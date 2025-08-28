import { Product } from "../models/productModel.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "../APIFeatures/handlerFactory.js";
import Variant from "../models/productVariantModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
// S3 uploads are handled by multerS3 middleware
import mongoose from "mongoose";

// const getAllProducts = getAll(Product);
const getAllProducts = catchAsync(async (req, res, next) => {
  const { q, category, subCategory, brand } = req.query;

  // Build the query object
  // const query = {};
  // if (q) {
  //   query.name = { $regex: q, $options: "i" }; // Case-insensitive regex for name
  //   query.category.name = { $regex: q, $options: "i" }; // Case-insensitive regex for category
  //   query.subCategory.name = { $regex: q, $options: "i" }; // Case-insensitive regex for subCategory
  // }

  const query = {};
  if (q) {
    query.$or = [];
    query.$or.push({ name: { $regex: q, $options: "i" } });
    query.$or.push({ description: { $regex: q, $options: "i" } });

    // Ensure category and subCategory are populated before querying their names
    query.$or.push({
      category: { $exists: true, $ne: null },
      "category.name": { $regex: q, $options: "i" },
    });
    query.$or.push({
      subCategory: { $exists: true, $ne: null },
      "subCategory.name": { $regex: q, $options: "i" },
    });

    if (mongoose.Types.ObjectId.isValid(q)) {
      query.$or.push({ _id: q });
    }
  }

  //setlimitandpage
  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  const skip = (page - 1) * limit;

  if (category) {
    query.category = category;
  }
  if (subCategory) {
    query.subCategory = subCategory;
  }
  if (brand) {
    query.brand = brand;
  }

  //only active products
  // query.isActive = { $ne: false };
  query.isActive = true;

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .select("-__v")
      .populate("brand", "name _id")
      .populate("category", "name _id")
      .populate("subCategory", "name _id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    message: "Successfully fetched products",
    results: products.length,
    totalPages: Math.ceil(totalProducts / limit),
    content: products,
  });
});

const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [product, variants] = await Promise.all([
    Product.findById(id),
    Variant.find({ product: id, isActive: true }),
  ]);

  if (!product || !product.isActive) {
    return next(new AppError("No product found with that ID", 404));
  }
  if (!variants) {
    return next(new AppError("No variant found for this product", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Successfully fetched product",
    results: variants.length,
    content: { product, variants },
  });
});

const createProduct = async (req, res, next) => {
  //   console.log(req.body);
  // Assuming req.body.productDetails and req.body.variants are JSON strings
  const { productDetails: productDetailsString, variants: variantsString } =
    req.body;

  // Parse the JSON strings to objects
  const productDetails = JSON.parse(productDetailsString);
  const variants = JSON.parse(variantsString);

  // Process uploaded files
  let productImage = "";
  let productBrochure = "";
  const variantImagesMap = {};


  //here we have to find that the variant's sku is already present in the database
  const existingVariants = await Variant.find({
    sku: { $in: variants.map((variant) => variant.sku) },
    isActive: true,
  });
  if (existingVariants.length > 0) {
    //mention the correct sku
    return next(
      new AppError(
        `The SKU: ${existingVariants
          .map((variant) => variant.sku)
          .join(", ")}  already exists`,
        400
      )
    );
  }


  if (req.files) {
    for (const file of req.files) {
      const { fieldname } = file;

      if (fieldname === "productImage") {
        productImage = file.location;
      } else if (fieldname === "productBrochure") {
        try {
          // Validate file type
          if (file.mimetype !== "application/pdf") {
            throw new Error("Only PDF files are allowed for brochure");
          }

          console.log("S3 upload successful:", file.location);
          productBrochure = file.location;
        } catch (error) {
          console.error("PDF upload error:", error);
          throw new AppError(
            `Failed to upload PDF brochure: ${error.message}`,
            400
          );
        }
      } else if (fieldname.startsWith("variant_")) {
        const match = fieldname.match(/variant_(\d+)_image_(\d+)/);

        if (match) {
          const variantIndex = match[1];
          const imageIndex = parseInt(match[2]);
          if (!variantImagesMap[variantIndex])
            variantImagesMap[variantIndex] = [];

          variantImagesMap[variantIndex][imageIndex] = file.location;
        }
      }
    }
  }

  const newProduct = new Product({
    ...productDetails,
    productImage: productImage,
    productBrochure: productBrochure || null,
  });

  let newVariants = [];
  if (variants && variants.length > 0) {
    newVariants = await Variant.create(
      variants.map((variant, index) => ({
        ...variant,
        product: newProduct._id,
        images: variantImagesMap[index] || [], // Assign images from the map
      }))
    );
  }

  await newProduct.save();

  res.status(201).json({
    status: "success",
    content: { product: newProduct, variants: newVariants },
  });
};

// const updateProduct (also variants);
const updateProduct = catchAsync(async (req, res, next) => {
  const { id: productId } = req.params;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError("No product found with that ID", 404));
  }

  // Assuming req.body.productDetails and req.body.variants are JSON strings
  const { productDetails: productDetailsString, variants: variantsString } =
    req.body;

  // Parse the JSON strings to objects
  const productDetails = JSON.parse(productDetailsString);
  const variants = JSON.parse(variantsString);

  // Process uploaded files
  let productImage = "";
  let productBrochure = "";
  const variantImagesMap = {};

  //*Handling images and PDFs using S3

  //here we have to find that the variant's sku is already present in the database
  // Get current product's variant IDs to exclude them from SKU check
  const currentProductVariants = await Variant.find({
    product: productId,
    isActive: true,
  }).select("_id");

  const currentVariantIds = currentProductVariants.map((v) => v._id);

  const existingVariants = await Variant.find({
    sku: { $in: variants.map((variant) => variant.sku) },
    _id: { $nin: currentVariantIds }, // Exclude current product's variants
    isActive: true,
  });
  if (existingVariants.length > 0) {
    //mention the correct sku
    return next(
      new AppError(
        `The SKU: ${existingVariants
          .map((variant) => variant.sku)
          .join(", ")}  already exists`,
        400
      )
    );
  }
  //*Handling images using cloudinary

  if (req.files) {
    for (const file of req.files) {
      const { fieldname } = file;

      if (fieldname === "productImage") {
        productImage = file.location;
      } else if (fieldname === "productBrochure") {
        try {
          // Validate file type
          if (file.mimetype !== "application/pdf") {
            throw new Error("Only PDF files are allowed for brochure");
          }

          productBrochure = file.location;
        } catch (error) {
          console.error("PDF upload error:", error);
          throw new AppError(
            `Failed to upload PDF brochure: ${error.message}`,
            400
          );
        }
      } else if (fieldname.startsWith("variant_")) {
        const match = fieldname.match(/variant_(\d+)_image_(\d+)/);

        if (match) {
          const variantIndex = match[1];
          const imageIndex = parseInt(match[2]);

          if (!variantImagesMap[variantIndex])
            variantImagesMap[variantIndex] = [];

          variantImagesMap[variantIndex][imageIndex] = file.location;
        }
      }
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      ...productDetails,
      productImage: productImage || productDetails.productImage, // Ensure fallback to existing image
      productBrochure: productBrochure || productDetails.productBrochure, // Ensure fallback to existing brochure
    },
    { new: true }
  );

  let updatedVariants = [];

  if (variants && variants.length > 0) {
    for (const [variantIndex, variant] of variants.entries()) {
      const variantImagesUpdated = [...(variant?.images || [])];

      // Update specific indices with new images from variantImagesMap
      if (variantImagesMap[variantIndex]) {
        variantImagesMap[variantIndex].forEach((newImage, imageIndex) => {
          if (typeof newImage === "string") {
            variantImagesUpdated[imageIndex] = newImage;
          }
        });
      }

      let updatedVariant;
      if (variant._id) {
        // Update existing variant
        updatedVariant = await Variant.findByIdAndUpdate(
          variant._id,
          {
            ...variant,
            images: variantImagesUpdated,
          },
          { new: true }
        );
      } else {
        // Create new variant
        updatedVariant = await Variant.create({
          ...variant,
          product: productId,
          images: variantImagesUpdated,
        });
      }
      updatedVariants.push(updatedVariant);
    }
  }

  res.status(201).json({
    status: "success",
    content: { product: updatedProduct, variants: updatedVariants },
  });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { id: productId } = req.params;

  // const [product, variants] = await Promise.all([
  //   Product.findByIdAndDelete(productId),
  //   Variant.deleteMany({ product: productId }),
  // ]);

  //soft delete
  const product = await Product.findByIdAndUpdate(productId, {
    isActive: false,
  });

  if (!product || !product.isActive) {
    return next(new AppError("No product found with that ID", 404));
  }

  // if (!variants) {
  //   return next(new AppError("No variants found with that ID", 404));
  // }

  res.status(204).json({
    status: "success",
    message: "Product and variants deleted successfully",
  });
});

//*------------variants--------------
const addVariant = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError("No product found with that ID", 404));
  }

  const newVariant = await Variant.create({ ...req.body, product: productId });
  if (!newVariant) {
    return next(new AppError("Failed to create variant", 400));
  }

  product.variants.push(newVariant._id);
  await product.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    content: newVariant,
  });
});

// Fetch all variants
const getAllVariants = catchAsync(async (req, res, next) => {
  const variants = await Variant.find()
    .populate({
      path: "product",
      match: { isActive: true },
    })
    .then((variants) => variants.filter((variant) => variant.product !== null));

  res.status(200).json({
    status: "success",
    results: variants.length,
    content: variants,
  });
});

// Fetch a single variant by ID
const getVariant = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const variant = await Variant.findById(id).populate("product");
  if (!variant) {
    return next(new AppError("No variant found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    content: variant,
  });
});

// Update a variant
const updateVariant = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const updatedVariant = await Variant.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedVariant) {
    return next(new AppError("No variant found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    content: updatedVariant,
  });
});

// Delete a variant
const deleteVariant = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // const variant = await Variant.findByIdAndDelete(id);
  const variant = await Variant.findByIdAndUpdate(id, { isActive: false });
  if (!variant) {
    return next(new AppError("No variant found with that ID", 404));
  }

  // Remove the variant reference from the associated product
  await Product.updateOne({ variants: id }, { $pull: { variants: id } });

  res.status(204).json({
    status: "success",
    content: null,
  });
});

const getProductByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const products = await Product.find({ category: categoryId, isActive: true });
  res.status(200).json({
    status: "success",
    results: products.length,
    content: products,
  });
});

const getProductBySubCategory = catchAsync(async (req, res, next) => {
  const { subCategoryId } = req.params;
  const products = await Product.find({
    subCategory: subCategoryId,
    isActive: true,
  });
  res.status(200).json({ status: "success", content: products });
});

const searchProducts = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const products = await Product.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ],
    isActive: true,
  });
  res.status(200).json({ status: "success", content: products });
});

const getProductByCategoryAndBrand = catchAsync(async (req, res, next) => {
  const { categoryId, brandId } = req.params;
  const products = await Product.find({
    category: categoryId,
    brand: brandId,
    isActive: true,
  });
  res.status(200).json({
    status: "success",
    content: products,
    results: products.length,
  });
});

const getProductByBrandAndSubCategory = catchAsync(async (req, res, next) => {
  const { brandId, subCategoryId } = req.params;
  const products = await Product.find({
    brand: brandId,
    subCategory: subCategoryId,
    isActive: true,
  });
  res.status(200).json({
    status: "success",
    content: products,
    results: products.length,
  });
});

export default {
  getAllProducts,
  createProduct,
  updateProduct,
  getProduct,
  deleteProduct,
  addVariant,
  getAllVariants,
  getVariant,
  updateVariant,
  deleteVariant,
  getProductByCategory,
  getProductBySubCategory,
  searchProducts,
  getProductByCategoryAndBrand,
  getProductByBrandAndSubCategory,
};

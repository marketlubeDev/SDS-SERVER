import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import APIFeatures from "./APIFeatures.js";
import { cloudinaryInstance } from "../config/cloudinary.js";
import { Product } from "../models/productModel.js";
import SubCategory from "../models/subCategoryModel.js";

const getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    let filter = {};

    const features = new APIFeatures(Model, Model.find(filter), req.query);

    features
      .filter()
      .sort()
      .limitFields()
      .paginate(Model.countDocuments())
      .filterByBranch()
      .filterByDateRange()
      .search();

    // Execute the query
    const data = await features.query;
    const additional = res?.additional;

    res.status(200).json({
      message: "Success",
      results: data.length,
      content: data,
      additional,
    });
  });
};

const getOne = (Model, type = "id") => {
  return catchAsync(async (req, res, next) => {
    let data;

    switch (type) {
      case "id":
        const { id } = req.params;
        data = await Model.findById(id).select("-password");
        break;

      case "email":
        const { email } = req.params;
        data = await Model.findOne({ email }).select("-password");

      case "phone":
        const { phone } = req.params;
        data = await Model.findOne({ phone }).select("-password");

      default:
        console.log("its not going to happen...");
    }

    if (!data) return next(new AppError(`No data on this ${type}`, 404));

    res.status(200).json({
      status: "Success",
      message: "fetched successfully",
      content: data,
    });
  });
};

const createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    if (req.file) {
      const cloudResponse = await cloudinaryInstance.uploader.upload(
        req.file.path
      );
      req.body.image = cloudResponse.secure_url;
    }

    const createdData = await Model.create(req.body);
    res.status(200).json({
      status: "Success",
      message: "created successfully",
      content: createdData,
    });
  });
};

const updateOne = (Model, subCategory = false) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const updation = req.body;

    if (subCategory) {
      const subCategoryDetails = await SubCategory.findById(id);
      // check it is updating its main category if yes then check if it has products
      if (
        subCategoryDetails.category.toString() != updation.category.toString()
      ) {
        const products = await Product.find({ subCategory: id });
        if (products.length > 0) {
          return next(
            new AppError(
              "Subcategory has products So you can't update its main category",
              400
            )
          );
        }
      }
    }

    if (req.file) {
      const cloudResponse = await cloudinaryInstance.uploader.upload(
        req.file.path
      );
      updation.image = cloudResponse.secure_url;
    }

    const updatedData = await Model.findByIdAndUpdate(id, updation, {
      new: true,
      runValidators: true,
    });

    if (!updatedData)
      return next(
        new AppError("No product found to update OR Unable to update", 404)
      );

    res.status(200).json({
      status: "Success",
      message: "Successfully Updated",
      content: updatedData,
    });
  });
};

const deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const data = await Model.findByIdAndDelete(id);

    if (!data) return next(new AppError("No document founded on this Id", 400));

    res.status(200).json({
      status: "Success",
      message: "Deleted Successfully",
      content: data,
    });
  });
};

export { getAll, getOne, createOne, updateOne, deleteOne };

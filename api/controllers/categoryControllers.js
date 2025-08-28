import Category from "../models/categoryModel.js";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
import { Product } from "../models/productModel.js";
import SubCategory from "../models/subCategoryModel.js";
import AppError from "../utils/appError.js";

// Create a new category
export const createCategory = createOne(Category);

// Get all categories
// export const getCategories = getAll(Category);
export const getCategories = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  const query = {};
  if (q) {
    query.$or = [];
    query.$or.push({ name: { $regex: q, $options: "i" } });
    query.$or.push({ description: { $regex: q, $options: "i" } });
    if (mongoose.Types.ObjectId.isValid(q)) {
      query.$or.push({ _id: q });
    }
  }

  const categories = await Category.find(query);

  res.status(200).json({ status: "success", content: categories });
});

// Get a single category by ID
export const getCategoryById = getOne(Category);

// Update a category
export const updateCategory = updateOne(Category);

// Delete a category
export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  const products = await Product.find({ category: category._id });
  const subCategories = await SubCategory.find({ category: category._id });
  if (products.length > 0) {
    return next(new AppError("Category has products", 400));
  }
  if (subCategories.length > 0) {
    return next(
      new AppError("Category has subcategories please delete them first", 400)
    );
  }
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  await category.deleteOne();
  res.status(204).json({ status: "success", content: null });
});

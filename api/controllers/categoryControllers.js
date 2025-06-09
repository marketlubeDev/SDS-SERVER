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
export const deleteCategory = deleteOne(Category);

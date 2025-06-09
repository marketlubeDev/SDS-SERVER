import SubCategory from "../models/subCategoryModel.js";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";

// Create a new subcategory
export const createSubCategory = createOne(SubCategory);

// Get all subcategories
// export const getSubCategories = getAll(SubCategory);
export const getSubCategories = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  const query = {};
  if (q) {
    query.$or = [];
    query.$or.push({ name: { $regex: q, $options: "i" } });
    query.$or.push({ description: { $regex: q, $options: "i" } });
    query.$or.push({
      "category.name": { $regex: q, $options: "i" },
    });
    if (mongoose.Types.ObjectId.isValid(q)) {
      query.$or.push({ _id: q });
    }
  }


  const subCategories = await SubCategory.find(query);

  res.status(200).json({ status: "success", content: subCategories });
});

// Get a single subcategory by ID
export const getSubCategoryById = getOne(SubCategory);

// Update a subcategory
export const updateSubCategory = updateOne(SubCategory);

// Delete a subcategory
export const deleteSubCategory = deleteOne(SubCategory);

// Get subcategories by category ID
export const getSubCategoryByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const subCategories = await SubCategory.find({ category: categoryId });
  res.status(200).json({ status: "success", content: subCategories });
});

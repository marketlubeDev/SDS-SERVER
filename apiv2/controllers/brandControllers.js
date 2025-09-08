import Brand from "../models/BrandModel.js";

import {
  getAll,
  createOne,
  getOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";

export const getAllBrands = catchAsync(async (req, res, next) => {
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

  //setlimitandpage
  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  const skip = (page - 1) * limit;

  const brands = await Brand.find(query).skip(skip).limit(limit);

  res.status(200).json({ status: "success", content: brands });
});

export const createBrand = createOne(Brand);

export const getBrandById = getOne(Brand);

export const updateBrand = updateOne(Brand);

export const deleteBrand = deleteOne(Brand);

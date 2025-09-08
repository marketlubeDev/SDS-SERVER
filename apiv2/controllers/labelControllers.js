import Label from "../models/labelModel.js";
import {
  getAll,
  createOne,
  getOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";

// const getAllLabels = getAll(Label);

export const getAllLabels = catchAsync(async (req, res, next) => {
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

  const labels = await Label.find(query);

  res.status(200).json({ status: "success", content: labels });
});

const createLabel = createOne(Label);

const getLabelById = getOne(Label);

const updateLabel = updateOne(Label);

const deleteLabel = deleteOne(Label);

export default {
  getAllLabels,
  createLabel,
  getLabelById,
  updateLabel,
  deleteLabel,
};

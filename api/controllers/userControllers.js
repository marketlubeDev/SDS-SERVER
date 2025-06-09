import User from "../models/userModels.js";
import Cart from "../models/cartModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import { cloudinaryInstance } from "../config/cloudinary.js";
import { get } from "mongoose";

const getMe = catchAsync(async (req, res, next) => {
  //req.user coming from protect middleware
  // const userId = req.user;
  const { password, ...userWIthoutPassword } = req.user._doc;

  res.status(200).json({
    status: "Success",
    message: "Successfully fetched the user",
    content: userWIthoutPassword,
  });
});

const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError("This is not the route for updating password..", 400)
    );

  //coming from protect middleware
  const userId = req.user._id;

  const updation = req.body;

  if (req.file) {
    const cloudResponse = await cloudinaryInstance.uploader.upload(
      req.file.path
    );
    updation.profilePic = cloudResponse.secure_url;
  }


  const updatedUser = await User.findByIdAndUpdate(userId, updation, {
    new: true,
    runValidators: true,
  }).select("-__v -password");

  res.status(200).json({
    status: "Success",
    message: `${updatedUser.name}'s data updated successfully`,
    content: updatedUser,
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const deletedUser = await User.findByIdAndDelete(
    userId,
    { active: false },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "Success",
    message: `${deletedUser.name}'s data deleted successfully`,
    content: deletedUser,
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const { name, email } = req.query;


  // Build the query object
  const query = {};
  if (name || email) {
    query.$or = [];
    if (name) query.$or.push({ name: { $regex: name, $options: "i" } }); // Case-insensitive regex for name
    if (email) query.$or.push({ email: { $regex: email, $options: "i" } }); // Case-insensitive regex for email
  }

  const users = await User.find(query).select("-__v -password");

  res.status(200).json({
    message: "Successfully fetched",
    status: "Success",
    content: users,
  });
});

const getUser = getOne(User);
const deleteUser = deleteOne(User);

const deleteAllUsers = async (req, res, next) => {
  await User.deleteMany({});
  await Cart.deleteMany({});
  res.status(200).json({ status: "Success", message: "Deleted All Users" });
};

const checkUser = catchAsync((req, res, next) => {
  const { role } = req.params;
  if (role !== req.user.role) {
    return next(new AppError("you are not authorized for this route", 401));
  }
  return res.status(200).json({
    message: "user authorized",
    content: { role: req.user.role },
    success: true,
  });
});

const getAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  res.status(200).json({
    message: "Address fetched successfully",
    content: user.addresses,
  });
});

const addAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { address } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { addresses: address } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Address added successfully",
    content: updatedUser.addresses,
  });
});

const updateAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { addressId } = req.params;
  const { address } = req.body;

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, "addresses._id": addressId },
    { $set: { "addresses.$": address } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Address updated successfully",
    content: updatedUser.addresses,
  });
});

const deleteAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { addressId } = req.params;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Address deleted successfully",
    content: updatedUser.addresses,
  });
});

export default {
  getAllUsers,
  getUser,
  deleteUser,
  deleteAllUsers,
  getMe,
  deleteMe,
  updateMe,
  checkUser,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
};

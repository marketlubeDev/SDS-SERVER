import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModels.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "../APIFeatures/handlerFactory.js";

const assignCouponToUser = catchAsync(async (req, res, next) => {
  const userCart = await Cart.findOneAndUpdate(
    { user: req.params.userId },
    { $addToSet: { coupons: req.params.couponId } },
    { new: true, runValidators: true }
  );

  if (!userCart) return next(new AppError("User did not exist...", 404));

  res.status(200).json({
    status: "Success",
    message: "Successfully assigned the Coupon",
    content: userCart,
  });
});

const getAllCoupon = getAll(Coupon);
const getCoupon = getOne(Coupon);
const createCoupon = createOne(Coupon);
const updateCoupon = updateOne(Coupon);
const deleteCoupon = deleteOne(Coupon);

export default {
  createCoupon,
  getAllCoupon,
  getCoupon,
  deleteCoupon,
  updateCoupon,
  assignCouponToUser,
};

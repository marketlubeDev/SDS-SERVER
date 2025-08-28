import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
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

const getAllCoupon = catchAsync(async (req, res) => {
  const coupons = await Coupon.find({
    isActive: true,
    expiryDate: { $gt: new Date() },
  });
  res.status(200).json({ coupons });
});

const getCoupon = getOne(Coupon);
const createCoupon = catchAsync(async (req, res) => {
  const {
    code,
    discountType,
    discountAmount,
    minPurchase,
    maxDiscount,
    expiryDate,
    description,
  } = req.body;

  const coupon = new Coupon({
    code,
    discountType,
    discountAmount,
    minPurchase,
    maxDiscount,
    expiryDate,
    description,
  });

  const savedCoupon = await coupon.save();

  res.status(201).json({ coupon: savedCoupon });
});
const updateCoupon = updateOne(Coupon);
const deleteCoupon = deleteOne(Coupon);

const applyCoupon = catchAsync(async (req, res, next) => {
  const { couponId } = req.body;
  const userId = req.user._id;

  // Find the cart for the user
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.products.length === 0) {
    return next(new AppError("Cart not found or empty", 404));
  }

  // Find the coupon
  const coupon = await Coupon.findOne({
    code: couponId,
    isActive: true,
    expiryDate: { $gt: new Date() },
  });

  if (!coupon) {
    return next(new AppError("Invalid or expired coupon", 400));
  }

  // Calculate cart total (using the existing totalPrice)
  const cartTotal = cart.totalAmount;

  // Check minimum purchase requirement
  if (cartTotal < coupon.minPurchase) {
    return next(
      new AppError(
        `Minimum purchase of ₹${coupon.minPurchase} required to use this coupon`,
        400
      )
    );
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.floor((cartTotal * coupon.discountAmount) / 100);
    // Apply maximum discount limit if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === "fixed") {
    discountAmount = coupon.discountAmount;
  }

  // Calculate final amount
  const finalAmount = cartTotal - discountAmount;

  // Update cart with coupon details
  cart.couponApplied = {
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountAmount: discountAmount,
    originalAmount: cartTotal,
    finalAmount: finalAmount,
  };
  cart.isCouponApplied = true;

  const updatedCart = await cart.save();

  // Format the response using your existing cart formatter
  const formattedCart = {
    ...updatedCart,
    couponDetails: {
      code: coupon.code,
      discountType: coupon.discountType,
      originalAmount: cartTotal,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      savings: discountAmount,
      description: coupon.description,
    },
  };

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    data: { formattedCart, finalAmount },
  });
});

const removeCoupon = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  cart.couponApplied = null;
  cart.isCouponApplied = false;
  await cart.save();
  res.status(200).json({
    success: true,
    message: "Coupon removed successfully",
  });
});

export default {
  createCoupon,
  getAllCoupon,
  getCoupon,
  deleteCoupon,
  updateCoupon,
  assignCouponToUser,
  applyCoupon,
  removeCoupon,
};

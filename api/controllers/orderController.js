import APIFeatures from "../APIFeatures/APIFeatures.js";
import Order from "../models/orderModel.js";
import catchAsync from "../utils/catchAsync.js";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "../APIFeatures/handlerFactory.js";
import Cart from "../models/cartModel.js";
import Variant from "../models/productVariantModel.js";
import AppError from "../utils/appError.js";
import razorpayInstance from "../config/razorPay.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const orderStats = catchAsync(async (req, res, next) => {
  const filter = {};
  const features = new APIFeatures(Order, Order.find(filter), req.query);
  features
    .filter()
    .sort()
    .limitFields()
    .paginate(Order.countDocuments())
    .filterByBranch()
    .filterByDateRange()
    .search();

  const orderStats = await features.query;

  const completed = orderStats.filter((obj) => obj.orderStatus === "Completed");
  const confirmed = orderStats.filter((obj) => obj.orderStatus === "Confirmed");
  const refund = orderStats.filter((obj) => obj.orderStatus === "On Refund");
  const cancelled = orderStats.filter((obj) => obj.orderStatus === "Cancelled");

  res.status(200).json({
    message: "Successfully fetched",
    status: "Success",
    content: {
      completed: completed.length,
      confirmed: confirmed.length,
      refund: refund.length,
      cancelled: cancelled.length,
    },
  });
});

const getAllOrders = getAll(Order);
const getOrder = getOne(Order);
const createOrder = createOne(Order);
const updateOrder = updateOne(Order);
const deleteOrder = deleteOne(Order);

const getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  //setlimitandpage
  const limit = req.query.limit;
  const page = req.query.page || 1;
  const skip = (page - 1) * limit;
  const [orders, totalOrders] = await Promise.all([
    Order.find({ user: userId })
      .populate("products.product", "name productImage _id")
      .skip(skip)
      .limit(limit && limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments({ user: userId }),
  ]);

  res.status(200).json({
    message: "Successfully fetched",
    status: "Success",
    results: orders.length,
    totalOrders: totalOrders,
    content: orders,
  });
});

const paymentIntent = catchAsync(async (req, res, next) => {
  // const { amount } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  let totalAmount = cart.totalAmount;
  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: uuidv4(),
  };
  const razorPayResponse = await razorpayInstance.orders.create(options);

  if (!razorPayResponse) {
    return next(new AppError("Error in creating order", 500));
  }

  res.status(200).json({
    message: "Payment intent created successfully",
    status: "Success",
    success: true,
    content: {
      order_id: razorPayResponse.id,
      currency: razorPayResponse.currency,
      amount: razorPayResponse.amount,
    },
  });
});

const verifyPayment = catchAsync(async (req, res, next) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    // payment_status,
  } = req.body;

  //   const order = await Order.findOne({ razorpay_order_id });

  // Check if payment status is failed or canceled
  //   if (payment_status === "failed" || payment_status === "canceled") {
  //     order.paymentStatus = payment_status;
  //     order.orderStatus = "cancelled";
  //     order.isVerified = true;
  //     await order.save();

  //     return res.status(400).json({
  //       message: `Payment ${payment_status}`,
  //       status: "Error",
  //       success: false,
  //       content: {
  //         order,
  //       },
  //     });
  //   }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  //create order in the database only after payment is verified
  const order = await Order.create({
    user: req.user._id,
    products: cart.products,
    totalAmount: cart.totalAmount,
    deliveryAddress: req.body.deliveryAddress,
    orderStatus: "pending",
    paymentMethod: "ONLINE",
    paymentStatus: "paid",
    isVerified: true,
    razorpay_order_id: razorpay_order_id,
    razorpay_payment_id: razorpay_payment_id,
    razorpay_signature: razorpay_signature,
  });

  //   //update the order status to paid
  //   order.paymentStatus = "paid";
  //   order.isVerified = true;
  //   await order.save();

  //TODO:clear the cart for successfull order
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { products: [], gst: 0, totalAmount: 0, subtotal: 0 } }
  );

  //reducethe product quantity from variant model
  const products = order.products?.map((product) => ({
    product: product.product,
    variant: product.variant,
    quantity: product.quantity,
    price: product.price,
  }));
  await Promise.all(
    products?.map(async (product) => {
      // Decrement the stock quantity
      const updatedVariant = await Variant.findByIdAndUpdate(
        product.variant?._id,
        { $inc: { stockQuantity: -product.quantity } },
        { new: true }
      );
      // Update the stock status based on the new quantity
      if (updatedVariant) {
        const newStatus =
          updatedVariant.stockQuantity <= 0 ? "outOfStock" : "inStock";
        await Variant.findByIdAndUpdate(product.variant?._id, {
          $set: { stockStatus: newStatus },
        });
      }
    })
  );

  res.status(200).json({
    message: "Payment verified and placed order successfully",
    status: "Success",
    success: true,
    content: {
      order,
    },
  });
});



const createOrderCashOnDelivery = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { deliveryAddress } = req.body;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  //get product details from product model
  const products = cart.products?.map((product) => ({
    product: product.product,
    variant: product.variant,
    quantity: product.quantity,
    price: product.price,
  }));

  const order = await Order.create({
    user: userId,
    products: products,
    totalAmount: cart.totalAmount,
    deliveryAddress: deliveryAddress,
    orderStatus: "pending",
    paymentMethod: "COD",
    paymentStatus: "pending",
    isVerified: true,
  });

  //TODO:clear the cart for successfull order
  await Cart.findByIdAndUpdate(cart._id, { $set: { products: [] } });
  try {
    await Promise.all(
      //reducethe product quantity from variant model
      products?.map(async (product) => {
        // Decrement the stock quantity
        const updatedVariant = await Variant.findByIdAndUpdate(
          product.variant?._id,
          { $inc: { stockQuantity: -product.quantity } },
          { new: true }
        );
        // Update the stock status based on the new quantity
        if (updatedVariant) {
          const newStatus =
            updatedVariant.stockQuantity <= 0 ? "outOfStock" : "inStock";
          await Variant.findByIdAndUpdate(product.variant?._id, {
            $set: { stockStatus: newStatus },
          });
        }
      })
    );
  } catch (error) {
    return next(new AppError("Error in creating order", 500));
  }

  res.status(200).json({
    message: "Order created successfully",
    status: "Success",
    content: order,
  });
});

export default {
  getAllOrders,
  getOrder,
  getUserOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  orderStats,
  paymentIntent,
  createOrderCashOnDelivery,
  verifyPayment,
};

import {Product} from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "../APIFeatures/handlerFactory.js";

const getReviewsOfProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) return next(new AppError("Please provide a product ID", 400));

  const reveiws = await Review.find({ product: productId });

  if (!reveiws)
    return next(new AppError(`No product on this ${productId}`, 404));

  res.status(200).json({
    status: "Success",
    message: "Successfully fetched reveiws of the product",
    content: reveiws,
  });
});

const createReview = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  if (!userId)
    return next(new AppError("User must be logged in to post a review", 401));

  const { productId, message, rating, title } = req.body;

  if (!productId || !message)
    return next(
      new AppError("Please provide the necessary data before requesting", 400)
    );

  const product = await Product.findById(productId);

  if (!product) return next(new AppError("Invalid product", 400));

  // Update the rating quantity
  const newRatingQty = product.ratingQty + 1;

  // Calculate the new average rating
  const newAvgRating =
    (product.avgRatings * product.ratingQty + rating) / newRatingQty;

  // Update the product with the new rating count and new average rating
  product.ratingQty = newRatingQty;
  product.avgRatings = newAvgRating.toFixed(2);

  await product.save();

  // Create and save the new review
  const newReview = new Review({
    user: userId,
    product: productId,
    rating,
    message,
    title,
  });

  await newReview.save({ validateBeforeSave: true });

  res.status(200).json({
    status: "Success",
    message: "Successfully created Review",
    content: newReview,
  });
});

const getAllReview = getAll(Review);
const getReview = getOne(Review);
const updateReview = updateOne(Review);
const deleteReview = deleteOne(Review);

export default {
  getReviewsOfProduct,
  getAllReview,
  getReview,
  updateReview,
  deleteReview,
  createReview,
};

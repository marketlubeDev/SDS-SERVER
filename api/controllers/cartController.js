import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { getAll, getOne, updateOne } from "../APIFeatures/handlerFactory.js";
import { Product } from "../models/productModel.js";
import Variant from "../models/productVariantModel.js";

const getMyCart = catchAsync(async (req, res, next) => {
  //get cart by user id
  const myCart = await Cart.findOne({ user: req.user._id });

  if (!myCart)
    return next(
      new AppError("Your are not logged in how did you get this far..?"),
      401
    );

  res.status(200).json({
    status: "Success",
    message: `Successully fetched ${req.user.name}'s cart`,
    content: myCart,
  });
});

const addProductToMyCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { variantId, quantity: reqQuantity } = req.body;

  // Validate variantId
  if (!variantId)
    return next(new AppError("Please provide the variant ID", 400));

  // Validate productId
  if (!productId)
    return next(new AppError("Please provide the product ID", 400));

  // Validate quantity
  const quantity = reqQuantity ? Number(reqQuantity) : 1;
  if (isNaN(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a positive number", 400));
  }

  // Get product and variant details
  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  const variant = await Variant.findById(variantId);
  if (!variant) return next(new AppError("Variant not found", 404));

  // Ensure the variant belongs to the product
  if (variant.product.toString() !== productId) {
    return next(
      new AppError("Variant does not belong to the specified product", 400)
    );
  }

  // Find the cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    // Create a new cart if it doesn't exist
    cart = await Cart.create({ user: req.user._id, products: [] });
  }

  // Check if the variant is available in stock
  if (
    variant.stockQuantity < quantity ||
    variant.stockStatus === "outOfStock" ||
    variant.stockQuantity === 0 ||
    variant.stockQuantity === undefined
  ) {
    return next(new AppError("Product is out of stock", 400));
  }

  // Check if the product with the variant already exists in the cart
  const existingProductIndex = cart.products.findIndex(
    (item) =>
      item.product._id.toString() === productId.toString() &&
      item.variant._id.toString() === variantId.toString()
  );

  if (existingProductIndex > -1) {
    // Product with the variant exists, update quantity
    cart.products[existingProductIndex].quantity += quantity;
  } else {
    // Product with the variant doesn't exist, add new product
    cart.products.push({
      product: productId,
      variant: variantId,
      quantity: quantity,
      price: variant.offerPrice, // Use the variant's price
    });
  }

  // Save cart (calculations will be done automatically in pre-save middleware)
  await cart.save();

  res.status(200).json({
    status: "Success",
    message:
      existingProductIndex > -1
        ? "Updated product quantity in cart"
        : "Added new product to cart",
    content: cart,
  });
});

const removeProductInCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  // Ensure quantity is a number and has a default value of 1
  const quantity = req.body.quantity ? Number(req.body.quantity) : 1;

  if (!productId) {
    return next(new AppError("Please provide the product ID", 400));
  }

  // Find the cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError("Cart not found", 404));

  // Find the product in the cart
  const existingProductIndex = cart.products.findIndex(
    (item) =>
      item.product._id.toString() === productId ||
      item.product.toString() === productId
  );

  if (existingProductIndex === -1) {
    return next(new AppError("Product not found in cart", 404));
  }

  const currentQuantity = cart.products[existingProductIndex].quantity;

  // If quantity to remove >= current quantity or no quantity specified, remove the product
  if (quantity >= currentQuantity) {
    cart.products.splice(existingProductIndex, 1);
  } else {
    // Reduce the quantity
    cart.products[existingProductIndex].quantity = currentQuantity - quantity;
  }

  // Save cart (calculations will be done automatically in pre-save middleware)
  await cart.save();

  res.status(200).json({
    status: "success",
    message:
      quantity >= currentQuantity
        ? "Product removed from cart"
        : `Reduced product quantity`,
    // : `Reduced product quantity by ${quantity}`,
    content: cart,
  });
});

const applyCoupon = catchAsync(async (req, res, next) => {
  const code = req.body.code;

  if (!code)
    next(new AppError("Must give the code before accessing this route..", 400));

  const coupon = await Coupon.findOne({ code, isValid: true });

  if (!coupon)
    return next(new AppError("Invalide code or Coupon is expired", 404));

  const userCart = await Cart.findOne({ user: req.user._id });

  if (!userCart)
    return next(new AppError("Invalide user please login again..", 401));

  if (!userCart.totalPrice)
    return next(
      new AppError("You Must add some Products to apply coupon", 400)
    );

  if (userCart.isCouponApplied)
    return next(new AppError("Coupon is already assigned", 401));

  const discount = coupon.discountPercent / 100;
  userCart.couponAppliedPrice =
    userCart.totalPrice - userCart.totalPrice * discount;
  userCart.couponAppliedPrice = Math.max(userCart.couponAppliedPrice, 0);

  userCart.isCouponApplied = true;

  await userCart.save();

  res.status(201).json({
    status: "Success",
    discountPercent: coupon.discountPercent,
    couponAppliedPrice: userCart.couponAppliedPrice,
    totalPrice: userCart.totalPrice,
    message: "Successfully assigned the Coupon",
    content: userCart,
  });
});

const removeCoupon = catchAsync(async (req, res, next) => {
  const userCart = await Cart.findOne({ user: req.user._id });

  if (!userCart)
    return next(new AppError("Invalide user please login again..", 401));

  if (!userCart.isCouponApplied)
    return next(new AppError("No coupon is currently applied.", 400));

  userCart.isCouponApplied = false;
  userCart.couponAppliedPrice = false;
  userCart.couponAppliedPrice = undefined;

  await userCart.save();

  res.status(201).json({
    status: "Success",
    message: "Successfully removed the coupon",
    totalPrice: userCart.totalPrice,
    content: userCart,
  });
});

const clearCart = catchAsync(async (req, res, next) => {
  const userCart = await Cart.findOne({ user: req.user._id });

  if (!userCart)
    return next(new AppError("Invalid user please login again..", 401));

  userCart.products = [];

  await userCart.save();

  res.status(201).json({
    status: "Success",
    message: "Successfully cleared cart items",
    content: userCart,
  });
});

const getAllCart = getAll(Cart);
const getCart = getOne(Cart);
const getCartByEmail = getOne(Cart, "email");

export default {
  getAllCart,
  getCart,
  getMyCart,
  addProductToMyCart,
  removeProductInCart,
  clearCart,
  getCartByEmail,
  applyCoupon,
  removeCoupon,
};

import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModels.js";

const KEY = process.env.JWT_SECRET;

export const protect = catchAsync(async (req, res, next) => {
  console.log("🛡️ Protect middleware running on:", req.originalUrl);


  // 1) Get the token and check its there
  const token = req.cookies.token;

  if (!token) return next(new AppError("Please Login to get access..", 401));

  // 2) Varify token
  const decode = jwt.verify(token, KEY); // there is a chance to get error
  if (!decode) return next(new AppError("Please Login to get access..", 401));


  // 3) Check the user is still exist to make sure
  const currentUser = await User.findById(decode.id);

  if (!currentUser)
    return next(new AppError("The User belong to this token is not exist"));


  // passing the user  to next middleware
  req.user = currentUser;


  next();
});

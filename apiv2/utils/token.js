import jwt from "jsonwebtoken";
import AppError from "./appError.js";

const KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;

export const generateToken = (id) => {
  return jwt.sign({ id }, KEY);
};

export const sendToken = (newUser, statusCode, res) => {
  const token = generateToken(newUser._id);
  if (!token) return next(new AppError("Server failed to create token", 500));

  const role = newUser.role;
  console.log(role, "role");

  res.cookie("token", token, {
    // res.cookie(role == "customer" ? "token" : "admin-token", token, {
    sameSite: NODE_ENV === "production" ? "None" : "Lax",
    secure: NODE_ENV === "production",
    httpOnly: NODE_ENV === "production",
  });

  res.status(statusCode).json({
    status: "Success",
    message: "Successfully logged in",
    content: newUser,
  });
};

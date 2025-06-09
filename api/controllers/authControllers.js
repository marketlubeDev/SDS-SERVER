import jwt from "jsonwebtoken";
// import User from "../Models/userShema.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModels.js";
import Cart from "../models/cartModel.js";
import { generateToken, sendToken } from "../utils/token.js";
import { otpToEmail } from "../utils/otp.js";
import bcrypt from "bcrypt";

const KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;

// In-memory storage for OTPs
const otpStore = new Map();

const logout = catchAsync(async (req, res, next) => {
  res.clearCookie("token", {
    sameSite: NODE_ENV === "production" ? "None" : "Lax",
    secure: NODE_ENV === "production",
    httpOnly: NODE_ENV === "production",
  });
  res
    .status(200)
    .json({ status: "Success", message: "Logged out, cookie cleared" });
});

const verify = catchAsync(async (req, res, next) => {
  let isLoggedIn = false;
  // 1) Get the token and check its there
  const token = req.cookies.token;
  if (!token)
    return res
      .status(401)
      .json({ status: "Failed", message: "Logged in failed", isLoggedIn });

  // 2) Varify token
  const decode = jwt.verify(token, KEY);
  const currentUser = await User.findById(decode.id).select(
    "email phone image name"
  );
  if (!currentUser) {
    return res.status(404).json({
      status: "Failed",
      message: "The User belong to this token is not exist",
      isLoggedIn,
    });
  }

  isLoggedIn = true;
  res.status(200).json({
    status: "Success",
    message: "Successfully Logged in",
    content: currentUser,
    isLoggedIn,
  });
});

// const login = catchAsync(async (req, res, next) => {
//   const { email, role } = req.body;

//   if (!email) return next(new AppError("Please provide email or phone.."));

//   const user = await User.findOne({ email, role });
//   if (!user) return next(new AppError("User not found", 404));
//   // if (!user) return signUp(req,res,next);

//   if (!req.body.password) {
//     //? return proceed to send otp(login with otp)
//     //TODO:uncomment after_connecting_to_email_service
//     //checking password is matching or not
//     // await user.createPasswordResetOtp(email);
//     // await user.save();
//     return res.status(200).json({
//       status: "Success",
//       message: "Otp has been sended successfully",
//     });
//   }

//   //?compare password
//   const isPasswordMatch = await user.comparePassword(req.body.password);
//   if (!isPasswordMatch) return next(new AppError("Invalid password", 401));

//   //?send token
//   // sendToken(user, 201, res);

//   const token = generateToken(user._id);


//   return res.status(200).json({
//     status: "Success",
//     message: "Successfully logged in",
//     content: user,
//     token,
//   });
// });

const login = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const [response, status, otp] = await otpToEmail(email);

 

    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
      userData: req.body, // Store the user data temporarily
    });



  res.status(200).json({
    status: "Success",
    message: "OTP has been sent successfully to your email",
    content: {
      email,
    },
  });
  
})


const signUp = catchAsync(async (req, res, next) => {
  const { email, name, phone } = req.body;
  if (!email) return next(new AppError("Please provide the mail"));

  const user = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (user?.email === email) {
    return res.status(400).json({
      status: "Failed",
      message: "Email already exists",
    });
  }

  if (user?.phone === phone) {
    return res.status(400).json({
      status: "Failed",
      message: "Phone already exists",
    });
  }

  // Send OTP to email
  const [response, status, otp] = await otpToEmail(email);
  if (status !== "OK") {
    return next(new AppError("Failed to send OTP. Please try again.", 500));
  }

  // Store OTP in memory with expiry
  otpStore.set(email, {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    userData: req.body, // Store the user data temporarily
  });

  res.status(200).json({
    status: "Success",
    message: "OTP has been sent successfully to your email",
    content: {
      email,
    },
  });
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  // Get stored OTP data
  const storedOtpData = otpStore.get(email);
  if (!storedOtpData) {
    return next(new AppError("No OTP found. Please request a new OTP.", 400));
  }

  // Check if OTP is expired
  if (Date.now() > storedOtpData.expires) {
    otpStore.delete(email); // Clean up expired OTP
    return next(new AppError("This OTP is expired. Try again..", 401));
  }

  // Verify OTP
  if (storedOtpData.otp !== otp) {
    return next(new AppError("Incorrect OTP. Check your inbox again...", 400));
  }

  // Create new user with stored data
  const userExists = await User.findOne({ email });

  if(!userExists){
    const newUser = new User(storedOtpData.userData);
    if (!newUser) {
      return next(new AppError("Failed to create user", 500));
    }
    const savedUser = await newUser.save();
    const newUserCart = await Cart.create({
      user: savedUser._id,
      products: [],
    });

    const token = generateToken(savedUser._id);
    res.status(200).json({
    status: "Success",
    message: "User created successfully",
    content: {
    email,
    },
    });
  }else{
    const token = generateToken(userExists._id);
    res.status(200).json({
      status: "Success",
      content: {
        email: userExists.email,
        name: userExists.name,
        image: userExists.profilePic,
        phone: userExists.phone,
        addresses: userExists.addresses,
      },
      token,
    });
  }

  // const savedUser = await newUser.save();
  // Create cart for the user


  // Save user

  // Clear OTP after successful verification
  // otpStore.delete(email);

  // sendToken(newUser, 201, res);
});

const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Get stored OTP data
  const storedOtpData = otpStore.get(email);
  if (!storedOtpData) {
    return next(new AppError("No OTP found. Please request a new OTP.", 400));
  }

  // Send new OTP
  const [response, status, newOtp] = await otpToEmail(email);

  if (status !== "OK") {
    return next(new AppError("Failed to send OTP. Please try again.", 500));
  }

  // Update stored OTP with new OTP
  otpStore.set(email, {
    otp: newOtp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    userData: storedOtpData.userData, // Keep the user data
  });

  res.status(200).json({
    status: "Success",
    message: "New OTP has been sent successfully to your email",
    content: {
      email,
    },
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const [response, status, otp] = await otpToEmail(email);
  if (status !== "OK") {
    return next(new AppError("Failed to send OTP. Please try again.", 500));
  }

  otpStore.set(email, {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    userData: req.body, // Store the user data temporarily
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  await user.createPasswordResetOtp(email);
  await user.save();

  res.status(200).json({
    status: "Success",
    message: "Password reset OTP has been sent successfully to your email",
  });
});

const verifyOtpAndResetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const isOtpValid = await user.verifyPasswordResetOtp(otp);
  if (!isOtpValid) return next(new AppError("Invalid OTP", 400));

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: "Success",
    message: "Password reset successfully",
  });
});

const adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;


  const admin = await User.findOne({ email, role: "admin" });

  if (!admin) return next(new AppError("Admin not found", 404));

  // const isPasswordMatch = await admin.comparePassword(password );

  const isPasswordMatch = await admin.comparePassword(password);
  if (!isPasswordMatch) return next(new AppError("Invalid password", 401));

  const token = generateToken(admin._id);
  res.status(200).json({
    status: "Success",
    message: "Admin logged in successfully",
    content: {
      email: admin.email,
      name: admin.name,  
    },
    token,
  });
});

export default {
  signUp,
  logout,
  login,
  verifyOtp,
  verify,
  resendOtp,
  forgotPassword,
  resetPassword,
  verifyOtpAndResetPassword,
  adminLogin,
};

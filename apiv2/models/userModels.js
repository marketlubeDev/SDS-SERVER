import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
// import bcrypt from "bcrypt";
// import AppError from "../Utilities/appError.js";
import { otpToEmail } from "../utils/otp.js";
// import { otpToEmail } from "../Utilities/otpGenerate.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [20, "User name should be less than 20 characters"],
      minlength: [3, "User name should be greater than 3 characters"],
    },
    email: {
      type: String,
      unique: true,
      minlength: [3, "email should be greater than 3 characters"],
      Lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      validate: {
        validator: function (value) {
          return value.length >= 10 && value.length <= 13;
        },
        message:
          "Enter a valid phone number with a length between 9 and 13 digits",
      },
    },
    profilePic: {
      type: String,
    },
    // cart: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Cart",
    // },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    active: {
      type: Boolean,
      select: false,
      default: true,
    },
    addresses: [
      {
        fullName: {
          type: String,
          required: true,
        },
        houseName: {
          type: String,
          required: true,
        },
        streetAddress: {
          type: String,
          required: true,
        },
        landmark: {
          type: String,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        pincode: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          // required: true,
        },
      },
    ],
    purchaseValue: {
      type: Number,
    },
    isNewOne: {
      type: Boolean,
      default: false,
      //TODO:remove this field after OTP validation
    },
    changePasswordDate: Date,
    passwordResetOtp: String,
    otpExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 🔹 Hash Password Before Saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

// 🔹 Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//TODO:uncomment after_connecting_to_order_service
userSchema.methods.calculatePurchaseValue = async function () {
  const orders = await mongoose
    .model("Order")
    .find({ user: this._id, orderStatus: "Completed" });
  return orders.reduce((total, order) => total + order.price, 0);
};



// deselecting fields that don't want to give to frontend
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } })
//     .select("-__v")
//     .populate("cart");
//   next();
// });

// 🔹 Generate Password Reset Token
userSchema.methods.createPasswordResetOtp = async function (email) {

  const [response, status, otp] = await otpToEmail(email, null,"Password Reset OTP");

  if (status !== "OK") return false;

  this.passwordResetOtp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000;
  return true;
};

userSchema.methods.verifyPasswordResetOtp = async function (otp) {
  return this.passwordResetOtp === otp && this.otpExpires > Date.now();
};



const User = mongoose.model("User", userSchema);

export default User;

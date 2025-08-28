import express from "express";
import authControllers from "../../controllers/authControllers.js";
import userControllers from "../../controllers/userControllers.js";
import { authRole } from "../../middlewares/authRole.js";
import { protect } from "../../middlewares/protect.js";
import { upload } from "../../middlewares/multerS3.js";

const router = express.Router();

//? auth routes
//----------------------------------
router.get("/verify", authControllers.verify);
router.post("/signup", authControllers.signUp);
router.post("/login", authControllers.login);
router.post("/logout", authControllers.logout);
router.patch("/verify-otp", authControllers.verifyOtp);
router.post("/resend-otp", authControllers.resendOtp);
router.post("/forgot-password", authControllers.forgotPassword);
router.post(
  "/verify-otp-and-reset-password",
  authControllers.verifyOtpAndResetPassword
);
router.patch("/reset-password", authControllers.resetPassword);
// router.patch("/verify-otp/:email/:otp", authControllers.verifyOtp);

//* router level middleware
router.use(protect);

//?user routes
router.use(authRole("customer", "admin"));
//----------------------------------
router.get("/get-me", userControllers.getMe);
router.patch(
  "/update-me",
  upload.single("profilePic"),
  userControllers.updateMe
);
router.delete("/delete-me", userControllers.deleteMe);
router.get("/check-user/:role", userControllers.checkUser);

//? address routes
router.get("/address", userControllers.getAddress);
router.post("/add-address", userControllers.addAddress);
router.patch("/update-address/:addressId", userControllers.updateAddress);
router.delete("/delete-address/:addressId", userControllers.deleteAddress);

//*==========================================================
//? admin routes{only admin can access}
router.use(authRole("admin"));
//----------------------------------
router.get("/all-users", userControllers.getAllUsers);
router.get("/user/:id", userControllers.getUser);
router.delete("/user/:id", userControllers.deleteUser);
router.delete("/delete-all-users", userControllers.deleteAllUsers);

// router.get("/check-admin", userControllers.checkUser);

export { router as userRouter };

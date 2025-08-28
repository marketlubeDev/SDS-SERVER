import { Router } from "express";
import authControllers from "../../controllers/authControllers.js";

const adminRouter = Router();

adminRouter.route("/login").post(authControllers.adminLogin);
adminRouter.route("/forgot-password").post(authControllers.adminForgetPassword);
adminRouter.route("/verify-otp").post(authControllers.adminVerifyOtp);
adminRouter
  .route("/verify-otp-reset-password")
  .post(authControllers.adminVerifyOtpAndResetPassword);
adminRouter.route("/resend-otp").post(authControllers.adminResendOtp);

export { adminRouter };

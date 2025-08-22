import express from "express";
// import couponController from "../../Controllers/couponController.js";
import couponController from "../../controllers/couponController.js";
import { protect } from "../../middlewares/protect.js";
import { authRole } from "../../middlewares/authRole.js";
const router = express.Router();

router.patch("/assign/:userId/:couponId", couponController.assignCouponToUser);
router.post(
  "/apply-coupon",
  protect,
  authRole("customer"),
  couponController.applyCoupon
);
router.patch(
  "/remove-coupon",
  protect,
  authRole("customer"),
  couponController.removeCoupon
);

router
  .route("/")
  .get(couponController.getAllCoupon)
  .post(protect, authRole("admin"), couponController.createCoupon);
router
  .route("/:id")
  .get(couponController.getCoupon)
  .patch(protect, authRole("admin"), couponController.updateCoupon)
  .delete(protect, authRole("admin"), couponController.deleteCoupon);

export { router as couponRouter };

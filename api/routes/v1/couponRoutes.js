import express from "express";
// import couponController from "../../Controllers/couponController.js";
import couponController from "../../controllers/couponController.js";

const router = express.Router();

router.patch("/assign/:userId/:couponId", couponController.assignCouponToUser);

router.route("/").get(couponController.getAllCoupon).post(couponController.createCoupon);
router.route("/:id").get(couponController.getCoupon).patch(couponController.updateCoupon).delete(couponController.deleteCoupon);

export { router as couponRouter };

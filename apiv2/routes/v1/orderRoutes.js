import express from "express";
import orderController from "../../controllers/orderController.js";
import { protect } from "../../middlewares/protect.js";
import { authRole } from "../../middlewares/authRole.js";

const router = express();

router.get("/order-stats", orderController.orderStats);

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

router.use(protect);

router.get("/my-orders", orderController.getUserOrders);

router
  .route("/:id")
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

router.use(protect);
router.use(authRole("customer", "admin"));

router.post("/paymentIntent", orderController.paymentIntent);
router.post("/paymentVerify", orderController.verifyPayment);
router.post("/cashOnDelivery", orderController.createOrderCashOnDelivery);

export { router as orderRouter };

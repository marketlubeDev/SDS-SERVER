import express from "express";
// import authController from "../../Controllers/authControllers.js";
import cartController from "../../controllers/cartController.js";
import { protect } from "../../middlewares/protect.js";
import { authRole } from "../../middlewares/authRole.js";

const router = express.Router();

router.use(protect);


//?user routes
router.use(authRole("customer"));
//----------------------------------
router.get("/get-my-cart", cartController.getMyCart);
router.patch("/add-product-to-cart/:productId",cartController.addProductToMyCart);
router.patch("/remove-product-in-cart/:productId",cartController.removeProductInCart);
router.patch("/clear-cart",cartController.clearCart);
router.post("/apply-coupon",cartController.applyCoupon);
router.patch("/remove-coupon",cartController.removeCoupon);



//?admin routes
router.use(authRole("admin"));
//----------------------------------
router.route("/").get(cartController.getAllCart);
router.route("/:id").get(cartController.getCart);
router.get("/get-cart-by-mail/:email", cartController.getCartByEmail);

export { router as cartRouter };

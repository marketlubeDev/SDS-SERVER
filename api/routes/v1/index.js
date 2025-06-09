import { Router } from 'express';
import { userRouter } from './userRoutes.js';
import { productRouter } from './productRoutes.js';
import { cartRouter } from './cartRoutes.js';
import { couponRouter } from './couponRoutes.js';
import { reviewRouter } from './reviewRoutes.js';
import { orderRouter  } from './orderRoutes.js';
import { categoryRouter } from './categoryRoutes.js';
import { subCategoryRouter } from './subCategoryRoutes.js';
import { bannerRouter } from './bannerRoutes.js';
import { labelRouter } from './labelRoutes.js';
import { brandRouter } from './brandRoutes.js';
import { mailRouter} from './mailRoutes.js';
import { adminRouter } from './adminRoutes.js';

const router = Router();


router.use("/user",userRouter)
router.use("/product",productRouter)
router.use("/cart",cartRouter)
router.use("/coupon",couponRouter)
router.use("/review",reviewRouter)
router.use("/order",orderRouter)
router.use("/category",categoryRouter)
router.use("/subCategory",subCategoryRouter)
router.use("/banner",bannerRouter)
router.use("/label",labelRouter)
router.use("/brand",brandRouter)
router.use("/mail",mailRouter)
router.use("/admin",adminRouter)

export { router as V1Router };
import { Router } from "express";
import {
  createBanner,
  getAllBanners,
  deleteBanner,
  updateBanner,
  getBannerById,
} from "../../controllers/BannerControllers.js";
import { upload } from "../../middlewares/multer.js";

const bannerRouter = Router();

bannerRouter.route("/").post(upload.any(), createBanner).get(getAllBanners);

bannerRouter
  .route("/:id")
  .get(getBannerById)
  .delete(deleteBanner)
  .patch(upload.any(), updateBanner);


export { bannerRouter };

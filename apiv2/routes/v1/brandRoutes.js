  import { Router } from "express";
const router = Router();
import {
  getAllBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../../controllers/brandControllers.js";
import { upload } from "../../middlewares/multer.js";


router.route("/").get(getAllBrands).post(upload.single("image"), createBrand);

router
  .route("/:id")
  .get(getBrandById)
  .patch(upload.single("image"), updateBrand)
  .delete(deleteBrand);

export { router as brandRouter };

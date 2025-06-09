import express from "express";
import productController from "../../controllers/productController.js";
import { upload } from "../../middlewares/multer.js";

const router = express.Router();

// Product routes
router
  .route("/")
  .get(productController.getAllProducts)
  .post(upload.any(), productController.createProduct);

router.route("/search").get(productController.searchProducts);

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(upload.any(), productController.updateProduct)
  .delete(productController.deleteProduct);

// Variant routes
router.route("/variant/all-variants").get(productController.getAllVariants);
router.route("/variant/:productId").post(productController.addVariant);

// router
//   .route("/variants/:productId")
//   .get(productController.getVariantsByProductId)
//   .post(productController.addVariant);

router
  .route("/variant/:id")
  .get(productController.getVariant)
  .patch(productController.updateVariant)
  .delete(productController.deleteVariant);

//get product by category
router.get("/category/:categoryId", productController.getProductByCategory);

//get product by subCategory
router.get(
  "/subCategory/:subCategoryId",
  productController.getProductBySubCategory
);

//get product by category and brand
router.get(
  "/category/:categoryId/brand/:brandId",
  productController.getProductByCategoryAndBrand
);

//get product by brandandsubcategory
router.get(
  "/brandandsubcategory/:brandId/:subCategoryId",
  productController.getProductByBrandAndSubCategory
);

export { router as productRouter };

import express from 'express';
import {
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoryByCategory
} from '../../controllers/subCategoryControllers.js';
import { upload } from '../../middlewares/multer.js';

const router = express.Router();

router.route('/')
    .post(upload.single("image"), createSubCategory)
    .get(getSubCategories);

router.route('/:id')
    .get(getSubCategoryById)
    .patch(upload.single("image"), updateSubCategory)
    .delete(deleteSubCategory);

//get subcategories by category id
router.route("/category/:categoryId")
    .get(getSubCategoryByCategory);

export { router as subCategoryRouter };
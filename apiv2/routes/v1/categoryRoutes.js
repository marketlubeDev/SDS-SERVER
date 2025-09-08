import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../../controllers/categoryControllers.js';
import { upload } from '../../middlewares/multer.js';

const router = express.Router();

router.route('/')
    .post(upload.single("image"), createCategory)
    .get(getCategories);

router.route('/:id')
    .get(getCategoryById)
    .patch(upload.single("image"), updateCategory)
    .delete(deleteCategory);

export { router as categoryRouter };
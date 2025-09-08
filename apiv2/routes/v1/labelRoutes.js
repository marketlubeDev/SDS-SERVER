import { Router } from "express";
import labelController from "../../controllers/labelControllers.js";

const router = Router();

router
  .route("/")
  .get(labelController.getAllLabels)
  .post(labelController.createLabel);

router
  .route("/:id")
  .get(labelController.getLabelById)
  .patch(labelController.updateLabel)
  .delete(labelController.deleteLabel);

export { router as labelRouter };

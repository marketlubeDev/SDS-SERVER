import { Router } from "express";
import { getInTouch, raiseComplaint } from "../../controllers/mailControllers.js";

const router = Router();

router.post("/get-in-touch", getInTouch);
router.post("/raise-complaint", raiseComplaint);

export { router as mailRouter };

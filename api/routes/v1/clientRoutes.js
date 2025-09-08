import express from "express";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientsCount,
} from "../../controllers/clientControllers.js";
import { upload } from "../../middlewares/multerS3.js";
import { protect } from "../../middlewares/protect.js";
import { authRole } from "../../middlewares/authRole.js";

const router = express.Router();

// Public routes
router.get("/", getAllClients);
router.get("/count", getClientsCount);
router.get("/:id", getClientById);

// Protected admin routes
router.use(protect);
router.use(authRole("admin"));

router.post("/", upload.single("image"), createClient);
router.patch("/:id", upload.single("image"), updateClient);
router.delete("/:id", deleteClient);

export { router as clientRouter };

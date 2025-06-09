import { Router } from "express";
import authControllers from "../../controllers/authControllers.js";

const adminRouter = Router();

adminRouter.route("/login").post(authControllers.adminLogin);


export {adminRouter};
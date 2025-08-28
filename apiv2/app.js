import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
// import fs from "fs";
import { apiRouter } from "./routes/index.js";
import globalErrorHandler from "./utils/globalErrorHandler.js";
import AppError from "./utils/appError.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// // Get the directory name of the current module
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// console.log(__dirname);

// // Resolve the path to the Client dist folder
// const clientDistPath = path.resolve(__dirname, "..", "..", "client", "dist");
// console.log(clientDistPath);

// Application Level Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://sds-security-sigma.vercel.app",
      "https://sds-security-admin.vercel.app",
      "https://www.securedesign.in",
    ], // Allow both Vite dev servers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true, // If using cookies for authentication
  })
);

app.get("/test", (req, res, next) => {
  return res
    .status(200)
    .json({ messsage: "connected to server", status: "success" });
});

// API routes
app.use("/api", apiRouter);

// End point mismatch / does not exist
app.all(/.*/, (req, res, next) => {
  next(new AppError("This route does not exist", 404));
});

// Global error handler
app.use(globalErrorHandler);

export default app;

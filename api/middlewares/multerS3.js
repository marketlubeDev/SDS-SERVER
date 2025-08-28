import multer from "multer";
import multerS3 from "multer-s3";
import s3Client, { S3_BUCKET_NAME } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: S3_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      const fileExtension = path.extname(file.originalname);
      let folder = "uploads";

      // Determine folder based on fieldname
      if (file.fieldname === "productImage") {
        folder = "SDS/products/main";
      } else if (file.fieldname === "productBrochure") {
        folder = "SDS/products/brochures";
      } else if (file.fieldname.startsWith("variant_")) {
        folder = "SDS/products/variants";
      } else if (file.fieldname === "image") {
        // Determine folder based on the route context
        const url = req.originalUrl || req.url || "";
        if (url.includes("/banner")) {
          folder = "SDS/banners/desktop";
        } else if (url.includes("/category")) {
          folder = "SDS/categories";
        } else if (url.includes("/subcategory")) {
          folder = "SDS/subcategories/images";
        } else if (url.includes("/brand")) {
          folder = "SDS/brands";
        } else {
          folder = "SDS/uploads";
        }
      } else if (file.fieldname === "mobileImage") {
        folder = "SDS/banners/mobile";
      } else if (file.fieldname === "brandImage") {
        folder = "SDS/brands";
      } else if (file.fieldname === "categoryImage") {
        folder = "SDS/categories";
      } else if (file.fieldname === "subCategoryImage") {
        folder = "SDS/subcategories/images";
      } else if (file.fieldname === "subCategoryBanner") {
        folder = "SDS/subcategories/banners";
      } else if (
        file.fieldname === "profilePic" ||
        file.fieldname === "profilePicture"
      ) {
        folder = "SDS/users/profiles";
      }

      const fileName = `${folder}/${uuidv4()}${fileExtension}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.fieldname === "productBrochure") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for brochures"), false);
      }
    } else {
      // For images
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"), false);
      }
    }
  },
});

export { upload };

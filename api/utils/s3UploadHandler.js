import { uploadToS3 } from "./s3Upload.js";

/**
 * Handle file uploads for products using S3
 * @param {Array} files - Array of uploaded files
 * @returns {Object} - Object containing processed file URLs
 */
export const handleProductFileUploads = async (files) => {
  let productImage = "";
  let productBrochure = "";
  const variantImagesMap = {};

  if (files && files.length > 0) {
    for (const file of files) {
      const { fieldname, buffer, originalname, mimetype } = file;

      try {
        if (fieldname === "productImage") {
          productImage = await uploadToS3(
            buffer,
            originalname,
            "SDS/products/main",
            mimetype
          );
        } else if (fieldname === "productBrochure") {
          // Validate file type
          if (mimetype !== "application/pdf") {
            throw new Error("Only PDF files are allowed for brochure");
          }
          productBrochure = await uploadToS3(
            buffer,
            originalname,
            "SDS/products/brochures",
            mimetype
          );
        } else if (fieldname.startsWith("variant_")) {
          const match = fieldname.match(/variant_(\d+)_image_(\d+)/);
          if (match) {
            const variantIndex = match[1];
            const imageIndex = parseInt(match[2]);
            const s3Url = await uploadToS3(
              buffer,
              originalname,
              "SDS/products/variants",
              mimetype
            );

            if (!variantImagesMap[variantIndex]) {
              variantImagesMap[variantIndex] = [];
            }
            variantImagesMap[variantIndex][imageIndex] = s3Url;
          }
        }
      } catch (error) {
        console.error(`Error uploading file ${fieldname}:`, error);
        throw error;
      }
    }
  }

  return {
    productImage,
    productBrochure,
    variantImagesMap,
  };
};

/**
 * Handle banner file uploads using S3
 * @param {Object} files - Files object from multer
 * @returns {Object} - Object containing banner image URLs
 */
export const handleBannerFileUploads = async (files) => {
  let image = "";
  let mobileImage = "";

  if (files) {
    if (files.image && files.image[0]) {
      const file = files.image[0];
      image = await uploadToS3(
        file.buffer,
        file.originalname,
        "SDS/banners/desktop",
        file.mimetype
      );
    }

    if (files.mobileImage && files.mobileImage[0]) {
      const file = files.mobileImage[0];
      mobileImage = await uploadToS3(
        file.buffer,
        file.originalname,
        "SDS/banners/mobile",
        file.mimetype
      );
    }
  }

  return { image, mobileImage };
};

/**
 * Handle single file upload using S3
 * @param {Object} file - Single file from multer
 * @param {string} folder - S3 folder path
 * @returns {string} - S3 URL
 */
export const handleSingleFileUpload = async (file, folder = "SDS/uploads") => {
  if (!file) return "";

  return await uploadToS3(
    file.buffer,
    file.originalname,
    folder,
    file.mimetype
  );
};

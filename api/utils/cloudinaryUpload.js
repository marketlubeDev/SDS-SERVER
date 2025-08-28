import { uploadToS3 } from "./s3Upload.js";

/**
 * Upload buffer to S3 (replaces Cloudinary functionality)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - S3 folder path (default: "SDS/products")
 * @param {string} originalName - Original filename (default: generated)
 * @param {string} contentType - MIME type (default: "image/jpeg")
 * @returns {Promise<string>} - S3 URL
 */
const uploadToS3Buffer = async (
  buffer,
  folder = "SDS/products",
  originalName = `image_${Date.now()}.jpg`,
  contentType = "image/jpeg"
) => {
  try {
    return await uploadToS3(buffer, originalName, folder, contentType);
  } catch (error) {
    console.error("Error uploading buffer to S3:", error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

export default uploadToS3Buffer;

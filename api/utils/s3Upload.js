import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client, { S3_BUCKET_NAME } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Upload buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} folder - S3 folder path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - S3 URL
 */
export const uploadToS3 = async (
  buffer,
  originalName,
  folder = "SDS/products",
  contentType = "image/jpeg"
) => {
  try {
    const fileExtension = path.extname(originalName);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read", // Make files publicly accessible
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${S3_BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Download image from URL and upload to S3
 * @param {string} imageUrl - Cloudinary URL
 * @param {string} folder - S3 folder path
 * @returns {Promise<string>} - S3 URL
 */
export const migrateImageToS3 = async (imageUrl, folder = "SDS/products") => {
  try {
    if (!imageUrl) {
      console.log("Skipping empty URL");
      return imageUrl;
    }

    // Skip if already in SDS folder structure
    if (imageUrl.includes("/SDS/")) {
      console.log("Skipping already migrated URL:", imageUrl);
      return imageUrl;
    }

    console.log(`Migrating image: ${imageUrl}`);

    // Download image from Cloudinary
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Extract filename from URL or generate one
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1] || `image_${Date.now()}.jpg`;

    // Upload to S3
    const s3Url = await uploadToS3(buffer, filename, folder, contentType);
    console.log(`Successfully migrated: ${imageUrl} -> ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error(`Error migrating image ${imageUrl}:`, error);
    throw error;
  }
};

export default uploadToS3;

import Banner from "../models/BannerModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";
import { cloudinaryInstance } from "../config/cloudinary.js";

export const createBanner = catchAsync(async (req, res, next) => {
  const { title, bannerFor, description, productLink, features } = req.body;

  const bannerData = { title, description, productLink, features };

  // if (bannerFor === "category") {
  //   const alreadyExist = await Banner.findOne({
  //     category: category,
  //     bannerFor: "category",
  //   });
  //   if (alreadyExist) {
  //     return next(new AppError("Banner For this category already exists", 400));
  //   }

  //   bannerData.category = category;
  //   bannerData.percentage = percentage;
  // }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      if (file?.fieldname?.startsWith("image")) {
        const uploadedImage = await cloudinaryInstance.uploader.upload(
          file.path,
          { folder: "banners" }
        );
        bannerData.image = uploadedImage.secure_url;
      } else if (file?.fieldname?.startsWith("mobileImage")) {
        const uploadedMobileImage = await cloudinaryInstance.uploader.upload(
          file.path,
          { folder: "banners" }
        );
        bannerData.mobileImage = uploadedMobileImage.secure_url;
      }
    }
  }

  const newBanner = await Banner.create(bannerData);

  res.status(201).json({
    status: "success",
    data: newBanner,
  });
});

export const getAllBanners = catchAsync(async (req, res, next) => {
  const banners = await Banner.find();
  res.status(200).json({
    status: "success",
    data: banners,
  });
});

export const getBannerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const banner = await Banner.findById(id);

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  if (banner.image) {
    const imagePath = join("public", banner.image);
    if (existsSync(imagePath)) {
      unlinkSync(imagePath);
    }
  }

  await banner.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Banner deleted successfully",
  });
});

export const updateBanner = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, bannerFor, description, productLink, features } = req.body;

  const updateData = {
    title,
    bannerFor,
    description,
    productLink,
    features,
  };

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {

      if (file.fieldname.startsWith("image")) {
        const uploadedImage = await cloudinaryInstance.uploader.upload(
          file.path,
          { folder: "banners" }
        );
        updateData.image = uploadedImage.secure_url;
      } else if (file.fieldname.startsWith("mobileImage")) {
        const uploadedMobileImage = await cloudinaryInstance.uploader.upload(
          file.path,
          { folder: "banners" }
        );
        updateData.mobileImage = uploadedMobileImage.secure_url;
      }
    }
  }

  const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedBanner) {
    return next(new AppError("Banner not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedBanner,
    message: "Banner updated successfully",
  });
});

export const deleteBanner = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await Banner.findByIdAndDelete(id);
  res
    .status(200)
    .json({ status: "success", message: "Banner deleted successfully" });
});

export const getAllBannersByCategory = catchAsync(async (req, res, next) => {
  const banners = await Banner.find({ bannerFor: "category" }).populate(
    "category"
  );
  res.status(200).json({ status: "success", data: banners });
});

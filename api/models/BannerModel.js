import mongoose from "mongoose";
const { Schema } = mongoose;

const bannerSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    default: null,
    required: [true, "Image is required"],
  },
  mobileImage: {
    type: String,
    required: [true, "Mobile image is required"],
  },
  bannerFor: {
    type: String,
    enum: ["category", "product", "home"],
    // required: [true, "Banner for is required"],
    default: "product",
  },
  productLink: {
    type: String,
    default: null,
  },
  features: {
    type: [String],
    maxLength: 4,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;

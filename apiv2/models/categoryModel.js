import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  // bannerImage: {
  //   type: String,
  //   trim: true,
  // },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;

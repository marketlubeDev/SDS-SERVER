import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product must have a name"],
      minlength: [3, "Product name should be greater than 3 characters"],
    },
    description: {
      type: String,
      required: [true, "Product must have a description"],
      // maxlength: [200, "Description must be less than 200 characters"],
      // minlength: [10, "Description must be greater than 10 characters"],
    },
    productImage: {
      type: String,
      required: [true, "Product must have a image"],
    },
    images: {
      type: [String],
      required: [true, "Product must have at least one image"],
    },
    label: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Label",
    },
    statistic: {
      type: String,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Product must belong to a brand"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to a category"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Product must belong to a sub-category"],
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// productSchema.virtual("offerPrice").get(function () {
//   if (!this.price || !this.offer) return this.price;
//   return this.price - (this.price * this.offer) / 100;
// });

// //populate category name
// productSchema.virtual("categoryName", {
//   ref: "Category",
//   localField: "category",
//   foreignField: "_id",
//   justOne: true,
//   select: "name",
// });

// //populate subCategory name
// productSchema.virtual("subCategoryName", {
//   ref: "SubCategory",
//   localField: "subCategory",
//   foreignField: "_id",
//   justOne: true,
//   select: "name",
// });

productSchema.pre(/^find/, function (next) {
  this.populate("label");
  next();
}
);

export const Product = mongoose.model("Product", productSchema);

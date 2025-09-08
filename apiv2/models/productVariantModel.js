import mongoose from "mongoose";
const { Schema } = mongoose;

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    // unique: true,
  },
  variantName: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  label: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Label",
  },
  grossPrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  offerPrice: {
    type: Number,
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: [0, "Stock quantity cannot be negative"],
  },
  stockStatus: {
    type: String,
    enum: ["inStock", "outOfStock"],
    default: "inStock",
  },
  specifications: [
    {
      title: { type: String, required: [true, "should have a title"] },
      specs: [
        {
          key: String,
          value: String,
        },
      ],
    },
  ],
  //images which will be shown in product details page(variant)
  images: [
    {
      type: String,
      required: [true, "Variant should have at least one image"],
    },
  ],
  features: [
    {
      name: String,
      description: String,
      image: { type: String },
    },
  ],
  // attributes: {
  //   title: String,
  //   description: String,
  // },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// variantSchema.pre("findOneAndUpdate", async function (next) {
//   const update = this.getUpdate();
//   if (update.stockQuantity !== undefined) {
//     update.stockStatus = update.stockQuantity <= 0 ? "outOfStock" : "inStock";
//   }
//   next();
// });

const Variant = mongoose.model("Variant", variantSchema);
export default Variant;

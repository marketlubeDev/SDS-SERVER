import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isVerified: { type: Boolean, default: false },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          type: Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        }, // Optional, if variants are used
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    deliveryAddress: { type: Object },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processed",
        // "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "onrefund",
      ],
      default: "pending",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    couponApplied: { type: Object },
    expectedDelivery: {
      type: Date,
      default: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], default: "COD" },
    // paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "onrefund",
        "processed",
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

// orderSchema.pre(/^find/, function (next) {
//   this.where({ isDeleted: false });
//   next();
// });

// orderSchema.pre("find", async function (next) {
//   this.populate({
//     path: "products.productId",
//     select: "name productImage _id ",
//   });
//   this.populate({
//     path: "products.variantId",
//     select: "-specifications",
//   });
//   next();
// });

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "products.product",
    select: "name price color productImage _id",
  });
  this.populate({
    path: "products.variant",
    select: "-specifications",
  });
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

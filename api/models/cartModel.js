import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true, // User is required
    },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true, // Product is required
        },
        variant: {
          type: mongoose.Schema.ObjectId,
          ref: "Variant", // Reference to the Variant model
          required: true, // Variant is required
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
          required: true, // Quantity is required
        },
        price: {
          type: Number,
          required: true, // Price is required
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
      required: true, // Subtotal is required
    },
    couponApplied: {
      type: Object,
    },
    isCouponApplied: {
      type: Boolean,
      default: false,
    },
    coupon: {
      type: mongoose.Schema.ObjectId,
      ref: "Coupon",
    },
    fittingCharges: {
      type: Number,
      default: 800,
      required: true, // Fitting charges are required
    },
    gst: {
      type: Number,
      default: 0,
      required: true, // GST is required
    },
    totalAmount: {
      type: Number,
      default: 0,
      required: true, // Total amount is required
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Calculate subtotal
cartSchema.methods.calculateSubtotal = function () {
  this.subtotal = this.products.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  return this.subtotal;
};

// Calculate GST (assuming 10%)
cartSchema.methods.calculateGST = function () {
  this.gst = Math.round(this.subtotal * 0.1);
  return this.gst;
};

// Calculate final total
cartSchema.methods.calculateTotal = function () {
  // Calculate subtotal first
  this.calculateSubtotal();

  // Calculate GST
  this.calculateGST();

  // Start with subtotal
  let total = this.subtotal;

  // Apply coupon discount if any
  if (this.isCouponApplied && this.couponAppliedPrice) {
    total = this.couponAppliedPrice;
  }

  // Add fitting charges
  total += this.fittingCharges;

  // Add GST
  total += this.gst;

  // Round to 2 decimal places
  this.totalAmount = Math.round(total * 100) / 100;
  return this.totalAmount;
};

// Virtual to combine price details
cartSchema.virtual("priceDetails").get(function () {
  return {
    subtotal: this.subtotal,
    discountAmount: this.isCouponApplied
      ? this.subtotal - this.couponAppliedPrice
      : 0,
    fittingCharges: this.fittingCharges,
    gst: this.gst,
    totalAmount: this.totalAmount,
  };
});

// Pre-save middleware to calculate totals
cartSchema.pre("save", async function (next) {
  this.calculateTotal();
  next();
});

//calculate total amount if the cart is updatedData
cartSchema.pre("find", async function (next) {
  if (
    this.isModified(
      "products",
      "coupon",
      "isCouponApplied",
      "couponAppliedPrice",
      "fittingCharges",
      "gst",
      "subtotal"
    )
  ) {
    this.calculateTotal();
  }
  next();
});

// Populate products, variants, and other references on find
cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: "products.product",
    select: "name price color productImage _id",
  })
    .populate({
      path: "products.variant",
      select:
        "sku color offerPrice grossPrice sellingPrice stockStatus _id stockQuantity", // Populate variant details
    })
    .populate({
      path: "user",
      select: "name email _id",
    })
    .populate({
      path: "coupon",
      select: "code discountPercent isValid",
    });
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

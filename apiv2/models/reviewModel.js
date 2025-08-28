import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A Review must belong to a User"],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "A Review must belong to a Product"],
    },
    message: {
      type: String,
      required: [true, "A Review must have a message"],
    },
    rating: {
      type: Number,
      required: [true, "User must give rating"],
    },
    title:{
      type:String,
      required: [true, "Review must have a title"],
    }
  },
  { timestamps: true }
);

// Ensure that a user can only create one review per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name email" }).populate({
    path: "product",
  });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;

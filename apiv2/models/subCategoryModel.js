import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    bannerImage: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

// subCategorySchema.pre("save", async function (next) {
//     if (!this.isModified("category")) return next();
//     this.category = await Category.findById(this.category);
//     next();
// });

subCategorySchema.pre("find", async function (next) {
    this.populate({
        path: "category",
        select: "name"
    });
    next();
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);



export default SubCategory;

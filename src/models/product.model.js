import { Schema, model } from "mongoose";

const productSchema = new Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be positive"],
    },
    image: [
        {
            url: String,
            public_id: String,
        },
    ],
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    subCategory: {
        type: String,
        required: [true, "Subcategory is required"],
    },
    sizes: {
        type: [String],
        required: [true, "Available sizes are required"],
    },
    bestseller: {
        type: Boolean,
        required: true,
        default: false,
    },
    discount: {
        type: Number,
        min: [0, "Discount cannot be less than 0%"],
        max: [99, "Discount cannot exceed 100%"],
        default: 0,
    },
    discountPrice: {
        type: Number,
        required: [true, "Discount price is required"],
        min: [0, "Price must be positive"],
    },
    embedding: {
        type: [Number],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

export const Product = model("Product", productSchema);

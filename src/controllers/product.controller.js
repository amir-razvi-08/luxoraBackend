import { v2 as cloudinary } from "cloudinary";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addProduct = asyncHandler(async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, discount, bestseller } = req.body;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded" });
        }

        const images = ["image1", "image2", "image3", "image4"]
            .map((key) => req.files[key]?.[0])
            .filter(Boolean);

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        const imagesData = await Promise.all(
            images.map(async (img) => {
                if (!img.buffer) {
                    throw new ApiError(400, "Invalid file buffer");
                }

                const result = await uploadOnCloudinary(img.buffer, img.mimetype);

                if (!result?.secure_url) {
                    throw new ApiError(500, "Image upload failed");
                }

                return {
                    url: result.secure_url,
                    public_id: result.public_id,
                };
            })
        );

        const discountPrice = Math.round((price * 100 - price * discount) / 100);

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            discount: discount ? Number(discount) : 0,
            discountPrice: Number(discountPrice),
            sizes: JSON.parse(sizes),
            bestseller: bestseller === "true",
            image: imagesData,
            date: Date.now(),
        };

        const product = await Product.create(productData);

        if (!product) {
            throw new ApiError(500, "Product creation failed");
        }

        return res.status(201).json(new ApiResponse(201, product, "Product added successfully"));
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});


const handleAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find();

    if (!products.length) {
        throw new ApiError(404, "No products found");
    }

    return res.status(200).json(new ApiResponse(200, products, "All products retrieved successfully"));
});

const removeProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    await Promise.all(
        product.image.map(async (img) => {
            await cloudinary.uploader.destroy(img.public_id);
        })
    );

    await Product.findByIdAndDelete(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Product removed successfully"));
});

const singleProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(new ApiResponse(200, product, "Product retrieved successfully"));
});

export { addProduct, handleAllProducts, removeProduct, singleProduct };

import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const addToCart = asyncHandler(async (req, res) => {
    const { itemId, size } = req.body;
    const userId = req.user._id;

    const userData = await User.findById(userId);
    if (!userData) throw new ApiError(404, "User not found");

    const cartData = await userData.cartData;

    if (cartData[itemId]) {
        if (cartData[itemId][size]) {
            cartData[itemId][size] += 1;
        } else {
            cartData[itemId][size] = 1;
        }
    } else {
        cartData[itemId] = {};
        cartData[itemId][size] = 1;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { cartData }, { new: true });
    if (!updatedUser) throw new ApiError(400, "Failed to add item to cart");

    return res.status(200).json(new ApiResponse(200, cartData, "User cart was added successfully"));
});

const updateCart = asyncHandler(async (req, res) => {
    const { itemId, size, quantity } = req.body;
    const userId = req.user._id;

    const userData = await User.findById(userId);
    if (!userData) throw new ApiError(404, "User not found");

    const cartData = await userData.cartData;
    if (!cartData[itemId] || !cartData[itemId][size]) throw new ApiError(404, "Item not found in cart");

    cartData[itemId][size] = quantity;

    const updatedUser = await User.findByIdAndUpdate(userId, { cartData }, { new: true });
    if (!updatedUser) throw new ApiError(400, "Failed to update cart");

    return res.status(200).json(new ApiResponse(200, cartData, "User cart was updated successfully"));
});

const getUserCarts = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const userData = await User.findById(userId);
    if (!userData) throw new ApiError(404, "User not found");

    const cartData = userData.cartData;

    return res.status(200).json(new ApiResponse(200, cartData, "User cart retrieved successfully"));
});

export { addToCart, updateCart, getUserCarts };

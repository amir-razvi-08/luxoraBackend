import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;

    if (!token) {
        throw new ApiError(401, "Unauthorized request: No access token provided");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Unauthorized request: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access token expired");
        } else if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid access token");
        } else {
            throw new ApiError(403, "Access forbidden");
        }
    }
});

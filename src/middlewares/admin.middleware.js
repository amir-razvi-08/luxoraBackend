import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const isAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;

        if (!token) {
            throw new ApiError(401, "Authorization token not found");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (decoded.role !== "admin") {
            throw new ApiError(403, "Access denied. Admins only.");
        }

        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token has expired, please log in again");
        }
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token");
        }

        throw new ApiError(error.status || 500, error.message || "Internal Server Error");
    }
};

export { isAdmin };

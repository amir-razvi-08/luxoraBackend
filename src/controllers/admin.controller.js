import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { options } from "../constants.js";
import { Admin } from "../models/admin.model.js";


const generateToken = async (adminId) => {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new ApiError(404, "Admin not found");

    const accessToken = admin.generateAccessToken();
    return accessToken;
};



const registerAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if ([fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const adminExist = await Admin.findOne({ email });
    if (adminExist) {
        throw new ApiError(409, "Admin with this email already exists");
    }

    const admin = await Admin.create({ fullName, email, password });

    const adminCreated = await Admin.findById(admin._id).select("-password");
    if (!adminCreated) {
        throw new ApiError(500, "Something went wrong while registering the admin");
    }

    return res.status(201).json(new ApiResponse(201, adminCreated, "Admin registered successfully"));
});



const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Admin Email required");
    }

    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const accessToken = await generateToken(admin._id);
    const loggedInAdmin = await Admin.findById(admin._id).select("-password");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { admin: loggedInAdmin, accessToken }, "Admin logged in successfully"));
});

const logoutAdmin = asyncHandler(async (req, res) => {
    return res.status(200).clearCookie("accessToken", options).json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

export { loginAdmin, logoutAdmin, registerAdmin };

import { sendWelcomeEmail, sendOtp } from "./email.controller.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { options } from "../constants.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "all field are required");
    }

    const userName = await User.findOne({ username });
    if (userName) {
        throw new ApiError(409, "This username is already taken");
    }
    const usermail = await User.findOne({ email });

    if (usermail) {
        throw new ApiError(409, "This email is already registered");
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username,
    });

    const userCreated = await User.findById(user._id).select("-password -refreshToken");
    if (!userCreated) {
        throw new ApiError(500, "something went wrong while regestring the user");
    }

    try {
        sendWelcomeEmail(user.email, user.fullName);
    } catch (err) {
        throw new ApiError(500, "Failed to send welcome email");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: userCreated, accessToken, refreshToken }, "user regestered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { usernameOremail, password } = req.body;

    if (!usernameOremail) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username: usernameOremail }, { email: usernameOremail }],
    });

    if (!user) {
        throw new ApiError(404, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid Password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("token", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "user loggedIn successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: "" },
        },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthoriazed request");
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedRefreshToken?._id);

        if (!user) {
            throw new ApiError(402, "Invalid refreshToken");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(402, "refreshToken expired");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: refreshToken }, "accessToken refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refreshToken");
    }
});


const generateOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is required");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 120000);

    const response = await User.findOneAndUpdate({ email }, { otp, otpExpiry }, { upsert: true, new: true });
    if (!response) throw new ApiError(404, "User not found");

    try {
        sendOtp(email, otp);
    } catch (error) {
        throw new ApiError(400, "Failed to send OTP");
    }

    res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
});


const verifyOtp = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const useOtp = user.otp;
    const otpExpiry = user.otpExpiry;

    if (useOtp !== otp) throw new ApiError(402, "Invalid OTP");

    if (otpExpiry < Date.now()) throw new ApiError(402, "OTP expired");

    user.otp = "";
    user.save();

    return res.status(200).json(new ApiResponse(200, {}, "otp varified successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) throw new ApiError(403, "user not found Or password not reset");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "password reset successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "current user fetched successfully"));
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, generateOtp, verifyOtp, resetPassword };

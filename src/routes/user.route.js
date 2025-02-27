import Router from "express";
import { registerUser, loginUser, logoutUser,verifyOtp, resetPassword,generateOtp } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/verify-otp').post(verifyOtp);
router.route('/reset-password').post(resetPassword);
router.route('/generate-otp').post(generateOtp);







export default router;

import Router from "express";
import { loginAdmin, logoutAdmin, registerAdmin, isAuthAdmin } from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/logout").post(isAdmin, logoutAdmin);
router.route("/register").post(registerAdmin);

router.route("/is-auth").get(isAdmin, isAuthAdmin);

export default router;

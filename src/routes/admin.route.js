import Router from "express";
import { loginAdmin, logoutAdmin,registerAdmin } from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route('/login').post(loginAdmin);
router.route('/logout').post(isAdmin,logoutAdmin);
router.route('/register').post(registerAdmin);



export default router;
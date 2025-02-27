import Router from "express";
import { addToCart, updateCart, getUserCarts } from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/add').patch(verifyJWT, addToCart);
router.route('/update').patch(verifyJWT, updateCart);
router.route('/get').get(verifyJWT, getUserCarts);

export default router;

import express,{ Router } from "express";
import {
  placeOrder,
  placeOrderStripe,
  verifyStripePayment,
  userOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  verifyStripeWebhook
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();


router.route("/list").get(isAdmin, getAllOrders);
router.route("/status").patch(isAdmin, updateOrderStatus);



router.route("/place-cod").post(verifyJWT, placeOrder);
router.route("/stripe").post(verifyJWT, placeOrderStripe);
router.route("/verify-stripe").post(verifyJWT, verifyStripePayment);
router.route("/cancel/:orderId").patch(verifyJWT, cancelOrder);
router.route("/user-orders").get(verifyJWT, userOrders);

router.post("/webhook/stripe", express.raw({ type: "application/json" }), verifyStripeWebhook);

export default router;



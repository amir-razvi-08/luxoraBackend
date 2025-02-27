import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Stripe from "stripe";

const currency = "INR";
const delivery_charge = 40;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = asyncHandler(async (req, res) => {
    const { address, amount, items } = req.body;
    const userId = req.user._id;

    const orderData = {
        items,
        address,
        amount,
        userId,
        paymentMethod: "COD",
        date: Date.now(),
    };

    const order = await Order.create(orderData);
    if (!order) throw new ApiError(400, "Failed to place the order");
    await User.findByIdAndUpdate(userId, { cartData: {} });
    return res.status(200).json(new ApiResponse(200, order, "Order placed successfully"));
});

const placeOrderStripe = asyncHandler(async (req, res) => {
    const { address, amount, items } = req.body;
    const { origin } = req.headers;
    const userId = req.user._id;

    if (!userId || !address || !amount || !items || items.length === 0) {
        throw new ApiError(400, "Missing required fields for order placement.");
    }

    const orderData = {
        userId,
        items,
        address,
        amount,
        paymentMethod: "Stripe",
        payment: false,
        date: Date.now(),
    };

    const newOrder = await Order.create(orderData);
    if (!newOrder || !newOrder._id) throw new ApiError(400, "Failed to create order for Stripe payment");

    const line_items = items.map((item) => ({
        price_data: {
            currency,
            product_data: { name: item.name },
            unit_amount: item.price * 100,
        },
        quantity: item.quantity,
    }));

    line_items.push({
        price_data: {
            currency,
            product_data: { name: "Delivery Charges" },
            unit_amount: delivery_charge * 100,
        },
        quantity: 1,
    });
    console.log(origin);

    const session = await stripe.checkout.sessions.create({
        success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
        line_items,
        mode: "payment",
        payment_intent_data: { metadata: { orderId: newOrder._id.toString() } },
    });

    if (!session) throw new ApiError(400, "Failed to initiate Stripe session");

    return res.status(200).json(new ApiResponse(200, { session_url: session.url }, "Stripe session created successfully"));
});

const verifyStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata.orderId;

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { payment: true, status: "Paid" }, { new: true });

        if (!updatedOrder) throw new ApiError(400, "Failed to update order status after payment");

        await User.findByIdAndUpdate(updatedOrder.userId, { cartData: {} });
    }

    res.status(200).json(new ApiResponse(200, {}, "Stripe webhook received successfully"));
});

const verifyStripePayment = asyncHandler(async (req, res) => {
    const { orderId, success } = req.body;
    const userId = req.user._id;

    if (!orderId || !success) {
        throw new ApiError(400, "Order ID and payment success status are required.");
    }

    if (success === "true") {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { payment: true }, { new: true });

        if (!updatedOrder) throw new ApiError(400, "Failed to verify payment");

        await User.findByIdAndUpdate(userId, { cartData: {} }, { new: true });

        return res.status(200).json(new ApiResponse(200, updatedOrder, "Payment verified successfully"));
    }

    const cancelledOrder = await Order.findByIdAndUpdate(orderId, { status: "Cancelled" }, { new: true });

    if (!cancelledOrder) {
        throw new ApiError(400, "Failed to update order status to cancelled");
    }

    return res.status(400).json(new ApiResponse(400, cancelledOrder, "Payment failed, order cancelled"));
});

const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOneAndUpdate({ _id: orderId, userId, status: { $ne: "Cancelled" } }, { status: "Cancelled" }, { new: true });

    if (!order) {
        throw new ApiError(404, "Order not found, unauthorized, or already cancelled");
    }

    return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});

const userOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const orders = await Order.find({ userId });
    if (!orders) throw new ApiError(404, "No orders found for this user");

    return res.status(200).json(new ApiResponse(200, orders, "User orders retrieved successfully"));
});

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find();
    if (!orders || orders.length === 0) throw new ApiError(404, "No orders found");

    return res.status(200).json(new ApiResponse(200, orders, "All orders retrieved successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId, status } = req.body;

    const validStatuses = ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid order status provided");
    }

    const updatedOrder = await Order.findById(orderId);
    if (!updatedOrder) {
        throw new ApiError(404, "Order not found");
    }

    if (updatedOrder.status === status) {
        throw new ApiError(400, `Order is already marked as ${status}`);
    }

    updatedOrder.status = status;
    await updatedOrder.save();

    return res.status(200).json(new ApiResponse(200, updatedOrder, "Order status updated successfully"));
});

export { placeOrder, placeOrderStripe, verifyStripePayment, getAllOrders, userOrders, updateOrderStatus, cancelOrder, verifyStripeWebhook };

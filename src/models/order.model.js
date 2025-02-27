import { Schema, model } from "mongoose";

const orderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [],

        address: {
            type: Object,
            default:{},
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, "Amount must be positive"],
        },
        status: {
            type: String,
            enum: ["Order Placed","Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
            default: "Order Placed",
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        payment: {
            type: Boolean,
            required: true,
            default: false,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {minimize:false, timestamps: true }
);

export const Order = model("Order", orderSchema);

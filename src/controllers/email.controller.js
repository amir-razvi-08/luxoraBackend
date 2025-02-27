import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendContactEmail = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;
    console.log(req.body);
    if (!name || !email || !subject || !message) throw new ApiError(400, "All fields are required");

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Submission: ${subject}`,
        html: `<h3>Contact Form Submission</h3>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Subject:</strong> ${subject}</p>
               <p><strong>Message:</strong></p>
               <p>${message}</p>`,
    };

    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank You for Contacting Luxora",
        html: `<h3>Hello ${name},</h3>
               <p>Thank you for reaching out to us. Our team will get back to you as soon as possible.</p>
               <p>Best Regards,</p>
               <p>Luxora Team</p>`,
    };

    await transporter.sendMail(mailOptions);
    await transporter.sendMail(userMailOptions);

    return res.status(200).json(new ApiResponse(200, {}, "Email sent successfully"));
});


const sendOtp = asyncHandler(async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Luxora - OTP for Password Reset",
            html: `<div style="max-width: 500px; margin: 0 auto; padding: 20px; background: 
                    #ffffff;  border: 1px solid #ddd; border-radius: 8px; font-family: Arial, sans-serif; text-align: center;">
                    <h3 style="color: #333; font-size: 22px; margin-bottom: 10px;">Password Reset Request</h3>
                    <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
                    You have requested to reset your password. Use the OTP below to proceed:
                    </p>
                    <p style="font-size: 30px; font-weight: bold; color: #000; margin: 15px 0;">${otp}</p>
                    <p style="color: #777; font-size: 14px;">
                    This OTP is valid for <strong>2 minutes</strong>. If you did not request a password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                    This is an automated email. Please do not reply.
                    </p>
                    </div>`,
                };
    await transporter.sendMail(mailOptions);
});

const sendWelcomeEmail = asyncHandler(async (userEmail, userName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Welcome to Luxora - Where Style Meets Elegance",
        html: `<div style="font-family: Arial, sans-serif; color: #333;">
                   <h2 style="color: #d81b60;">Welcome to Luxora, ${userName}!</h2>
                   <p>We're thrilled to have you as part of our fashion-forward community. At Luxora, we believe that style is a reflection of individuality, and we're here to help you express yours with our premium clothing collections.</p>
                   <p>As a valued member, you'll enjoy exclusive access to the latest trends, special offers, and personalized recommendations.</p>
                   <p>Start exploring now and elevate your wardrobe with Luxora’s finest pieces.</p>
                   <p><a href="https://luxora-shop.vercel.app" style="color: #d81b60; text-decoration: none; font-weight: bold;">Shop Now</a></p>
                   <p>Need assistance? Our support team is always here to help.</p>
                   <p>Best Regards,</p>
                   <p><strong>The Luxora Team</strong></p>
               </div>`,
    };

    await transporter.sendMail(mailOptions);
});

export { sendContactEmail, sendWelcomeEmail, sendOtp };

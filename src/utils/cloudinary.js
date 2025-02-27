import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = (fileBuffer, mimetype) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", timeout: 120000 },
            (error, result) => {
                if (error) reject(new Error("Cloudinary upload failed"));
                else resolve(result);
            }
        );

        uploadStream.end(fileBuffer); // Send file buffer to Cloudinary
    });
};

export { uploadOnCloudinary };

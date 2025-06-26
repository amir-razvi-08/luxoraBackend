import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { MongoClient } from "mongodb";


const mongoClient = async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("Client connected");
    return client.db(DB_NAME);
};

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("mongoose Connected");
    } catch (error) {
        console.log("MONGODB Connection error", error);
        process.exit(1);
    }
};

export { connectDB, mongoClient };

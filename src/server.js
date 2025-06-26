import dotenv from "dotenv";
import { connectDB } from "./database/mongoDB.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 4000, () => {
            console.log(` Server is running at port:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection FAILED!", err);
    });

export default app;

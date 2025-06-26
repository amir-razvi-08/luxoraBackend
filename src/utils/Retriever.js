import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { CohereEmbeddings } from "@langchain/cohere";
import { connectDB, mongoClient } from "../database/mongoDB.js";

await connectDB();
const db = await mongoClient();
const collection = db.collection("products");

const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
});

const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "default",
    textKey: "text",
    embeddingKey: "embedding",
});

const combinedRetriever = async (query) => {
    const staticResults = await vectorStore.similaritySearch(query, 3);
    return [...staticResults]
};

export { combinedRetriever };

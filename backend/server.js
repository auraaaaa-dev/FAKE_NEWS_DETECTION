// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();
const app = express();
app.use(express.json());

// CORS - allow requests from any frontend (or specify Vercel URL)
app.use(cors({ origin: "*" }));

// PORT
const PORT = process.env.PORT || 10000;

// MongoDB connection
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri === "FAKE_MONGO_URI") {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log("Connected to in-memory MongoDB for local dev");
  } else {
    await mongoose.connect(uri);
    console.log("Connected to real MongoDB");
  }
}
connectDB().catch(err => console.error("MongoDB connection error:", err));

// OpenAI setup
const openaiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey: openaiKey });
const openai = new OpenAIApi(configuration);

// Sample route: fake news detection
app.post("/api/detect", async (req, res) => {
  const { text } = req.body;

  // fallback if no API key
  if (!openaiKey || openaiKey === "FAKE_KEY") {
    return res.json({ result: "This is a mock AI response (local dev)" });
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Detect fake news: ${text}` }],
    });

    const result = response.data.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error("OpenAI error:", error.message);
    res.status(500).json({ error: "OpenAI API error" });
  }
});

// Health check
app.get("/", (req, res) => res.send("Backend is running!"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeCache = require("node-cache");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const cache = new NodeCache({ stdTTL: 600 }); // Cache dữ liệu trong 10 phút

app.use(express.json());
app.use(cors());

// API tạo JSON từ prompt
app.post("/generate-json", async (req, res) => {
  const { prompt } = req.body;
  const cacheKey = `json-${prompt}`;
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  const systemPrompt = `
    You are an AI that generates structured JSON for character descriptions.
    Always return JSON in this format:
    {
      "name": "Full Name",
      "gender": "Male/Female/Other",
      "traits": ["list", "of", "personality", "traits"],
      "hobbies": ["list", "of", "hobbies"],
      "appearance": {
        "hair": ["length", "color"],
        "facial": ["beard", "mustache", "clean-shaven"],
        "eyes": ["eye color"],
        "height": ["height in feet/inches"],
        "weight": ["weight in lbs"],
        "skin": ["skin tone"]
      }
    }
    Ensure response is always in valid JSON format.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\nDescribe: ${prompt}` }] }],
    });

    console.log("Raw Response:", JSON.stringify(response, null, 2));

    if (!response?.response?.candidates?.length) {
      throw new Error("Invalid API response from Gemini");
    }

    let jsonOutput = response.response.candidates[0]?.content?.parts?.[0]?.text;

    if (!jsonOutput) {
      throw new Error("Response content is empty or invalid.");
    }

    jsonOutput = jsonOutput.replace(/^```json\n/, "").replace(/\n```$/, "").trim();

    const parsedJson = JSON.parse(jsonOutput);
    cache.set(cacheKey, parsedJson);
    res.json(parsedJson);
  } catch (error) {
    console.error("Error generating JSON:", error);
    res.status(500).json({ error: error.message });
  }
});

// API tạo ảnh từ JSON
app.post("/generate-image", async (req, res) => {
  const { json } = req.body;
  const cacheKey = `image-${JSON.stringify(json)}`;
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    return res.json({ imageUrl: cachedResponse });
  }

  if (
    !json?.appearance?.hair?.length ||
    !json?.appearance?.skin?.length ||
    !json?.appearance?.eyes?.length ||
    !json?.appearance?.height?.length ||
    !json?.appearance?.weight?.length ||
    !json?.appearance?.facial?.length
  ) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }

  const { hair, skin, eyes, height, weight, facial } = json.appearance;

  const prompt = `A character with ${hair[0]} ${hair[1]} hair, ${skin[0]} skin, ${eyes[0]} eyes, ${height[0]} tall, weighing ${weight[0]}, and ${facial[0]} facial features.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      n: 1,
      size: "512x512",
    });

    const imageUrl = response.data[0].url;
    cache.set(cacheKey, imageUrl);
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});


app.listen(port, () => console.log(`✅ Server running on port ${port}`));

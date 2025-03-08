const express = require("express");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


app.use(express.json());
app.use(cors());

// API tạo JSON từ prompt
app.post("/generate-json", async (req, res) => {
  const { prompt } = req.body;

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
          contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\nDescribe: ${prompt}` }] }
          ]
      });

      console.log("Raw Response:", JSON.stringify(response, null, 2)); // Debug log

      if (!response || !response.response || !response.response.candidates || response.response.candidates.length === 0) {
          throw new Error("Invalid API response from Gemini");
      }

      let jsonOutput = response.response.candidates[0]?.content?.parts?.[0]?.text;

      if (!jsonOutput) {
          throw new Error("Response content is empty or invalid.");
      }

      // 🔥 Loại bỏ code block nếu có
      jsonOutput = jsonOutput.replace(/^```json\n/, "").replace(/\n```$/, "").trim();

      try {
          const parsedJson = JSON.parse(jsonOutput);
          res.json(parsedJson);
      } catch (jsonError) {
          res.status(500).json({ error: "Invalid JSON format", rawResponse: jsonOutput });
      }
  } catch (error) {
      console.error("Error generating JSON:", error);
      res.status(500).json({ error: error.message });
  }
});



// API tạo ảnh từ JSON
app.post("/generate-image", async (req, res) => {
    const { json } = req.body;
  
    if (!json || !json.appearance || !json.appearance.hair || !json.appearance.skin) {
      return res.status(400).json({ error: "Invalid JSON format" });
    }
  
    // Tạo prompt mô tả nhân vật dựa trên JSON
    const prompt = `A person with ${json.appearance.hair[0]} hair, ${json.appearance.skin[0]} skin, wearing adventure gear.`;
  
    try {
      const response = await openai.images.generate({
        model: "dall-e-2", // Sử dụng DALL·E 2 để giảm chi phí
        prompt,
        n: 1,
        size: "512x512", // Kích thước nhỏ nhất để tiết kiệm chi phí
      });
  
      const imageUrl = response.data[0].url;
      res.json({ imageUrl }); // Trả về URL ảnh để frontend hiển thị
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
  

app.listen(port, () => console.log(`✅ Server running on port ${port}`));







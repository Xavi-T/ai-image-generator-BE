# AI Image Generator - Backend

## 📝 Overview
This is the backend service for AI Image Generator, built with Node.js 18. It provides API endpoints to generate images from text prompts using AI models.

## 🚀 Features
- Accepts text prompts to generate images
- Returns JSON metadata with image URLs
- Supports image downloading
- Secure and scalable architecture

## 📦 Requirements
- **Node.js 18+**
- **npm** (or **yarn**)
- **Environment Variables** configured in `.env`

## 🛠 Installation
```sh
# Clone the repository
git clone https://github.com/your-username/ai-image-generator-BE.git

# Navigate into the project directory
cd ai-image-generator-BE

# Install dependencies
npm install
```

## 🔧 Configuration
Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
BACKEND_API_URL=https://your-api-url.com
OPENAI_API_KEY=your_openai_api_key
```

## ▶️ Running the Server
```sh
# Start the server in development mode
npm run dev

# Start the server in production mode
npm start
```

## 📡 API Endpoints
### 1️⃣ Generate Image
**POST** `/api/generate`
#### Request Body:
```json
{
  "prompt": "A futuristic city at sunset",
  "model": "text2pix"
}
```
#### Response:
```json
{
  "imageUrl": "https://your-storage.com/generated-image.jpg",
  "metadata": {
    "prompt": "A futuristic city at sunset",
    "model": "text2pix",
    "timestamp": "2025-03-06T12:00:00Z"
  }
}
```

### 2️⃣ Health Check
**GET** `/api/health`
#### Response:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## 🧪 Testing
```sh
# Run tests
npm test
```

## 📜 License
This project is licensed under the MIT License.


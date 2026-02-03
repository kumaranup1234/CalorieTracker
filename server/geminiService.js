import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

export async function analyzeFoodImage(filePath, mimeType) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze this food image. Identify the meal and estimate the nutritional content.
    Return ONLY a valid JSON object with the following structure:
    {
      "meal_name": "Name of the food",
      "calories": number (integer estimate),
      "protein": number (grams, estimate),
      "carbs": number (grams, estimate),
      "fat": number (grams, estimate),
      "reasoning": "Short explanation of how you arrived at these numbers"
    }
    Do not add any markdown formatting like \`\`\`json. Just the raw JSON string.
  `;

    const imagePart = fileToGenerativePart(filePath, mimeType);

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up generic markdown code blocks if the model includes them despite instructions
        const cleanJob = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanJob);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error; // Changed from `throw new Error("Failed to analyze image with Gemini");`
    }
}

export const estimateBurn = async (activityDescription) => {
    try {
        // 'gemini-pro' is the stable v1.0 text-only model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Estimate the calories burned and duration for the following activity: "${activityDescription}".
        Assume an average adult male (75kg).
        Return purely a JSON object with no markdown formatting.
        Format:
        {
            "name": "Short standardized name of activity (e.g. Running, HIIT)",
            "calories": number (estimated total calories burned),
            "duration": number (estimated duration in minutes, if not specified assume 30),
            "confidence": "high" or "low"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Burn Estimate Error:", error);
        // Fallback for simple errors
        return { name: "Activity", calories: 0, duration: 0, confidence: "low" };
    }
};

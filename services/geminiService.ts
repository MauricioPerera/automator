
import { GoogleGenAI } from "@google/genai";

export async function runGeminiTask(prompt: string, modelName: string = 'gemini-3-flash-preview') {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

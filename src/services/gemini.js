import { GoogleGenerativeAI } from "@google/generative-ai";

export const COURSE_ARCHITECT_PROMPT = `
You are an expert curriculum designer. Your task is to create a progressive, day-by-day learning syllabus based on a given topic and duration.

The output MUST be a single, valid JSON object. Do NOT include any other text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON object.

The JSON object MUST strictly adhere to the following format:
{
  "title": "Course Title",
  "dailyModules": [
    { "day": 1, "title": "Module Title", "material": "Full learning text for Day 1, covering the module's topic in detail." },
    { "day": 2, "title": "Another Module Title", "material": "Full learning text for Day 2, covering the module's topic in detail." }
  ]
}

Based on the user's provided topic and desired duration, generate a comprehensive course syllabus in the specified JSON format. Ensure the material for each day is detailed and provides a complete learning text.
`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateCourse(topic, duration) {
  // 1. Get the generative model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // 2. Create the full user prompt
  const userPrompt = `Topic: ${topic} Duration: ${duration}`;

  // 3. Send the request
  try {
    const result = await model.generateContent([
      COURSE_ARCHITECT_PROMPT, // Our system prompt
      userPrompt // The user's request
    ]);

    const response = result.response;
    const text = response.text();

    // 4. Clean and parse the JSON
    // The API sometimes adds ```json ... ``` tags. Let's remove them.
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 5. Return the parsed JSON object
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Error generating course:", error);
    // Return null or throw an error so the UI can react
    return null;
  }
}
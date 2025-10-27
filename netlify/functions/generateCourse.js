// Use modern ES Module 'import'
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get the API key safely from server environment variables
const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the prompt directly inside the function
const COURSE_ARCHITECT_PROMPT = `You are an expert curriculum designer. A user will provide a topic and a duration. You must generate a progressive, day-by-day syllabus for that course. The output *must* be a single, valid JSON object, with no other text or markdown tags before or after it.

The JSON format must be strictly this:
{
  "title": "Course Title",
  "dailyModules": [
    { "day": 1, "title": "Module Title", "description": "A 1-2 sentence description of this module's content." },
    { "day": 2, "title": "Another Module", "description": "A 1-2 sentence description of this module's content." }
  ]
}`;

// Use modern ES Module 'export'
export const handler = async (event) => {
  // Don't run unless it's a POST request
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the 'topic' and 'duration' from the React app
    const { topic, duration } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const userPrompt = `
      Topic: ${topic}
      Duration: ${duration}
    `;

    const result = await model.generateContent([
      COURSE_ARCHITECT_PROMPT,
      userPrompt
    ]);

    const response = result.response;
    const text = response.text();

    // Clean the JSON string
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Send the JSON string *back* to the React app
    return {
      statusCode: 200,
      body: cleanedText,
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate course" }),
    };
  }
};
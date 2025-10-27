// We can't use 'import' here, so we use 'require' (CommonJS syntax)
const { GoogleGenerativeAI } = require("@google/generative-ai");

// We import our prompt from the src folder
const { COURSE_ARCHITECT_PROMPT } = require("../../src/services/gemini.js");

// Get the API key safely from environment variables (Netlify sets this)
const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

exports.handler = async (event) => {
  // Don't run unless it's a POST request
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the 'topic' and 'duration' from the React app
    const { topic, duration } = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Send the JSON *back* to the React app
    return {
      statusCode: 200,
      body: cleanedText, // Send the cleaned JSON string
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate course" }),
    };
  }
};
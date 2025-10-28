import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
// We'll use the fast 'flash' model for this
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const FLASHCARD_GENERATOR_PROMPT = `You are a helpful study assistant. A user will provide you with a block of learning material. Your task is to generate 5-10 question-and-answer flashcards based *only* on the provided text.

The output *must* be a single, valid JSON object, with no other text or markdown tags before or after it.

The JSON format must be strictly this:
{
  "cards": [
    { "q": "Question...", "a": "Answer..." },
    { "q": "Another question...", "a": "Another answer..." }
  ]
}
`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the full lesson material from the frontend
    const { lessonMaterial } = JSON.parse(event.body);

    const result = await model.generateContent([
      FLASHCARD_GENERATOR_PROMPT,
      lessonMaterial // Send the full text as the prompt
    ]);

    const response = result.response;
    const jsonText = response.text();

    // Clean the JSON string (in case the AI adds markdown)
    const cleanedText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Send the JSON string *back* to the React app
    return {
      statusCode: 200,
      body: cleanedText, // Send the cleaned JSON string
    };

  } catch (error) {
    console.error("Error in generateFlashcards function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate flashcards" }),
    };
  }
};
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const LESSON_GENERATOR_PROMPT = `You are an expert educator and curriculum writer. A user will provide a course title and a specific module's title and description. Your task is to generate the complete, comprehensive learning material for *only that single module*.

The material should be formatted in clean markdown. It should be thorough, well-structured, and easy to understand. Include headings, lists, and code blocks where appropriate.

Do NOT output JSON. Output *only* the raw markdown for the lesson.
`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { courseTitle, moduleTitle, moduleDescription } = JSON.parse(event.body);

    const userPrompt = `
      Course Title: ${courseTitle}
      Module Title: ${moduleTitle}
      Module Description: ${moduleDescription}
    `;

    const result = await model.generateContent([
      LESSON_GENERATOR_PROMPT,
      userPrompt
    ]);

    const response = result.response;
    const lessonText = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ lessonMaterial: lessonText }),
    };

  } catch (error) {
    console.error("Error in generateLesson function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate lesson material" }),
    };
  }
};
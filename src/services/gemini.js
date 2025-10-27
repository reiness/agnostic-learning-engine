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

export async function generateCourse(topic, duration) {
  try {
    // This is the special path to our new Netlify Function
    const response = await fetch("/.netlify/functions/generateCourse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, duration }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from function");
    }

    // The function's body is the JSON string, so we parse it
    const data = await response.json(); 
    return data;

  } catch (error) {
    console.error("Error calling Netlify function:", error);
    return null;
  }
}
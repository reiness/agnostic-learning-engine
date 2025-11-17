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

/**
 * Calls the background function to generate a course.
 * @param {string} topic - The topic of the course.
 * @param {'7_days' | '14_days' | '30_days'} duration - The duration of the course.
 * @returns {Promise<any>} The response from the background function.
 */
export async function generateCourse(topic, duration) {
  if (typeof topic !== 'string' || topic.trim() === '') {
    throw new TypeError('Topic must be a non-empty string.');
  }

  const validDurations = ['7_days', '14_days', '30_days'];
  if (!validDurations.includes(duration)) {
    throw new TypeError('Duration must be one of "7_days", "14_days", or "30_days".');
  }

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
      throw new Error(`Failed to fetch from function. Status: ${response.status}`);
    }

    // The function's body is the JSON string, so we parse it
    const data = await response.json(); 
    return data;

  } catch (error) {
    console.error("Error calling Netlify function:", error);
    throw error;
  }
}
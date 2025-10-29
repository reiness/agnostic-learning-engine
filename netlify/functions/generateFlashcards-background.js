import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../service-account.json";

// --- Initialize Firebase Admin ---
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

// --- Initialize Gemini API ---
const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
// Use the fast 'flash' model for flashcards
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Flashcard Prompt ---
const FLASHCARD_GENERATOR_PROMPT = `You are a helpful study assistant. A user will provide you with a block of learning material. Your task is to generate 5-10 question-and-answer flashcards based *only* on the provided text. Each question and answer should be concise, ideally under 100 characters.
The output *must* be a single, valid JSON object, with no other text or markdown tags before or after it.
The JSON format must be strictly this:
{
  "cards": [
    { "q": "Question...", "a": "Answer..." },
    { "q": "Another question...", "a": "Another answer..." }
  ]
}`;

// --- The Main Function Handler ---
export const handler = async (event, context) => {
  const { lessonMaterial, courseId, moduleId, userId, moduleTitle } = JSON.parse(event.body);

  // 1. Define notification reference
  const notifRef = db.collection(`users/${userId}/notifications`).doc();
  // 2. Define flashcard document reference
  const flashcardRef = db.doc(`courses/${courseId}/flashcards/${moduleId}`);

  try {
    // 3. Create 'Generating' notification
    await notifRef.set({
      message: `Generating flashcards for ${moduleTitle}...`,
      status: "generating",
      createdAt: new Date(),
      type: "flashcard_generation",
      relatedDocId: moduleId, // Link to the module
      isRead: false
    });

    // 4. Call Gemini API
    const result = await model.generateContent([FLASHCARD_GENERATOR_PROMPT, lessonMaterial]);
    const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const flashcardData = JSON.parse(responseText); // Should be { cards: [...] }

    // 5. Save flashcards to Firestore
    // Use 'set' here because this might be the first time flashcards are created for this module
    await flashcardRef.set({ cards: flashcardData.cards });

    // 6. Update notification to 'Complete'
    await notifRef.set({ // Use 'set' with merge for safety
      message: `Flashcards for ${moduleTitle} are ready!`,
      status: "complete",
      createdAt: new Date(), // Update timestamp
      type: "flashcard_generation",
      relatedDocId: moduleId,
      isRead: false,
      link: `/course/${courseId}` // Link back to the course page
    }, { merge: true });

  } catch (error) {
    console.error("Error generating flashcards:", error);
    // Use 'set' to create a 'failed' notification
    await notifRef.set({
      message: `Failed to generate flashcards for ${moduleTitle}. Please try again.`,
      status: "failed",
      createdAt: new Date(),
      type: "flashcard_generation",
      relatedDocId: moduleId,
      isRead: false
    });
  }
};
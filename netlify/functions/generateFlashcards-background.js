import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import logger from './utils/logger.js';


// --- Initialize Firebase Admin (for backend) ---
let serviceAccountJson;
try {
  // Decode the Base64 string from the environment variable
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 env var not set.');
  }
  const decodedString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
  serviceAccountJson = JSON.parse(decodedString);
} catch (e) {
  logger.error("Error parsing Firebase service account key:", e);
  // Handle the error appropriately, maybe return a 500 status
}

// Initialize only if the key was parsed and no app exists
if (serviceAccountJson && getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccountJson) // <-- USE THE DECODED JSON
  });
}
const db = getFirestore();
// --- END Initialize Firebase Admin ---

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
  logger.info("generateFlashcards-background function started.");

  // --- Security Check: Validate User Identity ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn("Unauthorized access attempt: No Authorization header found.");
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'You must be logged in.' }),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];
  let verifiedUserId;

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    verifiedUserId = decodedToken.uid;
  } catch (error) {
    logger.error("Error verifying auth token:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid authentication token.' }),
    };
  }
  // ----------------------------------------------

  let lessonMaterial, courseId, moduleId, moduleTitle;

  try {
    if (!event.body) {
        throw new Error("Empty request body");
    }
    const body = JSON.parse(event.body);
    lessonMaterial = body.lessonMaterial;
    courseId = body.courseId;
    moduleId = body.moduleId;
    moduleTitle = body.moduleTitle;
  } catch (error) {
    logger.error("Invalid JSON in request body:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON payload: ' + error.message }),
    };
  }
  
  const missingFields = [];
  if (!lessonMaterial || typeof lessonMaterial !== 'string') missingFields.push('lessonMaterial');
  if (!courseId || typeof courseId !== 'string') missingFields.push('courseId');
  if (!moduleId) missingFields.push('moduleId');
  if (!moduleTitle || typeof moduleTitle !== 'string') missingFields.push('moduleTitle');

  if (missingFields.length > 0) {
      logger.error(`Missing or invalid required fields: ${missingFields.join(', ')}`);
      return {
          statusCode: 400,
          body: JSON.stringify({ message: `Missing or invalid required fields: ${missingFields.join(', ')}` })
      };
  }

  // 1. Define notification reference
  // USE VERIFIED USER ID
  const notifRef = db.collection(`users/${verifiedUserId}/notifications`).doc();
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
    logger.info(`Generating flashcards for user ${verifiedUserId}, course ${courseId}, module ${moduleId}: ${moduleTitle}`);

    // 4. Call Gemini API
    const result = await model.generateContent([FLASHCARD_GENERATOR_PROMPT, lessonMaterial]);
    const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const flashcardData = JSON.parse(responseText); // Should be { cards: [...] }
    logger.info(`Gemini API call successful for flashcard generation for module ${moduleId}.`);

    // 5. Save flashcards to Firestore
    // Use 'set' here because this might be the first time flashcards are created for this module
    await flashcardRef.set({ cards: flashcardData.cards });
    logger.info(`Flashcards saved to Firestore for module ID: ${moduleId}`);

    // Increment flashcardCount in the parent module and course documents
    const moduleDocRef = db.collection('courses').doc(courseId).collection('modules').doc(moduleId);
    const courseDocRef = db.collection('courses').doc(courseId);
    const increment = FieldValue.increment(flashcardData.cards.length);

    await Promise.all([
      moduleDocRef.update({ flashcardCount: increment }),
      courseDocRef.update({ flashcardCount: increment })
    ]);
    logger.info(`Flashcard count incremented for module ID: ${moduleId} and course ID: ${courseId}`);

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
    logger.info(`Flashcard generation complete for module ID: ${moduleId}. Notification updated.`);

  } catch (error) {
    logger.error(`Error generating flashcards for user ${verifiedUserId}, course ${courseId}, module ${moduleId}: ${error.message}`, error);
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
  logger.info("generateFlashcards-background function finished.");
};
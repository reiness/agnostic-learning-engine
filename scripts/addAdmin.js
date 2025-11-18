import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = getFirestore();

/**
 * Adds an email to the 'admins' collection in Firestore.
 * @param {string} email The email address to add as an admin.
 */
async function addAdminEmail(email) {
  if (!email) {
    console.error('Error: No email provided. Usage: node scripts/addAdmin.js your_email@example.com');
    process.exit(1);
  }

  try {
    const adminRef = db.collection('admins').doc(email);
    await adminRef.set({
      email: email,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Admin email '${email}' added successfully to Firestore.`);
  } catch (error) {
    console.error(`Error adding admin email '${email}':`, error);
    process.exit(1);
  }
}

// Get email from command line arguments
const emailToAdd = process.argv[2];
addAdminEmail(emailToAdd);
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, deleteDoc, getDocs, collection, writeBatch, serverTimestamp, runTransaction } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const deleteCourse = async (courseId) => {
  try {
    const batch = writeBatch(db);

    const courseRef = doc(db, "courses", courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      throw new Error("Course document does not exist!");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated for course deletion.");
    }

    const deletedCourseRef = doc(db, "deleted_courses", courseId);
    const courseData = courseDoc.data();
    batch.set(deletedCourseRef, {
      ...courseData,
      userId: user.uid,
      deletedAt: serverTimestamp(),
    });

    const modulesRef = collection(db, "courses", courseId, "modules");
    const modulesSnapshot = await getDocs(modulesRef);
    modulesSnapshot.forEach((moduleDoc) => {
      const newModuleRef = doc(db, "deleted_courses", courseId, "modules", moduleDoc.id);
      batch.set(newModuleRef, moduleDoc.data());
      batch.delete(moduleDoc.ref);
    });

    batch.delete(courseRef);

    await batch.commit();
    console.log("Course moved to deleted_courses successfully!");
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

const restoreCourse = async (courseId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const deletedCourseRef = doc(db, "deleted_courses", courseId);
      const deletedCourseDoc = await transaction.get(deletedCourseRef);

      if (!deletedCourseDoc.exists()) {
        throw new Error("Deleted course document does not exist!");
      }

      // 1. Create a new document in the 'courses' collection
      const courseRef = doc(db, "courses", courseId);
      const { deletedAt, userId, ...courseData } = deletedCourseDoc.data(); // Exclude deletedAt and userId
      transaction.set(courseRef, courseData);

      // 2. Move subcollections (e.g., 'modules')
      const modulesRef = collection(db, "deleted_courses", courseId, "modules");
      const modulesSnapshot = await getDocs(modulesRef);
      modulesSnapshot.forEach((moduleDoc) => {
        const newModuleRef = doc(db, "courses", courseId, "modules", moduleDoc.id);
        transaction.set(newModuleRef, moduleDoc.data());
        transaction.delete(moduleDoc.ref); // Delete the original module
      });

      // 3. Delete the document from the 'deleted_courses' collection
      transaction.delete(deletedCourseRef);
    });
    console.log("Course restored successfully!");
  } catch (error) {
    console.error("Error restoring course:", error);
    throw error;
  }
};

export { auth, db, deleteCourse, restoreCourse };
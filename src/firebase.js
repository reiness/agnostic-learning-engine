// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwsq_XKQ1HZgzilemO2ZzUjP4_gKvTgbI",
  authDomain: "agnostic-learning-engine.firebaseapp.com",
  projectId: "agnostic-learning-engine",
  storageBucket: "agnostic-learning-engine.firebasestorage.app",
  messagingSenderId: "351489213569",
  appId: "1:351489213569:web:6cb6c333c54a6d04b53980",
  measurementId: "G-QSYXDB2CNB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
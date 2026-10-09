import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Safely extract environment variables across Vite browser environment and Node CLI runners
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : (typeof process !== "undefined" ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "zukas-kitchen-spin-win.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "zukas-kitchen-spin-win",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "zukas-kitchen-spin-win.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || ""
};

// Utility boolean check to determine if valid Firebase environment variables are provided
export const isFirebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID
);

let app = null;
let db = null;
let functions = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  functions = getFunctions(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error.message);
}

export { app, db, functions };

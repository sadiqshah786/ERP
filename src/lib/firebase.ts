import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
// Firebase configuration.
// Replace these with your own project's values from
// Firebase Console → Project settings → Your apps → SDK setup.
// They are read from Vite env vars (.env) with sensible fallbacks
// so the app still boots in "demo / offline" mode without a project.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "amal-erp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "amal-erp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "amal-erp.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "0000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:0:web:0",
};

export const FIREBASE_CONFIGURED =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "demo-api-key";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

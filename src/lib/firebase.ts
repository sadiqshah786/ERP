import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
// Firebase configuration — Memon Solutions ERP (project: erp-ms-ab333).
// The web config below is safe to ship in client code (it is not a
// secret; access is controlled by Firebase Auth + Firestore rules).
// Env vars (VITE_FIREBASE_*) override these if set, so you can point
// a different environment at a different project without code changes.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBIMdH2bwp9r9S_KsvHlmZC6I1vJqc60pw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "erp-ms-ab333.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "erp-ms-ab333",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "erp-ms-ab333.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "689353875803",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:689353875803:web:8b3d849fa9f3efd80efa7e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-TYS9XTB85X",
};

// Real project is configured → app uses live Firebase Auth + Firestore
// (not the local-storage demo fallback).
export const FIREBASE_CONFIGURED =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("demo");

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

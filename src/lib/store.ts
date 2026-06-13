import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, onSnapshot, Unsubscribe,
} from "firebase/firestore";
import { db, FIREBASE_CONFIGURED } from "./firebase";

export interface Doc { id: string; [k: string]: any }

// ─────────────────────────────────────────────────────────────
// Data layer. Uses Firestore when configured, otherwise falls back
// to localStorage so the app is fully usable in demo mode.
// Same async API for both paths.
// ─────────────────────────────────────────────────────────────

const LS_PREFIX = "amal_erp::";
const lsKey = (c: string) => LS_PREFIX + c;

function lsRead(c: string): Doc[] {
  try {
    return JSON.parse(localStorage.getItem(lsKey(c)) || "[]");
  } catch {
    return [];
  }
}
function lsWrite(c: string, rows: Doc[]) {
  localStorage.setItem(lsKey(c), JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("amal-store-change", { detail: c }));
}

export async function listDocs(c: string): Promise<Doc[]> {
  if (FIREBASE_CONFIGURED) {
    const q = query(collection(db, c), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsRead(c).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function subscribe(c: string, cb: (rows: Doc[]) => void): Unsubscribe {
  if (FIREBASE_CONFIGURED) {
    const q = query(collection(db, c), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }
  const handler = (e: Event) => {
    if ((e as CustomEvent).detail === c) cb(lsRead(c));
  };
  window.addEventListener("amal-store-change", handler);
  cb(lsRead(c));
  return () => window.removeEventListener("amal-store-change", handler);
}

export async function createDoc(c: string, data: Record<string, any>): Promise<string> {
  if (FIREBASE_CONFIGURED) {
    const ref = await addDoc(collection(db, c), { ...data, createdAt: serverTimestamp() });
    return ref.id;
  }
  const rows = lsRead(c);
  const id = crypto.randomUUID();
  rows.push({ id, ...data, createdAt: Date.now() });
  lsWrite(c, rows);
  return id;
}

export async function updateDocById(c: string, id: string, data: Record<string, any>) {
  if (FIREBASE_CONFIGURED) {
    await updateDoc(doc(db, c, id), data);
    return;
  }
  const rows = lsRead(c).map((r) => (r.id === id ? { ...r, ...data } : r));
  lsWrite(c, rows);
}

export async function deleteDocById(c: string, id: string) {
  if (FIREBASE_CONFIGURED) {
    await deleteDoc(doc(db, c, id));
    return;
  }
  lsWrite(c, lsRead(c).filter((r) => r.id !== id));
}

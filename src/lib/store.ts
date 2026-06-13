import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp, onSnapshot, Unsubscribe,
} from "firebase/firestore";
import { db, FIREBASE_CONFIGURED } from "./firebase";

export interface Doc { id: string; [k: string]: any }

// ─────────────────────────────────────────────────────────────
// Data layer. Uses Firestore when configured, otherwise falls back
// to localStorage so the app is fully usable in demo mode.
// Same async API for both paths.
//
// Ordering note: we sort on a client-set `createdAtMs` (a real number
// written at create time) rather than on Firestore's serverTimestamp.
// A serverTimestamp is null for a moment on a fresh write (pending),
// which would push new rows out of place until a refresh. `createdAtMs`
// is set instantly, so new records show at the top immediately via the
// live onSnapshot listener — no refresh needed.
// ─────────────────────────────────────────────────────────────

const LS_PREFIX = "amal_erp::";
const lsKey = (c: string) => LS_PREFIX + c;

function timeOf(d: Doc): number {
  if (typeof d.createdAtMs === "number") return d.createdAtMs;
  // Firestore Timestamp → millis, else 0
  if (d.createdAt && typeof d.createdAt.toMillis === "function") return d.createdAt.toMillis();
  if (typeof d.createdAt === "number") return d.createdAt;
  return 0;
}

const sortNewestFirst = (rows: Doc[]) => rows.sort((a, b) => timeOf(b) - timeOf(a));

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
    const snap = await getDocs(collection(db, c));
    return sortNewestFirst(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return sortNewestFirst(lsRead(c));
}

export function subscribe(c: string, cb: (rows: Doc[]) => void): Unsubscribe {
  if (FIREBASE_CONFIGURED) {
    // No orderBy → includes pending local writes instantly and avoids
    // excluding docs that miss the sort field. We sort client-side.
    return onSnapshot(
      collection(db, c),
      (snap) => cb(sortNewestFirst(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      (err) => console.error(`[store] subscribe(${c}) failed:`, err.message)
    );
  }
  const handler = (e: Event) => {
    if ((e as CustomEvent).detail === c) cb(sortNewestFirst(lsRead(c)));
  };
  window.addEventListener("amal-store-change", handler);
  cb(sortNewestFirst(lsRead(c)));
  return () => window.removeEventListener("amal-store-change", handler);
}

export async function createDoc(c: string, data: Record<string, any>): Promise<string> {
  const createdAtMs = Date.now();
  if (FIREBASE_CONFIGURED) {
    const ref = await addDoc(collection(db, c), { ...data, createdAtMs, createdAt: serverTimestamp() });
    return ref.id;
  }
  const rows = lsRead(c);
  const id = crypto.randomUUID();
  rows.push({ id, ...data, createdAtMs, createdAt: createdAtMs });
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

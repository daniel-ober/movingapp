// src/services/properties.js
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection ref
const propertiesCol = collection(db, "properties");

/**
 * Subscribe to all properties (live updates).
 * Returns unsubscribe function.
 */
export function subscribeToProperties(onChange) {
  const q = query(propertiesCol, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.error("[subscribeToProperties] Firestore error:", err);
      onChange([]);
    }
  );
}

/**
 * Create a new property.
 */
export async function createProperty(data) {
  const payload = {
    status: data.status || "interested", // interested | not_interested
    visitStatus: data.visitStatus || "not_visited", // not_visited | visited

    address: (data.address || "").trim(),

    rentMonthly: Number(data.rentMonthly) || 0,
    beds: Number(data.beds) || 0,
    baths: Number(data.baths) || 0,
    sqft: Number(data.sqft) || 0,

    // store as YYYY-MM-DD (string) from <input type="date">
    earliestMoveIn: data.earliestMoveIn || "",

    commuteMinutes: Number(data.commuteMinutes) || 0,
    commuteMiles: Number(data.commuteMiles) || 0,

    originalLink: (data.originalLink || "").trim(),

    // Either one of these will be set:
    managementCompanyId: (data.managementCompanyId || "").trim(),
    managementCompanyName: (data.managementCompanyName || "").trim(),

    notes: (data.notes || "").trim(),

    // scoring placeholders (computed later)
    score: Number(data.score) || 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!payload.address || payload.address.length < 6) {
    throw new Error("Address is required (min 6 chars).");
  }

  return addDoc(propertiesCol, payload);
}

export async function updateProperty(id, patch) {
  const ref = doc(db, "properties", id);
  const safePatch = {
    ...patch,
    updatedAt: serverTimestamp(),
  };
  return updateDoc(ref, safePatch);
}
// src/services/companies.js
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const companiesCol = collection(db, "management_companies");

export function subscribeToCompanies(onChange) {
  const q = query(companiesCol, orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // normalize shape to {id,name}
      onChange(
        items
          .map((c) => ({ id: c.id, name: String(c.name || "").trim() }))
          .filter((c) => c.name)
      );
    },
    (err) => {
      console.error("[subscribeToCompanies] Firestore error:", err);
      onChange([]);
    }
  );
}

export async function createCompany(name) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("Company name required.");

  const payload = {
    name: clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(companiesCol, payload);
  return { id: ref.id, name: clean };
}
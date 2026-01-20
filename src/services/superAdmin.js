// src/services/superAdmin.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { pruneUndefined } from "../utils/pruneUndefined";

/**
 * NOTE:
 * This service assumes Firestore rules will allow super-admins to read all workspaces.
 * Step 2 = we implement those rules properly.
 */

export async function listAllWorkspaces({ pageSize = 50 } = {}) {
  const q = query(
    collection(db, "workspaces"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getWorkspace(workspaceId) {
  const ref = doc(db, "workspaces", String(workspaceId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listWorkspaceMembers(workspaceId) {
  const wsId = String(workspaceId || "");
  if (!wsId) return [];

  const membersRef = collection(db, "workspaces", wsId, "members");
  const snap = await getDocs(membersRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateWorkspaceAdminFields(workspaceId, patch) {
  const wsId = String(workspaceId || "");
  if (!wsId) throw new Error("updateWorkspaceAdminFields requires workspaceId.");

  const ref = doc(db, "workspaces", wsId);
  const payload = pruneUndefined({ ...(patch || {}) });
  await updateDoc(ref, payload);
}
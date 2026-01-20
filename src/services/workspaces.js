// src/services/workspaces.js
import { db } from "./firebase";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

/**
 * Create a workspace and add creator as OWNER.
 */
export async function createWorkspace({ name, ownerUid, ownerEmail }) {
  const workspaceRef = doc(collection(db, "workspaces"));

  await setDoc(workspaceRef, {
    name: String(name || "").trim() || "My Workspace",
    ownerUid,
    ownerEmail: ownerEmail || "",
    plan: "free",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // IMPORTANT: include uid field so we can query memberships via collectionGroup
  await setDoc(doc(db, "workspaces", workspaceRef.id, "members", ownerUid), {
    uid: ownerUid,
    role: "owner", // owner | admin | member
    email: ownerEmail || "",
    status: "active",
    createdAt: serverTimestamp(),
    joinedAt: serverTimestamp(),
  });

  return workspaceRef.id;
}

/**
 * Return all workspaces the user belongs to.
 * Uses collectionGroup(members) where uid == current uid.
 */
export async function getMyWorkspaces(uid) {
  if (!uid) return [];

  const q = query(collectionGroup(db, "members"), where("uid", "==", uid));
  const snap = await getDocs(q);

  // members docs live at: workspaces/{workspaceId}/members/{uid}
  const workspaceIds = [];
  snap.forEach((d) => {
    const parts = d.ref.path.split("/");
    const wsIndex = parts.indexOf("workspaces");
    const workspaceId = wsIndex >= 0 ? parts[wsIndex + 1] : null;
    if (workspaceId) workspaceIds.push(workspaceId);
  });

  const uniqueIds = Array.from(new Set(workspaceIds));
  if (uniqueIds.length === 0) return [];

  const out = [];
  for (const workspaceId of uniqueIds) {
    const wsSnap = await getDoc(doc(db, "workspaces", workspaceId));
    if (wsSnap.exists()) out.push({ id: wsSnap.id, ...wsSnap.data() });
  }

  // newest first if timestamps exist (optional)
  out.sort((a, b) => {
    const ta = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
    const tb = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
    return tb - ta;
  });

  return out;
}

/**
 * Read membership doc for a user in a workspace.
 */
export async function getMyMembership(workspaceId, uid) {
  if (!workspaceId || !uid) return null;

  const ref = doc(db, "workspaces", workspaceId, "members", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Read workspace doc by id.
 */
export async function getWorkspace(workspaceId) {
  if (!workspaceId) return null;
  const ref = doc(db, "workspaces", workspaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
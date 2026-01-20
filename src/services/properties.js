// src/services/properties.js
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import { pruneUndefined } from "../utils/pruneUndefined";

/**
 * Workspace-scoped collection path:
 * workspaces/{workspaceId}/properties/{propertyId}
 */

function requireWorkspaceId(workspaceId, fnName) {
  if (!workspaceId) {
    throw new Error(`${fnName} requires a workspaceId.`);
  }
}

function propertiesCol(workspaceId) {
  requireWorkspaceId(workspaceId, "propertiesCol");
  return collection(db, "workspaces", String(workspaceId), "properties");
}

function propertyDoc(workspaceId, propertyId) {
  requireWorkspaceId(workspaceId, "propertyDoc");
  if (!propertyId) throw new Error("propertyDoc requires a propertyId.");
  return doc(
    db,
    "workspaces",
    String(workspaceId),
    "properties",
    String(propertyId)
  );
}

function normalizeListingType(v) {
  const s = String(v || "rent").toLowerCase().trim();
  if (s === "buy" || s === "sale" || s === "for_sale") return "buy";
  return "rent";
}

/**
 * Subscribe to properties for the active workspace (live updates)
 * Returns unsubscribe function.
 */
export function subscribeToProperties(workspaceId, onChange) {
  if (!workspaceId) {
    onChange?.([]);
    return () => {};
  }

  const q = query(propertiesCol(workspaceId), orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange?.(items);
    },
    (err) => {
      console.error("[subscribeToProperties] Firestore error:", err);
      onChange?.([]);
    }
  );
}

/**
 * Create a new property (workspace-scoped).
 */
export async function createProperty(workspaceId, data, userId = "") {
  const wsId = String(workspaceId || "");
  if (!wsId) throw new Error("No active workspace selected.");

  const listingType = normalizeListingType(data?.listingType);

  const payload = pruneUndefined({
    // ✅ workspace scoping
    workspaceId: wsId,

    // ✅ listing type
    listingType, // "rent" | "buy"

    // auditing
    createdBy: userId ? String(userId) : "",
    updatedBy: userId ? String(userId) : "",

    status: data?.status || "interested", // interested | not_interested
    visitStatus: data?.visitStatus || "not_visited", // not_visited | visited

    address: (data?.address || "").trim(),

    // ✅ rent fields
    rentMonthly: listingType === "rent" ? Number(data?.rentMonthly) || 0 : 0,

    // ✅ buy fields
    purchasePrice: listingType === "buy" ? Number(data?.purchasePrice) || 0 : 0,

    // ✅ shared fields
    hoaMonthly: Number(data?.hoaMonthly) || 0,

    beds: String(data?.beds || "3"),
    baths: String(data?.baths || "2"),
    sqft: Number(data?.sqft) || 0,

    // store as YYYY-MM-DD (string) from <input type="date">
    earliestMoveIn: data?.earliestMoveIn || "",

    commuteMinutes: Number(data?.commuteMinutes) || 0,
    commuteMiles: Number(data?.commuteMiles) || 0,

    originalLink: (data?.originalLink || "").trim(),

    managementCompanyId: (data?.managementCompanyId || "").trim(),
    managementCompanyName: (data?.managementCompanyName || "").trim(),

    notes: (data?.notes || "").trim(),

    // scoring fields (optional; UI can compute later)
    scoreInputs: data?.scoreInputs || undefined,
    score: Number(data?.score) || 0,
    scoreBreakdown: data?.scoreBreakdown || undefined,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (!payload.address || payload.address.length < 6) {
    throw new Error("Address is required (min 6 chars).");
  }

  const ref = await addDoc(propertiesCol(wsId), payload);
  return ref.id;
}

/**
 * Update a property (workspace-scoped).
 * IMPORTANT: workspaceId is REQUIRED because docs are nested.
 *
 * NOTE:
 * - We do NOT re-score here (your modal already sends score + breakdown).
 * - We normalize listingType.
 * - We keep rentMonthly/purchasePrice consistent with listingType when listingType is present.
 */
export async function updateProperty(propertyId, patch, workspaceId, userId = "") {
  const wsId = String(workspaceId || "");
  if (!wsId) throw new Error("updateProperty requires a workspaceId.");
  if (!propertyId) throw new Error("updateProperty requires a propertyId.");

  const next = { ...(patch || {}) };

  // ✅ normalize listing type if provided
  if (next.listingType != null) {
    next.listingType = normalizeListingType(next.listingType);
  }

  // ✅ enforce rent vs buy money fields only when listingType is being set/changed
  const lt = next.listingType;
  if (lt === "rent") {
    // if switching to rent, clear purchase price
    if (next.purchasePrice != null) next.purchasePrice = Number(next.purchasePrice) || 0;
  }
  if (lt === "buy") {
    // if switching to buy, clear rent monthly
    if (next.rentMonthly != null) next.rentMonthly = Number(next.rentMonthly) || 0;
  }

  const safePatch = pruneUndefined({
    ...next,
    workspaceId: wsId, // keep consistent
    updatedAt: serverTimestamp(),
    ...(userId ? { updatedBy: String(userId) } : {}),
  });

  return updateDoc(propertyDoc(wsId, propertyId), safePatch);
}
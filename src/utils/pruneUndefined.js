// src/utils/pruneUndefined.js
export function pruneUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(pruneUndefined)
      .filter((v) => v !== undefined);
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, pruneUndefined(v)])
        .filter(([, v]) => v !== undefined)
    );
  }

  return obj === undefined ? undefined : obj;
}
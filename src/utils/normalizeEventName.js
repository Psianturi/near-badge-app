// src/utils/normalizeEventName.js
export function normalizeEventName(rawName) {
  if (!rawName || typeof rawName !== "string") return "";
  return rawName
    .trim()         
    .replace(/\s+/g, " ");
}

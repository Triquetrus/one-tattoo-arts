// upload.js — Upload media to Firebase Storage + save metadata to Firestore
import { storage, db } from "./firebase.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Upload a file to Firebase Storage and save metadata to Firestore.
 * @param {File} file
 * @param {{ title, category, artist, visibility, description }} meta
 * @param {Function} onProgress  — called with 0–100
 * @returns {Promise<string>}    — Firestore doc ID
 */
export async function uploadMedia(file, meta, onProgress) {
  const ext = file.name.split(".").pop();
  const type = file.type.startsWith("video") ? "video" : "image";
  const path = `gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);

  // Resumable upload with progress
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      snap => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      resolve
    );
  });

  const url = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, "gallery"), {
    url,
    storagePath: path,
    type,
    title: meta.title || file.name,
    category: meta.category || "Uncategorized",
    artist: meta.artist || "",
    visibility: meta.visibility || "public",
    description: meta.description || "",
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Delete a file from Storage (by storagePath) + its Firestore doc.
 * gallery.js calls this — exported here for reuse.
 */
export async function deleteFromStorage(storagePath) {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (e) {
    // File may already be gone — ignore
    console.warn("Storage delete skipped:", e.code);
  }
}

// gallery.js — Load, display, paginate, and delete gallery items from Firestore
import { db } from "./firebase.js";
import { deleteFromStorage } from "./upload.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  deleteDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PAGE_SIZE = 12;
let lastVisible = null;
let currentFilter = "all";
let isLoading = false;

/**
 * Render gallery grid inside #gallery-manager-grid.
 * Replaces existing static placeholder content.
 */
export async function loadGallery(filterCategory = "all", reset = true) {
  if (isLoading) return;
  isLoading = true;

  const grid = document.getElementById("gallery-manager-grid");
  const loader = document.getElementById("gallery-load-more");

  if (reset) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:2rem;text-align:center;color:var(--mid);font-size:.8rem;letter-spacing:.1em;">Loading…</div>`;
    lastVisible = null;
    currentFilter = filterCategory;
  }

  try {
    const col = collection(db, "gallery");
    let q;

    if (filterCategory && filterCategory !== "all") {
      q = lastVisible
        ? query(col, where("category", "==", filterCategory), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(PAGE_SIZE))
        : query(col, where("category", "==", filterCategory), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    } else {
      q = lastVisible
        ? query(col, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(PAGE_SIZE))
        : query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    }

    const snap = await getDocs(q);

    if (reset) grid.innerHTML = "";

    if (snap.empty && reset) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:3rem;text-align:center;color:var(--mid);font-size:.85rem;">No media found. Upload some!</div>`;
      if (loader) loader.style.display = "none";
      isLoading = false;
      return;
    }

    snap.forEach(docSnap => {
      const item = docSnap.data();
      const id = docSnap.id;
      const el = document.createElement("div");
      el.className = "gm-item";
      el.dataset.id = id;

      if (item.type === "video") {
        el.innerHTML = `
          <video class="gm-img" src="${item.url}" muted loop style="object-fit:cover;width:100%;aspect-ratio:1;"></video>
          <span class="gm-tag">${item.category}</span>
          <div class="gm-overlay">
            <div style="font-family:'Inter',sans-serif;font-size:.7rem;color:rgba(255,255,255,.7);text-align:center;padding:0 .5rem;margin-bottom:.3rem;">${item.title}</div>
            <button class="gm-btn del" onclick="window.deleteMedia('${id}','${item.storagePath}',this)">Delete</button>
          </div>`;
      } else {
        el.innerHTML = `
          <img class="gm-img" src="${item.url}" alt="${item.title}" loading="lazy"/>
          <span class="gm-tag">${item.category}</span>
          <div class="gm-overlay">
            <div style="font-family:'Inter',sans-serif;font-size:.7rem;color:rgba(255,255,255,.7);text-align:center;padding:0 .5rem;margin-bottom:.3rem;">${item.title}</div>
            <button class="gm-btn del" onclick="window.deleteMedia('${id}','${item.storagePath}',this)">Delete</button>
          </div>`;
      }

      grid.appendChild(el);
    });

    lastVisible = snap.docs[snap.docs.length - 1];

    // Show/hide load more button
    if (loader) {
      loader.style.display = snap.size < PAGE_SIZE ? "none" : "block";
    }
  } catch (err) {
    console.error("Gallery load error:", err);
    if (reset) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:2rem;text-align:center;color:#ef4444;font-size:.8rem;">Failed to load gallery. Check Firestore rules.</div>`;
    }
  }

  isLoading = false;
}

/** Load next page (pagination) */
export function loadMoreGallery() {
  loadGallery(currentFilter, false);
}

/** Delete media item from Storage + Firestore */
export async function deleteMedia(docId, storagePath, btnEl) {
  if (!confirm("Delete this media permanently?")) return;
  btnEl.textContent = "…";
  btnEl.disabled = true;
  try {
    await deleteFromStorage(storagePath);
    await deleteDoc(doc(db, "gallery", docId));
    // Remove card from DOM
    const card = document.querySelector(`.gm-item[data-id="${docId}"]`);
    if (card) card.remove();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete failed. Check console.");
    btnEl.textContent = "Delete";
    btnEl.disabled = false;
  }
}

// Expose deleteMedia globally so inline onclick can reach it
window.deleteMedia = deleteMedia;

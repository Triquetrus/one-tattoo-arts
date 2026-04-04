// reviews.js — Firestore CRUD for client reviews
import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Load all reviews (optionally filter by status: 'pending' | 'approved').
 * Renders into #reviews-tbody.
 */
export async function loadReviews(filter = "all") {
  const tbody = document.getElementById("reviews-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--mid);padding:2rem;font-size:.8rem;">Loading…</td></tr>`;

  try {
    const col = collection(db, "reviews");
    let q;
    if (filter === "pending") {
      q = query(col, where("status", "==", "pending"), orderBy("createdAt", "desc"));
    } else if (filter === "approved") {
      q = query(col, where("status", "==", "approved"), orderBy("createdAt", "desc"));
    } else {
      q = query(col, orderBy("createdAt", "desc"));
    }

    const snap = await getDocs(q);
    tbody.innerHTML = "";

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--mid);padding:2rem;font-size:.8rem;">No reviews found.</td></tr>`;
      return;
    }

    snap.forEach(docSnap => {
      const r = docSnap.data();
      const id = docSnap.id;
      const stars = "★".repeat(r.stars || 5) + "☆".repeat(5 - (r.stars || 5));
      const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";
      const isApproved = r.status === "approved";

      const tr = document.createElement("tr");
      tr.dataset.id = id;
      tr.innerHTML = `
        <td><b style="color:var(--white)">${escHtml(r.author)}</b></td>
        <td><span class="review-stars-sm">${stars}</span></td>
        <td style="max-width:200px;font-size:.78rem;">"${escHtml(r.text)}"</td>
        <td>${escHtml(r.tattoo || "—")}</td>
        <td>${date}</td>
        <td>${isApproved
          ? '<span class="review-approved">Published</span>'
          : '<span class="review-pending">Pending</span>'}</td>
        <td>
          <div class="tbl-actions">
            ${!isApproved
              ? `<button class="tbl-btn" style="color:var(--success);border-color:rgba(34,197,94,.3)" onclick="window.approveReview('${id}',this)">Approve</button>`
              : `<button class="tbl-btn" onclick="window.unapproveReview('${id}',this)">Unpublish</button>`}
            <button class="tbl-btn del" onclick="window.deleteReview('${id}',this)">Reject</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    updateReviewsBadge(snap);
  } catch (err) {
    console.error("Reviews load error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;font-size:.8rem;">Failed to load. Check Firestore rules.</td></tr>`;
  }
}

function updateReviewsBadge(snap) {
  const pending = snap.docs.filter(d => d.data().status === "pending").length;
  const badge = document.querySelector('.nav-item[data-panel="reviews"] .nav-badge');
  if (badge) badge.textContent = pending || "";
}

export async function approveReview(id, btn) {
  btn.disabled = true; btn.textContent = "…";
  await updateDoc(doc(db, "reviews", id), { status: "approved" });
  loadReviews();
}

export async function unapproveReview(id, btn) {
  btn.disabled = true; btn.textContent = "…";
  await updateDoc(doc(db, "reviews", id), { status: "pending" });
  loadReviews();
}

export async function deleteReview(id, btn) {
  if (!confirm("Delete this review permanently?")) return;
  btn.disabled = true; btn.textContent = "…";
  await deleteDoc(doc(db, "reviews", id));
  document.querySelector(`tr[data-id="${id}"]`)?.remove();
}

// Expose globally for inline onclick
window.approveReview = approveReview;
window.unapproveReview = unapproveReview;
window.deleteReview = deleteReview;

function escHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

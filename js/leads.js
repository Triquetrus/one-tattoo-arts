// leads.js — Save appointment form leads to Firestore + display in admin
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Called from appointment.html when user submits the booking form.
 * Returns true on success.
 */
export async function saveLead(data) {
  await addDoc(collection(db, "leads"), {
    name: data.name || "",
    phone: data.phone || "",
    email: data.email || "",
    artist: data.artist || "",
    style: data.style || "",
    placement: data.placement || "",
    size: data.size || "",
    date: data.date || "",
    idea: data.idea || "",
    reference: data.reference || "",
    createdAt: serverTimestamp()
  });
}

/**
 * Load leads from Firestore and render into #leads-tbody in admin dashboard.
 */
export async function loadLeads() {
  const tbody = document.getElementById("leads-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--mid);padding:2rem;font-size:.8rem;">Loading…</td></tr>`;

  try {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    tbody.innerHTML = "";

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--mid);padding:2rem;font-size:.8rem;">No leads yet. They'll appear here when clients submit the booking form.</td></tr>`;
      return;
    }

    // Update bookings badge with lead count
    const badge = document.querySelector('.nav-item[data-panel="bookings"] .nav-badge');
    if (badge) badge.textContent = snap.size;

    snap.forEach(docSnap => {
      const l = docSnap.data();
      const id = docSnap.id;
      const date = l.createdAt?.toDate
        ? l.createdAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

      const initials = (l.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

      const tr = document.createElement("tr");
      tr.dataset.id = id;
      tr.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:.8rem;">
            <div class="booking-avatar">${initials}</div>
            <div>
              <div class="booking-name">${escHtml(l.name)}</div>
              <div class="booking-meta">${escHtml(l.email)}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--light);font-size:.82rem;">${escHtml(l.phone)}</td>
        <td style="font-size:.8rem;">${escHtml(l.style || "—")}<br><span style="color:var(--mid);font-size:.72rem;">${escHtml(l.placement || "")}</span></td>
        <td style="font-size:.8rem;">${escHtml(l.artist || "No preference")}</td>
        <td style="font-size:.75rem;max-width:160px;color:var(--light);">${escHtml((l.idea || "—").slice(0, 80))}${l.idea?.length > 80 ? "…" : ""}</td>
        <td style="color:var(--mid);font-size:.75rem;white-space:nowrap;">${date}</td>
        <td>
          <div class="tbl-actions">
            <span class="booking-status pending">New Lead</span>
            <button class="tbl-btn del" onclick="window.deleteLead('${id}',this)" style="margin-left:.4rem;">✕</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Leads load error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;font-size:.8rem;">Failed to load. Check Firestore rules.</td></tr>`;
  }
}

export async function deleteLead(id, btn) {
  if (!confirm("Remove this lead?")) return;
  btn.disabled = true;
  await deleteDoc(doc(db, "leads", id));
  document.querySelector(`tr[data-id="${id}"]`)?.remove();
}

window.deleteLead = deleteLead;

function escHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

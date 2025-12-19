// js/admin-booking-firebase.js
// Simple admin realtime listener for Firestore 'reservations' collection.
// Expects an HTML table with tbody id="bookingsBody" like your admin page.
// This file is a module: include with <script type="module" src="js/admin-booking-firebase.js"></script>

import { db } from './firebase-config.js';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const STORAGE_KEY = 'goat_bookings_v1'; // (unused here but kept for compatibility note)
const ADMIN_PASSWORD = 'admin123'; // your client-side admin password (still only client-side)

const btnLogin = document.getElementById('btnLogin');
const adminPass = document.getElementById('adminPass');
const adminControls = document.getElementById('adminControls');
const loginArea = document.getElementById('loginArea');
const bookingsBody = document.getElementById('bookingsBody');
const adminMsg = document.getElementById('adminMsg');
const btnClear = document.getElementById('btnClear');
const btnExport = document.getElementById('btnExport');
const searchInput = document.getElementById('search');
const clearSearchBtn = document.getElementById('clear');

let unsubscribeRealtime = null;

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function renderListFromDocs(docs) {
  bookingsBody.innerHTML = '';
  if (!docs.length) {
    bookingsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;padding:18px;">لا توجد حجوزات حتى الآن.</td></tr>';
    return;
  }
  docs.forEach((docSnap, idx) => {
    const data = docSnap.data();
    const tr = document.createElement('tr');
    const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString() : (data.createdAt || '');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="service">${escapeHtml(data.service || '')}</td>
      <td class="name">${escapeHtml(data.name || '')}</td>
      <td class="phone">${escapeHtml(data.phone || '')}</td>
      <td class="time">${escapeHtml(data.time || '')}</td>
      <td class="created">${escapeHtml(created)}</td>
    `;
    bookingsBody.appendChild(tr);
  });
}

// start listening in realtime (ordered by createdAt desc)
function startRealtimeListener() {
  const col = collection(db, 'reservations');
  const q = query(col, orderBy('createdAt', 'desc'));
  unsubscribeRealtime = onSnapshot(q, (snapshot) => {
    // snapshot.docs is the list; render
    renderListFromDocs(snapshot.docs);
    adminMsg.textContent = `تم تحميل ${snapshot.size} حجز (آنيًا).`;
    setTimeout(() => { adminMsg.textContent = ''; }, 1800);
  }, (err) => {
    console.error('Realtime listener error', err);
    adminMsg.textContent = 'فشل في الاتصال بالحجوزات.';
    setTimeout(() => { adminMsg.textContent = ''; }, 2500);
  });
}

// export to CSV
async function exportToCsv() {
  try {
    const col = collection(db, 'reservations');
    const snapshot = await getDocs(col);
    if (snapshot.empty) {
      adminMsg.textContent = 'لا توجد حجوزات للتصدير.';
      setTimeout(()=> adminMsg.textContent='', 2000);
      return;
    }
    const header = ['id','service','name','phone','time','createdAt'];
    const rows = snapshot.docs.map(d => {
      const data = d.data();
      const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : '';
      return header.map(k => `"${(k === 'id' ? d.id : (data[k] || '')).toString().replace(/"/g,'""')}"`).join(',');
    });
    const csv = [header.join(',')].concat(rows).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    adminMsg.textContent = 'فشل التصدير.';
    setTimeout(()=> adminMsg.textContent='', 2000);
  }
}

// delete all reservations (use with caution)
async function clearAllReservations() {
  if (!confirm('هل أنت متأكد من حذف جميع الحجوزات؟ لا يمكن التراجع.')) return;
  try {
    const col = collection(db, 'reservations');
    const snapshot = await getDocs(col);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(doc(db, 'reservations', d.id)));
    await batch.commit();
    adminMsg.textContent = 'تم حذف جميع الحجوزات.';
    setTimeout(()=> adminMsg.textContent='', 2000);
  } catch (err) {
    console.error(err);
    adminMsg.textContent = 'فشل الحذف.';
    setTimeout(()=> adminMsg.textContent='', 2000);
  }
}

// login handling (client-only)
if (btnLogin && adminPass) {
  btnLogin.addEventListener('click', () => {
    const val = adminPass.value.trim();
    if (val === ADMIN_PASSWORD) {
      loginArea.style.display = 'none';
      adminControls.style.display = 'block';
      adminMsg.textContent = '';
      startRealtimeListener();
    } else {
      adminMsg.textContent = 'كلمة المرور غير صحيحة.';
      setTimeout(() => adminMsg.textContent = '', 2500);
    }
  });

  adminPass.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnLogin.click();
  });
}

// export & clear buttons
if (btnExport) btnExport.addEventListener('click', exportToCsv);
if (btnClear) btnClear.addEventListener('click', clearAllReservations);

// search/filter client-side (works on currently rendered rows)
if (searchInput) {
  searchInput.addEventListener('input', function(){
    const q = this.value.trim().toLowerCase();
    document.querySelectorAll('#bookings tbody tr').forEach(tr => {
      const name = (tr.querySelector('.name')?.textContent || '').toLowerCase();
      const phone = (tr.querySelector('.phone')?.textContent || '').toLowerCase();
      tr.style.display = (q === '' || name.includes(q) || phone.includes(q)) ? '' : 'none';
    });
  });
}
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', function(){
    if (searchInput) searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  });
}

// Optionally: stop realtime when leaving the page
window.addEventListener('beforeunload', () => {
  if (typeof unsubscribeRealtime === 'function') unsubscribeRealtime();
});

// js/booking.js - معدل لدعم Firestore كخيار مركزي (يحافظ على localStorage)
const STORAGE_KEY = 'goat_bookings_v1';
const modal = document.getElementById('bookingModal');
const serviceNameEl = document.getElementById('serviceName');
const bookButtons = document.querySelectorAll('.book-btn');
const closeBtn = modal ? modal.querySelector('.gc-close') : null;
const cancelBtn = document.getElementById('gc-cancel');
const overlay = modal ? modal.querySelector('.gc-overlay') : null;
const form = document.getElementById('bookingForm');
const msgEl = document.getElementById('gc-msg');

let lastFocus = null;

/* ---- Firebase: ضع هنا تكوين Firebase الذي تحصل عليه من console.firebase.google.com ----
   مثال:
   const FIREBASE_CONFIG = {
     apiKey: "AIza... ",
     authDomain: "your-app.firebaseapp.com",
     projectId: "your-app",
     // ...
   };
   أو اضف ملف config منفصل ثم استورد
*/
const FIREBASE_CONFIG = null; // <-- غيّر هذا إلى كائن التكوين لتفعيل الصنف السحابي

// load firebase SDK dynamically إذا تم وضع CONFIG
let db = null;
async function initFirebaseIfNeeded(){
  if(!FIREBASE_CONFIG) return;
  if(window.firebase && window.firebase.firestore) {
    db = firebase.firestore();
    return;
  }
  // تحميل SDK (compat) من CDN
  await new Promise((res, rej) => {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js';
      s2.onload = () => res();
      s2.onerror = rej;
      document.head.appendChild(s2);
    };
    s1.onerror = rej;
    document.head.appendChild(s1);
  });
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
}

/* Modal + helpers (كما عندك) */
function openModal(service = '-') {
  lastFocus = document.activeElement;
  if (serviceNameEl) serviceNameEl.textContent = service;
  if (modal) modal.setAttribute('aria-hidden', 'false');
  if (form) {
    const first = form.querySelector('input, textarea, select');
    if (first) first.focus();
  }
  document.addEventListener('keydown', handleKey);
}
function closeModal() {
  if (modal) modal.setAttribute('aria-hidden', 'true');
  if (msgEl) msgEl.textContent = '';
  if (form) form.reset();
  if (lastFocus) lastFocus.focus();
  document.removeEventListener('keydown', handleKey);
}
function handleKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
  if (e.key === 'Tab') {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const arr = Array.from(focusable).filter(el => el.offsetParent !== null);
    if (arr.length === 0) return;
    const first = arr[0], last = arr[arr.length - 1];
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  }
}

/* bind book buttons */
bookButtons.forEach(btn => {
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const title = btn.dataset.title || btn.textContent.trim() || 'حجز';
    openModal(title);
  });
});
if (overlay) overlay.addEventListener('click', closeModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

/* save localStorage as fallback */
function saveLocal(data){
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (err) { console.error(err); return false; }
}

/* save to Firestore (if enabled) */
async function saveCloud(data){
  if(!db) return false;
  try {
    await db.collection('bookings').add(data);
    return true;
  } catch (err) {
    console.error('firestore save failed', err);
    return false;
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const time = form.time ? form.time.value : (form.querySelector('#b-time') ? form.querySelector('#b-time').value : '');
    const service = serviceNameEl ? serviceNameEl.textContent : '-';
    if (!name || !phone || !time) {
      if (msgEl) msgEl.textContent = 'يرجى تعبئة جميع الحقول المطلوبة.';
      return;
    }
    const booking = {
      id: 'b_' + Date.now(),
      service,
      name,
      phone,
      time,
      createdAt: new Date().toISOString()
    };
    // Save locally immediately
    const okLocal = saveLocal(booking);

    // Attempt cloud save (if enabled)
    if(FIREBASE_CONFIG && !db) {
      try { await initFirebaseIfNeeded(); } catch(err) { console.warn('Firebase init failed', err); }
    }
    let okCloud = false;
    if(db) {
      okCloud = await saveCloud(booking);
    }

    if (okLocal || okCloud) {
      if (msgEl) msgEl.textContent = 'تم إرسال الحجز بنجاح. شكرًا لك.';
      setTimeout(() => closeModal(), 1200);
    } else {
      if (msgEl) msgEl.textContent = 'حصل خطأ أثناء حفظ الحجز. حاول مرة أخرى.';
    }
  });
}

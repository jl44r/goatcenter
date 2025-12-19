// js/booking-firebase.js
// Handles booking form submission and writes to Firestore
// This file expects to be loaded as a module (type="module")

import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// keep the same form id as in your HTML: #bookingForm
const form = document.getElementById('bookingForm');
const msgEl = document.getElementById('gc-msg');
const modal = document.getElementById('bookingModal');

async function saveToFirestore({ service, name, phone, time }) {
  try {
    const col = collection(db, 'reservations');
    const docRef = await addDoc(col, {
      service: service || '-',
      name: name || '',
      phone: phone || '',
      time: time || '',
      createdAt: serverTimestamp()
    });
    return { ok: true, id: docRef.id };
  } catch (err) {
    console.error('Firestore addDoc error', err);
    return { ok: false, error: err };
  }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (form.name && form.name.value || '').trim();
    const phone = (form.phone && form.phone.value || '').trim();
    const time = (form.time && form.time.value || '').trim();
    const service = document.getElementById('serviceName') ? document.getElementById('serviceName').textContent : '-';

    if (!name || !phone || !time) {
      if (msgEl) msgEl.textContent = 'يرجى تعبئة جميع الحقول المطلوبة.';
      return;
    }

    // disable submit button while sending
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await saveToFirestore({ service, name, phone, time });

    if (res.ok) {
      if (msgEl) msgEl.textContent = 'تم إرسال الحجز بنجاح. شكرًا لك.';
      // reset and close after short delay (existing modal functions)
      setTimeout(() => {
        form.reset();
        // If you have a closeModal() function (existing booking.js) call it; otherwise hide modal:
        try {
          const closeEvent = new Event('closeBookingModal');
          window.dispatchEvent(closeEvent);
        } catch (err) {}
        if (submitBtn) submitBtn.disabled = false;
      }, 900);
    } else {
      if (msgEl) msgEl.textContent = 'حصل خطأ أثناء حفظ الحجز. حاول مرة أخرى.';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// js/booking.js (معدل) - حذف حقل التاريخ، والوقت أصبح select
const STORAGE_KEY = 'goat_bookings_v1'; // مفتاح التخزين (تأكد أن نفس المفتاح في admin)
const modal = document.getElementById('bookingModal');
const serviceNameEl = document.getElementById('serviceName');
const bookButtons = document.querySelectorAll('.book-btn');
const closeBtn = modal ? modal.querySelector('.gc-close') : null;
const cancelBtn = document.getElementById('gc-cancel');
const overlay = modal ? modal.querySelector('.gc-overlay') : null;
const form = document.getElementById('bookingForm');
const msgEl = document.getElementById('gc-msg');

let lastFocus = null;

function openModal(service = '-') {
  lastFocus = document.activeElement;
  if (serviceNameEl) serviceNameEl.textContent = service;
  if (modal) modal.setAttribute('aria-hidden', 'false');
  // focus على أول حقل
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
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  }
  if (e.key === 'Tab') {
    // simple focus trap
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const arr = Array.from(focusable).filter(el => el.offsetParent !== null);
    if (arr.length === 0) return;
    const first = arr[0], last = arr[arr.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    }
  }
}

// bind book buttons
bookButtons.forEach(btn => {
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const title = btn.dataset.title || btn.textContent.trim() || 'حجز';
    openModal(title);
  });
});

// close handlers
if (overlay) overlay.addEventListener('click', closeModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

// helper: save booking to localStorage
function saveBooking(data) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (err) {
    console.error('Failed to save booking', err);
    return false;
  }
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form) return;
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const time = form.time ? form.time.value : (form.querySelector('#b-time') ? form.querySelector('#b-time').value : '');
    const service = serviceNameEl ? serviceNameEl.textContent : '-';

    // التحقق: لم يعد هناك حقل التاريخ
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

    const ok = saveBooking(booking);
    if (ok) {
      if (msgEl) msgEl.textContent = 'تم إرسال الحجز بنجاح. شكرًا لك.';
      // أغلق المودال بعد 1.2 ثانية
      setTimeout(() => {
        closeModal();
      }, 1200);
    } else {
      if (msgEl) msgEl.textContent = 'حصل خطأ أثناء حفظ الحجز. حاول مرة أخرى.';
    }
  });
}
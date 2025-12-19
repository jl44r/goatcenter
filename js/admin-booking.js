// js/admin-booking.js - قراءة من localStorage و Firestore (إذا متوفر)
(function () {
  const STORAGE_KEY = 'goat_bookings_v1';
  const ADMIN_PASSWORD = 'admin123';

  const btnLogin = document.getElementById('btnLogin');
  const adminPass = document.getElementById('adminPass');
  const adminControls = document.getElementById('adminControls');
  const loginArea = document.getElementById('loginArea');
  const bookingsBody = document.getElementById('bookingsBody');
  const adminMsg = document.getElementById('adminMsg');
  const btnClear = document.getElementById('btnClear');
  const btnExport = document.getElementById('btnExport');

  // firebase config should be same used في booking.js
  const FIREBASE_CONFIG = null; // ضع نفس الـ config هنا إن أردت

  let db = null;
  async function initFirebaseIfNeeded(){
    if(!FIREBASE_CONFIG) return;
    if(window.firebase && window.firebase.firestore) { db = firebase.firestore(); return; }
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

  function loadLocal() {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (err) { return []; }
  }

  async function loadCloud() {
    if(!db) return [];
    try {
      const snap = await db.collection('bookings').orderBy('createdAt','desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('cloud load failed', err);
      return [];
    }
  }

  async function renderBookings() {
    bookingsBody.innerHTML = '';
    // Attempt cloud first (if configured)
    if(FIREBASE_CONFIG) {
      try {
        if(!db) await initFirebaseIfNeeded();
        const cloudList = await loadCloud();
        if (cloudList && cloudList.length) {
          cloudList.forEach((b, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${idx+1}</td>
              <td>${escapeHtml(b.service || '')}</td>
              <td>${escapeHtml(b.name || '')}</td>
              <td>${escapeHtml(b.phone || '')}</td>
              <td>${escapeHtml(b.time || '')}</td>
              <td>${escapeHtml(new Date(b.createdAt || '').toLocaleString() || '')}</td>
            `;
            bookingsBody.appendChild(tr);
          });
          return;
        }
      } catch(err) { console.warn(err); /* fallback to local */ }
    }
    // fallback to localStorage
    const list = loadLocal();
    if (list.length === 0) {
      bookingsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;padding:18px;">لا توجد حجوزات حتى الآن.</td></tr>';
      return;
    }
    list.slice().reverse().forEach((b, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${list.length - idx}</td>
        <td>${escapeHtml(b.service || '')}</td>
        <td class="name">${escapeHtml(b.name || '')}</td>
        <td class="phone">${escapeHtml(b.phone || '')}</td>
        <td>${escapeHtml(b.time || '')}</td>
        <td>${escapeHtml(new Date(b.createdAt || '').toLocaleString() || '')}</td>
      `;
      bookingsBody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  btnLogin.addEventListener('click', () => {
    const val = adminPass.value.trim();
    if (val === ADMIN_PASSWORD) {
      loginArea.style.display = 'none';
      adminControls.style.display = 'block';
      adminMsg.textContent = '';
      renderBookings();
    } else {
      adminMsg.textContent = 'كلمة المرور غير صحيحة.';
      setTimeout(() => adminMsg.textContent = '', 2500);
    }
  });

  adminPass.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnLogin.click();
  });

  btnClear.addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من حذف جميع الحجوزات؟ لا يمكن التراجع.')) return;
    // remove local
    localStorage.removeItem(STORAGE_KEY);
    // optionally remove cloud (إن رغبت تحتاج صلاحيات/تحقق) - غير مفعل هنا
    renderBookings();
    adminMsg.textContent = 'تم حذف جميع الحجوزات المحلية.';
    setTimeout(() => adminMsg.textContent = '', 2500);
  });

  btnExport.addEventListener('click', () => {
    const list = loadLocal();
    if (!list.length) {
      adminMsg.textContent = 'لا توجد حجوزات للتصدير.';
      setTimeout(() => adminMsg.textContent = '', 2000);
      return;
    }
    const header = ['id', 'service', 'name', 'phone', 'time', 'createdAt'];
    const rows = list.map(b => header.map(k => `"${(b[k] || '').toString().replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(',')].concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // search/filter existing DOM rows (existing code)
  document.addEventListener('DOMContentLoaded', function(){
    const qEl = document.getElementById('search');
    const clearBtn = document.getElementById('clear');
    if(!qEl) return;
    qEl.addEventListener('input', function(){
      const q = this.value.trim().toLowerCase();
      document.querySelectorAll('#bookings tbody tr').forEach(tr => {
        const name = (tr.querySelector('.name') ? tr.querySelector('.name').textContent : (tr.cells[2]||{}).textContent || '').toLowerCase();
        const phone = (tr.querySelector('.phone') ? tr.querySelector('.phone').textContent : (tr.cells[3]||{}).textContent || '').toLowerCase();
        tr.style.display = (q === '' || name.includes(q) || phone.includes(q)) ? '' : 'none';
      });
    });
    if(clearBtn) clearBtn.addEventListener('click', function(){ qEl.value = ''; qEl.dispatchEvent(new Event('input')); });
  });

})();

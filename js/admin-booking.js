// js/admin-booking.js (معدل) - تم حذف حقل التاريخ من العرض/التصدير
(function () {
  const STORAGE_KEY = 'goat_bookings_v1';
  const ADMIN_PASSWORD = 'admin123'; // يمكن تغييره؛ هذه حماية بسيطة على جهة العميل فقط

  const btnLogin = document.getElementById('btnLogin');
  const adminPass = document.getElementById('adminPass');
  const adminControls = document.getElementById('adminControls');
  const loginArea = document.getElementById('loginArea');
  const bookingsBody = document.getElementById('bookingsBody');
  const adminMsg = document.getElementById('adminMsg');
  const btnClear = document.getElementById('btnClear');
  const btnExport = document.getElementById('btnExport');

  function loadBookings() {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      return [];
    }
  }

  function renderBookings() {
    const list = loadBookings();
    bookingsBody.innerHTML = '';
    if (list.length === 0) {
      bookingsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;padding:18px;">لا توجد حجوزات حتى الآن.</td></tr>';
      return;
    }
    list.slice().reverse().forEach((b, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${list.length - idx}</td>
        <td>${escapeHtml(b.service || '')}</td>
        <td>${escapeHtml(b.name || '')}</td>
        <td>${escapeHtml(b.phone || '')}</td>
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

  // Enter key to login
  adminPass.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnLogin.click();
  });

  btnClear.addEventListener('click', () => {
    if (!confirm('هل أنت متأكد من حذف جميع الحجوزات؟ لا يمكن التراجع.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderBookings();
    adminMsg.textContent = 'تم حذف جميع الحجوزات.';
    setTimeout(() => adminMsg.textContent = '', 2500);
  });

  btnExport.addEventListener('click', () => {
    const list = loadBookings();
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
})();

document.addEventListener('DOMContentLoaded', function(){
  const qEl = document.getElementById('search');
  const clearBtn = document.getElementById('clear');
  const rows = () => document.querySelectorAll('#bookings tbody tr');

  if(!qEl) return console.warn('input#search غير موجود في الصفحة');

  qEl.addEventListener('input', function(){
    const q = this.value.trim().toLowerCase();
    rows().forEach(tr => {
      const nameEl = tr.querySelector('.name');
      const phoneEl = tr.querySelector('.phone');

      //Fallback لاستخدام خانات بالاندكس إن لم توجد الفئات
      const name = (nameEl ? nameEl.textContent : (tr.cells[2]||{}).textContent || '').toLowerCase();
      const phone = (phoneEl ? phoneEl.textContent : (tr.cells[3]||{}).textContent || '').toLowerCase();

      tr.style.display = (q === '' || name.includes(q) || phone.includes(q)) ? '' : 'none';
    });
  });

  if(clearBtn) clearBtn.addEventListener('click', function(){
    qEl.value = '';
    qEl.dispatchEvent(new Event('input'));
  });
});
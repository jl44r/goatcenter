// تحكم بزر الهامبرغر لفتح / غلق القائمة
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-navigation');
  const navLinks = document.querySelectorAll('.nav-list a');

  if (!toggle || !nav || !header) return;

  function setOpen(isOpen) {
    if (isOpen) {
      header.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'إغلاق القائمة');
    } else {
      header.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'فتح القائمة');
    }
  }

  toggle.addEventListener('click', function (e) {
    const isOpen = header.classList.contains('open');
    setOpen(!isOpen);
  });

  // إغلاق القائمة عند الضغط على أي رابط (مفيد على الجوال)
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      // فقط إذا كانت القائمة مفتوحة على الموبايل
      if (header.classList.contains('open')) {
        setOpen(false);
      }
    });
  });

  // إغلاق القائمة عند الضغط خارِجها (اختياري)
  document.addEventListener('click', function (e) {
    if (!header.classList.contains('open')) return;
    // إذا النقر خارج الهيدر والقائمة -> أغلق
    if (!header.contains(e.target)) {
      setOpen(false);
    }
  });

  // إغلاق القائمة بزر الهروب
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('open')) {
      setOpen(false);
    }
  });
});
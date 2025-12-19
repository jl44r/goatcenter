// header.js
// يضبط ارتفاع الهيدر ديناميكياً في متغير CSS --header-height حتى لا يغطي الهيدر المحتوى
(function () {
  const root = document.documentElement;
  const header = document.querySelector('header');
  const siteContent = document.querySelector('.site-content') || document.querySelector('main') || document.body;

  if (!header) return;

  function updateHeaderHeight() {
    // استخدام getBoundingClientRect للحصول على الارتفاع الدقيق (يشمل padding)
    const h = Math.ceil(header.getBoundingClientRect().height);
    // يضع القيمة ببيكسل في متغير CSS
    root.style.setProperty('--header-height', h + 'px');
    // يضمن وجود مساحة أعلى المحتوى حتى لا يُغطي الهيدر الجزأ العلوي
    siteContent.style.marginTop = '0'; // نحن نستخدم body padding-top عادة، لكن نترك هذا للخيار إن لزم
    // تأكد أنّ body لديه padding-top إذا أردت:
    document.body.style.paddingTop = h + 'px';
  }

  // استدعاءات أولية
  window.addEventListener('load', updateHeaderHeight, { passive: true });
  window.addEventListener('resize', updateHeaderHeight, { passive: true });

  // إذا كانت هناك صور داخل الهيدر قد تغيّر الارتفاع بعد تحميلها:
  const imgs = header.querySelectorAll('img');
  if (imgs.length) {
    let loaded = 0;
    imgs.forEach(img => {
      if (img.complete) { loaded++; }
      else img.addEventListener('load', () => { updateHeaderHeight(); });
    });
    if (loaded === imgs.length) updateHeaderHeight();
  } else {
    updateHeaderHeight();
  }

  // (اختياري) لو تريد إظهار/إخفاء الهيدر عند النزول/الصعود يمكن تفعيله هنا.
  // حالياً نُبقي الهيدر ثابتاً ومرئيًا دائما كما طلبت.
})();

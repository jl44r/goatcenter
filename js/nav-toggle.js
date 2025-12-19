(function() {
  'use strict';
  
  function init() {
    var header = document.querySelector('header');
    var nav = document.querySelector('.navigation');
    
    if (! header || !nav) return;
    
    // Create button
    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.setAttribute('aria-expanded', 'false');
    
    var bar = document.createElement('span');
    bar.className = 'bar';
    btn.appendChild(bar);
    
    header.appendChild(btn);
    
    // Functions
    var toggle = function() {
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ?  'true' : 'false');
    };
    
    var close = function() {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    
    // Events
    btn.addEventListener('click', toggle);
    
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', close);
    });
    
    document.addEventListener('click', function(e) {
      if (!header.contains(e.target)) close();
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    });
    
    window.addEventListener('resize', function() {
      if (window.innerWidth > 900) close();
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
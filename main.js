(function () {
  var root = document.documentElement;

  // Theme toggle (initial data-theme is set by the inline no-FOUC script in <head>)
  var toggle = document.getElementById('themeToggle');
  var icon = document.getElementById('themeIcon');
  var txt = document.getElementById('themeText');
  function render(m) {
    if (icon) icon.textContent = m === 'dark' ? '☀' : '◐';
    if (txt) txt.textContent = m === 'dark' ? 'Light' : 'Dark';
  }
  render(root.getAttribute('data-theme') || 'light');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      render(next);
    });
  }

  // Mobile nav
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('navMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

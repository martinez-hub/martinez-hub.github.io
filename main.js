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

  // --- Analytics: track engagement clicks (GA4 custom events) ---
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').trim();

    // CV download (PDF link)
    if (/\.pdf($|\?)/i.test(href) || /(^|\/)cv\//i.test(href)) {
      track('cv_download', { link_url: href, link_text: text });
      return;
    }

    // only external links beyond this point
    var isExternal = /^https?:\/\//i.test(href) && href.indexOf(location.host) === -1;
    if (!isExternal) return;

    var pub = a.closest('.pub');
    if (pub || a.closest('.linkrow')) {
      var titleEl = pub && pub.querySelector('.title');
      track('paper_click', {
        link_url: href,
        link_text: text,
        paper_title: titleEl ? titleEl.textContent.trim() : text
      });
    } else if (a.closest('.social')) {
      track('social_click', { platform: text, link_url: href });
    } else if (a.closest('.news') || a.closest('.news-feed')) {
      track('news_click', { link_url: href, link_text: text });
    } else {
      track('outbound_click', { link_url: href, link_text: text });
    }
  });
})();

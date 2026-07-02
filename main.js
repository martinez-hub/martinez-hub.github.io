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

// --- Code blocks: per-OS tabs + copy button ---
(function () {
  function detectOS() {
    var s = (navigator.userAgent || '') + ' ' + (navigator.platform || '');
    if (/Win/i.test(s)) return 'windows';
    if (/Android/i.test(s)) return 'linux';
    if (/Linux/i.test(s)) return 'linux';
    return 'macos'; // default for Mac and anything else
  }

  var tabbed = Array.prototype.slice.call(document.querySelectorAll('.codeblock[data-tabs]'));
  var allBlocks = Array.prototype.slice.call(document.querySelectorAll('.codeblock'));
  if (!allBlocks.length) return;

  var saved;
  try { saved = localStorage.getItem('os'); } catch (e) {}
  var currentOS = saved || detectOS();

  function applyOS(os) {
    currentOS = os;
    try { localStorage.setItem('os', os); } catch (e) {}
    tabbed.forEach(function (cb) {
      var pres = cb.querySelectorAll('.cb-pre');
      var matched = false;
      pres.forEach(function (p) {
        var show = p.getAttribute('data-os') === os;
        p.hidden = !show;
        if (show) matched = true;
      });
      if (!matched && pres.length) { pres[0].hidden = false; } // fall back to first
      cb.querySelectorAll('.cb-tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-os') === os);
      });
    });
  }

  tabbed.forEach(function (cb) {
    cb.querySelectorAll('.cb-tab').forEach(function (t) {
      t.addEventListener('click', function () { applyOS(t.getAttribute('data-os')); });
    });
  });
  if (tabbed.length) applyOS(currentOS);

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) {}
  }

  allBlocks.forEach(function (cb) {
    var btn = cb.querySelector('.cb-copy');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var pre = cb.querySelector('.cb-pre:not([hidden])') || cb.querySelector('.cb-pre');
      if (!pre) return;
      var text = pre.innerText.replace(/\s+$/, '');
      var flash = function () {
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash, function () { fallbackCopy(text, flash); });
      } else {
        fallbackCopy(text, flash);
      }
    });
  });
})();

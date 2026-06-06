# Website Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static research website into the approved "Paper" design (light + dark editorial theme), update content for the new role/research areas, fix the favicon, and restore hosting by making the repo public.

**Architecture:** Static HTML pages sharing one `style.css` (CSS custom-property theming) and one `main.js` (theme toggle + mobile nav). A tiny inline `<head>` script applies the saved/system theme before first paint to avoid FOUC. No build step, no framework.

**Tech Stack:** HTML5, CSS (custom properties, grid/flex), vanilla JS, Google Fonts (Newsreader, Inter, JetBrains Mono), SVG favicon, GitHub Pages.

**Reference:** Spec at `docs/superpowers/specs/2026-06-06-website-modernization-design.md`. Approved homepage mockup at `.superpowers/brainstorm/15414-1780765706/content/mockups-v2.html` (visual source of truth for tokens/spacing).

---

## File Structure

- `assets/favicon.svg` — **create** — monogram favicon (oxblood "JM" on paper).
- `assets/apple-touch-icon.png` — **create** — 180×180 PNG version.
- `assets/favicon.png` — **delete** (2.2 MB, replaced).
- `style.css` — **replace** — full design system + all page component styles + dark theme + responsive.
- `main.js` — **create** — theme toggle + mobile nav menu.
- `index.html` — **replace** — new hero/about/news.
- `research.html` — **replace** — restyled projects + consolidated interests.
- `publications.html` — **replace** — restyled, content preserved.
- `contact.html` — **replace** — restyled, Formspree form kept.
- `404.html` — **replace** — restyled.

**Shared partials** (copy verbatim into each page; this is a static site, duplication is expected):
- **HEAD-COMMON** (per-page `<title>`/meta differ; everything else identical)
- **NAV** (the `.active` class moves per page)
- **FOOTER** (identical)

---

### Shared snippet: HEAD-COMMON

Place inside `<head>`. Replace `__TITLE__`, `__DESC__`, `__OGURL__` per page. The inline theme script MUST come before the stylesheet to prevent FOUC.

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="author" content="Josué Martínez-Martínez">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:image" content="https://martinez-hub.github.io/assets/profile.jpg">
<meta property="og:url" content="__OGURL__">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">

<!-- No-FOUC theme: must run before stylesheet -->
<script>
  (function(){
    try{
      var s=localStorage.getItem('theme');
      var m=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
      document.documentElement.setAttribute('data-theme',m);
    }catch(e){ document.documentElement.setAttribute('data-theme','light'); }
  })();
</script>

<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
<link rel="apple-touch-icon" href="./assets/apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CW59PVY98J"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-CW59PVY98J');
</script>
```

### Shared snippet: NAV

Set `class="active"` on the current page's link. Put `aria-label` on the toggle.

```html
<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="index.html">Josué Martínez-Martínez</a>
    <button class="nav-burger" id="navBurger" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-menu" id="navMenu">
      <li><a href="index.html">About</a></li>
      <li><a href="research.html">Research</a></li>
      <li><a href="publications.html">Publications</a></li>
      <li><a href="./cv/Josue_Martinez_Martinez_CV.pdf" target="_blank">CV</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><button class="toggle" id="themeToggle" aria-label="Toggle theme"><span id="themeIcon">◐</span> <span id="themeText">Dark</span></button></li>
    </ul>
  </div>
</nav>
```

### Shared snippet: FOOTER

```html
<footer>
  <div class="footer-inner">
    <span>© 2026 Josué Martínez-Martínez</span>
    <span>Hosted on GitHub Pages · Updated June 2026</span>
  </div>
</footer>
<script src="main.js"></script>
```

---

### Task 1: Generate the favicon assets

**Files:**
- Create: `assets/favicon.svg`
- Create: `assets/apple-touch-icon.png`
- Delete: `assets/favicon.png`

- [ ] **Step 1: Create `assets/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#f6f2ea"/>
  <text x="32" y="44" text-anchor="middle"
        font-family="Newsreader, Georgia, 'Times New Roman', serif"
        font-size="38" font-weight="600" fill="#7a2e2e">JM</text>
</svg>
```

- [ ] **Step 2: Generate the 180×180 PNG from the SVG**

Run (macOS, uses built-in tools; falls back to `rsvg-convert`/`magick` if present):
```bash
cd /Users/josuemartinez/Documents/PersonalProjects/research-website
if command -v rsvg-convert >/dev/null; then rsvg-convert -w 180 -h 180 assets/favicon.svg -o assets/apple-touch-icon.png;
elif command -v magick >/dev/null; then magick -background none -density 300 assets/favicon.svg -resize 180x180 assets/apple-touch-icon.png;
else qlmanage -t -s 180 -o assets assets/favicon.svg && mv assets/favicon.svg.png assets/apple-touch-icon.png; fi
ls -la assets/apple-touch-icon.png
```
Expected: a PNG file < 20 KB exists.

- [ ] **Step 3: Delete the oversized PNG**

```bash
git rm assets/favicon.png
```

- [ ] **Step 4: Verify sizes**

Run: `du -h assets/favicon.svg assets/apple-touch-icon.png`
Expected: both small (SVG < 1 KB, PNG < 20 KB).

- [ ] **Step 5: Commit**

```bash
git add assets/favicon.svg assets/apple-touch-icon.png
git commit -m "Add monogram favicon, remove 2.2MB PNG"
```

---

### Task 2: Create the design system (`style.css`)

**Files:**
- Replace: `style.css`

- [ ] **Step 1: Replace `style.css` with the full stylesheet**

```css
/* ===== Reset & tokens ===== */
*{ margin:0; padding:0; box-sizing:border-box; }
html{ scroll-behavior:smooth; }

:root[data-theme="light"]{
  --bg:#f6f2ea; --surface:#efe8da; --surface-2:#ece4d5;
  --text:#211e18; --muted:#5e564a; --faint:#9a8f7c;
  --line:#ddd3c2; --accent:#7a2e2e; --accent-ink:#5e2424;
  --shadow:0 1px 2px rgba(60,40,20,.06);
}
:root[data-theme="dark"]{
  --bg:#16140f; --surface:#1e1b15; --surface-2:#221e17;
  --text:#ece7dd; --muted:#a99f8e; --faint:#7d7464;
  --line:#332e25; --accent:#d2796a; --accent-ink:#e6a394;
  --shadow:0 1px 2px rgba(0,0,0,.3);
}

body{
  font-family:'Newsreader',Georgia,serif; background:var(--bg); color:var(--text);
  line-height:1.6; -webkit-font-smoothing:antialiased;
  transition:background .35s ease, color .35s ease;
}
a{ color:inherit; }
.wrap{ max-width:1040px; margin:0 auto; padding:0 2.5rem; }
.ui{ font-family:'Inter',sans-serif; }

/* mono/sans micro-labels */
.eyebrow,.sec-h,.date,.nav-menu,.toggle,.tags span,.footer-inner,.nav-burger{ font-family:'Inter',sans-serif; }

/* ===== Nav ===== */
.nav{ position:sticky; top:0; z-index:50; background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
.nav-inner{ max-width:1040px; margin:0 auto; padding:1.2rem 2.5rem; display:flex; align-items:center; justify-content:space-between; }
.brand{ font-weight:600; font-size:1.15rem; letter-spacing:-.01em; text-decoration:none; color:var(--text); }
.nav-menu{ list-style:none; display:flex; gap:1.9rem; align-items:center; font-size:.9rem; }
.nav-menu a{ text-decoration:none; color:var(--muted); transition:color .2s; }
.nav-menu a:hover,.nav-menu a.active{ color:var(--accent); }
.toggle{ cursor:pointer; border:1px solid var(--line); background:var(--surface); color:var(--muted);
  border-radius:999px; padding:.4rem .8rem; font-size:.78rem; display:inline-flex; align-items:center; gap:.4rem; transition:.2s; }
.toggle:hover{ color:var(--accent); border-color:var(--accent); }
.nav-burger{ display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:.3rem; }
.nav-burger span{ width:22px; height:2px; background:var(--text); transition:.25s; }

/* ===== Hero (home) ===== */
.hero{ display:grid; grid-template-columns:auto 1fr; gap:3.5rem; align-items:center; padding:5rem 0 3.5rem; }
.avatar{ width:200px; height:200px; border-radius:50%; object-fit:cover; border:1px solid var(--line); box-shadow:var(--shadow); }
.eyebrow{ font-size:.76rem; letter-spacing:.2em; text-transform:uppercase; color:var(--accent); margin-bottom:1rem; font-weight:600; }
h1{ font-weight:500; font-size:clamp(2.6rem,5.5vw,4.4rem); line-height:1.03; letter-spacing:-.015em; }
.role{ font-style:italic; font-size:1.35rem; color:var(--muted); margin-top:.9rem; }
.role b{ font-style:normal; font-weight:600; color:var(--accent); }
.sub{ font-family:'Inter',sans-serif; font-size:.95rem; color:var(--muted); margin-top:.6rem; }
.tags{ display:flex; flex-wrap:wrap; gap:.55rem; margin-top:1.6rem; }
.tags span{ font-size:.8rem; padding:.35rem .85rem; background:var(--surface-2); border:1px solid var(--line); border-radius:5px; color:var(--muted); }
.social{ display:flex; flex-wrap:wrap; gap:1.4rem; margin-top:1.8rem; font-family:'Inter',sans-serif; font-size:.9rem; }
.social a{ text-decoration:none; color:var(--accent); border-bottom:1px solid var(--line); padding-bottom:2px; transition:.2s; }
.social a:hover{ border-color:var(--accent); }

.rule{ height:1px; background:var(--line); margin:1rem 0 3.5rem; }

/* ===== Generic page content ===== */
main{ padding:2.5rem 0 1rem; }
.page-title{ font-weight:500; font-size:clamp(2rem,4vw,3rem); letter-spacing:-.01em; margin:2rem 0 2.5rem; }
.sec-h{ font-size:.74rem; letter-spacing:.16em; text-transform:uppercase; color:var(--faint); margin-bottom:1.3rem; font-weight:600; }
.lead{ font-size:1.15rem; color:var(--muted); max-width:62ch; margin-bottom:2rem; }
.lead a{ color:var(--accent); font-weight:600; }

/* two-column About/News (home) */
.grid{ display:grid; grid-template-columns:1.45fr 1fr; gap:4rem; padding-bottom:4rem; }
.about p{ font-size:1.22rem; line-height:1.65; color:var(--text); max-width:58ch; margin-bottom:1.1rem; }
.about p b{ color:var(--accent); font-weight:600; }
.about p.muted{ color:var(--muted); }

/* news */
.news .item{ padding:1rem 0; border-bottom:1px solid var(--line); }
.news .item:last-child{ border-bottom:none; }
.news .date{ font-size:.72rem; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); margin-bottom:.2rem; }
.news .t{ font-size:1.12rem; font-weight:500; }
.news .l{ font-family:'Inter',sans-serif; font-size:.82rem; color:var(--accent); text-decoration:none; }
.news .l:hover{ text-decoration:underline; }

/* projects (research page) */
.project{ padding-bottom:2.5rem; margin-bottom:2.5rem; border-bottom:1px solid var(--line); }
.project:last-child{ border-bottom:none; }
.project h3{ font-size:1.5rem; font-weight:600; margin-bottom:.75rem; }
.project p{ font-size:1.08rem; line-height:1.7; color:var(--text); margin-bottom:.9rem; max-width:70ch; }
.project p b{ color:var(--accent); }
.project ul{ margin:0 0 1rem 1.3rem; }
.project li{ margin-bottom:.5rem; line-height:1.6; color:var(--muted); max-width:70ch; }
.linkrow{ display:flex; flex-wrap:wrap; gap:1rem; }
.linkrow a{ font-family:'Inter',sans-serif; font-size:.88rem; color:var(--accent); text-decoration:none; border-bottom:1px solid var(--line); padding-bottom:2px; }
.linkrow a:hover{ border-color:var(--accent); }

/* interests list */
.interests{ list-style:none; }
.interests li{ padding:1rem 0; border-bottom:1px solid var(--line); max-width:72ch; }
.interests li:last-child{ border-bottom:none; }
.interests b{ color:var(--accent); font-weight:600; }

/* publications */
.pub-group{ font-family:'Inter',sans-serif; font-size:.78rem; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin:2.75rem 0 1.25rem; font-weight:600; }
.pub{ padding:1.1rem 0; border-bottom:1px solid var(--line); }
.pub:last-child{ border-bottom:none; }
.pub .title{ font-size:1.12rem; font-weight:600; margin-bottom:.3rem; }
.pub .authors{ font-size:1rem; color:var(--text); margin-bottom:.2rem; }
.pub .authors b{ color:var(--accent); }
.pub .venue{ font-style:italic; color:var(--muted); margin-bottom:.5rem; }
.pub .links{ display:flex; gap:1rem; }
.pub .links a{ font-family:'Inter',sans-serif; font-size:.85rem; color:var(--accent); text-decoration:none; border-bottom:1px solid var(--line); padding-bottom:1px; }

/* contact form */
.card{ background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:1.75rem; margin-bottom:2rem; }
.card p{ margin-bottom:.6rem; }
.card a{ color:var(--accent); }
.form{ max-width:620px; }
.field{ margin-bottom:1.25rem; }
.field label{ display:block; font-family:'Inter',sans-serif; font-size:.85rem; font-weight:600; margin-bottom:.4rem; }
.field input,.field textarea{ width:100%; padding:.75rem; font-family:'Inter',sans-serif; font-size:1rem;
  background:var(--bg); color:var(--text); border:1px solid var(--line); border-radius:6px; transition:border-color .2s; }
.field input:focus,.field textarea:focus{ outline:none; border-color:var(--accent); }
.field textarea{ resize:vertical; min-height:130px; }
.btn{ font-family:'Inter',sans-serif; font-weight:600; font-size:.95rem; cursor:pointer;
  background:var(--accent); color:#fff; border:none; padding:.75rem 1.8rem; border-radius:6px; transition:.2s; }
.btn:hover{ background:var(--accent-ink); }

/* 404 */
.center{ text-align:center; padding:6rem 0; }
.center .big{ font-size:6rem; font-weight:600; color:var(--accent); line-height:1; }

/* ===== Footer ===== */
footer{ border-top:1px solid var(--line); background:var(--surface); padding:2.5rem 0; margin-top:3rem; }
.footer-inner{ max-width:1040px; margin:0 auto; padding:0 2.5rem; font-size:.82rem; color:var(--faint);
  display:flex; justify-content:space-between; flex-wrap:wrap; gap:.5rem; }

/* ===== Responsive ===== */
@media(max-width:760px){
  .nav-burger{ display:flex; }
  .nav-menu{ position:absolute; top:100%; left:0; right:0; flex-direction:column; align-items:flex-start;
    gap:1rem; padding:1.25rem 2.5rem; background:var(--bg); border-bottom:1px solid var(--line);
    display:none; }
  .nav-menu.open{ display:flex; }
  .hero{ grid-template-columns:1fr; text-align:center; gap:2rem; padding-top:3rem; }
  .avatar{ margin:0 auto; width:150px; height:150px; }
  .social,.tags{ justify-content:center; }
  .grid{ grid-template-columns:1fr; gap:2.5rem; }
  .wrap,.nav-inner,.footer-inner{ padding-left:1.5rem; padding-right:1.5rem; }
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "Rebuild stylesheet: Paper design system with light/dark themes"
```

---

### Task 3: Create `main.js` (theme toggle + mobile nav)

**Files:**
- Create: `main.js`

- [ ] **Step 1: Create `main.js`**

```js
(function () {
  var root = document.documentElement;

  // Theme toggle
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
```

- [ ] **Step 2: Commit**

```bash
git add main.js
git commit -m "Add theme toggle and mobile nav script"
```

---

### Task 4: Rebuild `index.html`

**Files:**
- Replace: `index.html`

Per-page values: `__TITLE__` = `Josué Martínez-Martínez — AI Research Engineer`; `__DESC__` = `AI Research Engineer at Orbis Operations and CS PhD (UConn). Research in agentic AI, world models, and AI assurance.`; `__OGURL__` = `https://martinez-hub.github.io/`. NAV active link: About.

- [ ] **Step 1: Write `index.html`** — `<head>` = HEAD-COMMON, then:

```html
</head>
<body>
<!-- NAV (active: About) -->
<main class="wrap">
  <header class="hero">
    <img class="avatar" src="./assets/profile.jpg" alt="Josué Martínez-Martínez">
    <div>
      <div class="eyebrow">AI Research Engineer · Orbis Operations</div>
      <h1>Josué Martínez-Martínez</h1>
      <p class="role"><b>AI Research Engineer</b>, Orbis Operations</p>
      <p class="sub">PhD, Computer Science &amp; Engineering · University of Connecticut</p>
      <div class="tags"><span>Agentic AI</span><span>World Models</span><span>AI Assurance</span></div>
      <div class="social">
        <a href="https://scholar.google.com/citations?user=oqFkyvcAAAAJ&hl=en" target="_blank">Google Scholar</a>
        <a href="https://orcid.org/0000-0002-2903-9297" target="_blank">ORCID</a>
        <a href="https://github.com/martinez-hub" target="_blank">GitHub</a>
        <a href="https://www.linkedin.com/in/josuemartinezmartinez/" target="_blank">LinkedIn</a>
        <a href="contact.html">Contact</a>
      </div>
    </div>
  </header>

  <div class="rule"></div>

  <section class="grid">
    <div>
      <div class="sec-h">About</div>
      <div class="about">
        <p>I'm an <b>AI Research Engineer at Orbis Operations</b> and a recent PhD graduate in Computer Science &amp; Engineering from the University of Connecticut. My work centers on AI systems that remain reliable under distribution shift and adversarial stress — spanning <b>agentic AI, world models, and AI assurance</b>.</p>
        <p class="muted">My doctoral research was conducted in collaboration with MIT Lincoln Laboratory and supported by competitive fellowships and grants from NSF, NASA, GEM, General Electric, and the University of Connecticut.</p>
      </div>
    </div>
    <div>
      <div class="sec-h">News</div>
      <div class="news">
        <div class="item">
          <div class="date">January 2026</div>
          <div class="t">Paper presented at NLDL 2026</div>
          <a class="l" href="https://proceedings.mlr.press/v307/marti-nez-marti-nez26a.html" target="_blank">View paper →</a>
        </div>
        <div class="item">
          <div class="date">March 2026</div>
          <div class="t">Organizing the SAFE Workshop @ WACV 2026</div>
          <a class="l" href="https://www.safeworkshop.org/wacv-2026/" target="_blank">Workshop website →</a>
        </div>
        <div class="item">
          <div class="date">Deadline · March 13</div>
          <div class="t">SAFE @ CVPR 2026 — Call for Papers</div>
          <a class="l" href="https://www.safeworkshop.org/cvpr-2026/" target="_blank">Submit your work →</a>
        </div>
        <div class="item">
          <div class="date">Deadline · March 14</div>
          <div class="t">SPAR3D @ CVPR 2026 — Call for Papers</div>
          <a class="l" href="https://www.spar3d.org" target="_blank">Learn more →</a>
        </div>
      </div>
    </div>
  </section>
</main>
<!-- FOOTER -->
</body>
</html>
```

- [ ] **Step 2: Verify** — `grep -c "World Models" index.html` → expect ≥1; `grep -c "favicon.svg" index.html` → expect 1.
- [ ] **Step 3: Commit** — `git add index.html && git commit -m "Rebuild homepage in Paper design"`

---

### Task 5: Rebuild `research.html`

**Files:**
- Replace: `research.html`

Per-page values: `__TITLE__` = `Research — Josué Martínez-Martínez`; `__DESC__` = `Research on agentic AI, world models, and AI assurance, including adversarial robustness and trustworthy ML.`; `__OGURL__` = `https://martinez-hub.github.io/research.html`. NAV active: Research.

- [ ] **Step 1: Write `research.html`** — HEAD-COMMON + NAV(active Research) + FOOTER, body:

```html
<main class="wrap">
  <h1 class="page-title">Research &amp; Projects</h1>

  <section class="project">
    <h3>Underconfidence Adversarial Training</h3>
    <p>Addressed an overlooked vulnerability in adversarially trained models: attacks that reduce model confidence without changing predictions. Decreased confidence can cause unnecessary interventions, delayed diagnoses, and erosion of trust — especially in high-stakes domains like medical imaging and autonomous systems.</p>
    <p><b>Key contributions:</b></p>
    <ul>
      <li>Introduced two underconfidence attacks: class-pair ambiguity attacks and ConfSmooth, which spreads uncertainty across all classes.</li>
      <li>Developed Underconfidence Adversarial Training (UAT), integrating these attacks into standard adversarial training.</li>
      <li>UAT matches or beats traditional adversarial training while using half the gradient steps.</li>
      <li>Evaluated across 6 architectures (CNNs, ViTs) and 7 datasets including MNIST, CIFAR, ImageNet, MSTAR, and medical imaging.</li>
    </ul>
    <div class="linkrow"><a href="https://proceedings.mlr.press/v307/marti-nez-marti-nez26a.html" target="_blank">View paper →</a></div>
  </section>

  <section class="project">
    <h3>Model-Based Robust Training</h3>
    <p>Investigated how deep models handle natural image corruptions like snow and rain in safety-critical settings, using learned corruption models to generate realistic distortions while balancing robustness, calibration, and compute.</p>
    <p><b>Key contributions:</b></p>
    <ul>
      <li>Comparative framework evaluating model-based training against Vanilla, Adversarial Training, and AugMix across corruption severities.</li>
      <li>Hybrid strategies combining random coverage with adversarial refinement in nuisance space.</li>
      <li>Multi-dimensional analysis of accuracy, calibration, and computational cost — beyond accuracy-only metrics.</li>
      <li>Showed model-based augmentation matches adversarial robustness at significantly lower cost.</li>
    </ul>
    <div class="linkrow">
      <a href="https://arxiv.org/abs/2601.09153" target="_blank">From Snow to Rain (NeurIPS 2025 workshop) →</a>
      <a href="https://ojs.aaai.org/index.php/AAAI/article/view/30481" target="_blank">Towards Robustness to Natural Variations (AAAI 2024) →</a>
    </div>
  </section>

  <section class="project">
    <h3>Robust Training for Medical Imaging Classification</h3>
    <p>Developed robust training strategies to strengthen diagnostic neural networks against adversarial attacks and distribution shift while preserving diagnostic accuracy and clinician trust.</p>
    <p><b>Key contributions:</b></p>
    <ul>
      <li>Proposed Robust Training with Data Augmentation (RTDA) tailored to medical imaging.</li>
      <li>Benchmarked across 6 baselines spanning isolated and combined adversarial training and augmentation.</li>
      <li>Validated across mammograms, X-rays, and ultrasound.</li>
      <li>Evaluated against both adversarial perturbations and natural distribution variations while preserving clean accuracy.</li>
    </ul>
    <div class="linkrow">
      <a href="https://arxiv.org/abs/2506.17133" target="_blank">RTDA (AAAI 2025 workshop) →</a>
      <a href="https://ieeexplore.ieee.org/document/10980787" target="_blank">Mammogram Classification (ISBI 2025) →</a>
      <a href="https://ieeexplore.ieee.org/document/10195019/" target="_blank">Medical Deep Learning (IEEE CAI 2023) →</a>
    </div>
  </section>

  <h2 class="page-title" style="font-size:1.8rem">Research Interests</h2>
  <ul class="interests">
    <li><b>Agentic AI</b> — autonomous, tool-using AI systems and their reliability.</li>
    <li><b>World Models</b> — learned models of environment dynamics for perception and planning.</li>
    <li><b>AI Assurance</b> — trustworthy, reliable AI under adversarial and distribution stress, including adversarial machine learning, robustness to natural variation, uncertainty quantification, out-of-distribution generalization, and self-supervised representation learning.</li>
  </ul>
</main>
```

- [ ] **Step 2: Verify** — `grep -c "Agentic AI" research.html` → ≥1; legacy flat list removed: `grep -c "Deepfake Detection:" research.html` → 0.
- [ ] **Step 3: Commit** — `git add research.html && git commit -m "Rebuild research page; consolidate interests under three areas"`

---

### Task 6: Rebuild `publications.html`

**Files:**
- Replace: `publications.html`

Per-page values: `__TITLE__` = `Publications — Josué Martínez-Martínez`; `__DESC__` = `Publications on AI assurance, adversarial robustness, and trustworthy AI (AAAI, NeurIPS, NLDL, IEEE ISBI, and more).`; `__OGURL__` = `https://martinez-hub.github.io/publications.html`. NAV active: Publications.

- [ ] **Step 1: Write `publications.html`** — HEAD-COMMON + NAV(active Publications) + FOOTER, body below. **Preserve every title/author/venue/link from the current file**; only the markup/classes change. Use `.pub-group` for each section heading, `.pub` per item, wrap "Josué Martínez-Martínez" in `<b>`.

```html
<main class="wrap">
  <h1 class="page-title">Publications</h1>
  <p class="lead">For a complete list with citations, see my
    <a href="https://scholar.google.com/citations?user=oqFkyvcAAAAJ&hl=en" target="_blank">Google Scholar</a> or
    <a href="https://orcid.org/0000-0002-2903-9297" target="_blank">ORCID</a>.</p>

  <div class="pub-group">Conference Papers</div>
  <div class="pub"><div class="title">Improving Vision Model Robustness against Misclassification and Uncertainty Attacks via Underconfidence Adversarial Training</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, John T Holodnak, Olivia Brown, Sheida Nabavi, Derek Aguiar, Allan Wollaber</div>
    <div class="venue">Northern Lights Deep Learning (NLDL) Conference, 2026</div>
    <div class="links"><a href="https://proceedings.mlr.press/v307/marti-nez-marti-nez26a.html" target="_blank">Paper</a><a href="https://github.com/martinez-hub/underconfidence-adversarial-training" target="_blank">Code</a></div></div>
  <div class="pub"><div class="title">Robust Training of Deep Learning Models for Mammogram Classification</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Olivia Brown, Jun Bai, Sheida Nabavi</div>
    <div class="venue">IEEE International Symposium on Biomedical Imaging (ISBI), 2025</div>
    <div class="links"><a href="https://ieeexplore.ieee.org/document/10980787" target="_blank">Paper</a></div></div>
  <div class="pub"><div class="title">Unmanned Autonomous Aerial Navigation in GPS-Denied Environments</div>
    <div class="authors">Noshin Habib, Angel Flores-Abad, <b>Josué Martínez-Martínez</b>, Diego Aponte-Roa, Albert Espinoza</div>
    <div class="venue">18th LACCEI International Multi-Conference for Engineering, Education, and Technology, 2020</div>
    <div class="links"><a href="https://laccei.org/LACCEI2020-VirtualEdition/full_papers/FP349.pdf" target="_blank">Paper</a></div></div>
  <div class="pub"><div class="title">A Secured IoT Scheme for Microgrids Monitoring</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Carmen Carvajal-Jiménez, Diego A. Aponte-Roa</div>
    <div class="venue">10th Annual Computing and Communication Workshop and Conference (CCWC), pp. 986-990, 2020</div>
    <div class="links"><a href="https://ieeexplore.ieee.org/document/9031280" target="_blank">Paper</a></div></div>

  <div class="pub-group">Workshop Papers</div>
  <div class="pub"><div class="title">From Snow to Rain: Evaluating Robustness, Calibration, and Complexity of Model-Based Robust Training</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Olivia Brown, Giselle Zeno, Pooya Khorrami, Rajmonda Caceres</div>
    <div class="venue">LatinX in AI Research Workshop @ NeurIPS 2025</div>
    <div class="links"><a href="https://arxiv.org/abs/2601.09153" target="_blank">Paper</a><a href="https://github.com/martinez-hub/mbrdl-hybrid" target="_blank">Code</a></div></div>
  <div class="pub"><div class="title">Robust Training with Data Augmentation for Medical Imaging Classification</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Olivia Brown, Mostafa Karami, Sheida Nabavi</div>
    <div class="venue">9th International Workshop on Health Intelligence (W3PHIAI-25) @ AAAI 2025</div>
    <div class="links"><a href="https://arxiv.org/abs/2506.17133" target="_blank">Paper</a><a href="https://github.com/martinez-hub/rtda" target="_blank">Code</a></div></div>
  <div class="pub"><div class="title">RobustAugMix: Joint Optimization of Natural and Adversarial Robustness</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Olivia Brown</div>
    <div class="venue">ML Safety Workshop @ NeurIPS 2022</div>
    <div class="links"><a href="https://openreview.net/pdf?id=8MfPfECiFET" target="_blank">Paper</a><a href="https://github.com/martinez-hub/robustaugmix" target="_blank">Code</a></div></div>

  <div class="pub-group">Conference Abstracts</div>
  <div class="pub"><div class="title">Towards Robustness to Natural Variations and Distribution Shift (Student Abstract)</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Olivia Brown, Rajmonda Caceres</div>
    <div class="venue">Proceedings of the AAAI Conference on Artificial Intelligence, Vol. 38, No. 21, pp. 23579-23581, 2024</div>
    <div class="links"><a href="https://ojs.aaai.org/index.php/AAAI/article/view/30481" target="_blank">Paper</a></div></div>
  <div class="pub"><div class="title">Addressing Vulnerability in Medical Deep Learning through Robust Training</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Sheida Nabavi</div>
    <div class="venue">IEEE Conference on Computational Intelligence (CAI), 2023</div>
    <div class="links"><a href="https://ieeexplore.ieee.org/document/10195019/" target="_blank">Paper</a><a href="https://github.com/martinez-hub/robustaugmix" target="_blank">Code</a></div></div>

  <div class="pub-group">Journal Articles</div>
  <div class="pub"><div class="title">A Low-Cost Secure IoT Mechanism for Monitoring and Controlling Polygeneration Microgrids</div>
    <div class="authors"><b>Josué Martínez-Martínez</b>, Diego Aponte-Roa, Idalides Vergara-Laurens, Wayne W. Weaver</div>
    <div class="venue">Applied Sciences, Vol. 10, No. 23, Article 8354, 2020</div>
    <div class="links"><a href="https://www.mdpi.com/2076-3417/10/23/8354" target="_blank">Paper</a></div></div>

  <div class="pub-group">Thesis</div>
  <div class="pub"><div class="title">Achieving Robustness to Natural and Adversarial Perturbations</div>
    <div class="authors"><b>Josué Martínez-Martínez</b></div>
    <div class="venue">PhD Dissertation, University of Connecticut, 2025</div></div>
</main>
```

- [ ] **Step 2: Verify** — `grep -c 'class="pub"' publications.html` → expect 11; `grep -c "openreview.net" publications.html` → expect 1 (no links lost).
- [ ] **Step 3: Commit** — `git add publications.html && git commit -m "Rebuild publications page in Paper design"`

---

### Task 7: Rebuild `contact.html`

**Files:**
- Replace: `contact.html`

Per-page values: `__TITLE__` = `Contact — Josué Martínez-Martínez`; `__DESC__` = `Contact Josué Martínez-Martínez for research collaborations in agentic AI, world models, and AI assurance.`; `__OGURL__` = `https://martinez-hub.github.io/contact.html`. NAV active: Contact.

- [ ] **Step 1: Write `contact.html`** — HEAD-COMMON + NAV(active Contact) + FOOTER, body:

```html
<main class="wrap">
  <h1 class="page-title">Get in Touch</h1>

  <div class="card">
    <p>I'm always interested in research collaborations, speaking opportunities, and roles related to my research areas.</p>
    <p><b>Location:</b> Massachusetts, USA</p>
    <p><b>LinkedIn:</b> <a href="https://www.linkedin.com/in/josuemartinezmartinez/" target="_blank">josuemartinezmartinez</a></p>
  </div>

  <div class="sec-h">Send a message</div>
  <form class="form" action="https://formspree.io/f/mgoljkdg" method="POST">
    <div class="field"><label for="name">Your name *</label><input type="text" id="name" name="name" required></div>
    <div class="field"><label for="email">Your email *</label><input type="email" id="email" name="email" required></div>
    <div class="field"><label for="subject">Subject *</label><input type="text" id="subject" name="subject" required></div>
    <div class="field"><label for="message">Message *</label><textarea id="message" name="message" required></textarea></div>
    <button type="submit" class="btn">Send Message</button>
  </form>
  <p class="sub" style="margin-top:1.5rem">I typically respond within 2–3 business days.</p>

  <div class="sec-h" style="margin-top:3rem">Collaboration interests</div>
  <ul class="interests">
    <li><b>Agentic AI</b> — autonomous, tool-using systems and their reliability.</li>
    <li><b>World Models</b> — learned environment dynamics for perception and planning.</li>
    <li><b>AI Assurance</b> — trustworthy, robust AI under adversarial and distribution stress (adversarial ML, robustness to natural variation, uncertainty quantification, OOD generalization, self-supervised learning).</li>
  </ul>
</main>
```

- [ ] **Step 2: Verify** — `grep -c "formspree.io/f/mgoljkdg" contact.html` → expect 1 (form preserved).
- [ ] **Step 3: Commit** — `git add contact.html && git commit -m "Rebuild contact page; keep Formspree form"`

---

### Task 8: Rebuild `404.html`

**Files:**
- Replace: `404.html`

Per-page values: `__TITLE__` = `Page Not Found — Josué Martínez-Martínez`; `__DESC__` = `Page not found.`; `__OGURL__` = `https://martinez-hub.github.io/404.html`. NAV active: none.

- [ ] **Step 1: Write `404.html`** — HEAD-COMMON + NAV + FOOTER, body:

```html
<main class="wrap">
  <section class="center">
    <div class="big">404</div>
    <h1 class="page-title" style="margin:1rem 0">Page Not Found</h1>
    <p class="lead" style="margin:0 auto 2rem">The page you're looking for doesn't exist or has moved.</p>
    <a class="btn" href="index.html">Return Home</a>
  </section>
</main>
```

- [ ] **Step 2: Commit** — `git add 404.html && git commit -m "Rebuild 404 page in Paper design"`

---

### Task 9: Local verification (all pages, both themes, mobile)

**Files:** none (verification only)

- [ ] **Step 1: Serve locally**

```bash
cd /Users/josuemartinez/Documents/PersonalProjects/research-website
python3 -m http.server 8000 >/dev/null 2>&1 &
sleep 1
for p in index research publications contact 404; do
  curl -sS -o /dev/null -w "$p.html → HTTP %{http_code}\n" http://localhost:8000/$p.html
done
```
Expected: all HTTP 200.

- [ ] **Step 2: Asset checks**

```bash
curl -sS -o /dev/null -w "favicon.svg → %{http_code}\n" http://localhost:8000/assets/favicon.svg
curl -sS -o /dev/null -w "main.js → %{http_code}\n" http://localhost:8000/main.js
curl -sS -o /dev/null -w "style.css → %{http_code}\n" http://localhost:8000/style.css
```
Expected: all 200.

- [ ] **Step 3: Visual check via companion server** — push `http://localhost:8000/` pages through the brainstorm companion or open in browser. Confirm: light/dark toggle works and persists across navigation; mobile (≤760px) shows hamburger that opens/closes; no FOUC on reload in dark mode; contact form renders.

- [ ] **Step 4: Stop the server** — `kill %1 2>/dev/null || pkill -f "http.server 8000"`

- [ ] **Step 5: Commit any fixes** found during verification.

---

### Task 10: Restore hosting (make repo public) and verify live

**Files:** none (ops)

- [ ] **Step 1: Merge the branch to main** (after user review)

```bash
cd /Users/josuemartinez/Documents/PersonalProjects/research-website
git checkout main
git merge --no-ff redesign-paper -m "Modernize website: Paper design, content updates, favicon fix"
git push origin main
```

- [ ] **Step 2: Make the repository public**

```bash
gh repo edit martinez-hub/martinez-hub.github.io --visibility public --accept-visibility-change-consequences
```

- [ ] **Step 3: Wait for Pages rebuild, then verify live**

```bash
sleep 60
curl -sS -o /dev/null -w "live root → HTTP %{http_code}\n" -L https://martinez-hub.github.io/
```
Expected: HTTP 200 (retry after another 60s if still 404 — first rebuild after going public can lag).

- [ ] **Step 4: Confirm Pages status**

```bash
gh api repos/martinez-hub/martinez-hub.github.io/pages --jq '{status:.status, html_url:.html_url}'
```
Expected: `status: built`, URL reachable.

---

## Notes for the executor

- This is a static site; "verification" replaces unit tests (curl + grep + visual).
- Keep all external links byte-for-byte identical to the originals (publications especially).
- Do not commit anything under `.superpowers/` (already gitignored).
- The hosting step (Task 10) is outward-facing — only run after the user has reviewed the rebuilt site.

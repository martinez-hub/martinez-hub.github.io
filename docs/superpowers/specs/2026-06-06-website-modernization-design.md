# Research Website Modernization — Design Spec

**Date:** 2026-06-06
**Owner:** Josué Martínez-Martínez
**Repo:** `martinez-hub/martinez-hub.github.io` (GitHub Pages user site)

## 1. Goals

1. **Restore hosting.** The live site returns HTTP 404 because the repo is private; make it public so GitHub Pages serves it.
2. **Modernize the design** into a distinctive, production-grade look ("Paper" direction) while keeping the academic credibility expected by researchers and hiring managers.
3. **Update content** to reflect the new role (AI Research Engineer at Orbis Operations) and consolidated research areas.
4. **Fix correctness/perf issues** (2.2 MB favicon, mobile nav, dated palette).

Non-goals: changing the hosting platform, adding a build step/framework, or rewriting page content beyond what's specified here. The site stays static HTML/CSS + minimal vanilla JS.

## 2. Chosen design direction — "Paper"

Light-first editorial aesthetic with a matching dark theme.

- **Typography:** `Newsreader` (serif) for headings and body prose; `Inter` for nav, labels, and UI; `JetBrains Mono` for small mono micro-labels (eyebrows, dates). Loaded via Google Fonts with `preconnect`.
- **Accent:** Oxblood `#7a2e2e` (light) / warm brick `#d2796a` (dark).
- **Themes:** Light (warm paper `#f6f2ea`) and dark (warm near-black `#16140f`), driven by `data-theme` on `<html>` and CSS custom properties.
- **Hero:** Name-first — large name, role line (*AI Research Engineer, Orbis Operations*), sub-line (PhD, CSE · UConn), photo alongside, research-area tags, social links.
- **Layout:** `max-width: 1040px`, two-column About/News on the homepage, generous whitespace, ruled section dividers, sticky blurred nav.

Approved mockup of record: `.superpowers/brainstorm/.../content/mockups-v2.html` (homepage). It is the visual source of truth for tokens, spacing, and components.

## 3. Theming system

CSS custom properties defined under `:root[data-theme="light"]` and `:root[data-theme="dark"]`:

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f6f2ea` | `#16140f` |
| `--surface` | `#efe8da` | `#1e1b15` |
| `--surface-2` | `#ece4d5` | `#221e17` |
| `--text` | `#211e18` | `#ece7dd` |
| `--muted` | `#5e564a` | `#a99f8e` |
| `--faint` | `#9a8f7c` | `#7d7464` |
| `--line` | `#ddd3c2` | `#332e25` |
| `--accent` | `#7a2e2e` | `#d2796a` |

**Theme behavior:**
- An inline `<head>` script sets `data-theme` before first paint to avoid flash of wrong theme (FOUC). Order of precedence: saved choice in `localStorage` → `prefers-color-scheme` → light.
- Toggle button in the nav writes the choice to `localStorage` and updates the icon/label.
- This requires a small shared JS file (`theme.js`) included on every page.

## 4. Component inventory (shared across pages)

- **Nav:** brand (name) + links (About, Research, Publications, CV, Contact) + theme toggle. Sticky, blurred, bottom border.
- **Mobile nav:** below 760px, collapse the link list into a hamburger-toggled panel (replacing the current behavior where links just stack/center). Toggle is vanilla JS.
- **Hero** (home only).
- **Section heading** (`.sec-h`): mono uppercase label.
- **Tag chip** (`.tags span`).
- **Social link row.**
- **News item.**
- **Publication item / project item** (restyled to new tokens).
- **Footer:** copyright + meta line.

## 5. Per-page plan

### 5.1 `index.html` (Home)
Rebuild to match the approved mockup. Hero (name-first), three research tags **Agentic AI · World Models · AI Assurance**, About (updated bio), News (existing 3–4 items preserved with their real links).

**New bio:**
> I'm an **AI Research Engineer at Orbis Operations** and a recent PhD graduate in Computer Science & Engineering from the University of Connecticut. My work centers on AI systems that remain reliable under distribution shift and adversarial stress — spanning **agentic AI, world models, and AI assurance**.
>
> My doctoral research was conducted in collaboration with MIT Lincoln Laboratory and supported by competitive fellowships and grants from NSF, NASA, GEM, General Electric, and the University of Connecticut.

### 5.2 `research.html`
Keep the three detailed project write-ups (they are the substantive PhD body of work) restyled to the new design. Update the **"Research Interests"** list to lead with the consolidated framing while retaining substance:
- **Agentic AI** — (new direction)
- **World Models** — (new direction)
- **AI Assurance** — reliable, trustworthy AI under adversarial and distribution stress (umbrella covering the prior adversarial ML / robustness / uncertainty / OOD work)

The legacy granular bullets (adversarial ML, self-supervised learning, deepfake detection, uncertainty quantification, OOD generalization) fold under AI Assurance as supporting detail rather than a flat top-level list. **Decision point flagged for user review (§8).**

### 5.3 `publications.html`
Restyle only — content and grouping (Conference / Workshop / Abstracts / Journal / Thesis) preserved exactly, including all links. Improve typographic hierarchy and group headings to new tokens.

### 5.4 `contact.html`
Keep the working Formspree form (`formspree.io/f/mgoljkdg`), restyle inputs/buttons to new tokens (including dark-theme field styling). Reconcile the **"Collaboration Interests"** list with the new three-area framing (same approach as Research). Keep Location + LinkedIn.

### 5.5 `404.html`
Restyle to new tokens; keep the big "404" + Return Home CTA.

## 6. Asset & performance fixes

- **Favicon:** the current `assets/favicon.png` is **2.2 MB** — far too large. Generate a new **monogram favicon matching the Paper theme** (not the face): initials "JM" (or "J") in oxblood `#7a2e2e` on a warm paper `#f6f2ea` ground, set in the Newsreader/serif style. Produce an SVG favicon plus a 180×180 `apple-touch-icon` PNG; target < 20 KB total. Replace `assets/favicon.png` references accordingly.
- Keep `profile.jpg` (67 KB, fine).
- Remove the stray `2022-...MITLincolnLaboratory....JPG` (1.5 MB) from `assets/` if unused, or leave untouched if referenced elsewhere (verify first).
- Fonts: load only the weights actually used.

## 7. Hosting fix

- Make the repository **public**: `gh repo edit martinez-hub/martinez-hub.github.io --visibility public --accept-visibility-change-consequences`.
- Verify `https://martinez-hub.github.io/` returns HTTP 200 after the Pages rebuild.
- The `og:url` / `og:image` absolute URLs already point at the correct domain; keep them.

## 8. Resolved decisions

1. **Research/Collaboration interest lists** (§5.2, §5.4): **Resolved — Option A.** Collapse the legacy granular bullets under the three new areas (Agentic AI · World Models · AI Assurance), with prior work as supporting detail under AI Assurance.
2. **Favicon:** **Resolved.** Generate a new monogram favicon matching the Paper theme (oxblood-on-paper), not the face. See §6.

## 9. Testing / verification

- Visual check of all 5 pages in light and dark themes, desktop + mobile (≤760px), via local server.
- Theme persists across navigation and reload; no FOUC.
- Mobile hamburger opens/closes; all nav links work.
- Contact form still submits to Formspree.
- `curl -I https://martinez-hub.github.io/` → 200 after going public.
- Favicon file < 50 KB.

## 10. Out of scope / YAGNI

No CMS, no JS framework, no animations beyond the theme transition and simple hovers, no blog, no search.

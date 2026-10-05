# martinez-hub.github.io

Source for my personal research website, live at <https://martinez-hub.github.io>.

Static HTML and CSS with a small amount of vanilla JavaScript. No framework, no
build step, no dependencies.

## Pages

| File | Contents |
|---|---|
| `index.html` | Landing page: role, research areas, recent news |
| `research.html` | Research projects and interests |
| `publications.html` | Publications, grouped by type |
| `news.html` | Dated announcements |
| `contact.html` | Contact form and collaboration interests |
| `students.html` | Index for the four student guides |
| `students-setup.html` | Setting up a machine, per operating system |
| `students-learn.html` | What to learn, in order |
| `students-practice.html` | Engineering habits and running experiments |
| `students-skills.html` | Reading, writing and talks |
| `404.html` | Not-found page |

Everything else: `style.css` holds all styles, `main.js` all behavior,
`assets/` the favicon and profile image, and `cv/` the CV linked from the nav.

## What main.js does

- Light and dark theme toggle, remembered in `localStorage`. Each page sets its
  initial theme from an inline script in `<head>`, so the page never flashes the
  wrong one before the stylesheet applies.
- Mobile navigation.
- Per-operating-system tabs and a copy button on the shell samples, used by the
  setup and practice pages.
- Google Analytics 4 events for CV downloads and outbound links.

## Running it locally

Open `index.html` in a browser. Nothing to install, nothing to build.

Serving it over HTTP behaves more like production than `file://` does:

```bash
python3 -m http.server 8000
```

## Deploying

GitHub Pages builds from `main`, so a push to `main` publishes the site. There is
no staging branch: check a change locally before pushing it.

## Changing the colors

The palette lives in two blocks at the top of `style.css`,
`:root[data-theme="light"]` and `:root[data-theme="dark"]`, which share the
variables `--bg`, `--text`, `--line` and `--grain`. Change both, or one theme
will look wrong.

## License

Feel free to reuse this code for your own website. No attribution required.

## Questions

Open an issue.

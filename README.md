# Personal Research Website

A clean, minimal academic website template for showcasing research, publications, and facilitating collaborations.

## 🎨 Features

- **Clean & Minimal Design** - Professional academic aesthetic
- **Responsive** - Works on desktop, tablet, and mobile
- **Fast Loading** - Static HTML/CSS, no JavaScript required
- **Easy to Customize** - Simple HTML structure with CSS variables
- **GitHub Pages Ready** - Deploy for free in minutes

## 📁 Structure

```
research-website/
├── index.html          # Home page with About section
├── research.html       # Research projects
├── publications.html   # Publications list
├── contact.html        # Contact information
├── style.css          # All styles
└── README.md          # This file
```

## 🚀 Quick Start

### Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. Edit the HTML files to add your content
4. Customize colors in `style.css` (see CSS variables in `:root`)

### Deploy to GitHub Pages

1. Create a new GitHub repository named `yourusername.github.io`
2. Push this code to the repository:
   ```bash
   git add .
   git commit -m "Initial commit: Personal research website"
   git push origin main
   ```
3. Go to repository Settings → Pages
4. Under "Source", select "Deploy from a branch"
5. Select branch `main` and folder `/ (root)`
6. Click Save
7. Your site will be live at `https://yourusername.github.io`

## ✏️ Customization Guide

### 1. Update Personal Information

Search for placeholders and replace:
- `[Your Name]` - Your full name
- `[Your Field]` - Your research field
- `[Your University]` - Your institution
- `[Your Research Area]` - Brief research description
- `your.email@example.com` - Your email
- `yourusername` - Your GitHub/LinkedIn username

### 2. Customize Colors

Edit CSS variables in `style.css`:

```css
:root {
    --primary-color: #2c3e50;    /* Main headings */
    --accent-color: #3498db;     /* Links and highlights */
    --text-color: #333;          /* Body text */
    /* ... */
}
```

### 3. Add Your Content

- **About section**: Edit `index.html` hero and about sections
- **Research projects**: Edit `research.html`
- **Publications**: Edit `publications.html`
- **Contact info**: Edit `contact.html`

### 4. Add Your CV

Create a `cv.pdf` file and update the CV link in navigation to `href="cv.pdf"`.

## 📱 Testing Responsive Design

Test on different screen sizes:
- Desktop: 1920px wide
- Tablet: 768px wide
- Mobile: 375px wide

Or use browser DevTools (F12) → Toggle device toolbar.

## 🔧 Advanced Customization

### Add Google Analytics

Add before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Custom Domain

1. Buy a domain (e.g., yourname.com)
2. Add a `CNAME` file with your domain:
   ```bash
   echo "yourname.com" > CNAME
   git add CNAME && git commit -m "Add custom domain" && git push
   ```
3. Configure DNS with your domain provider (see [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))

## 📄 License

Feel free to use this template for your own website. No attribution required.

## 🤝 Support

If you have questions or need help customizing, open an issue on GitHub.

---

Built with ❤️ for researchers by researchers.

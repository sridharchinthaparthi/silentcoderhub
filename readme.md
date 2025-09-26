# Jekyll-Style Blog Template - Setup Guide

## Directory Structure

```
your-blog/
├── index.html          # Main blog page
├── style.css           # Main stylesheet
├── script.js           # Main JavaScript file
├── posts/              # Directory for all blog posts
│   ├── getting-started-modern-web-development.html
│   ├── understanding-javascript-async-await.html
│   ├── css-grid-vs-flexbox-when-to-use.html
│   └── [your-daily-posts].html
├── assets/             # Static assets (optional)
│   ├── images/
│   └── icons/
└── README.md           # This file
```

## How to Add Daily Posts

### 1. Create Your Daily Post File

1. Copy the `post-template.html` file
2. Rename it with your post slug (e.g., `my-topic-2025-09-24.html`)
3. Place it in the `posts/` directory

### 2. Update Post Content

Edit your new post file and update:

- **Title**: Update `<title>` tag and `.post-title`
- **Meta Description**: Update the meta description
- **Post Metadata**: Update date, author, category, reading time
- **Tags**: Update the tags in `.post-tags`
- **Content**: Replace everything between `<!-- START OF YOUR CONTENT -->` and `<!-- END OF YOUR CONTENT -->`

### 3. Update the Main Index

To make your new post appear on the main page, you need to update the `script.js` file:

1. Open `script.js`
2. Find the `getSamplePosts()` function
3. Add your new post data at the beginning of the array:

```javascript
{
    id: 'post-2025-09-24',
    title: 'Your New Post Title',
    excerpt: 'Brief description of your post content...',
    content: '',
    date: '2025-09-24',
    category: 'Your Category',
    tags: ['Tag1', 'Tag2', 'Tag3'],
    author: 'Admin',
    readTime: '5 min',
    slug: 'your-new-post-slug'
}
```

## Post Template Variables

When creating a new post, update these elements in your HTML:

### HTML Head Section
```html
<title>Your Post Title - Daily Tech Blog</title>
<meta name="description" content="Your post description">
```

### Post Header
```html
<h1 class="post-title">Your Post Title Here</h1>
<p class="post-subtitle">A brief subtitle</p>

<!-- Update meta information -->
<span>September 24, 2025</span>  <!-- Date -->
<span>8 min read</span>          <!-- Reading time -->
<span>Author Name</span>         <!-- Author -->
<span>Category Name</span>       <!-- Category -->

<!-- Update tags -->
<div class="post-tags">
    <a href="#" class="tag">Tag1</a>
    <a href="#" class="tag">Tag2</a>
</div>
```

### Post Navigation
```html
<!-- Update previous/next post links -->
<a href="previous-post-slug.html" class="nav-link prev">
    <!-- Previous post info -->
</a>
<a href="next-post-slug.html" class="nav-link next">
    <!-- Next post info -->
</a>
```

## Content Writing Guidelines

### Supported HTML Elements

- **Headings**: `<h2>`, `<h3>` (h1 is reserved for post title)
- **Paragraphs**: `<p>`
- **Lists**: `<ul>`, `<ol>`, `<li>`
- **Blockquotes**: `<blockquote>`
- **Code**: `<code>` for inline, `<pre><code>` for blocks
- **Images**: `<img>` (automatically styled)
- **Links**: `<a>`

### Example Content Structure

```html
<h2>Main Section</h2>
<p>Your paragraph content...</p>

<h3>Subsection</h3>
<ul>
    <li>List item 1</li>
    <li>List item 2</li>
</ul>

<blockquote>
    Important quote or highlight
</blockquote>

<pre><code>// Code example
function example() {
    return "Hello World";
}
</code></pre>
```

## Customization Options

### Colors & Theming
Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #2c3e50;      /* Main brand color */
    --secondary-color: #3498db;    /* Accent color */
    --accent-color: #e74c3c;       /* Highlight color */
    --text-color: #2c3e50;         /* Main text */
    --text-light: #7f8c8d;         /* Secondary text */
    --background: #ffffff;         /* Main background */
    --background-light: #f8f9fa;   /* Light background */
    --border-color: #e9ecef;       /* Border color */
}
```

### Blog Information
Update these in `index.html`:

```html
<!-- Blog title and description -->
<a href="/" class="logo">Your Blog Name</a>
<h1>Your Blog Title</h1>
<p>Your blog description</p>

<!-- About section -->
<div class="widget">
    <h3>About</h3>
    <p class="about-text">Your about text...</p>
</div>
```

## Deployment

### Option 1: GitHub Pages
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Your blog will be available at `username.github.io/repository-name`

### Option 2: Netlify
1. Create a Netlify account
2. Drag and drop your blog folder
3. Your blog will be deployed automatically

### Option 3: Traditional Web Hosting
1. Upload all files to your web server
2. Ensure the directory structure is maintained
3. Access via your domain

## Daily Workflow

1. **Create new post**: Copy `post-template.html` → rename → edit content
2. **Update index**: Add post data to `script.js`
3. **Test locally**: Open `index.html` in browser
4. **Deploy**: Push to your hosting platform

## Advanced Features

### Auto-generating Post Data
For automation, you could create a simple Node.js script to:
- Scan the `posts/` directory
- Extract metadata from HTML files
- Generate the posts array for `script.js`

### RSS Feed
Add an `rss.xml` file for RSS feed functionality.

### Search Enhancement
The current search works with the loaded post data. For better search, consider:
- Full-text indexing
- Search highlighting
- Advanced filters

## Troubleshooting

### Posts Not Appearing
- Check that post data is added to `getSamplePosts()` in `script.js`
- Verify the slug matches the filename
- Ensure proper date format (YYYY-MM-DD)

### Styling Issues
- Check CSS file is properly linked
- Verify CSS class names match
- Clear browser cache

### Mobile Issues
- The template is responsive by default
- Test on different screen sizes
- Check viewport meta tag is present

## File Templates

### Quick Post Template (Minimal)
```html
<!-- Copy post-template.html and update these sections -->
1. Title and meta tags
2. Post header information
3. Content between START/END comments
4. Navigation links
```

### Post Data Template
```javascript
{
    id: 'post-YYYY-MM-DD',
    title: 'Your Post Title',
    excerpt: 'Brief description (150-200 chars)',
    content: '',
    date: 'YYYY-MM-DD',
    category: 'Category Name',
    tags: ['tag1', 'tag2', 'tag3'],
    author: 'Your Name',
    readTime: 'X min',
    slug: 'post-file-name-without-extension'
}
```

This setup gives you a professional, Jekyll-like blog system that's easy to maintain and deploy!
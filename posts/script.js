// Blog Configuration
const BLOG_CONFIG = {
    postsPerPage: 5,
    postsDirectory: './posts/',
    maxRecentPosts: 5,
    maxPopularTags: 10
};

// Global Variables
let allPosts = [];
let displayedPosts = [];
let currentPage = 0;
let isLoading = false;

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const noPostsDiv = document.getElementById('noPosts');
const backToTopBtn = document.getElementById('backToTop');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const subscribeForm = document.getElementById('subscribeForm');

// Initialize the blog when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeBlog();
    setupEventListeners();
});

// Initialize Blog
async function initializeBlog() {
    showLoadingSkeleton();
    await loadAllPosts();
    hideLoadingSkeleton();
    displayPosts();
    updateSidebar();
    updateStats();
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchBtn.addEventListener('click', handleSearch);
    
    // Load more posts
    loadMoreBtn.addEventListener('click', loadMorePosts);
    
    // Mobile navigation
    hamburger.addEventListener('click', toggleMobileMenu);
    
    // Back to top button
    window.addEventListener('scroll', handleScroll);
    backToTopBtn.addEventListener('click', scrollToTop);
    
    // Subscribe form
    subscribeForm.addEventListener('submit', handleSubscription);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
    
    // Tag and category filtering
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag') || e.target.classList.contains('category-item')) {
            e.preventDefault();
            const filterTerm = e.target.textContent.trim().replace(/\d+$/, '').trim(); // Remove count numbers
            searchInput.value = filterTerm;
            handleSearch();
        }
    });
}

// Load all posts from actual HTML files
async function loadAllPosts() {
    try {
        // First try to load from a posts index file
        const posts = await fetchPostsFromIndex();
        if (posts.length > 0) {
            allPosts = posts;
            console.log(`Loaded ${allPosts.length} posts from index`);
            return;
        }
        
        // Fallback: try to discover posts
        allPosts = await discoverPosts();
        console.log(`Discovered ${allPosts.length} posts`);
        
    } catch (error) {
        console.error('Error loading posts:', error);
        allPosts = getSamplePosts(); // Final fallback to sample data
        console.log('Using sample posts as fallback');
    }
}

// Try to fetch posts from a posts.json index file
async function fetchPostsFromIndex() {
    try {
        const response = await fetch('./posts/posts.json');
        if (response.ok) {
            const postsData = await response.json();
            return postsData.posts || [];
        }
    } catch (error) {
        console.log('No posts.json found, trying post discovery...');
    }
    return [];
}

// Discover posts by trying known filenames and parsing HTML
async function discoverPosts() {
    const knownPosts = [
        'what-exactly-is-a-computer'
    ];
    
    const posts = [];
    
    for (const slug of knownPosts) {
        try {
            const postData = await loadAndParsePost(slug);
            if (postData) {
                posts.push(postData);
            }
        } catch (error) {
            console.log(`Could not load post: ${slug}`);
        }
    }
    
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Load and parse individual post HTML file
async function loadAndParsePost(slug) {
    try {
        const response = await fetch(`./posts/${slug}.html`);
        if (!response.ok) throw new Error('Post not found');
        
        const html = await response.text();
        return parsePostHTML(html, slug);
    } catch (error) {
        console.error(`Error loading post ${slug}:`, error);
        return null;
    }
}

// Parse HTML to extract metadata
function parsePostHTML(html, slug) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to extract metadata from various sources
    const title = extractTitle(doc);
    const excerpt = extractExcerpt(doc);
    const date = extractDate(doc, slug);
    const category = extractCategory(doc);
    const tags = extractTags(doc);
    
    return {
        id: `post-${slug}`,
        title: title,
        excerpt: excerpt,
        content: html,
        date: date,
        category: category,
        tags: tags,
        author: 'SilentCoderHub',
        readTime: calculateReadTime(doc.body.textContent || ''),
        slug: slug
    };
}

// Extract title from HTML
function extractTitle(doc) {
    // Try different selectors
    const titleEl = doc.querySelector('h1') || 
                   doc.querySelector('title') || 
                   doc.querySelector('.post-title') ||
                   doc.querySelector('.title');
    
    if (titleEl) {
        return titleEl.textContent.trim();
    }
    
    return 'Untitled Post';
}

// Extract excerpt from HTML
function extractExcerpt(doc) {
    // Try to find excerpt in meta tag or first paragraph
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
        return metaDesc.getAttribute('content');
    }
    
    const firstP = doc.querySelector('p');
    if (firstP) {
        let text = firstP.textContent.trim();
        if (text.length > 200) {
            text = text.substring(0, 200) + '...';
        }
        return text;
    }
    
    return 'No excerpt available.';
}

// Extract date from HTML or filename
function extractDate(doc, slug) {
    // Try to find date in meta tag
    const metaDate = doc.querySelector('meta[name="date"]') || 
                    doc.querySelector('meta[property="article:published_time"]');
    
    if (metaDate) {
        return metaDate.getAttribute('content');
    }
    
    // Try to extract from filename if it contains date pattern
    const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
        return dateMatch[1];
    }
    
    // Default to today's date
    return new Date().toISOString().split('T')[0];
}

// Extract category from HTML
function extractCategory(doc) {
    const metaCat = doc.querySelector('meta[name="category"]');
    if (metaCat) {
        return metaCat.getAttribute('content');
    }
    
    // Try to find in content
    const catEl = doc.querySelector('.category') || doc.querySelector('.post-category');
    if (catEl) {
        return catEl.textContent.trim();
    }
    
    return 'General';
}

// Extract tags from HTML
function extractTags(doc) {
    const metaTags = doc.querySelector('meta[name="keywords"]');
    if (metaTags) {
        return metaTags.getAttribute('content').split(',').map(tag => tag.trim());
    }
    
    // Try to find tag elements
    const tagElements = doc.querySelectorAll('.tag, .post-tag');
    if (tagElements.length > 0) {
        return Array.from(tagElements).map(el => el.textContent.trim());
    }
    
    return ['Blog'];
}

// Calculate reading time
function calculateReadTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

// Sample posts data (fallback)
function getSamplePosts() {
    return [
        {
            id: 'post-what-exactly-is-a-computer',
            title: 'What Exactly is a Computer? Understanding the Essentials',
            excerpt: 'Ever wondered what defines a computer? Let\'s dive into its core functions, key features, and its remarkable place in both work and life. From simple devices to powerful companions.',
            content: '',
            date: '2025-09-23',
            category: 'Computer Basics',
            tags: ['Computer Science', 'Technology', 'Hardware', 'Basics'],
            author: 'SilentCoderHub',
            readTime: '6 min read',
            slug: 'what-exactly-is-a-computer'
        },
        {
            id: 'post-sample-2',
            title: 'Getting Started with Web Development',
            excerpt: 'A comprehensive guide to beginning your journey in web development. Learn about HTML, CSS, JavaScript, and modern frameworks.',
            content: '',
            date: '2025-09-20',
            category: 'Web Development',
            tags: ['HTML', 'CSS', 'JavaScript', 'Frontend'],
            author: 'SilentCoderHub',
            readTime: '8 min read',
            slug: 'getting-started-web-development'
        },
        {
            id: 'post-sample-3',
            title: 'Understanding JavaScript Closures',
            excerpt: 'Dive deep into one of JavaScript\'s most powerful features. Learn how closures work and how to use them effectively in your code.',
            content: '',
            date: '2025-09-18',
            category: 'Programming',
            tags: ['JavaScript', 'Programming Concepts', 'Functions'],
            author: 'SilentCoderHub',
            readTime: '10 min read',
            slug: 'understanding-javascript-closures'
        }
    ];
}

// Display posts on the page
function displayPosts(posts = null) {
    const postsToShow = posts || allPosts;
    const startIndex = currentPage * BLOG_CONFIG.postsPerPage;
    const endIndex = startIndex + BLOG_CONFIG.postsPerPage;
    
    if (posts) {
        // If filtering, show all filtered posts
        displayedPosts = postsToShow;
        currentPage = 0;
    } else {
        // Normal pagination
        displayedPosts = allPosts.slice(0, endIndex);
    }
    
    if (displayedPosts.length === 0) {
        showNoPostsMessage();
        return;
    }
    
    hideNoPostsMessage();
    renderPosts(displayedPosts);
    updateLoadMoreButton(posts ? postsToShow : allPosts);
}

// Render posts in the container
function renderPosts(posts) {
    postsContainer.innerHTML = '';
    
    posts.forEach((post, index) => {
        const postElement = createPostElement(post);
        postElement.style.animationDelay = `${index * 0.1}s`;
        postsContainer.appendChild(postElement);
    });
}

// Create individual post element
function createPostElement(post) {
    const postDiv = document.createElement('article');
    postDiv.className = 'post-card fade-in';
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-meta">
                <span class="post-date">${formatDate(post.date)}</span>
                <span><i class="fas fa-clock"></i> ${post.readTime}</span>
                <span><i class="fas fa-user"></i> ${post.author}</span>
                <a href="#" class="post-category">${post.category}</a>
            </div>
            <h2 class="post-title">
                <a href="posts/${post.slug}.html"  rel="noopener">${post.title}</a>
            </h2>
            <p class="post-excerpt">${post.excerpt}</p>
        </div>
        <div class="post-footer">
            <a href="posts/${post.slug}.html"  rel="noopener" class="read-more">
                Read More <i class="fas fa-arrow-right"></i>
            </a>
            <div class="post-tags">
                ${post.tags.map(tag => `<a href="#" class="tag">${tag}</a>`).join('')}
            </div>
        </div>
    `;
    return postDiv;
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        currentPage = 0;
        displayPosts();
        return;
    }
    
    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.category.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    displayPosts(filteredPosts);
}

// Load more posts
function loadMorePosts() {
    if (isLoading) return;
    
    isLoading = true;
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
        currentPage++;
        displayPosts();
        isLoading = false;
        loadMoreBtn.textContent = 'Load More Posts';
        loadMoreBtn.disabled = false;
    }, 500);
}

// Update load more button visibility
function updateLoadMoreButton(posts) {
    const totalPosts = posts.length;
    const displayedCount = displayedPosts.length;
    
    if (displayedCount >= totalPosts) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Update sidebar content
function updateSidebar() {
    updateRecentPosts();
    updateCategories();
    updateTags();
}

// Update recent posts in sidebar
function updateRecentPosts() {
    const recentPostsList = document.getElementById('recentPostsList');
    const recentPosts = allPosts.slice(0, BLOG_CONFIG.maxRecentPosts);
    
    recentPostsList.innerHTML = recentPosts.map(post => `
        <li>
            <a href="posts/${post.slug}.html"  rel="noopener">${post.title}</a>
            <span class="recent-date">${formatDate(post.date)}</span>
        </li>
    `).join('');
}

// Update categories in sidebar
function updateCategories() {
    const categoryList = document.getElementById('categoryList');
    const categories = {};
    
    allPosts.forEach(post => {
        categories[post.category] = (categories[post.category] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);
    
    categoryList.innerHTML = sortedCategories.map(([category, count]) => `
        <a href="#" class="category-item">
            <span>${category}</span>
            <span class="category-count">${count}</span>
        </a>
    `).join('');
}

// Update tags in sidebar
function updateTags() {
    const tagsList = document.getElementById('tagsList');
    const tags = {};
    
    allPosts.forEach(post => {
        post.tags.forEach(tag => {
            tags[tag] = (tags[tag] || 0) + 1;
        });
    });
    
    const sortedTags = Object.entries(tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, BLOG_CONFIG.maxPopularTags);
    
    tagsList.innerHTML = sortedTags.map(([tag]) => `
        <a href="#" class="tag">${tag}</a>
    `).join('');
}

// Update blog statistics
function updateStats() {
    const totalPostsEl = document.getElementById('totalPosts');
    const thisMonthEl = document.getElementById('thisMonth');
    
    totalPostsEl.textContent = allPosts.length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthCount = allPosts.filter(post => {
        const postDate = new Date(post.date);
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
    }).length;
    
    thisMonthEl.textContent = thisMonthCount;
}

// Mobile menu toggle
function toggleMobileMenu() {
    navLinks.classList.toggle('active');
}

// Handle scroll events
function handleScroll() {
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Handle subscription form
function handleSubscription(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    
    button.textContent = 'Subscribing...';
    button.disabled = true;
    
    setTimeout(() => {
        alert(`Thank you for subscribing with ${email}! 🎉`);
        e.target.reset();
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}

// Show/hide loading skeleton
function showLoadingSkeleton() {
    postsContainer.innerHTML = Array(3).fill().map(() => 
        '<div class="skeleton skeleton-post"></div>'
    ).join('');
}

function hideLoadingSkeleton() {
    const skeletons = document.querySelectorAll('.skeleton-post');
    skeletons.forEach(skeleton => skeleton.remove());
}

// Show/hide no posts message
function showNoPostsMessage() {
    noPostsDiv.style.display = 'block';
    loadMoreBtn.style.display = 'none';
}

function hideNoPostsMessage() {
    noPostsDiv.style.display = 'none';
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to manually add posts to the known posts list
function addKnownPost(slug) {
    // This function can be called when you add a new post
    // It will attempt to load the post immediately
    loadAndParsePost(slug).then(postData => {
        if (postData) {
            allPosts.unshift(postData);
            allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            currentPage = 0;
            displayPosts();
            updateSidebar();
            updateStats();
            console.log(`Added new post: ${postData.title}`);
        }
    });
}

// Function to refresh posts (useful for development)
function refreshPosts() {
    console.log('Refreshing posts...');
    initializeBlog();
}

// Expose functions for debugging/development
window.blogDebug = {
    addKnownPost,
    refreshPosts,
    loadAndParsePost,
    allPosts: () => allPosts,
    displayedPosts: () => displayedPosts
};

// Detect if current page is inside /posts/ folder
const pathPrefix = window.location.pathname.includes("/posts/") ? "../" : "";

// Load header
fetch(pathPrefix + "header.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("header").innerHTML = data;

        // ✅ Fix links if inside posts/
        if (pathPrefix === "../") {
            document.querySelectorAll('#header a').forEach(link => {
                const href = link.getAttribute("href");
                if (href && !href.startsWith("http") && !href.startsWith("#")) {
                    link.setAttribute("href", pathPrefix + href);
                }
            });
        }

        // ✅ Hamburger toggle
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    });

// Load footer
fetch(pathPrefix + "footer.html")
    .then(res => res.text())
    .then(data => document.getElementById("footer").innerHTML = data);


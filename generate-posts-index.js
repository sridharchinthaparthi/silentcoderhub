#!/usr/bin/env node

/**
 * Post Indexer Script for SilentCoderHub Blog
 * 
 * This script automatically scans the posts directory and generates
 * a posts.json file with metadata extracted from HTML files.
 * 
 * Usage: node generate-posts-index.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const POSTS_DIR = path.join(__dirname, 'posts');
const OUTPUT_FILE = path.join(POSTS_DIR, 'posts.json');

// Configuration
const CONFIG = {
    author: 'SilentCoderHub',
    wordsPerMinute: 200,
    defaultCategory: 'General',
    defaultTags: ['Blog']
};

/**
 * Extract metadata from HTML file
 */
function extractMetadata(htmlContent, filename) {
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;
    
    // Extract slug from filename
    const slug = path.basename(filename, '.html');
    
    // Extract title
    const titleEl = doc.querySelector('h1, .post-title-main, title');
    const title = titleEl ? titleEl.textContent.trim() : 'Untitled Post';
    
    // Extract excerpt from meta description or first paragraph
    let excerpt = '';
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
        excerpt = metaDesc.getAttribute('content');
    } else {
        const firstP = doc.querySelector('.post-content p, p');
        if (firstP) {
            excerpt = firstP.textContent.trim();
            if (excerpt.length > 200) {
                excerpt = excerpt.substring(0, 200) + '...';
            }
        }
    }
    
    // Extract date
    let date = new Date().toISOString().split('T')[0]; // Default to today
    const metaDate = doc.querySelector('meta[name="date"], meta[property="article:published_time"]');
    if (metaDate) {
        date = metaDate.getAttribute('content').split('T')[0]; // Remove time if present
    } else {
        // Try to extract from filename pattern
        const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            date = dateMatch[1];
        }
    }
    
    // Extract category
    let category = CONFIG.defaultCategory;
    const metaCat = doc.querySelector('meta[name="category"]');
    if (metaCat) {
        category = metaCat.getAttribute('content');
    } else {
        const catEl = doc.querySelector('.post-category');
        if (catEl) {
            category = catEl.textContent.replace(/.*\s/, '').trim(); // Remove icon text
        }
    }
    
    // Extract tags
    let tags = [...CONFIG.defaultTags];
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        tags = metaKeywords.getAttribute('content')
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    } else {
        // Try to find tag elements
        const tagElements = doc.querySelectorAll('.tag, .post-tag');
        if (tagElements.length > 0) {
            tags = Array.from(tagElements).map(el => el.textContent.trim());
        }
    }
    
    // Calculate reading time
    const content = doc.body.textContent || '';
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readTime = Math.max(1, Math.ceil(wordCount / CONFIG.wordsPerMinute));
    
    // Extract author
    let author = CONFIG.author;
    const metaAuthor = doc.querySelector('meta[name="author"]');
    if (metaAuthor) {
        author = metaAuthor.getAttribute('content');
    }
    
    return {
        id: `post-${slug}`,
        title,
        excerpt: excerpt || 'No excerpt available.',
        date,
        category,
        tags,
        author,
        readTime: `${readTime} min read`,
        slug,
        wordCount,
        lastModified: new Date().toISOString()
    };
}

/**
 * Scan posts directory and generate index
 */
async function generatePostsIndex() {
    try {
        console.log('🔍 Scanning posts directory...');
        
        // Check if posts directory exists
        if (!fs.existsSync(POSTS_DIR)) {
            console.error('❌ Posts directory not found:', POSTS_DIR);
            return;
        }
        
        // Read all HTML files in posts directory
        const files = fs.readdirSync(POSTS_DIR)
            .filter(file => file.endsWith('.html'))
            .sort();
        
        if (files.length === 0) {
            console.log('⚠️  No HTML files found in posts directory');
            return;
        }
        
        console.log(`📄 Found ${files.length} post files:`, files.map(f => `  - ${f}`).join('\n'));
        
        const posts = [];
        const categories = new Set();
        const tags = new Set();
        
        // Process each HTML file
        for (const file of files) {
            try {
                const filePath = path.join(POSTS_DIR, file);
                const htmlContent = fs.readFileSync(filePath, 'utf8');
                
                const metadata = extractMetadata(htmlContent, file);
                posts.push(metadata);
                
                // Collect categories and tags
                categories.add(metadata.category);
                metadata.tags.forEach(tag => tags.add(tag));
                
                console.log(`✅ Processed: ${metadata.title}`);
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
        
        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Create the index data structure
        const indexData = {
            generated: new Date().toISOString(),
            totalPosts: posts.length,
            posts: posts,
            categories: Array.from(categories).sort().map(cat => ({
                name: cat,
                count: posts.filter(p => p.category === cat).length,
                description: `Posts about ${cat}`
            })),
            tags: Array.from(tags).sort().map(tag => ({
                name: tag,
                count: posts.filter(p => p.tags.includes(tag)).length
            })),
            stats: {
                totalWords: posts.reduce((sum, post) => sum + (post.wordCount || 0), 0),
                averageReadTime: Math.round(posts.reduce((sum, post) => {
                    const minutes = parseInt(post.readTime);
                    return sum + minutes;
                }, 0) / posts.length),
                latestPost: posts[0]?.date,
                oldestPost: posts[posts.length - 1]?.date
            }
        };
        
        // Write the index file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2), 'utf8');
        
        console.log('\n🎉 Successfully generated posts index!');
        console.log(`📊 Statistics:`);
        console.log(`   - Total posts: ${indexData.totalPosts}`);
        console.log(`   - Categories: ${indexData.categories.length}`);
        console.log(`   - Tags: ${indexData.tags.length}`);
        console.log(`   - Total words: ${indexData.stats.totalWords.toLocaleString()}`);
        console.log(`   - Average read time: ${indexData.stats.averageReadTime} minutes`);
        console.log(`📁 Index saved to: ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('❌ Error generating posts index:', error);
    }
}

/**
 * Watch for changes in posts directory (optional)
 */
function watchPostsDirectory() {
    if (!fs.existsSync(POSTS_DIR)) {
        console.log('Posts directory does not exist, skipping watch mode');
        return;
    }
    
    console.log('👀 Watching posts directory for changes...');
    
    fs.watch(POSTS_DIR, { recursive: false }, (eventType, filename) => {
        if (filename && filename.endsWith('.html')) {
            console.log(`📝 Detected change in ${filename}, regenerating index...`);
            setTimeout(generatePostsIndex, 1000); // Debounce
        }
    });
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--watch') || args.includes('-w')) {
        generatePostsIndex().then(() => {
            watchPostsDirectory();
        });
    } else {
        generatePostsIndex();
    }
}

module.exports = {
    generatePostsIndex,
    extractMetadata
};
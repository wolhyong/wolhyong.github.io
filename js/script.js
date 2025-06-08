// Main JavaScript for the blog
console.log("JavaScript file loaded");

// SVG Icons for Theme Toggle with hardcoded colors
const sunIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon" fill="#FFD700"><path d="M12 17.25a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3a.75.75 0 01.75-.75zM12 3.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0112 3.75zM5.096 6.562a.75.75 0 011.061 0l2.121 2.121a.75.75 0 01-1.06 1.061L5.096 7.622a.75.75 0 010-1.06zm11.787 9.799a.75.75 0 011.06 0l2.122 2.121a.75.75 0 01-1.06 1.06l-2.121-2.12a.75.75 0 010-1.061zM20.25 12a.75.75 0 01-.75.75h-3a.75.75 0 010-1.5h3a.75.75 0 01.75.75zM3.75 12a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3A.75.75 0 013.75 12zM6.157 17.843a.75.75 0 010-1.06l2.121-2.122a.75.75 0 011.06 1.06l-2.121 2.122a.75.75 0 01-1.06 0zm10.626-11.787a.75.75 0 010-1.06l2.121-2.121a.75.75 0 011.061 1.06l-2.121 2.121a.75.75 0 01-1.06 0zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>';
const moonIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="theme-icon" fill="#8A2BE2"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6.75a8.969 8.969 0 008.968 8.968 8.97 8.97 0 005.231-.69a.75.75 0 01.82.162.75.75 0 01.161.819A10.473 10.473 0 0118 18.75a10.473 10.473 0 01-10.473-10.473A10.47 10.47 0 015.231 7.522a.75.75 0 01.162-.82zM16.5 9.75a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V10.5a.75.75 0 01.75-.75z" clip-rule="evenodd"/></svg>';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('post-list')) { // This implies we are on index.html
        fetchPostsAndEnableSearch();
    }

    if (document.getElementById('post-content')) { // This implies we are on post.html
        loadPost();
    }

    if (document.getElementById('progress-bar')) {
        window.addEventListener('scroll', updateReadingProgressBar);
        updateReadingProgressBar();
    }
});

// --- Theme Toggle Logic ---
const themeToggleButton = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if(themeToggleButton) themeToggleButton.innerHTML = sunIconSVG;
    } else {
        document.body.classList.remove('dark-mode');
        if(themeToggleButton) themeToggleButton.innerHTML = moonIconSVG;
    }
}

const currentTheme = localStorage.getItem('theme');
applyTheme(currentTheme || 'light');

if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// --- Client-Side Search Logic (for index.html) ---
let allPostsData = [];

async function fetchPostsAndEnableSearch() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allPostsData = await response.json();
        renderPosts(allPostsData);

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredPosts = allPostsData.filter(post =>
                    (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                    (post.description && post.description.toLowerCase().includes(searchTerm))
                );
                renderPosts(filteredPosts, searchTerm);
            });
        }
    } catch (error) {
        console.error('Error fetching posts for search:', error);
        const postList = document.getElementById('post-list');
        if (postList) postList.innerHTML = '<li>Error loading posts.</li>';
    }
}

function renderPosts(postsToRender, searchTerm = "") {
    const postList = document.getElementById('post-list');
    const blogPostsHeading = document.getElementById('blog-posts-heading');

    if (!postList) return;
    postList.innerHTML = '';
    postList.className = 'post-card-grid';

    if (postsToRender.length === 0) {
        postList.innerHTML = `<p class="no-results">No posts found${searchTerm ? ` matching "${searchTerm}"` : ''}.</p>`;
        if (blogPostsHeading) blogPostsHeading.textContent = searchTerm ? "Search Results" : "Blog Posts";
        return;
    }

    if (blogPostsHeading) {
        blogPostsHeading.textContent = searchTerm ? `Search Results for "${searchTerm}"` : "Blog Posts";
    }

    postsToRender.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        const cardLink = document.createElement('a');
        cardLink.href = `post.html?post=${post.file}`;
        cardLink.className = 'post-card-link';
        const cardTitle = document.createElement('h3');
        cardTitle.className = 'post-card-title';
        cardTitle.textContent = post.title;
        cardLink.appendChild(cardTitle);
        if (post.description) {
            const cardDescription = document.createElement('p');
            cardDescription.className = 'post-card-description';
            cardDescription.textContent = post.description;
            cardLink.appendChild(cardDescription);
        }
        const cardDate = document.createElement('small');
        cardDate.className = 'post-card-date';
        cardDate.textContent = `Published: ${post.datePublished || post.date}`;
        cardLink.appendChild(cardDate);
        card.appendChild(cardLink);
        postList.appendChild(card);
    });
}

// --- Single Post Page Logic (post.html) ---
async function loadPost() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postFile = urlParams.get('post');
        const postContentElement = document.getElementById('post-content');

        if (!postFile) {
            postContentElement.innerHTML = '<p>No post specified.</p>';
            return;
        }
        if (postFile.includes('..') || postFile.startsWith('/')) {
            postContentElement.innerHTML = '<p>Invalid post path.</p>';
            return;
        }

        const response = await fetch(`posts/${postFile}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const markdown = await response.text();

        if (typeof marked === 'undefined') {
            console.error('marked.js library is not loaded.');
            postContentElement.innerHTML = '<p>Error: Markdown parser not loaded.</p>';
            return;
        }

        const renderer = new marked.Renderer();
        renderer.heading = function (text, level) {
            const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            return `<h${level} id="${escapedText}">${text}</h${level}>`;
        };
        const htmlContent = marked.parse(markdown, { renderer: renderer });
        postContentElement.innerHTML = htmlContent;

        generateTableOfContents(postContentElement);

        const postData = await getPostData(postFile);

        document.title = (postData?.title || postContentElement.querySelector('h1')?.textContent || "Blog Post") + " | My Coding Blog";
        updateMetaDescription(postData?.description || (postContentElement.textContent || postContentElement.innerText || "").substring(0, 150) + "...");

        if(postData) addBlogPostingSchema(postData);

        const textContent = postContentElement.innerText || postContentElement.textContent;
        displayEstimatedReadingTime(textContent);

        insertMidArticleAd(postContentElement);
        updateSocialShareLinks();

    } catch (error) {
        console.error('Error loading post:', error);
        const postContentElement = document.getElementById('post-content');
        if (postContentElement) postContentElement.innerHTML = '<p>Error loading post content.</p>';
    }
}

async function getPostData(postFilename) {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();
        return posts.find(post => post.file === postFilename);
    } catch (error) {
        console.error('Error fetching post data from posts.json:', error);
        return null;
    }
}

function updateMetaDescription(description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
}

function updateSocialShareLinks() {
    const postUrl = window.location.href;
    let postTitle = document.title.replace(" | My Coding Blog", "");
    if (!postTitle || postTitle.trim() === "") {
        const h1 = document.querySelector('#post-content h1');
        postTitle = h1?.textContent || "Check out this post!";
    }

    const twitterLink = document.querySelector('.share-btn.twitter');
    if (twitterLink) twitterLink.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`;
    const facebookLink = document.querySelector('.share-btn.facebook');
    if (facebookLink) facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    const linkedinLink = document.querySelector('.share-btn.linkedin');
    if (linkedinLink) linkedinLink.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
}

function displayEstimatedReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    const readingTimeElement = document.getElementById('post-meta-placeholder');
    if (readingTimeElement) {
        const existingP = readingTimeElement.querySelector('.reading-time');
        if (existingP) existingP.textContent = `Estimated reading time: ${minutes} min`;
        else readingTimeElement.innerHTML = `<p class="reading-time">Estimated reading time: ${minutes} min</p>` + readingTimeElement.innerHTML;
    }
}

function insertMidArticleAd(postContentElement) {
    if (!postContentElement) return;
    let insertionPoint = null;
    const children = Array.from(postContentElement.children);
    const firstH2 = children.find(el => el.tagName === 'H2');
    if (firstH2) {
        insertionPoint = firstH2;
    } else {
        const paragraphs = children.filter(el => el.tagName === 'P');
        if (paragraphs.length >= 3) {
            insertionPoint = paragraphs[2];
        }
    }
    if (insertionPoint) {
        const adDiv = document.createElement('div');
        adDiv.id = 'ad-placeholder-in-article-1';
        adDiv.className = 'ad-placeholder ad-adsense-in-article';
        adDiv.dataset.comment = 'Google AdSense In-article Ad';
        insertionPoint.insertAdjacentElement('afterend', adDiv);
        console.log('In-article ad placeholder inserted after:', insertionPoint.tagName);
    } else {
        console.log('Suitable insertion point for in-article ad not found.');
    }
}

function addBlogPostingSchema(postData) {
    if (!postData) return;
    const postUrl = window.location.href;
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": postData.title,
        "description": postData.description,
        "datePublished": postData.datePublished,
        "dateModified": postData.lastModified || postData.datePublished,
        "mainEntityOfPage": {"@type": "WebPage", "@id": postUrl},
        "author": {"@type": "Person", "name": "The Blog Author"}, // Replace or make dynamic
    };
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema, null, 2);
}

function generateTableOfContents(contentElement) {
    const tocList = document.getElementById('toc-list');
    const tocContainer = document.getElementById('toc-container');
    if (!tocList || !contentElement || !tocContainer) return;
    tocList.innerHTML = '';
    const headings = contentElement.querySelectorAll('h2, h3');
    let hasHeadings = false;
    headings.forEach(heading => {
        hasHeadings = true;
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = heading.textContent;
        link.href = `#${heading.id}`;
        listItem.className = `toc-item toc-level-${heading.tagName.toLowerCase()}`;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({behavior: 'smooth'});
        });
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
    tocContainer.style.display = hasHeadings ? 'block' : 'none';
}

function updateReadingProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    const contentElement = document.getElementById('post-content');
    let scrollableHeight, currentScroll;
    if (contentElement) {
        const elementRect = contentElement.getBoundingClientRect();
        const contentHeight = elementRect.height;
        const viewportHeight = window.innerHeight;
        scrollableHeight = contentHeight - viewportHeight;
        currentScroll = -elementRect.top;
    } else {
        scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        currentScroll = window.pageYOffset;
    }
    if (scrollableHeight <= 0) {
        progressBar.style.width = (window.pageYOffset > 0) ? '100%' : '0%';
        return;
    }
    const scrollPercentage = (currentScroll / scrollableHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercentage))}%`;
}

// Function to generate sitemap.xml content (intended for manual use via console)
async function generateSitemap() {
    console.log("Attempting to generate sitemap...");
    const YOUR_BLOG_BASE_URL = prompt("Please enter your blog's base URL (e.g., https://yourusername.github.io/your-repo-name):", "YOUR_BLOG_BASE_URL_HERE");

    if (!YOUR_BLOG_BASE_URL || YOUR_BLOG_BASE_URL === "YOUR_BLOG_BASE_URL_HERE") {
        console.error("Sitemap generation cancelled: Base URL not provided.");
        alert("Sitemap generation cancelled. Please replace 'YOUR_BLOG_BASE_URL_HERE' in sitemap.xml manually or re-run with a valid URL.");
        return;
    }

    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const today = new Date().toISOString().split('T')[0];
    sitemapXml += `  <url><loc>${YOUR_BLOG_BASE_URL}/index.html</loc><lastmod>${today}</lastmod></url>\n`;

    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();
        posts.forEach(post => {
            sitemapXml += `  <url>\n`;
            sitemapXml += `    <loc>${YOUR_BLOG_BASE_URL}/post.html?post=${post.file}</loc>\n`;
            if (post.lastModified) sitemapXml += `    <lastmod>${post.lastModified}</lastmod>\n`;
            sitemapXml += `  </url>\n`;
        });
    } catch (error) {
        console.error("Error fetching posts for sitemap:", error);
    }
    sitemapXml += `</urlset>`;
    console.log("\n--- Generated sitemap.xml ---\n");
    console.log(sitemapXml);
    alert("Sitemap XML generated! Check browser console (F12) for XML and copy to sitemap.xml.");
}

async function generateRssFeed() {
    console.log("Attempting to generate RSS feed...");
    const YOUR_BLOG_BASE_URL = prompt("Please enter your blog's full base URL (e.g., https://yourusername.github.io/your-repo-name):", "YOUR_BLOG_BASE_URL_HERE");

    if (!YOUR_BLOG_BASE_URL || YOUR_BLOG_BASE_URL === "YOUR_BLOG_BASE_URL_HERE") {
        console.error("RSS feed generation cancelled: Base URL not provided.");
        alert("RSS feed generation cancelled. Please provide your blog's base URL.");
        return;
    }

    const blogTitle = "My Coding Blog"; // Or fetch dynamically if stored elsewhere
    const blogDescription = "A blog about software development, coding tips, programming tutorials, and technology insights."; // Or fetch dynamically

    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    rssXml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    rssXml += `  <channel>\n`;
    rssXml += `    <title><![CDATA[${blogTitle}]]></title>\n`;
    rssXml += `    <link>${YOUR_BLOG_BASE_URL}</link>\n`;
    rssXml += `    <description><![CDATA[${blogDescription}]]></description>\n`;
    rssXml += `    <language>en-us</language>\n`; // Assuming English, change if needed
    rssXml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rssXml += `    <atom:link href="${YOUR_BLOG_BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />\n`;

    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();

        posts.forEach(post => {
            const postUrl = `${YOUR_BLOG_BASE_URL}/post.html?post=${post.file}`;
            let pubDate = '';
            if (post.datePublished) {
                pubDate = `<pubDate>${new Date(post.datePublished).toUTCString()}</pubDate>\n`;
            } else if (post.date) {
                 pubDate = `<pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
            }

            rssXml += `    <item>\n`;
            rssXml += `      <title><![CDATA[${post.title}]]></title>\n`;
            rssXml += `      <link>${postUrl}</link>\n`;
            rssXml += `      <guid isPermaLink="true">${postUrl}</guid>\n`;
            if (post.description) {
                rssXml += `      <description><![CDATA[${post.description}]]></description>\n`;
            }
            if (pubDate) {
                rssXml += `      ${pubDate}`;
            }
            rssXml += `    </item>\n`;
        });

    } catch (error) {
        console.error("Error fetching posts for RSS feed:", error);
    }

    rssXml += `  </channel>\n`;
    rssXml += `</rss>`;

    console.log("\n--- Generated rss.xml ---\n");
    console.log(rssXml);
    alert("RSS feed XML generated! Check the browser console (F12) for the XML content. Copy this content and paste it into a new file named 'rss.xml' in the root of your project.");
}

/*
   General Notes & Todos:
   - Consider HTML sanitization for markdown-rendered content if user-generated MD is ever a possibility.
   - Reading progress bar calculation could be further refined for edge cases or complex layouts.
   - Sitemap and RSS generation are manual; for automation, a build script or server-side logic would be needed.
   - Blog title and description for RSS feed are currently hardcoded in generateRssFeed function.
*/

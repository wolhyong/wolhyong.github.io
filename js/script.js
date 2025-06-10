// Main JavaScript for the blog
console.log("JavaScript file loaded");

document.addEventListener('DOMContentLoaded', () => {
    // Common initializations
    if (document.getElementById('progress-bar')) {
        window.addEventListener('scroll', updateReadingProgressBar);
        updateReadingProgressBar();
    }

    // Initialize search toggle if elements are present (works for index.html and post.html)
    const searchToggleButton = document.getElementById('search-toggle-btn');
    const searchInputField = document.getElementById('search-input');
    const searchContainer = document.getElementById('search-container');

    if (searchToggleButton && searchInputField && searchContainer) {
      initializeSearchToggle(searchToggleButton, searchInputField, searchContainer);
    }

    // Page-specific initializations
    if (document.getElementById('post-list')) { // Index page specific
        fetchPostsAndEnableSearch(searchInputField, searchToggleButton);
    } else if (document.getElementById('post-content')) { // Post page specific
        loadPost();
        if (searchInputField) {
            searchInputField.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  const searchTerm = searchInputField.value.trim();
                  if (searchTerm) {
                    window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
                  }
                }
            });
        }
    }

    loadBootstrapIconsSprite();
});

// --- Theme Toggle Logic ---
const themeToggleButtonGlobal = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (themeToggleButtonGlobal) {
        let newIconHTML = '';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            newIconHTML = '<svg class="theme-icon theme-icon-sun" viewBox="0 0 16 16"><use xlink:href="#sun-fill"></use></svg>';
            themeToggleButtonGlobal.setAttribute('aria-label', 'Switch to light mode');
        } else {
            document.body.classList.remove('dark-mode');
            newIconHTML = '<svg class="theme-icon theme-icon-moon" viewBox="0 0 16 16"><use xlink:href="#moon-fill"></use></svg>';
            themeToggleButtonGlobal.setAttribute('aria-label', 'Switch to dark mode');
        }
        themeToggleButtonGlobal.innerHTML = newIconHTML;
    } else if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

const currentTheme = localStorage.getItem('theme');
applyTheme(currentTheme || 'light');

if (themeToggleButtonGlobal) {
    themeToggleButtonGlobal.addEventListener('click', () => {
        let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// --- Toggleable Search UI Logic ---
function initializeSearchToggle(stb, sif, sc) {
    sif.classList.add('search-input-hidden');
    stb.setAttribute('aria-expanded', 'false');
    stb.setAttribute('aria-label', 'Open search');

    stb.addEventListener('click', (event) => {
        event.stopPropagation();
        const isHidden = sif.classList.toggle('search-input-hidden');
        stb.setAttribute('aria-expanded', String(!isHidden));
        stb.setAttribute('aria-label', isHidden ? 'Open search' : 'Close search');
        if (!isHidden) {
            sif.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (!sif.classList.contains('search-input-hidden') &&
            !sc.contains(event.target) &&
            event.target !== stb &&
            !stb.contains(event.target) ) {

            sif.classList.add('search-input-hidden');
            stb.setAttribute('aria-expanded', 'false');
            stb.setAttribute('aria-label', 'Open search');
        }
    });

    sif.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

// --- Client-Side Search Logic (for index.html) ---
let allPostsData = [];

async function fetchPostsAndEnableSearch(searchInputField, searchToggleButton) {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allPostsData = await response.json();
        renderPosts(allPostsData);

        if (searchInputField) {
            searchInputField.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredPosts = allPostsData.filter(post =>
                    (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                    (post.description && post.description.toLowerCase().includes(searchTerm)) ||
                    (post.keywords && post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)))
                );
                renderPosts(filteredPosts, searchTerm);
            });

            const urlParams = new URLSearchParams(window.location.search);
            const searchParam = urlParams.get('search');
            if (searchParam && searchToggleButton) { // Check searchToggleButton also
                searchInputField.value = decodeURIComponent(searchParam);
                if (searchInputField.classList.contains('search-input-hidden')) {
                    searchInputField.classList.remove('search-input-hidden');
                    searchToggleButton.setAttribute('aria-expanded', 'true');
                    searchToggleButton.setAttribute('aria-label', 'Close search');
                }
                const event = new Event('input', { bubbles: true, cancelable: true });
                searchInputField.dispatchEvent(event);
                searchInputField.focus();
            }
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

    if (blogPostsHeading) {
        if (postsToRender.length === 0 && searchTerm) {
            blogPostsHeading.textContent = `'${searchTerm}'에 대한 검색 결과가 없습니다.`;
        } else if (searchTerm) {
            blogPostsHeading.textContent = `'${searchTerm}' 검색 결과 (커리큘럼)`;
        } else {
            blogPostsHeading.textContent = '커리큘럼';
        }
    }

    if (postsToRender.length === 0) {
        postList.innerHTML = `<p class="no-results">No posts found${searchTerm ? ` matching "${searchTerm}"` : ''}.</p>`;
        return;
    }

    postsToRender.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';

        const cardLink = document.createElement('a');
        cardLink.href = `post.html?post=${post.file}`;
        cardLink.className = 'post-card-link';

        // Create and prepend thumbnail image
        if (post.thumbnailImageUrl) {
            const thumbnailImage = document.createElement('img');
            thumbnailImage.src = post.thumbnailImageUrl;
            thumbnailImage.alt = `Thumbnail for ${post.title}`;
            thumbnailImage.className = 'card-thumbnail-image';
            cardLink.appendChild(thumbnailImage); // Prepend to link for structure
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-thumbnail-placeholder';
            // placeholder.textContent = 'No Image'; // Optional text
            cardLink.appendChild(placeholder);
        }

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const cardDate = document.createElement('small');
        cardDate.className = 'post-card-date';
        cardDate.textContent = `Published: ${post.datePublished || post.date}`;
        cardContent.appendChild(cardDate);

        const cardTitle = document.createElement('h3');
        cardTitle.className = 'post-card-title';
        cardTitle.textContent = post.title;
        // Link is on cardLink, so title itself is not a link here.
        // If title should be a link, this needs adjustment or wrap h3 in <a>.
        // For now, assuming cardLink provides overall link.
        cardContent.appendChild(cardTitle);

        if (post.description) {
            const cardDescription = document.createElement('p');
            cardDescription.className = 'post-card-description';
            cardDescription.textContent = post.description;
            cardContent.appendChild(cardDescription);
        }

        // Create and append keywords
        if (post.keywords && post.keywords.length > 0) {
            const keywordsContainer = document.createElement('div');
            keywordsContainer.className = 'card-keywords';
            post.keywords.forEach(keywordText => {
                const keywordTag = document.createElement('span');
                keywordTag.className = 'keyword-tag';
                keywordTag.textContent = keywordText;
                keywordsContainer.appendChild(keywordTag);
            });
            cardContent.appendChild(keywordsContainer);
        }

        cardLink.appendChild(cardContent);
        card.appendChild(cardLink);
        postList.appendChild(card);
    });
}

// ... (rest of the script remains the same) ...

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
        "author": {"@type": "Person", "name": "The Blog Author"},
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

    const blogTitle = "My Coding Blog";
    const blogDescription = "A blog about software development, coding tips, programming tutorials, and technology insights.";

    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    rssXml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    rssXml += `  <channel>\n`;
    rssXml += `    <title><![CDATA[${blogTitle}]]></title>\n`;
    rssXml += `    <link>${YOUR_BLOG_BASE_URL}</link>\n`;
    rssXml += `    <description><![CDATA[${blogDescription}]]></description>\n`;
    rssXml += `    <language>en-us</language>\n`;
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

// --- Bootstrap Icons SVG Sprite Loader ---
function loadBootstrapIconsSprite() {
  const spriteUrl = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/bootstrap-icons.svg';
  if (document.getElementById('bootstrap-icons-sprite-container')) {
    return;
  }

  const spriteContainer = document.createElement('div');
  spriteContainer.id = 'bootstrap-icons-sprite-container';
  spriteContainer.style.display = 'none';

  document.body.insertBefore(spriteContainer, document.body.firstChild);

  fetch(spriteUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok for Bootstrap Icons sprite.');
      }
      return response.text();
    })
    .then(svgData => {
      spriteContainer.innerHTML = svgData;
    })
    .catch(error => {
      console.error('Error loading Bootstrap Icons sprite:', error);
      if (spriteContainer.parentNode) {
        spriteContainer.parentNode.removeChild(spriteContainer);
      }
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBootstrapIconsSprite);
} else {
  loadBootstrapIconsSprite();
}

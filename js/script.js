// --- Utility Functions ---
function calculateReadingTime(contentOrWordCount) {
    if (contentOrWordCount === null || contentOrWordCount === undefined) return "";
    let wordCount;
    if (typeof contentOrWordCount === 'number') {
        wordCount = contentOrWordCount;
    } else if (typeof contentOrWordCount === 'string') {
        const text = contentOrWordCount.replace(/<[^>]*>/g, "").replace(/\s+/g, ' ').trim();
        wordCount = text === "" ? 0 : text.split(' ').length;
    } else {
        return "";
    }

    const wpm = 200;
    const minutes = Math.ceil(wordCount / wpm);
    return minutes < 1 ? "< 1 min read" : `${minutes} min read`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial Setup: Selectors
    const postsContainer = document.getElementById('posts-container');
    const postContentArticle = document.getElementById('post-content-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const tocContainer = document.getElementById('toc-container');
    const postDateDisplay = document.getElementById('post-date-display');
    const readingTimeDisplay = document.getElementById('reading-time-display');
    const socialShareContainer = document.getElementById('social-share-container');

    let allPosts = [];

    // --- Theme Toggle Logic ---
    if (themeToggleButton) {
        const initializeTheme = () => {
            const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme');
            document.body.classList.toggle('dark-theme', savedTheme === 'dark-theme');
            themeToggleButton.textContent = savedTheme === 'dark-theme' ? 'Light Mode' : 'Dark Mode';
        };
        initializeTheme();
        themeToggleButton.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            themeToggleButton.textContent = isDark ? 'Light Mode' : 'Dark Mode';
            localStorage.setItem('theme', isDark ? 'dark-theme' : 'light-theme');
        });
    }

    // --- Logic for index.html (Listing posts & Search) ---
    if (postsContainer) {
        fetch('posts.json')
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(posts => {
                allPosts = posts; // Store for search
                renderPostsList(allPosts);
                if (allPosts.length === 0 && (!searchInput || searchInput.value === '')) {
                     postsContainer.innerHTML = '<p>No posts yet. Stay tuned!</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching posts for index:', error);
                postsContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
            });

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                const filteredPosts = allPosts.filter(post =>
                    post.title.toLowerCase().includes(searchTerm) ||
                    post.description.toLowerCase().includes(searchTerm)
                );
                renderPostsList(searchTerm === "" ? allPosts : filteredPosts);

                if (searchTerm !== "" && filteredPosts.length === 0) {
                    postsContainer.innerHTML = '<p>No posts found matching your search.</p>';
                } else if (searchTerm === "" && allPosts.length === 0) {
                     postsContainer.innerHTML = '<p>No posts yet. Stay tuned!</p>';
                }
            });
        }
    }

    // --- Logic for post.html (Displaying a single post & ToC & Meta & Social Share & JSON-LD) ---
    if (postContentArticle) {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (slug) {
            // Fetch all posts to find the current one by slug.
            // Consider fetching only the specific post's data if backend supported it,
            // or having individual JSON files per post. For now, this is fine for a small blog.
            fetch('posts.json')
                .then(response => response.json())
                .then(posts => {
                    const post = posts.find(p => p.slug === slug);
                    if (post) {
                        document.title = post.title + " | My Blog";

                        if(postDateDisplay) postDateDisplay.textContent = `Published on: ${new Date(post.date).toLocaleDateString()}`;

                        fetch(post.markdownFile)
                            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for file ${post.markdownFile}`); return response.text(); })
                            .then(markdown => {
                                if (typeof marked !== 'undefined') {
                                    postContentArticle.innerHTML = marked.parse(markdown);
                                    if (tocContainer) generateToc(postContentArticle, tocContainer);
                                    if (readingTimeDisplay) readingTimeDisplay.textContent = calculateReadingTime(markdown);
                                    if (socialShareContainer) populateSocialShareLinks(post.title, window.location.href);
                                    addStructuredData(post);
                                } else {
                                    console.error('marked.js is not loaded.');
                                    postContentArticle.innerHTML = '<p>Error rendering post: Markdown library not found.</p>';
                                }
                            })
                            .catch(error => {
                                console.error('Error fetching markdown content:', error);
                                postContentArticle.innerHTML = '<p>Error loading post content.</p>';
                            });
                    } else {
                        postContentArticle.innerHTML = '<p>Post not found.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching posts for post page:', error);
                    postContentArticle.innerHTML = '<p>Error loading post data.</p>';
                });
        } else {
            postContentArticle.innerHTML = '<p>No post specified.</p>';
        }
    }
});

function renderPostsList(postsToRender) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    postsContainer.innerHTML = '';

    if (postsToRender.length === 0) {
        // Message for "no posts" is handled by the calling function (initial load or search)
        return;
    }

    postsToRender.forEach(post => {
        const postElement = document.createElement('article');
        postElement.classList.add('post-item');

        const titleElement = document.createElement('h2');
        const linkElement = document.createElement('a');
        linkElement.href = `post.html?slug=${post.slug}`;
        linkElement.textContent = post.title;
        titleElement.appendChild(linkElement);
        postElement.appendChild(titleElement);

        const metaDiv = document.createElement('div');
        metaDiv.classList.add('post-meta');

        const dateElement = document.createElement('span');
        dateElement.textContent = `Published on: ${new Date(post.date).toLocaleDateString()}`;
        metaDiv.appendChild(dateElement);

        if (post.wordCount !== undefined) {
            const readingTimeElement = document.createElement('span');
            readingTimeElement.classList.add('reading-time-list');
            readingTimeElement.textContent = calculateReadingTime(post.wordCount);
            metaDiv.appendChild(readingTimeElement);
        }
        postElement.appendChild(metaDiv);

        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = post.description;
        postElement.appendChild(descriptionElement);

        postsContainer.appendChild(postElement);
    });
}

function generateToc(contentContainer, tocEl) {
    if (!contentContainer || !tocEl) return;
    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
        tocEl.innerHTML = '';
        tocEl.style.display = 'none';
        return;
    }
    tocEl.style.display = 'block';
    tocEl.innerHTML = '<h3>Table of Contents</h3>';
    const tocList = document.createElement('ul');
    let currentLevel = 0;
    let currentList = tocList;
    const parentLists = [];

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName.substring(1));
        if (!heading.id) {
            let idBase = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            if (!idBase) idBase = 'heading';
            let potentialId = idBase;
            let counter = 1;
            while (document.getElementById(potentialId)) {
                potentialId = `${idBase}-${counter++}`;
            }
            heading.id = potentialId;
        }

        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        listItem.appendChild(link);

        if (level > currentLevel) {
            for (let i = currentLevel; i < level; i++) {
                const newList = document.createElement('ul');
                const lastLi = currentList.lastElementChild;
                if (lastLi && lastLi.tagName === 'LI') {
                    lastLi.appendChild(newList);
                } else {
                    currentList.appendChild(newList);
                }
                parentLists.push(currentList);
                currentList = newList;
            }
        } else if (level < currentLevel) {
            for (let i = currentLevel; i > level; i--) {
                currentList = parentLists.pop();
            }
        }
        currentList.appendChild(listItem);
        currentLevel = level;
    });
    tocEl.appendChild(tocList);
}

function populateSocialShareLinks(title, url) {
    const container = document.getElementById('social-share-container');
    if (!container) return;

    const h4Title = container.querySelector('h4');
    container.innerHTML = '';
    if (h4Title) container.appendChild(h4Title);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const platforms = [
        { name: 'Twitter', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
        { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
        { name: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}` },
        { name: 'Email', href: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20post:%20${encodedUrl}` }
    ];

    platforms.forEach(platform => {
        const link = document.createElement('a');
        link.href = platform.href;
        link.textContent = platform.name;
        link.classList.add('social-share-button');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        container.appendChild(link);
    });
}

function addStructuredData(post) {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    const siteBaseUrl = window.location.origin;
    const postUrl = window.location.href;
    let imageUrl = post.image || (siteBaseUrl + '/images/default-blog-placeholder.jpg');
    if (post.image && !post.image.startsWith('http')) {
        imageUrl = siteBaseUrl + (post.image.startsWith('/') ? '' : '/') + post.image;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": imageUrl,
        "url": postUrl,
        "datePublished": new Date(post.date).toISOString(),
        "dateModified": new Date(post.date).toISOString(),
        "author": {
            "@type": "Person",
            "name": post.author || "My Blog Author"
        },
        "publisher": {
            "@type": "Organization",
            "name": "My Blog",
            "logo": {
                "@type": "ImageObject",
                "url": siteBaseUrl + "/images/logo.png"
            }
        },
        "description": post.description,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": postUrl
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
}

// --- Sitemap and RSS Feed Generators (callable from console) ---
async function fetchPostsForFeeds() {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts.json for feeds:", error);
        return []; // Return empty array on error
    }
}

window.generateSitemapXML = async () => {
    const posts = await fetchPostsForFeeds();
    const siteBaseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');


    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home page
    xml += '  <url>\n';
    xml += `    <loc>${siteBaseUrl}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`; // Today's date for homepage
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Blog posts
    posts.forEach(post => {
        xml += '  <url>\n';
        xml += `    <loc>${siteBaseUrl}post.html?slug=${post.slug}</loc>\n`;
        xml += `    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    console.log("Sitemap XML:\n\n", xml);
    alert("Sitemap XML generated. Check the browser console (F12).");
};

window.generateRssXML = async () => {
    const posts = await fetchPostsForFeeds();
    const siteBaseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const blogTitle = "My Blog"; // Customize as needed
    const blogDescription = "코딩 배우기, 프로그래밍 기초부터 실전까지 자세히 알려주는 그레이해커 월횽 블로그입니다."; // Customize

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    xml += '  <channel>\n';
    xml += `    <title>${blogTitle}</title>\n`;
    xml += `    <link>${siteBaseUrl}</link>\n`;
    xml += `    <description>${blogDescription}</description>\n`;
    xml += `    <language>en-us</language>\n`; // Customize as needed
    xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    xml += `    <atom:link href="${siteBaseUrl}rss.xml" rel="self" type="application/rss+xml" />\n`;


    posts.forEach(post => {
        xml += '    <item>\n';
        xml += `      <title><![CDATA[${post.title}]]></title>\n`;
        xml += `      <link>${siteBaseUrl}post.html?slug=${post.slug}</link>\n`;
        xml += `      <guid isPermaLink="true">${siteBaseUrl}post.html?slug=${post.slug}</guid>\n`;
        xml += `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
        xml += `      <description><![CDATA[${post.description}]]></description>\n`;
        // For full content in RSS (optional):
        // xml += `      <content:encoded><![CDATA[${post.markdownContent}]]></content:encoded>\n`; // Need to fetch markdown for this
        xml += '    </item>\n';
    });

    xml += '  </channel>\n';
    xml += '</rss>';
    console.log("RSS Feed XML:\n\n", xml);
    alert("RSS Feed XML generated. Check the browser console (F12).");
};

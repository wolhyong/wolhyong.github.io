// --- Global Constants & Utility Functions ---
const WPM = 200; // Average words per minute for reading time calculation

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
    const minutes = Math.ceil(wordCount / WPM);
    return minutes < 1 ? "1분 미만 소요" : `${minutes}분 소요`; // Korean output
}

function loadBootstrapIconsSprite() {
    const spriteUrl = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/bootstrap-icons.svg"; // Use a specific version
    fetch(spriteUrl)
        .then(response => response.text())
        .then(svgData => {
            const div = document.createElement("div");
            div.style.display = "none"; // Hide the sprite
            div.innerHTML = svgData;
            document.body.insertBefore(div, document.body.firstChild);
        })
        .catch(error => console.error("Error loading Bootstrap Icons sprite:", error));
}


document.addEventListener('DOMContentLoaded', () => {
    loadBootstrapIconsSprite(); // Load icons when DOM is ready

    const themeToggleButton = document.getElementById('theme-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuPanel = document.getElementById('mobile-menu-panel');

    // Search elements - assume one primary search for now, can be page specific
    const searchToggleButton = document.getElementById('search-toggle-btn'); // Common for both pages in new HTML
    const searchContainer = document.getElementById('search-container'); // Specific to index.html
    const searchInput = document.getElementById('search-input'); // Specific to index.html

    const searchContainerPost = document.getElementById('search-container-post'); // Specific to post.html
    const searchInputPost = document.getElementById('search-input-post'); // Specific to post.html

    // Content-specific elements
    const postsContainer = document.getElementById('posts-container'); // For index.html
    const postContentArticle = document.getElementById('post-content-container'); // For post.html
    const tocContainer = document.getElementById('toc-container');
    const postDateDisplay = document.getElementById('post-date-display');
    const readingTimeDisplay = document.getElementById('reading-time-display');
    const socialShareContainer = document.getElementById('social-share-container');

    let allPostsData = []; // Store fetched posts for index page

    // --- Initialize Theme ---
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark-mode');
        if (themeToggleButton) {
            themeToggleButton.innerHTML = theme === 'dark-mode' ?
                '<svg class="theme-icon" viewBox="0 0 16 16" fill="currentColor" style="width: 1.2em; height: 1.2em;"><use xlink:href="#sun-fill"></use></svg>' :
                '<svg class="theme-icon" viewBox="0 0 16 16" fill="currentColor" style="width: 1.2em; height: 1.2em;"><use xlink:href="#moon-fill"></use></svg>';
            themeToggleButton.setAttribute('aria-label', theme === 'dark-mode' ? '라이트 모드로 변경' : '다크 모드로 변경');
        }
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') ||
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-mode' : 'light-mode');
        applyTheme(savedTheme);
    }

    if (themeToggleButton) {
        initializeTheme();
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }

    // --- Initialize Mobile Menu ---
    function initializeMobileMenu() {
        if (mobileMenuToggle && mobileMenuPanel) {
            mobileMenuToggle.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from immediately closing via document listener
                const isOpen = mobileMenuPanel.classList.toggle('active');
                mobileMenuPanel.setAttribute('aria-hidden', !isOpen);
                mobileMenuToggle.setAttribute('aria-expanded', isOpen);
                mobileMenuToggle.innerHTML = isOpen ?
                    '<svg class="theme-icon" viewBox="0 0 16 16" fill="currentColor" style="width: 1.2em; height: 1.2em;"><use xlink:href="#x-lg"></use></svg>' : // Bootstrap X icon
                    '<svg class="theme-icon" viewBox="0 0 16 16" fill="currentColor" style="width: 1.2em; height: 1.2em;"><use xlink:href="#list"></use></svg>'; // Bootstrap List icon
            });

            // Close on outside click
            document.addEventListener('click', (event) => {
                if (mobileMenuPanel.classList.contains('active') &&
                    !mobileMenuPanel.contains(event.target) &&
                    event.target !== mobileMenuToggle &&
                    !mobileMenuToggle.contains(event.target) /* check if click was on icon inside button */
                    ) {
                    mobileMenuPanel.classList.remove('active');
                    mobileMenuPanel.setAttribute('aria-hidden', 'true');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    mobileMenuToggle.innerHTML = '<svg class="theme-icon" viewBox="0 0 16 16" fill="currentColor" style="width: 1.2em; height: 1.2em;"><use xlink:href="#list"></use></svg>';
                }
            });
        }
    }
    initializeMobileMenu();

    // --- Initialize Search Toggle ---
    function initializeSearchToggle(toggleBtn, searchContainerElement, searchInputElement) {
        if (toggleBtn && searchContainerElement) {
            toggleBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const isHidden = searchContainerElement.classList.toggle('search-input-hidden');
                toggleBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
                if (!isHidden && searchInputElement) {
                    searchInputElement.focus();
                }
            });

            document.addEventListener('click', (event) => {
                if (!searchContainerElement.classList.contains('search-input-hidden') &&
                    !searchContainerElement.contains(event.target) &&
                    event.target !== toggleBtn &&
                    !toggleBtn.contains(event.target)
                    ) {
                    searchContainerElement.classList.add('search-input-hidden');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // Initialize search for index page
    if (searchContainer && searchInput) { // searchContainer is the div for index.html
        initializeSearchToggle(searchToggleButton, searchContainer, searchInput);
    }
    // Initialize search for post page (if elements exist)
    if (searchContainerPost && searchInputPost) { // searchContainerPost is the div for post.html
        // The search toggle button is the same, but it controls a different container on post.html
        // This might need adjustment if the same button is meant to behave differently or if post page search is just a redirect
        // For now, let's assume post page search input is for redirecting.
        initializeSearchToggle(searchToggleButton, searchContainerPost, searchInputPost);

        searchInputPost.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && searchInputPost.value.trim() !== '') {
                window.location.href = `index.html?search=${encodeURIComponent(searchInputPost.value.trim())}`;
            }
        });
    }


    // --- Logic for index.html (Listing posts & Search Filtering) ---
    if (postsContainer) {
        fetch('posts.json')
            .then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); })
            .then(posts => {
                allPostsData = posts;
                // Check for search query in URL
                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('search');
                if (searchQuery && searchInput) {
                    searchInput.value = searchQuery;
                    // Make search input visible if it was hidden and there's a query
                    if(searchContainer && searchContainer.classList.contains('search-input-hidden')) {
                        searchContainer.classList.remove('search-input-hidden');
                        if(searchToggleButton) searchToggleButton.setAttribute('aria-expanded', 'true');
                    }
                    filterAndRenderPosts(searchQuery.toLowerCase().trim());
                } else {
                    renderPostsList(allPostsData);
                }
                if (allPostsData.length === 0 && (!searchInput || searchInput.value === '')) {
                     postsContainer.innerHTML = '<p>게시물이 아직 없습니다. 곧 업데이트됩니다!</p>'; // Korean
                }
            })
            .catch(error => {
                console.error('Error fetching posts for index:', error);
                postsContainer.innerHTML = '<p>게시물을 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.</p>'; // Korean
            });

        if (searchInput) { // For index page search input
            searchInput.addEventListener('input', () => {
                filterAndRenderPosts(searchInput.value.toLowerCase().trim());
            });
        }
    }

    function filterAndRenderPosts(searchTerm) {
        const filteredPosts = allPostsData.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            (post.description && post.description.toLowerCase().includes(searchTerm)) ||
            (post.keywords && post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)))
        );
        renderPostsList(filteredPosts);
        if (searchTerm !== "" && filteredPosts.length === 0) {
            postsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>'; // Korean
        } else if (searchTerm === "" && allPostsData.length === 0) {
             postsContainer.innerHTML = '<p>게시물이 아직 없습니다. 곧 업데이트됩니다!</p>'; // Korean
        } else if (searchTerm === "" && allPostsData.length > 0) {
            // If search is cleared, render all posts again (already handled by renderPostsList(allPostsData))
        }
    }

    // --- Logic for post.html (Displaying a single post, ToC, Meta, Social Share, JSON-LD) ---
    if (postContentArticle) {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (slug) {
            fetch('posts.json')
                .then(response => response.json())
                .then(posts => {
                    const post = posts.find(p => p.slug === slug);
                    if (post) {
                        document.title = post.title + " | GHW 코딩 블로그"; // Updated blog name

                        if(postDateDisplay) postDateDisplay.textContent = `게시일: ${new Date(post.date).toLocaleDateString('ko-KR')}`; // Korean

                        fetch(post.markdownFile)
                            .then(response => { if (!response.ok) throw Error(`Markdown fetch error: ${response.statusText}`); return response.text(); })
                            .then(markdown => {
                                if (typeof marked !== 'undefined') {
                                    postContentArticle.innerHTML = marked.parse(markdown);
                                    if (tocContainer) generateTableOfContents(postContentArticle, tocContainer);
                                    if (readingTimeDisplay) readingTimeDisplay.textContent = calculateReadingTime(markdown);
                                    if (socialShareContainer) populateSocialShareLinks(post.title, window.location.href);
                                    addSchemaOrgMarkup(post); // Renamed for clarity
                                    // Initialize Disqus
                                    if (document.getElementById('disqus_thread')) {
                                        var disqus_config = function () {
                                            this.page.url = window.location.href;
                                            this.page.identifier = post.slug;
                                        };
                                        (function() {
                                        var d = document, s = d.createElement('script');
                                        s.src = 'https://YOUR_DISQUS_SHORTNAME_HERE.disqus.com/embed.js'; // Replace with actual shortname
                                        s.setAttribute('data-timestamp', +new Date());
                                        (d.head || d.body).appendChild(s);
                                        })();
                                    }
                                } else {
                                    console.error('marked.js is not loaded.');
                                    postContentArticle.innerHTML = '<p>게시물 렌더링 오류: Markdown 라이브러리를 찾을 수 없습니다.</p>'; // Korean
                                }
                            })
                            .catch(error => {
                                console.error('Error fetching markdown content:', error);
                                postContentArticle.innerHTML = '<p>게시물 내용을 불러오는 중 오류가 발생했습니다.</p>'; // Korean
                            });
                    } else {
                        postContentArticle.innerHTML = '<p>게시물을 찾을 수 없습니다.</p>'; // Korean
                    }
                })
                .catch(error => {
                    console.error('Error fetching posts for post page:', error);
                    postContentArticle.innerHTML = '<p>게시물 데이터를 불러오는 중 오류가 발생했습니다.</p>'; // Korean
                });
        } else {
            postContentArticle.innerHTML = '<p>지정된 게시물이 없습니다.</p>'; // Korean
        }
    }


    // --- Function to render posts on index.html ---
    function renderPostsList(postsToRender) {
        if (!postsContainer) return;
        postsContainer.innerHTML = '';

        if (postsToRender.length === 0) {
            // Message for "no posts" is handled by the caller (filterAndRenderPosts or initial load)
            return;
        }

        postsToRender.forEach(post => {
            const postElement = document.createElement('article');
            postElement.classList.add('post-card'); // Updated class for new theme

            // Thumbnail
            if (post.thumbnailImageUrl) {
                const thumbnailLink = document.createElement('a');
                thumbnailLink.href = `post.html?slug=${post.slug}`;
                const thumbnail = document.createElement('img');
                thumbnail.src = post.thumbnailImageUrl;
                thumbnail.alt = `${post.title} 썸네일`; // Korean
                thumbnail.classList.add('card-thumbnail-image');
                thumbnailLink.appendChild(thumbnail);
                postElement.appendChild(thumbnailLink);
            } else {
                const placeholder = document.createElement('div');
                placeholder.classList.add('card-thumbnail-placeholder');
                placeholder.textContent = '썸네일 없음'; // Korean
                postElement.appendChild(placeholder);
            }

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('card-content');

            const dateElement = document.createElement('p');
            dateElement.classList.add('post-card-date');
            dateElement.textContent = `게시일: ${new Date(post.date).toLocaleDateString('ko-KR')}`; // Korean
            contentDiv.appendChild(dateElement);

            const titleElement = document.createElement('h2');
            titleElement.classList.add('post-card-title');
            const linkElement = document.createElement('a');
            linkElement.href = `post.html?slug=${post.slug}`;
            linkElement.textContent = post.title;
            titleElement.appendChild(linkElement);
            contentDiv.appendChild(titleElement);

            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('post-card-description');
            descriptionElement.textContent = post.description;
            contentDiv.appendChild(descriptionElement);

            // Keywords / Tags
            if (post.keywords && post.keywords.length > 0) {
                const keywordsDiv = document.createElement('div');
                keywordsDiv.classList.add('card-keywords');
                post.keywords.forEach(keyword => {
                    const keywordTag = document.createElement('span'); // Or 'a' if tags are links
                    keywordTag.classList.add('keyword-tag');
                    keywordTag.textContent = keyword;
                    keywordsDiv.appendChild(keywordTag);
                });
                contentDiv.appendChild(keywordsDiv);
            }
            postElement.appendChild(contentDiv);
            postsContainer.appendChild(postElement);
        });
    }

    // --- ToC Generation (Updated classes if necessary) ---
    function generateTableOfContents(contentEl, tocEl) { // Renamed from generateToc
        if (!contentEl || !tocEl) return;
        const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            tocEl.style.display = 'none';
            return;
        }
        tocEl.style.display = 'block'; // Show if there is a ToC
        tocEl.innerHTML = '<h4>목차</h4>'; // Korean, changed to h4 for styling consistency
        const tocList = document.createElement('ul');
        tocList.id = 'toc-list'; // ID for specific styling from toc.css

        let currentLevel = 0;
        let currentList = tocList;
        const parentLists = [];

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1));
            if (!heading.id) {
                let idBase = heading.textContent.trim().toLowerCase()
                    .replace(/\s+/g, '-').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣-]+/g, ''); // Allow Korean in slugs
                if (!idBase) idBase = 'heading';
                let potentialId = idBase;
                let counter = 1;
                while (document.getElementById(potentialId)) {
                    potentialId = `${idBase}-${counter++}`;
                }
                heading.id = potentialId;
            }

            const listItem = document.createElement('li');
            listItem.classList.add('toc-item', `toc-level-h${level}`);
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
                    currentList = parentLists.pop() || tocList; // Fallback to tocList if stack is empty
                }
            }
            currentList.appendChild(listItem);
            currentLevel = level;
        });
        tocEl.appendChild(tocList);
    }

    // --- Social Share Links ---
    function populateSocialShareLinks(title, url) {
        if (!socialShareContainer) return;
        const h4 = socialShareContainer.querySelector('h4');
        socialShareContainer.innerHTML = ''; // Clear previous
        if (h4) socialShareContainer.appendChild(h4); // Add title back

        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const platforms = [
            { name: 'Twitter', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
            { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
            { name: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}` },
            { name: 'Email', href: `mailto:?subject=${encodedTitle}&body=${url} 에서 이 게시물을 확인하세요.` } // Korean
        ];
        platforms.forEach(p => {
            const a = document.createElement('a');
            a.href = p.href; a.textContent = p.name; a.classList.add('social-share-button');
            a.target = '_blank'; a.rel = 'noopener noreferrer';
            socialShareContainer.appendChild(a);
        });
    }

    // --- Structured Data (Schema.org) ---
    function addSchemaOrgMarkup(post) { // Renamed from addStructuredData
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) existingScript.remove();

        const siteBaseUrl = window.location.origin;
        const postUrl = window.location.href;
        let imageUrl = post.image || (siteBaseUrl + '/images/default-blog-placeholder.jpg');
        if (post.image && !post.image.startsWith('http')) {
            imageUrl = siteBaseUrl + (post.image.startsWith('/') ? '' : '/') + post.image;
        }

        const schema = {
            "@context": "https://schema.org", "@type": "BlogPosting",
            "headline": post.title, "image": imageUrl, "url": postUrl,
            "datePublished": new Date(post.date).toISOString(),
            "dateModified": post.lastModified ? new Date(post.lastModified).toISOString() : new Date(post.date).toISOString(),
            "author": {"@type": "Person", "name": post.author || "GHW"}, // Korean author
            "publisher": {"@type": "Organization", "name": "GHW 코딩 블로그", "logo": {"@type": "ImageObject", "url": siteBaseUrl + "/images/logo.png"}}, // Korean
            "description": post.description,
            "mainEntityOfPage": {"@type": "WebPage", "@id": postUrl}
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    // --- Sitemap and RSS Feed Generators (callable from console) ---
    async function fetchPostsForFeeds() {
        try {
            const response = await fetch('posts.json');
            if (!response.ok) throw Error(`Feed posts fetch error: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching posts.json for feeds:", error);
            return [];
        }
    }

    window.generateSitemapXML = async () => { /* ... unchanged ... */ };
    window.generateRssXML = async () => { /* ... unchanged ... */ };
});

// Make generateSitemapXML and generateRssXML globally available if they are not already due to being inside DOMContentLoaded
// For simplicity, keeping them inside, they'd be callable if DOMContentLoaded has fired.
// If needed outside sooner, define them at the top level outside DOMContentLoaded.
// The current structure is fine.
// Note: The previous sitemap/RSS functions had some hardcoded values like blog title/description.
// It's better if these are configurable or also drawn from a central place if possible.
// For now, I'll ensure they use the updated Korean strings where appropriate.

// Re-defining generateSitemapXML and generateRssXML to ensure they are in the global scope
// if they were accidentally moved or if the previous comment about them being inside was misleading.
// On review, they ARE inside DOMContentLoaded. For console access, they should be on `window`.

async function globalFetchPostsForFeeds() { // Renamed to avoid conflict if script is run multiple times
    try {
        const response = await fetch('posts.json');
        if (!response.ok) throw Error(`Global Feed posts fetch error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts.json for global feeds:", error);
        return [];
    }
}

window.generateSitemapXML = async () => {
    const posts = await globalFetchPostsForFeeds();
    const siteBaseUrl = window.location.origin + (window.location.pathname.startsWith('/index.html') ? window.location.pathname.replace(/index\.html$/, '') : (window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/')).replace(/[^/]*$/, '');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${siteBaseUrl}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;
    posts.forEach(post => {
        xml += `  <url><loc>${siteBaseUrl}post.html?slug=${post.slug}</loc><lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
    });
    xml += '</urlset>';
    console.log("Sitemap XML:\n\n", xml);
    alert("Sitemap XML이 생성되었습니다. 브라우저 콘솔(F12)을 확인하세요."); // Korean
};

window.generateRssXML = async () => {
    const posts = await globalFetchPostsForFeeds();
    const siteBaseUrl = window.location.origin + (window.location.pathname.startsWith('/index.html') ? window.location.pathname.replace(/index\.html$/, '') : (window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/')).replace(/[^/]*$/, '');
    const blogTitle = "GHW 코딩 블로그";
    const blogDescription = "코딩 배우기, 프로그래밍 기초부터 실전까지 자세히 알려주는 그레이해커 월횽 블로그입니다.";

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n';
    xml += `    <title><![CDATA[${blogTitle}]]></title>\n`;
    xml += `    <link>${siteBaseUrl}</link>\n`;
    xml += `    <description><![CDATA[${blogDescription}]]></description>\n`;
    xml += `    <language>ko-KR</language>\n`; // Korean
    xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    xml += `    <atom:link href="${siteBaseUrl}rss.xml" rel="self" type="application/rss+xml" />\n`;
    posts.forEach(post => {
        xml += '    <item>\n';
        xml += `      <title><![CDATA[${post.title}]]></title>\n`;
        xml += `      <link>${siteBaseUrl}post.html?slug=${post.slug}</link>\n`;
        xml += `      <guid isPermaLink="true">${siteBaseUrl}post.html?slug=${post.slug}</guid>\n`;
        xml += `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
        xml += `      <description><![CDATA[${post.description}]]></description>\n`;
        xml += '    </item>\n';
    });
    xml += '  </channel>\n</rss>';
    console.log("RSS Feed XML:\n\n", xml);
    alert("RSS Feed XML이 생성되었습니다. 브라우저 콘솔(F12)을 확인하세요."); // Korean
};

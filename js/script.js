// Main JavaScript for the blog
console.log("JavaScript file loaded");

document.addEventListener('DOMContentLoaded', () => {
    updateCopyrightYear();

    if (document.getElementById('post-list')) {
        fetchPosts();
    }

    if (document.getElementById('post-content')) {
        loadPost();
    }
});

function updateCopyrightYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

async function fetchPosts() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        const postList = document.getElementById('post-list');

        postList.innerHTML = ''; // Clear any static placeholders

        if (posts.length === 0) {
            postList.innerHTML = '<li>No posts available yet. Check back soon!</li>';
            return;
        }

        posts.forEach(post => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `post.html?post=${post.file}`;
            link.textContent = post.title;

            const dateSmall = document.createElement('small');
            dateSmall.textContent = `Published on: ${post.date}`;

            listItem.appendChild(link);
            listItem.appendChild(document.createElement('br')); // For better spacing
            listItem.appendChild(dateSmall);
            postList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        const postList = document.getElementById('post-list');
        if (postList) {
            postList.innerHTML = '<li>Error loading posts. Please try again later.</li>';
        }
    }
}

async function loadPost() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postFile = urlParams.get('post');
        const postContentElement = document.getElementById('post-content');

        if (!postFile) {
            postContentElement.innerHTML = '<h2>Post Not Found</h2><p>The requested post could not be found. Please select a post from the <a href="index.html">homepage</a>.</p>';
            document.title = "Post Not Found - Wolhyong Development Blog";
            return;
        }

        const response = await fetch(`posts/${postFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for file ${postFile}`);
        }
        const markdown = await response.text();

        if (typeof marked === 'function') {
            postContentElement.innerHTML = marked.parse(markdown);
        } else {
            console.error('marked.js library is not loaded.');
            postContentElement.innerHTML = '<p>Error rendering post: Markdown library not found. Please ensure marked.min.js is correctly linked.</p>';
            return; // Stop further processing if marked is not available
        }

        // SEO and Social Media Meta Tag Updates
        const postTitleElement = postContentElement.querySelector('h1, h2'); // Get the first H1 or H2 as title
        const postTitle = postTitleElement ? postTitleElement.textContent : "Wolhyong Development Blog Post";
        document.title = `${postTitle} - Wolhyong Development Blog`;

        // Create or update meta description
        let description = `Read '${postTitle}' on Wolhyong's Development Blog.`;
        const firstParagraph = postContentElement.querySelector('p');
        if (firstParagraph) {
            description = firstParagraph.textContent.substring(0, 155) + "..."; // SEO-friendly length
        }
        updateMetaTag('description', description);
        updateMetaTag('og:title', postTitle);
        updateMetaTag('twitter:title', postTitle);
        updateMetaTag('og:description', description);
        updateMetaTag('twitter:description', description);
        updateMetaTag('og:url', window.location.href);
        updateMetaTag('twitter:url', window.location.href);
        updateMetaTag('canonical', window.location.href, 'link');

        // Update social share links
        updateSocialShareLinks(window.location.href, postTitle);

        // Update Disqus configuration if it's already loaded (for SPA-like navigation if implemented later)
        if (window.DISQUS) {
            DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.url = window.location.href;
                    this.page.identifier = postFile;
                    this.page.title = postTitle;
                }
            });
        } else {
            // Disqus script in post.html will handle initial load.
            // We ensure disqus_config is set before embed.js runs.
            window.disqus_config = function () {
                this.page.url = window.location.href;
                this.page.identifier = postFile;
                this.page.title = postTitle;
            };
        }

    } catch (error) {
        console.error('Error loading post:', error);
        const postContent = document.getElementById('post-content');
        if (postContent) {
            postContent.innerHTML = '<h2>Error Loading Post</h2><p>Sorry, there was an issue loading this blog post. Please try again later or contact the site administrator.</p>';
            document.title = "Error Loading Post - Wolhyong Development Blog";
        }
    }
}

function updateMetaTag(name, content, type = 'meta') {
    let element;
    if (type === 'link') {
        element = document.querySelector(`link[rel='${name}']`);
    } else {
        element = document.querySelector(`meta[name='${name}']`) || document.querySelector(`meta[property='${name}']`);
    }

    if (element) {
        if (type === 'link') {
            element.href = content;
        } else {
            element.content = content;
        }
    } else {
        // Create and append if it doesn't exist
        element = document.createElement(type);
        if (type === 'link') {
            element.rel = name;
            element.href = content;
        } else {
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
                element.setAttribute('property', name);
            } else {
                element.setAttribute('name', name);
            }
            element.content = content;
        }
        document.head.appendChild(element);
    }
}

function updateSocialShareLinks(url, title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const xLink = document.querySelector('.share-btn.X');
    if (xLink) {
        xLink.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    }

    const facebookLink = document.querySelector('.share-btn.facebook');
    if (facebookLink) {
        facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }

    const instagramLink = document.querySelector('.share-btn.Instagram');
    if (instagramLink) {
        // Instagram sharing is primarily mobile app-based and doesn't support URL prefill for posts.
        // This link can point to your Instagram profile or a page with sharing instructions.
        instagramLink.href = "https://www.instagram.com/"; // Replace with your Instagram profile or relevant link
        instagramLink.title = "Visit our Instagram (manual sharing recommended)";
    }
}

// Note: The DISQUS_SHORTNAME constant is removed as the shortname should be directly in post.html's script.
// The user MUST replace 'YOUR_DISQUS_SHORTNAME_HERE' in post.html.

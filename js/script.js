// Main JavaScript for the blog
console.log("JavaScript file loaded");

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('post-list')) {
        fetchPosts();
    }

    if (document.getElementById('post-content')) {
        loadPost();
    }
});

async function fetchPosts() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        const postList = document.getElementById('post-list');
        
        // Clear existing placeholder content except the first item (template)
        // Or, if there's no template, just clear everything.
        // For now, let's assume we clear it and repopulate.
        postList.innerHTML = ''; // Clear any static placeholders

        posts.forEach(post => {
            const listItem = document.createElement('li');
            // Link to post.html, passing the filename as a query parameter
            listItem.innerHTML = `<a href="post.html?post=${post.file}">${post.title}</a> - <small>${post.date}</small>`;
            postList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        const postList = document.getElementById('post-list');
        if (postList) {
            postList.innerHTML = '<li>Error loading posts.</li>';
        }
    }
}

async function loadPost() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postFile = urlParams.get('post');

        if (!postFile) {
            document.getElementById('post-content').innerHTML = '<p>No post specified.</p>';
            return;
        }

        // Basic security check: Ensure postFile is a relative path and doesn't contain '..'
        if (postFile.includes('..') || postFile.startsWith('/')) {
             document.getElementById('post-content').innerHTML = '<p>Invalid post path.</p>';
             return;
        }

        const response = await fetch(`posts/${postFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        
        // Check if marked.js is loaded
        if (typeof marked === 'undefined') {
            console.error('marked.js library is not loaded.');
            document.getElementById('post-content').innerHTML = '<p>Error: Markdown parser not loaded.</p>';
            return;
        }

        const htmlContent = marked.parse(markdown); // Use marked.parse (or marked() in older versions)
        const postContentElement = document.getElementById('post-content');
        
        // Sanitize HTML content before inserting (important for security)
        // For this example, we'll directly insert, but a real app needs sanitization.
        postContentElement.innerHTML = htmlContent;

        // Try to set the title of the page based on the first H1 in the markdown
        const firstH1 = postContentElement.querySelector('h1');
        if (firstH1 && firstH1.textContent) {
            document.title = firstH1.textContent + " - My Blog";
        }

        // Update social sharing links
        updateSocialShareLinks();

    } catch (error) {
        console.error('Error loading post:', error);
        const postContentElement = document.getElementById('post-content');
        if (postContentElement) {
            postContentElement.innerHTML = '<p>Error loading post content.</p>';
        }
    }
}

function updateSocialShareLinks() {
    const postUrl = window.location.href;
    // Attempt to get the post title from the document title, removing the " - My Blog" suffix
    let postTitle = document.title.replace(" - My Blog", ""); 
    
    // As a fallback, if the title is generic like "Blog Post - My Blog", try to get it from H1
    if (document.title === "Blog Post - My Blog" || !postTitle) {
        const h1 = document.querySelector('#post-content h1');
        if (h1 && h1.textContent) {
            postTitle = h1.textContent;
        } else {
            postTitle = "Check out this post!"; // Generic fallback
        }
    }

    const twitterLink = document.querySelector('.share-btn.twitter');
    if (twitterLink) {
        twitterLink.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`;
    }

    const facebookLink = document.querySelector('.share-btn.facebook');
    if (facebookLink) {
        facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    }

    const linkedinLink = document.querySelector('.share-btn.linkedin');
    if (linkedinLink) {
        linkedinLink.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    }
}

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
        // and get post description from posts.json
        const postData = await getPostData(postFile); // Helper to get data from posts.json

        if (postData && postData.title) {
            document.title = postData.title + " | My Coding Blog"; // More specific title
        } else {
            // Fallback if post not in posts.json or title missing
            const firstH1 = postContentElement.querySelector('h1');
            if (firstH1 && firstH1.textContent) {
                document.title = firstH1.textContent + " | My Coding Blog";
            }
        }

        if (postData && postData.description) {
            updateMetaDescription(postData.description);
        } else {
            // Fallback: generate description from content (first ~150 chars)
            const textContent = postContentElement.textContent || postContentElement.innerText || "";
            updateMetaDescription(textContent.substring(0, 150) + "...");
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

// Helper function to fetch data for a specific post from posts.json
async function getPostData(postFilename) {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
    // Attempt to get the post title from the document title, removing " | My Coding Blog" suffix
    let postTitle = document.title.replace(" | My Coding Blog", "");
    
    // Fallback if title is not specific enough (e.g. if it only contains " | My Coding Blog")
    if (!postTitle || postTitle.trim() === "") {
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

// --- SEO Enhancements ---

// Function to generate and add Schema.org JSON-LD for BlogPosting
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
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": postUrl
        },
        "author": { // Basic author schema
            "@type": "Person",
            "name": "The Blog Author" // Replace with actual author name or make dynamic
        },
        // "image": "URL_TO_A_REPRESENTATIVE_IMAGE.jpg", // Optional: Add if posts have images
        // "publisher": { // Optional: Add if you have a publisher logo/name
        //    "@type": "Organization",
        //    "name": "Your Blog Name",
        //    "logo": {
        //        "@type": "ImageObject",
        //        "url": "URL_TO_YOUR_LOGO.png"
        //    }
        // }
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema, null, 2); // Pretty print JSON
}

// Modify loadPost to call addBlogPostingSchema
async function loadPost() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postFile = urlParams.get('post');

        if (!postFile) {
            document.getElementById('post-content').innerHTML = '<p>No post specified.</p>';
            return;
        }

        if (postFile.includes('..') || postFile.startsWith('/')) {
             document.getElementById('post-content').innerHTML = '<p>Invalid post path.</p>';
             return;
        }

        const response = await fetch(`posts/${postFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        
        if (typeof marked === 'undefined') {
            console.error('marked.js library is not loaded.');
            document.getElementById('post-content').innerHTML = '<p>Error: Markdown parser not loaded.</p>';
            return;
        }

        const htmlContent = marked.parse(markdown);
        const postContentElement = document.getElementById('post-content');
        postContentElement.innerHTML = htmlContent;

        const postData = await getPostData(postFile); 

        if (postData && postData.title) {
            document.title = postData.title + " | My Coding Blog";
        } else {
            const firstH1 = postContentElement.querySelector('h1');
            if (firstH1 && firstH1.textContent) {
                document.title = firstH1.textContent + " | My Coding Blog";
            }
        }

        if (postData && postData.description) {
            updateMetaDescription(postData.description);
        } else {
            const textContent = postContentElement.textContent || postContentElement.innerText || "";
            updateMetaDescription(textContent.substring(0, 150) + "...");
        }
        
        if(postData) { // Add Schema.org markup
            addBlogPostingSchema(postData);
        }

        updateSocialShareLinks();

    } catch (error) {
        console.error('Error loading post:', error);
        const postContentElement = document.getElementById('post-content');
        if (postContentElement) {
            postContentElement.innerHTML = '<p>Error loading post content.</p>';
        }
    }
}


// Function to generate sitemap.xml content
async function generateSitemap() {
    console.log("Attempting to generate sitemap...");
    const YOUR_BLOG_BASE_URL = prompt("Please enter your blog's base URL (e.g., https://yourusername.github.io/your-repo-name):", "YOUR_BLOG_BASE_URL_HERE");

    if (!YOUR_BLOG_BASE_URL || YOUR_BLOG_BASE_URL === "YOUR_BLOG_BASE_URL_HERE") {
        console.error("Sitemap generation cancelled: Base URL not provided.");
        alert("Sitemap generation cancelled: Base URL not provided. Please replace 'YOUR_BLOG_BASE_URL_HERE' in sitemap.xml manually or re-run with a valid URL.");
        return;
    }
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add index.html
    // For index.html lastmod, we can use today's date or a fixed date.
    const today = new Date().toISOString().split('T')[0];
    sitemapXml += `  <url>\n`;
    sitemapXml += `    <loc>${YOUR_BLOG_BASE_URL}/index.html</loc>\n`;
    sitemapXml += `    <lastmod>${today}</lastmod>\n`; // Or a more specific last modified date for index
    sitemapXml += `  </url>\n`;

    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        posts.forEach(post => {
            sitemapXml += `  <url>\n`;
            sitemapXml += `    <loc>${YOUR_BLOG_BASE_URL}/post.html?post=${post.file}</loc>\n`;
            if (post.lastModified) {
                sitemapXml += `    <lastmod>${post.lastModified}</lastmod>\n`;
            }
            sitemapXml += `  </url>\n`;
        });

    } catch (error) {
        console.error("Error fetching posts for sitemap:", error);
    }

    sitemapXml += `</urlset>`;
    
    console.log("\n--- Generated sitemap.xml ---\n");
    console.log(sitemapXml);
    console.log("\n--- End of sitemap.xml ---\n");
    console.log("ACTION REQUIRED: Copy the XML content above and paste it into your sitemap.xml file, replacing its current content.");
    alert("Sitemap XML generated! Check the browser console (F12) for the XML content and instructions.");
}

/* 
   Page Load Speed & Optimization Notes:
   - For larger projects, consider minifying CSS and JavaScript files to reduce their size. 
     Tools like UglifyJS for JS and cssnano for CSS can automate this.
   - Ensure images are optimized (compressed) without significant quality loss.
   - Leverage browser caching. GitHub Pages sets appropriate Cache-Control headers by default.
   - Modern web servers (including GitHub Pages) often handle Gzip compression automatically, 
     which significantly reduces the size of text-based assets like HTML, CSS, and JS.
   - For this small project, these manual steps might be overkill, but they are crucial for larger applications.
*/

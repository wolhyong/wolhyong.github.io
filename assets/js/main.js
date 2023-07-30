// Function to create blog cards and add them to the DOM
function createBlogCards() {
    const blogContainer = document.getElementById("blog-section");

    blogData.forEach((post) => {
        const blogCard = document.createElement("div");
        blogCard.className = "blog-card";

        const titleElement = document.createElement("h2");
        titleElement.textContent = post.title;

        const dateElement = document.createElement("p");
        dateElement.textContent = post.date;

        const summaryElement = document.createElement("p");
        summaryElement.textContent = post.summary;

        const viewMoreLink = document.createElement("a");
        viewMoreLink.textContent = "View More";
        viewMoreLink.href = "#"; // Set the link URL for the full blog post

        blogCard.appendChild(titleElement);
        blogCard.appendChild(dateElement);
        blogCard.appendChild(summaryElement);
        blogCard.appendChild(viewMoreLink);

        blogContainer.appendChild(blogCard);
    });
}

// 드롭다운 메뉴

// Toggle the visibility of the desktop menu when the hamburger menu icon is clicked
document.querySelector('.hamburger_menu').addEventListener('click', function () {
    document.querySelector('.header_menu ul').classList.toggle('active');
});

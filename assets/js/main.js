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
        viewMoreLink.href = "#"; // 전체 블로그 게시물 링크를 설정할 URL로 변경

        blogCard.appendChild(titleElement);
        blogCard.appendChild(dateElement);
        blogCard.appendChild(summaryElement);
        blogCard.appendChild(viewMoreLink);

        blogContainer.appendChild(blogCard);
    });
}

// 드롭다운 메뉴

// dropdown menu
document.addEventListener('DOMContentLoaded', function() {
    // Close the dropdown menu when clicking outside of it
    window.addEventListener('click', function(event) {
        const headerMenu = document.querySelector('.header_menu ul');
        if (!event.target.matches('.hamburger_menu') && !event.target.matches('.header_menu ul') && headerMenu.classList.contains('active')) {
            headerMenu.classList.remove('active');
        }
    });
});

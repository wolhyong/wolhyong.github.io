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
    // 햄버거 메뉴 아이콘을 클릭하면 데스크톱 메뉴 아이콘의 가시성을 전환
    document.querySelector('.hamburger_menu').addEventListener('click', function () {
        document.querySelector('.header_menu ul').classList.toggle('active');
    });
});

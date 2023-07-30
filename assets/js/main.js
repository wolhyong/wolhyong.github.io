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

const dropdowns = document.querySelectorAll('.dropdown');
const mobileMenuIcon = document.querySelector('.menu_icon');
const mobileNav = document.querySelector('.mobile_nav');

// Handle dropdowns
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener('click', () => {
    dropdown.querySelector('.dropdown-content').classList.toggle('active');
  });
});

// Handle mobile menu
mobileMenuIcon.addEventListener('click', () => {
  mobileNav.classList.toggle('active');
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    mobileNav.classList.remove('active');
  }
});


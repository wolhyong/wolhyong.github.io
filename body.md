    <footer id="footer_wrap">
        <h2 class="blind">하단 영역</h2>
        <div class="footer_inner">
            <address class="footer_address">
                <p class="copyright">© 2023 wolhyong. All rights reserved.</p>
            </address>
        </div>
    </footer>

    <script src="js/blogData.js"></script>
    <script>
        // 블로그 카드 생성 및 DOM에 추가하는 함수
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
                viewMoreLink.textContent = "더 보기";
                viewMoreLink.href = "#"; // 전체 블로그 게시물 링크 URL 설정

                blogCard.appendChild(titleElement);
                blogCard.appendChild(dateElement);
                blogCard.appendChild(summaryElement);
                blogCard.appendChild(viewMoreLink);

                blogContainer.appendChild(blogCard);
            });
        }

        // 페이지 로드 시 블로그 카드 생성 함수 호출
        window.onload = createBlogCards;
    </script>
</body>

</html>

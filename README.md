# Greyhacker Wolhyong의 GitHub 블로그

Greyhacker Wolhyong을 위한 간단하고 현대적이며 반응형인 GitHub 블로그입니다. HTML, CSS, JavaScript로 구축되었으며, 네이버 및 구글 검색 엔진에서 상위 노출을 목표로 SEO 최적화에 중점을 두었습니다.

## 주요 기능

-   **모던 디자인**: CSS 변수를 사용하여 깔끔하고 현대적인 디자인을 제공합니다.
-   **반응형**: 데스크톱, 태블릿, 모바일 등 다양한 화면 크기에 맞춰 조정됩니다.
-   **SEO 최적화**: 메타 태그, 오픈 그래프, 트위터 카드 및 캐노니컬 링크를 포함하여 검색 엔진 가시성을 향상시킵니다. JavaScript를 통한 동적 업데이트는 개별 게시물의 SEO를 강화합니다. (Greyhacker Wolhyong 블로그의 네이버 및 구글 타겟팅)
-   **마크다운 기반**: 블로그 게시물은 마크다운으로 작성되어 작성이 용이합니다.
-   **동적 게시물 로딩**: JSON 파일에서 게시물 목록을 가져오고 개별 게시물을 동적으로 로드합니다.
-   **Disqus 연동**: Disqus를 사용하여 댓글 기능을 통합할 준비가 되어 있습니다.
-   **소셜 공유**: 게시물에 대한 기본 소셜 미디어 공유 링크를 제공합니다.

## 프로젝트 구조

```
wolhyong/
├── css/
│   └── style.css         # 메인 스타일시트
├── js/
│   └── script.js         # 메인 JavaScript 파일
├── posts/
│   ├── posts.json        # 모든 블로그 게시물 목록을 담은 JSON 파일
│   └── sample-post.md    # 마크다운으로 작성된 예제 블로그 게시물
├── index.html            # 메인 랜딩 페이지, 블로그 게시물 목록 표시
├── post.html             # 개별 블로그 게시물 템플릿
└── README.md             # 이 파일
```

## 설정 및 구성

1.  **저장소 복제**: 이 저장소를 로컬 컴퓨터로 복제하거나 템플릿으로 사용합니다.

2.  **플레이스홀더 업데이트**: HTML 및 JavaScript 파일에서 다음 플레이스홀더를 **반드시** 업데이트해야 합니다:
    -   `YOUR_BLOG_URL_HERE`: `index.html` 및 `post.html`에서 캐노니컬 링크 및 소셜 공유를 위해 실제 블로그 URL(예: `https://yourusername.github.io/your-repo-name/`)로 교체합니다. 이 값은 Greyhacker Wolhyong 블로그의 동적 메타 태그 업데이트를 위해 `script.js`에서도 사용됩니다.
    -   **`YOUR_BLOG_PREVIEW_IMAGE_URL_HERE`**: `index.html` 및 `post.html`에서 오픈 그래프/트위터 이미지용으로 사용됩니다. 블로그 또는 개별 게시물의 기본 미리보기 이미지 URL이어야 합니다.
    -   `YOUR_DISQUS_SHORTNAME_HERE`: `post.html`에서 Greyhacker Wolhyong 블로그의 댓글 기능을 활성화하려면 Disqus shortname으로 교체합니다.

3.  **파비콘(Favicon)**:
    -   `favicon.ico` 파일을 만들어 루트 디렉토리에 배치합니다.
    -   다른 파일 이름이나 형식을 사용하는 경우 `index.html` 및 `post.html`의 `<head>` 섹션에서 링크를 업데이트합니다:
        ```html
        <link rel="icon" href="your-favicon.png" type="image/png">
        ```

4.  **콘텐츠 사용자 정의**:
    -   필요한 경우 `index.html` 및 `post.html`을 편집하여 기본 블로그 제목(`<h1>`) 또는 기타 정적 텍스트를 변경합니다.
    -   `css/style.css`를 수정하여 시각적 테마(색상, 글꼴 등)를 변경합니다.

## 새 블로그 게시물 추가하기

1.  **마크다운 파일 만들기**: 블로그 게시물을 마크다운으로 작성하고 `posts/` 디렉토리 내에 `.md` 파일로 저장합니다(예: `my-new-post.md`).

2.  **`posts.json` 업데이트**: `posts/posts.json` 파일에 새 게시물에 대한 항목을 추가합니다. JSON 파일은 각 객체가 게시물을 나타내는 객체의 배열입니다:
    ```json
    [
        {
            "title": "샘플 블로그 게시물",
            "file": "sample-post.md",
            "date": "2023-10-27"
        },
        {
            "title": "나의 멋진 새 게시물",
            "file": "my-new-post.md",
            "date": "YYYY-MM-DD" // 실제 날짜 사용
        }
        // 여기에 더 많은 게시물 추가
    ]
    ```
    -   `title`: 블로그 게시물의 제목 (홈페이지와 게시물 제목으로 표시됨).
    -   `file`: 마크다운 파일의 파일 이름 (예: `my-new-post.md`).
    -   `date`: 게시물의 발행 날짜.

3.  **커밋 및 푸시**: 변경 사항을 커밋하고 GitHub 저장소로 푸시합니다.

## SEO 고려 사항

이 템플릿은 우수한 기술적 SEO 기반을 제공하지만, 높은 검색 엔진 순위는 다음 사항에도 좌우된다는 점을 기억하십시오:

-   **고품질 콘텐츠**: 독창적이고 가치 있으며 잘 작성된 콘텐츠를 정기적으로 게시합니다.
-   **키워드**: 제목, 헤더 및 콘텐츠에 관련 키워드를 전략적으로 사용합니다.
-   **백링크**: 다른 평판 좋은 웹사이트에서 블로그로 연결되는 링크를 확보합니다.
-   **사이트 속도**: 블로그가 빠르게 로드되도록 합니다 (이 템플릿은 가벼워서 도움이 됩니다).
-   **사용자 경험**: 블로그를 쉽게 탐색하고 읽을 수 있도록 합니다.
-   **사이트맵**: 규모가 큰 블로그의 경우 `sitemap.xml`을 생성하여 검색 엔진에 제출하는 것을 고려합니다.

## GitHub Pages에 호스팅하기

1.  GitHub에서 저장소 설정으로 이동합니다.
2.  "Pages" 섹션으로 이동합니다.
3.  배포할 브랜치를 선택합니다 (일반적으로 `main` 또는 `master`).
4.  `/ (root)` 폴더를 선택합니다.
5.  블로그는 `https://yourusername.github.io/your-repo-name/`에서 사용할 수 있게 됩니다.

## 라이선스

이 프로젝트는 오픈 소스입니다. 자유롭게 사용, 수정 및 배포하십시오.

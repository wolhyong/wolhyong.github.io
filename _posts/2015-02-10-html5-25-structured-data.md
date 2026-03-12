---
layout: post
title: "구조화 데이터 완전 정리 — Schema.org와 JSON-LD로 구글 리치 스니펫 만들기"
description: "구조화 데이터(Structured Data)가 무엇인지, JSON-LD로 Schema.org 마크업을 작성하는 방법을 정리합니다. 블로그 포스트, FAQ, BreadcrumbList, 작성자 정보 스키마 예제와 구글 리치 결과 테스트 도구 사용법까지 다룹니다."
date: 2015-02-10 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 25
tags: [html, 구조화데이터, JSON-LD, Schema.org, 리치스니펫, SEO, FAQ, BreadcrumbList]
lang: ko
---

구글 검색 결과에서 일반 링크 옆에 별점, FAQ 아코디언, 빵 부스러기 경로가 표시되는 것을 본 적 있을 겁니다. 이것이 리치 스니펫(Rich Snippet)입니다. 구조화 데이터를 HTML에 추가하면 이런 특별한 검색 결과를 얻을 수 있습니다.

---

## 구조화 데이터란

검색 엔진이 페이지의 내용을 더 정확히 이해할 수 있도록 **데이터의 의미**를 명시적으로 표현하는 방법입니다.

예를 들어 "Python 기초 문법" 이라는 텍스트만 있으면 구글은 이게 책인지, 강의인지, 블로그 포스트인지 추론해야 합니다. 구조화 데이터를 추가하면 "이건 BlogPosting이고, 작성일은 2024-01-15이고, 작성자는 wolhyong입니다"를 명확히 전달할 수 있습니다.

---

## JSON-LD — 권장 방식

구조화 데이터를 표현하는 세 가지 형식(JSON-LD, Microdata, RDFa) 중 구글이 권장하는 방식입니다.

```html
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Python 가상환경 완전 정리",
    "datePublished": "2024-01-15",
    "author": {
      "@type": "Person",
      "name": "wolhyong"
    }
  }
  </script>
</head>
```

`<script type="application/ld+json">` 태그 안에 JSON으로 작성합니다. HTML 콘텐츠와 분리되어 있어 유지보수가 쉽습니다.

---

## BlogPosting — 블로그 포스트 스키마

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Python 가상환경 완전 정리 — venv, conda, poetry 비교",
  "description": "Python 프로젝트에서 가상환경을 설정하는 세 가지 방법을 비교합니다.",
  "image": "https://myblog.com/assets/images/posts/python-venv-og.jpg",
  "url": "https://myblog.com/post/python-venv",
  "datePublished": "2024-01-15T09:00:00+09:00",
  "dateModified": "2024-03-20T15:00:00+09:00",
  "author": {
    "@type": "Person",
    "name": "wolhyong",
    "url": "https://myblog.com/about"
  },
  "publisher": {
    "@type": "Organization",
    "name": "GHW Dev Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://myblog.com/assets/images/logo.png",
      "width": 200,
      "height": 60
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://myblog.com/post/python-venv"
  },
  "keywords": "Python, 가상환경, venv, conda, poetry"
}
</script>
```

---

## FAQPage — FAQ 리치 스니펫

검색 결과에서 질문 목록이 아코디언으로 바로 펼쳐지는 형태입니다.

```html
<!-- HTML 본문 (사용자가 보는 콘텐츠) -->
<section>
  <h2>자주 묻는 질문</h2>

  <details>
    <summary>GitHub Pages는 무료인가요?</summary>
    <p>퍼블릭 저장소의 GitHub Pages는 무료입니다. 월 100GB 대역폭, 1GB 저장공간 제한이 있습니다.</p>
  </details>

  <details>
    <summary>Jekyll 말고 다른 정적 사이트 생성기를 사용할 수 있나요?</summary>
    <p>네. Hugo, Gatsby, Eleventy 등도 GitHub Pages에서 사용 가능합니다. 단, 빌드 과정이 다소 복잡해질 수 있습니다.</p>
  </details>
</section>

<!-- 구조화 데이터 (검색엔진에게) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "GitHub Pages는 무료인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "퍼블릭 저장소의 GitHub Pages는 무료입니다. 월 100GB 대역폭, 1GB 저장공간 제한이 있습니다."
      }
    },
    {
      "@type": "Question",
      "name": "Jekyll 말고 다른 정적 사이트 생성기를 사용할 수 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "네. Hugo, Gatsby, Eleventy 등도 GitHub Pages에서 사용 가능합니다."
      }
    }
  ]
}
</script>
```

---

## BreadcrumbList — 빵 부스러기 경로

검색 결과에 `GHW Dev Blog > Python > 가상환경 완전 정리` 형태로 경로가 표시됩니다.

```html
<!-- HTML 본문 -->
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">홈</a></li>
    <li><a href="/category/python">Python</a></li>
    <li aria-current="page">가상환경 완전 정리</li>
  </ol>
</nav>

<!-- 구조화 데이터 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "홈",
      "item": "https://myblog.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Python",
      "item": "https://myblog.com/category/python"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Python 가상환경 완전 정리",
      "item": "https://myblog.com/post/python-venv"
    }
  ]
}
</script>
```

---

## Jekyll 블로그 포스트에 자동화

`_layouts/post.html`에 Liquid로 자동 생성합니다.

```html
{% raw %}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": {{ page.title | jsonify }},
  "description": {{ page.description | default: site.description | jsonify }},
  "url": {{ page.url | absolute_url | jsonify }},
  "datePublished": {{ page.date | date_to_xmlschema | jsonify }},
  {% if page.last_modified_at %}
  "dateModified": {{ page.last_modified_at | date_to_xmlschema | jsonify }},
  {% endif %}
  "author": {
    "@type": "Person",
    "name": {{ site.author.name | jsonify }},
    "url": {{ site.url | append: "/about" | jsonify }}
  },
  "publisher": {
    "@type": "Organization",
    "name": {{ site.title | jsonify }},
    "logo": {
      "@type": "ImageObject",
      "url": {{ site.url | append: "/assets/images/logo.png" | jsonify }}
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": {{ page.url | absolute_url | jsonify }}
  }
}
</script>
{% endraw %}
```

---

## 리치 결과 테스트

구조화 데이터가 올바르게 작성됐는지 확인합니다.

```
1. search.google.com/test/rich-results 접속
2. URL 입력 또는 코드 직접 붙여넣기
3. 감지된 구조화 데이터 확인
4. 오류/경고 수정
```

Search Console의 "리치 결과" 리포트에서 실제 적용 현황도 확인할 수 있습니다.

---

## 정리

- 구조화 데이터는 검색 엔진이 콘텐츠를 정확히 이해하도록 의미를 명시합니다
- JSON-LD 방식이 구글 권장 방식입니다 (`<script type="application/ld+json">`)
- `BlogPosting`으로 게시글, `FAQPage`로 FAQ, `BreadcrumbList`로 경로를 표현합니다
- Jekyll에서 Liquid 템플릿으로 자동화하면 효율적입니다
- 구글 리치 결과 테스트 도구로 마크업을 검증합니다

다음 글에서는 Canvas 기초 — 사각형, 원, 선 그리기를 다룹니다.
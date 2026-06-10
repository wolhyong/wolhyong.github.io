---
layout: post
title: "구조화 데이터 — Schema.org와 JSON-LD로 구글 리치 스니펫 만들기"
description: "구글 리치 스니펫은 어떻게 만드나요? 구조화 데이터(Structured Data)의 개념과 JSON-LD로 Schema.org 마크업을 작성하는 방법을 설명합니다. 블로그 포스트, FAQ, BreadcrumbList 스키마 예제와 구글 리치 결과 테스트 도구 사용법까지 다룹니다."
date: 2015-07-13 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 28
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
    "headline": "Python 가상환경 설정 방법",
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
  "headline": "Python 가상환경 설정 방법 — venv, conda, poetry 비교",
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

검색 결과에 `GHW Dev Blog > Python > 가상환경 설정 방법` 형태로 경로가 표시됩니다.

```html
<!-- HTML 본문 -->
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">홈</a></li>
    <li><a href="/category/python">Python</a></li>
    <li aria-current="page">가상환경 설정 방법</li>
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
      "name": "Python 가상환경 설정 방법",
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

## 실제로 적용해보기

리치 스니펫은 검색 결과에서 바로 눈에 띕니다. 구글에 "자주 묻는 질문" 형태로 검색 결과가 나타나는 사이트를 본 적이 있을 겁니다. 그것이 FAQPage 구조화 데이터 덕분입니다.

자신의 블로그에 BlogPosting JSON-LD를 적용한 후, 구글 리치 결과 테스트 도구(search.google.com/test/rich-results)에 URL을 입력하면 적용된 구조화 데이터를 시각적으로 확인할 수 있습니다. 오류가 있다면 그 자리에서 알려줍니다.

---

## 되짚기

- 구조화 데이터는 검색 엔진이 콘텐츠를 정확히 이해하도록 의미를 명시합니다
- JSON-LD 방식이 구글 권장 방식입니다 (`<script type="application/ld+json">`)
- `BlogPosting`으로 게시글, `FAQPage`로 FAQ, `BreadcrumbList`로 경로를 표현합니다
- Jekyll에서 Liquid 템플릿으로 자동화하면 효율적입니다
- 구글 리치 결과 테스트 도구로 마크업을 검증합니다

다음 글에서는 Canvas 기초 — 사각형, 원, 선 그리기를 알아봅니다.


## 실전 예제로 이해하기

HTML의 구조화 데이터 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 구조화 데이터을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>구조화 데이터 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>구조화 데이터에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 구조화 데이터을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. 구조화 데이터 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 구조화 데이터을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.

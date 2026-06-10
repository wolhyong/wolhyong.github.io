---
layout: post
title: "Open Graph 태그 심화 — 카카오톡·슬랙·트위터 공유 썸네일 최적화"
description: "SNS 공유 시 썸네일 미리보기는 어떻게 최적화하나요? OG(Open Graph) 태그를 활용한 SNS 공유 미리보기 최적화 방법, og:image 권장 크기, 트위터 카드 타입별 차이, Jekyll 블로그에 OG 태그 자동화 방법까지 다룹니다."
date: 2015-07-06 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 27
tags: [html, OG태그, OpenGraph, SNS공유, 카카오톡, 트위터카드, SEO, Jekyll]
lang: ko
---

블로그 글 링크를 카카오톡이나 슬랙에 공유했을 때 제목, 설명, 이미지가 예쁘게 나오는 것은 OG 태그 덕분입니다. 초급에서 기초를 다뤘으니 이번에는 자주 마주치는 상황들을 심화로 다룹니다.

---

## OG 태그 기본 복습

```html
<meta property="og:title" content="페이지 제목">
<meta property="og:description" content="페이지 설명 (160자 이내)">
<meta property="og:image" content="https://myblog.com/images/og.jpg">
<meta property="og:url" content="https://myblog.com/post/slug">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GHW Dev Blog">
<meta property="og:locale" content="ko_KR">
```

---

## og:image 크기와 형식

잘못된 크기를 설정하면 플랫폼마다 다르게 잘립니다.

| 플랫폼 | 권장 크기 | 최소 크기 |
|--------|-----------|-----------|
| 카카오톡 | 800×400 이상 | 200×200 |
| 페이스북 | 1200×630 | 600×315 |
| 슬랙 | 1200×630 | — |
| 트위터 Large Card | 1200×628 | 600×314 |
| LinkedIn | 1200×627 | — |

**가장 안전한 크기: 1200×630px**

이 크기 하나로 대부분의 플랫폼에서 잘 보입니다.

```html
<meta property="og:image" content="https://myblog.com/images/post-og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="Python 가상환경 설정 방법 — 썸네일 이미지">
```

`og:image:alt`는 이미지가 표시되지 않을 때의 대체 텍스트입니다. 접근성을 위해 작성합니다.

---

## article 전용 OG 태그

`og:type`이 `article`일 때 쓸 수 있는 추가 태그들이 있습니다.

```html
<meta property="og:type" content="article">
<meta property="article:published_time" content="2024-01-15T09:00:00+09:00">
<meta property="article:modified_time" content="2024-03-20T15:00:00+09:00">
<meta property="article:author" content="https://myblog.com/about">
<meta property="article:section" content="Python">
<meta property="article:tag" content="Python">
<meta property="article:tag" content="가상환경">
<meta property="article:tag" content="venv">
```

구글은 `article:published_time`을 참고해 콘텐츠의 신선도를 평가합니다.

---

## 트위터 카드 타입별 차이

```html
<!-- Summary Card: 작은 썸네일 + 제목 + 설명 -->
<meta name="twitter:card" content="summary">

<!-- Summary Large Image Card: 큰 이미지 + 제목 + 설명 (블로그에 권장) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Python 가상환경 설정 방법">
<meta name="twitter:description" content="venv, conda, poetry 세 가지를 비교합니다.">
<meta name="twitter:image" content="https://myblog.com/images/post-og.jpg">
<meta name="twitter:image:alt" content="Python 가상환경 도구 비교 썸네일">
<meta name="twitter:site" content="@your_twitter_id">
<meta name="twitter:creator" content="@author_twitter_id">
```

---

## Jekyll 블로그에 OG 태그 자동화

게시물마다 수동으로 OG 태그를 쓰는 것은 비효율적입니다. Jekyll의 Liquid 템플릿으로 자동화합니다.

`_includes/head.html`에 아래 코드를 추가합니다.

```html
{% raw %}
<!-- Open Graph -->
<meta property="og:site_name" content="{{ site.title }}">
<meta property="og:locale" content="ko_KR">

{% if page.layout == "post" %}
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{ page.title | escape }}">
  <meta property="og:description" content="{{ page.description | default: site.description | escape }}">
  <meta property="og:url" content="{{ page.url | absolute_url }}">

  {% if page.og_image %}
    <meta property="og:image" content="{{ page.og_image | absolute_url }}">
  {% elsif page.thumbnail %}
    <meta property="og:image" content="{{ page.thumbnail | absolute_url }}">
  {% else %}
    <meta property="og:image" content="{{ site.url }}/assets/images/og-default.jpg">
  {% endif %}

  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  {% if page.date %}
    <meta property="article:published_time" content="{{ page.date | date_to_xmlschema }}">
  {% endif %}
  {% if page.last_modified_at %}
    <meta property="article:modified_time" content="{{ page.last_modified_at | date_to_xmlschema }}">
  {% endif %}
  {% for tag in page.tags %}
    <meta property="article:tag" content="{{ tag }}">
  {% endfor %}

{% else %}
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{ page.title | default: site.title | escape }}">
  <meta property="og:description" content="{{ page.description | default: site.description | escape }}">
  <meta property="og:url" content="{{ page.url | absolute_url }}">
  <meta property="og:image" content="{{ site.url }}/assets/images/og-default.jpg">
{% endif %}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page.title | default: site.title | escape }}">
<meta name="twitter:description" content="{{ page.description | default: site.description | escape }}">
{% if page.og_image %}
  <meta name="twitter:image" content="{{ page.og_image | absolute_url }}">
{% else %}
  <meta name="twitter:image" content="{{ site.url }}/assets/images/og-default.jpg">
{% endif %}
{% endraw %}
```

포스트 프론트매터에 `og_image`를 지정하면 해당 이미지를 사용하고, 없으면 기본 이미지로 대체합니다.

```yaml
---
title: "Python 가상환경 설정 방법"
description: "SNS 공유 시 썸네일 미리보기는 어떻게 최적화하나요? OG(Open Graph) 태그를 활용한 SNS 공유 미리보기 최적화 방법, og:image 권장 크기, 트위터 카드 타입별 차이, Jekyll 블로그에 OG 태그 자동화 방법까지 다룹니다."
og_image: /assets/images/posts/python-venv-og.jpg
---
```

---

## OG 이미지 크롤러 캐시 갱신

카카오톡, 페이스북 등은 OG 이미지를 캐시합니다. 이미지나 태그를 수정한 후에도 예전 미리보기가 나올 수 있습니다.

**카카오톡 캐시 갱신**

```
https://developers.kakao.com/tool/clear/og
```

위 URL에서 URL을 입력하면 캐시를 삭제합니다.

**페이스북 캐시 갱신**

```
https://developers.facebook.com/tools/debug/
```

URL을 입력하고 "다시 스크래핑"을 클릭합니다.

---

## OG 태그 테스트 도구

| 도구 | URL | 지원 플랫폼 |
|------|-----|------------|
| 카카오 개발자 | developers.kakao.com/tool/clear/og | 카카오톡 |
| 메타 디버거 | developers.facebook.com/tools/debug | 페이스북 |
| 트위터 카드 검사기 | cards-dev.twitter.com/validator | 트위터 |
| OpenGraph.xyz | opengraph.xyz | 여러 플랫폼 동시 |
| MetaTags.io | metatags.io | 여러 플랫폼 미리보기 |

## 실제로 확인하기

블로그 포스트 하나를 카카오톡에 공유해보세요. OG 태그가 제대로 설정되어 있으면 제목, 설명, 이미지가 함께 보입니다. 만약 이미지가 안 나오거나 이상하게 잘려 보인다면 `og:image`의 크기나 경로를 확인해보면 됩니다.

`metatags.io`에서 자신의 블로그 URL을 입력하면 카카오톡, 페이스북, 트위터 등 각 플랫폼에서 어떻게 보일지 미리 확인할 수 있습니다.

---

## 마치며
- `og:image` 크기는 1200×630px이 가장 안전한 선택입니다
- `article:published_time`으로 발행일을 명시하면 SEO에 유리합니다
- Jekyll에서 Liquid 템플릿으로 OG 태그를 자동화할 수 있습니다
- OG 태그 변경 후 각 플랫폼의 캐시 초기화 도구를 사용합니다

다음 글에서는 구조화 데이터 — Schema.org와 JSON-LD로 리치 스니펫 만들기를 알아봅니다.
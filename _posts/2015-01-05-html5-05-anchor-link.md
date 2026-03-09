---
layout: post
title: "HTML 링크 태그 완전 정리 — a 태그, href, target, 앵커 이동"
description: "HTML a 태그의 href, target, rel 속성 사용법을 정리합니다. 외부 링크, 페이지 내 앵커 이동, 이메일 링크, 전화번호 링크, 새 탭으로 열기와 보안 설정까지 다룹니다."
date: 2015-01-05 09:00:00 +0900
category: html
level: beginner
series: "HTML/CSS 처음부터 끝까지"
series_order: 5
tags: [html, a태그, href, target, 링크, 앵커]
lang: ko
---

웹의 본질은 하이퍼링크입니다. 링크 없이는 웹이 존재하지 않습니다. HTML에서 링크를 만드는 `<a>` 태그를 속성 하나하나 제대로 정리합니다.

---

## 기본 사용법

```html
<a href="https://example.com">바로가기</a>
```

`href`(Hypertext REFerence) 속성에 이동할 주소를 넣고, 태그 사이에 클릭할 텍스트를 씁니다.

---

## href 속성에 들어갈 수 있는 값들

**외부 URL**

```html
<a href="https://google.com">구글</a>
```

**같은 사이트 내 다른 페이지 (상대 경로)**

```html
<!-- 같은 폴더의 파일 -->
<a href="about.html">소개 페이지</a>

<!-- 상위 폴더의 파일 -->
<a href="../index.html">홈으로</a>

<!-- 하위 폴더의 파일 -->
<a href="posts/2024-01-01-post.html">첫 번째 글</a>
```

**페이지 내 특정 위치로 이동 (앵커)**

```html
<!-- 이동할 곳에 id 지정 -->
<h2 id="installation">설치 방법</h2>

<!-- 해당 id로 점프 -->
<a href="#installation">설치 방법으로 이동</a>
```

긴 문서에서 목차를 만들 때 자주 씁니다.

**이메일 링크**

```html
<a href="mailto:contact@example.com">이메일 보내기</a>
```

클릭하면 기본 이메일 앱이 열립니다. 이메일 주소를 제목, 내용과 함께 전달할 수도 있습니다.

```html
<a href="mailto:contact@example.com?subject=문의합니다&body=안녕하세요">문의하기</a>
```

**전화번호 링크**

```html
<a href="tel:+821012345678">전화하기</a>
```

모바일에서 클릭하면 전화 앱이 바로 열립니다.

---

## target 속성 — 어디서 열 것인가

| 값 | 동작 |
|----|------|
| `_self` | 현재 탭에서 열기 (기본값) |
| `_blank` | 새 탭에서 열기 |
| `_parent` | 부모 프레임에서 열기 |
| `_top` | 최상위 프레임에서 열기 |

실무에서는 `_self`와 `_blank`만 거의 씁니다.

```html
<!-- 현재 탭에서 열기 (기본, 생략 가능) -->
<a href="about.html">소개</a>

<!-- 새 탭에서 열기 -->
<a href="https://github.com" target="_blank">GitHub</a>
```

---

## 새 탭으로 열 때 반드시 rel="noopener noreferrer" 추가

`target="_blank"`를 사용할 때 보안 이슈가 있습니다. 열린 새 탭이 원래 페이지를 참조해서 악의적으로 리디렉션할 수 있는 취약점이 있습니다.

```html
<!-- 보안 취약점 있음 -->
<a href="https://example.com" target="_blank">링크</a>

<!-- 올바른 방법 -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">링크</a>
```

- `noopener` — 새 탭이 원본 페이지에 접근하지 못하게 합니다
- `noreferrer` — 어느 페이지에서 왔는지 정보를 넘기지 않습니다

외부 링크에 `target="_blank"`를 쓸 때는 항상 이 두 속성을 함께 써야 합니다.

---

## 이미지를 링크로 만들기

텍스트뿐 아니라 이미지도 링크로 만들 수 있습니다.

```html
<a href="https://example.com">
  <img src="logo.png" alt="회사 로고 — 홈으로 이동">
</a>
```

---

## 버튼처럼 보이는 링크

CSS로 a 태그를 버튼처럼 스타일링하는 방법을 많이 씁니다.

```html
<a href="/signup" class="btn">회원가입</a>
```

링크지만 시각적으로 버튼처럼 보이게 하는 것입니다. 이동이 목적이면 a 태그, 폼 제출 등 동작이 목적이면 button 태그를 사용하는 것이 맞습니다.

---

## 링크를 무효화하는 방법

개발 중에 임시로 링크를 막아야 할 때가 있습니다.

```html
<!-- href를 #으로 설정 (페이지 최상단으로 이동) -->
<a href="#">임시 링크</a>

<!-- JavaScript로 기본 동작 방지 -->
<a href="javascript:void(0)">클릭해도 이동 없음</a>
```

실무에서는 `href="#"`이 가장 많이 쓰입니다. 다만 페이지 상단으로 스크롤되는 부작용이 있어서, JavaScript로 이벤트를 처리할 때는 `event.preventDefault()`를 함께 쓰는 게 좋습니다.

---

## 실습: 목차 있는 긴 페이지 만들기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Docker 입문 가이드</title>
</head>
<body>
  <h1>Docker 입문 가이드</h1>

  <!-- 목차 -->
  <nav>
    <ul>
      <li><a href="#what-is-docker">Docker란?</a></li>
      <li><a href="#install">설치 방법</a></li>
      <li><a href="#basic-commands">기본 명령어</a></li>
    </ul>
  </nav>

  <!-- 섹션 1 -->
  <h2 id="what-is-docker">Docker란?</h2>
  <p>Docker는 애플리케이션을 컨테이너로 패키징하는 플랫폼입니다.</p>

  <!-- 섹션 2 -->
  <h2 id="install">설치 방법</h2>
  <p>
    <a href="https://docker.com" target="_blank" rel="noopener noreferrer">공식 사이트</a>에서 설치 파일을 다운로드합니다.
  </p>

  <!-- 섹션 3 -->
  <h2 id="basic-commands">기본 명령어</h2>
  <p>자주 쓰는 Docker 명령어를 정리합니다.</p>

  <p><a href="mailto:feedback@myblog.com">이 글에 피드백 보내기</a></p>
</body>
</html>
```

---

## 정리

- `href` — 이동할 주소 (URL, 상대경로, #앵커, mailto, tel)
- `target="_blank"` — 새 탭에서 열기
- `rel="noopener noreferrer"` — 새 탭 열기 시 보안 필수 속성
- 이미지, 버튼도 a 태그로 감싸서 링크로 만들 수 있습니다

다음 글에서는 이미지 태그(`<img>`)를 완전히 정리합니다.
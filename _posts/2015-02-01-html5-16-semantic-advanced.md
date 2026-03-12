---
layout: post
title: "시맨틱 HTML 심화 — aside, figure, time, address, details 완전 정리"
description: "HTML5 시맨틱 태그 심화편입니다. aside, figure, figcaption, time, address, details, summary, mark, abbr 태그의 올바른 사용법과 SEO·접근성 향상 효과를 실전 예제와 함께 정리합니다."
date: 2015-02-01 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 16
tags: [html5, 시맨틱태그, aside, figure, time, address, details, 접근성, SEO]
lang: ko
---

초급 과정에서 header, nav, main, section, article, footer를 배웠습니다. HTML5에는 그 외에도 콘텐츠의 의미를 정확하게 전달하는 시맨틱 태그들이 더 있습니다. 이 태그들을 제대로 쓰면 검색 엔진이 페이지 내용을 더 정확히 파악하고, 스크린 리더 사용자의 경험도 개선됩니다.

---

## aside — 본문과 간접적으로 관련된 콘텐츠

메인 콘텐츠와 직접적인 연관은 없지만 부가적으로 도움이 되는 내용을 담습니다.

```html
<main>
  <article>
    <h1>Python 가상 환경 완전 정리</h1>
    <p>venv, conda, poetry 세 가지 방법을 비교합니다...</p>
  </article>

  <aside>
    <h2>관련 글</h2>
    <ul>
      <li><a href="/post/pip-guide">pip 패키지 관리 완전 가이드</a></li>
      <li><a href="/post/pyenv">pyenv로 Python 버전 관리하기</a></li>
    </ul>

    <h2>이 글의 태그</h2>
    <ul>
      <li><a href="/tags/python">Python</a></li>
      <li><a href="/tags/venv">가상환경</a></li>
    </ul>
  </aside>
</main>
```

aside는 사이드바 전체, 또는 article 안에서 본문의 보충 설명 박스로도 씁니다.

```html
<article>
  <h1>Docker 컨테이너 기초</h1>
  <p>컨테이너는 애플리케이션과 그 실행 환경을 묶은 단위입니다.</p>

  <aside>
    <h3>용어 정리</h3>
    <p><strong>컨테이너</strong>: 격리된 실행 환경 단위</p>
    <p><strong>이미지</strong>: 컨테이너 생성을 위한 템플릿</p>
  </aside>

  <p>Docker Desktop을 설치하면 로컬에서 바로 실험할 수 있습니다...</p>
</article>
```

---

## figure와 figcaption — 독립적인 콘텐츠와 설명

이미지, 코드, 차트, 표처럼 독립적으로 참조되는 콘텐츠를 설명과 함께 묶습니다.

```html
<!-- 이미지 + 설명 -->
<figure>
  <img
    src="/assets/images/react-lifecycle.png"
    alt="React 컴포넌트 생명주기 다이어그램"
    width="800"
    height="450"
    loading="lazy">
  <figcaption>그림 1. React 18 컴포넌트 생명주기. Mount → Update → Unmount 단계별 흐름을 나타냅니다.</figcaption>
</figure>

<!-- 코드 블록 + 설명 -->
<figure>
  <pre><code>const [count, setCount] = useState(0);</code></pre>
  <figcaption>코드 1. useState Hook으로 상태 변수와 업데이트 함수를 선언합니다.</figcaption>
</figure>

<!-- 인용문 + 출처 -->
<figure>
  <blockquote>
    <p>First, solve the problem. Then, write the code.</p>
  </blockquote>
  <figcaption>— John Johnson, 소프트웨어 엔지니어</figcaption>
</figure>
```

figcaption은 figure의 첫 번째 또는 마지막 자식으로 씁니다.

---

## time — 날짜와 시간 표시

기계가 읽을 수 있는 형식으로 날짜/시간을 마크업합니다.

```html
<!-- 날짜 -->
<time datetime="2024-01-15">2024년 1월 15일</time>

<!-- 날짜와 시간 -->
<time datetime="2024-01-15T09:00:00+09:00">2024년 1월 15일 오전 9시</time>

<!-- 상대적 표현 -->
<p>이 글은 <time datetime="2024-01-15">3일 전</time>에 작성됐습니다.</p>

<!-- 기간 -->
<p>개발 기간: <time datetime="2023-06">2023년 6월</time> ~ <time datetime="2024-01">2024년 1월</time></p>
```

`datetime` 속성 형식은 ISO 8601 표준을 따릅니다.

- 날짜만: `2024-01-15`
- 날짜+시간: `2024-01-15T09:00`
- 타임존 포함: `2024-01-15T09:00:00+09:00`
- 연월만: `2024-01`

검색 엔진이 게시 날짜를 정확히 파악해서 신선도(Freshness) 점수에 반영합니다. 블로그 포스트의 게시일에는 반드시 time 태그를 씁니다.

```html
<article>
  <header>
    <h1>Kubernetes 입문 — 처음 배우는 k8s</h1>
    <p>
      <time datetime="2024-01-15T09:00:00+09:00">2024년 1월 15일</time>
      작성 · <time datetime="2024-03-20">2024년 3월 20일</time> 업데이트
    </p>
  </header>
</article>
```

---

## address — 연락처 정보

글의 작성자 또는 사이트 운영자의 연락처 정보를 담습니다.

```html
<!-- article 안에서: 글 작성자 연락처 -->
<article>
  <h1>FastAPI로 REST API 만들기</h1>
  <address>
    작성자: <a href="mailto:author@myblog.com">개발자 홍길동</a>
    <br>
    GitHub: <a href="https://github.com/username" rel="noopener">github.com/username</a>
  </address>
  <p>본문 내용...</p>
</article>

<!-- footer 안에서: 사이트 전체 연락처 -->
<footer>
  <address>
    <p>운영자: GHW Dev Blog</p>
    <p>이메일: <a href="mailto:contact@myblog.com">contact@myblog.com</a></p>
    <p>서울특별시 강남구</p>
  </address>
</footer>
```

address는 물리적 주소보다는 **연락처 정보** 전반에 사용합니다. 일반 텍스트 주소를 담는 용도가 아닙니다.

---

## details와 summary — 접기/펼치기

JavaScript 없이 순수 HTML만으로 아코디언(접기/펼치기) UI를 만들 수 있습니다.

```html
<details>
  <summary>Q. Jekyll과 Hugo 중 어떤 것을 선택해야 하나요?</summary>
  <p>블로그 규모가 작고 GitHub Pages를 사용할 예정이라면 Jekyll을, 빌드 속도가 중요하거나 대규모 콘텐츠를 관리한다면 Hugo를 권장합니다. Jekyll은 Ruby 기반, Hugo는 Go 기반입니다.</p>
</details>

<details>
  <summary>Q. GitHub Pages는 무료인가요?</summary>
  <p>퍼블릭 저장소는 무료입니다. 프라이빗 저장소의 GitHub Pages는 유료 플랜이 필요합니다.</p>
</details>
```

`open` 속성으로 기본적으로 펼쳐진 상태를 만들 수 있습니다.

```html
<details open>
  <summary>설치 방법 (클릭하면 접힙니다)</summary>
  <ol>
    <li>Node.js 설치</li>
    <li>npm install 실행</li>
    <li>npm start로 실행</li>
  </ol>
</details>
```

FAQ 섹션, 설치 가이드 단계별 설명, 코드 설명 등에 활용합니다.

---

## abbr — 약어 설명

약어에 전체 의미를 부여합니다. 마우스를 올리면 툴팁으로 표시됩니다.

```html
<p>
  <abbr title="HyperText Markup Language">HTML</abbr>은
  <abbr title="World Wide Web">WWW</abbr>의 기본 언어입니다.
</p>

<p>
  이 API는 <abbr title="JavaScript Object Notation">JSON</abbr> 형식으로 응답합니다.
  <abbr title="Cross-Origin Resource Sharing">CORS</abbr> 설정도 필요합니다.
</p>
```

---

## mark — 검색 결과 하이라이트

검색 결과 페이지에서 검색어를 강조하거나, 중요한 구절을 형광펜으로 표시할 때 씁니다.

```html
<!-- 검색 결과에서 키워드 강조 -->
<p>
  <mark>Python</mark>은 데이터 분석에 널리 사용됩니다.
  <mark>Python</mark>의 pandas 라이브러리를 활용하면 됩니다.
</p>

<!-- 인용문에서 중요 부분 강조 -->
<blockquote>
  <p>코드는 작동하게 만드는 것보다 <mark>읽히게 만드는 것</mark>이 더 중요합니다.</p>
</blockquote>
```

---

## 실습: 기술 블로그 포스트 전체 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Rebase vs Merge — 언제 어떤 것을 써야 할까</title>
</head>
<body>

  <header>
    <nav aria-label="주요 메뉴">
      <a href="/">GHW Dev Blog</a>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1>Git Rebase vs Merge — 언제 어떤 것을 써야 할까</h1>
        <p>
          작성자: <address><a href="mailto:author@myblog.com">wolhyong</a></address>
          ·
          <time datetime="2024-01-20T09:00:00+09:00">2024년 1월 20일</time>
          · 7분 읽기
        </p>
      </header>

      <p>
        <abbr title="Version Control System">VCS</abbr>를 사용하다 보면
        rebase와 merge 중 어떤 것을 써야 할지 헷갈리는 경우가 많습니다.
      </p>

      <figure>
        <img src="/images/git-rebase-merge.png"
             alt="Git merge는 두 브랜치를 합치는 새 커밋을 만들고, rebase는 커밋을 재배치합니다"
             width="800" height="400" loading="lazy">
        <figcaption>그림 1. merge(위)와 rebase(아래)의 커밋 히스토리 차이</figcaption>
      </figure>

      <h2>Merge를 써야 할 때</h2>
      <p>팀 협업에서 작업 이력을 그대로 보존해야 할 때 merge를 씁니다.</p>

      <details>
        <summary>merge 커맨드 전체 예시 보기</summary>
        <pre><code>git checkout main
git merge feature/login
git push origin main</code></pre>
      </details>

      <h2>Rebase를 써야 할 때</h2>
      <p>로컬 작업 이력을 깔끔하게 정리할 때 rebase가 유용합니다.</p>

      <aside>
        <h3>주의</h3>
        <p><mark>이미 push한 커밋은 rebase하면 안 됩니다.</mark> 팀원의 히스토리와 충돌이 생깁니다.</p>
      </aside>
    </article>

    <aside aria-label="관련 글">
      <h2>관련 글</h2>
      <ul>
        <li><a href="/post/git-branch">Git 브랜치 전략 완전 정리</a></li>
        <li><a href="/post/git-commit">좋은 커밋 메시지 작성법</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <address>
      <a href="mailto:contact@myblog.com">contact@myblog.com</a>
    </address>
    <p><small>&copy; 2015 GHW Dev Blog</small></p>
  </footer>

</body>
</html>
```

---

## 정리

| 태그 | 핵심 용도 |
|------|----------|
| `<aside>` | 본문 보충 정보, 사이드바, 관련 링크 |
| `<figure>` | 이미지/코드/인용문을 설명과 묶기 |
| `<figcaption>` | figure의 설명 텍스트 |
| `<time>` | 날짜·시간 (datetime 속성 필수) |
| `<address>` | 작성자·운영자 연락처 |
| `<details>` + `<summary>` | 순수 HTML 아코디언 |
| `<abbr>` | 약어 전체 의미 표시 |
| `<mark>` | 형광펜 하이라이트 |

다음 글에서는 폼 태그 심화 (select, textarea, fieldset, datalist)를 다룹니다.
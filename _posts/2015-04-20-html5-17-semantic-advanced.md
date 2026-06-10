---
layout: post
title: "VS Code Emmet — HTML을 작성하는 단축 문법"
description: "HTML을 타이핑하는 게 느리다고 느껴질 때가 있나요? VS Code의 Emmet 기능으로 ! + Tab, div>p*3, lorem 같은 단축 문법을 쓰면 작성 속도가 2배 이상 빨라집니다. 기호별 사용법과 실전 예제를 설명했습니다."
date: 2015-04-20 12:00:00 +0900
category: html
level: beginner
tags: [html, emmet, vscode, 생산성, 코딩속도]
lang: ko
---

VS Code로 HTML을 작성할 때 태그 하나하나를 직접 입력하고 있으면 시간이 아깝습니다. Emmet은 짧은 기호를 입력하고 Tab 키를 누르면 전체 HTML 구조로 확장해주는 도구입니다. VS Code에 기본 내장되어 있어서 별도 설치가 필요 없습니다.

---

## Emmet 작동 방식

Emmet은 CSS 선택자 문법과 비슷한 기호를 사용합니다. 약어를 입력하고 `Tab` 또는 `Enter`를 누르면 HTML 코드로 변환됩니다.

```
div → <div></div>
p → <p></p>
h1 → <h1></h1>
```

`!` 하나만 치고 Tab을 누르면 HTML 기본 구조 전체가 나옵니다.

```
! ⭢ Tab

<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>

</body>
</html>
```

`lang="ko"`만 `lang="ko"`로 바꾸면 바로 쓸 수 있습니다. 매번 `<!DOCTYPE html>`부터 입력하던 걸 생각하면 시간 차이가 큽니다.

---

## 자주 쓰는 Emmet 기호

**> — 자식 요소**

```emmet
div>p>span
```

결과:

```html
<div>
  <p><span></span></p>
</div>
```

**+ — 형제 요소**

```emmet
h1+p
```

결과:

```html
<h1></h1>
<p></p>
```

**\* — 반복**

```emmet
ul>li*3
```

결과:

```html
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>
```

`*3`은 li를 세 번 반복합니다. 목록이나 카드 목록을 만들 때 자주 씁니다.

**^ — 한 단계 위로**

```emmet
div>p>span^p
```

결과:

```html
<div>
  <p><span></span></p>
  <p></p>
</div>
```

`^`는 부모 레벨로 돌아갑니다. span 다음에 `^`로 빠져나와서 형제 p를 만듭니다.

**() — 그룹**

```emmet
div>(header>h1)+section
```

결과:

```html
<div>
  <header><h1></h1></header>
  <section></section>
</div>
```

괄호로 묶으면 복잡한 구조도 한 줄로 표현할 수 있습니다.

---

## 속성과 텍스트

**.클래스명** — 클래스 추가

```emmet
div.container
```

결과:

```html
<div class="container"></div>
```

**#아이디명** — 아이디 추가

```emmet
div#main
```

결과:

```html
<div id="main"></div>
```

**{텍스트}** — 내용 채우기

```emmet
p{안녕하세요}
```

결과:

```html
<p>안녕하세요</p>
```

**[]** — 속성

```emmet
a[href="https://google.com" target="_blank"]
```

결과:

```html
<a href="https://google.com" target="_blank"></a>
```

---

## 예제

**예제 1: 내비게이션 메뉴**

```emmet
nav>ul>li*4>a[href="#"]
```

결과:

```html
<nav>
  <ul>
    <li><a href="#"></a></li>
    <li><a href="#"></a></li>
    <li><a href="#"></a></li>
    <li><a href="#"></a></li>
  </ul>
</nav>
```

**예제 2: 블로그 카드 목록**

```emmet
.post-grid>.card*3>img[src="thumb.jpg"]+h2.card-title+p.card-desc
```

결과:

```html
<div class="post-grid">
  <div class="card">
    <img src="thumb.jpg" alt="">
    <h2 class="card-title"></h2>
    <p class="card-desc"></p>
  </div>
  <div class="card">
    <img src="thumb.jpg" alt="">
    <h2 class="card-title"></h2>
    <p class="card-desc"></p>
  </div>
  <div class="card">
    <img src="thumb.jpg" alt="">
    <h2 class="card-title"></h2>
    <p class="card-desc"></p>
  </div>
</div>
```

한 줄 입력으로 50줄 가까운 HTML이 완성됩니다. 직접 반복해서 입력했다면 시간이 훨씬 더 걸렸을 겁니다.

**예제 3: 폼 구조**

```emmet
form>fieldset>legend+div*3>label+input[type="text"]
```

결과:

```html
<form action="">
  <fieldset>
    <legend></legend>
    <div><label for=""></label><input type="text" name="" id=""></div>
    <div><label for=""></label><input type="text" name="" id=""></div>
    <div><label for=""></label><input type="text" name="" id=""></div>
  </fieldset>
</form>
```

---

## lorem — 샘플 텍스트 채우기

`lorem`을 입력하고 Tab을 누르면 의미 없는 샘플 텍스트가 자동으로 채워집니다.

```emmet
p*2>lorem10
```

결과:

```html
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque, nunc.</p>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque, nunc.</p>
```

`lorem10`은 10단어, `lorem30`은 30단어짜리 텍스트가 나옵니다. 블로그 레이아웃을 만들 때 실제 데이터 없이 목업을 채울 때 유용합니다.

---

## 실제로 실행해보면 어떤 차이가 있을까?

직접 VS Code를 열고 새 HTML 파일을 만든 다음, `!`를 입력하고 Tab을 눌러보세요. 기본 구조가 1초 만에 완성됩니다. 그 다음 `div.container>h1{Hello}+p*2>lorem15`를 입력하고 Tab을 눌러보면 4~5줄의 HTML이 한 번에 생성됩니다. 직접 손으로 입력하는 것과 비교하면 작성 속도 차이가 체감될 겁니다.

---

## 핵심

- Emmet은 약어 + Tab으로 HTML을 효율적으로 확장해주는 도구입니다
- `!` + Tab으로 HTML 기본 구조 자동 생성
- `>` 자식, `+` 형제, `*` 반복, `^` 상위 이동, `()` 그룹
- `.클래스명` `#아이디명` `{텍스트}` `[속성]` 조합 가능
- `lorem` 으로 샘플 텍스트 채우기

다음 글에서는 시맨틱 태그를 실제 레이아웃에 적용하는 심화 방법을 다룹니다.


## 실전 예제로 이해하기

HTML의 VS Code Emmet 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 VS Code Emmet을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VS Code Emmet 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>VS Code Emmet에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 VS Code Emmet을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. VS Code Emmet 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 VS Code Emmet을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.

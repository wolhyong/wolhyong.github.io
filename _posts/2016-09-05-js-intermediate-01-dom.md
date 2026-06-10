---
layout: post
title: "자바스크립트 DOM 조작 - 요소 선택, 생성, 수정, 삭제 정리"
description: "자바스크립트로 DOM 요소를 선택하고, 생성하고, 스타일과 속성을 변경하는 방법을 실전 예제와 함께 학습합니다."
date: 2016-09-05 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, dom, front-end, 웹]
---

DOM(Document Object Model)은 브라우저가 HTML 문서를 구조화한 트리 구조입니다. 자바스크립트로 이 DOM을 조작하면 동적인 웹 페이지를 만들 수 있습니다.

## 요소 선택하기

```javascript
// 가장 많이 사용되는 선택 메서드
const el = document.querySelector(".my-class");     // 첫 번째 매칭 요소
const all = document.querySelectorAll(".item");     // 모든 매칭 요소 ( NodeList )

// ID로 선택 (빠름, 고유값)
const header = document.getElementById("header");

// 클래스로 선택
const items = document.getElementsByClassName("item"); // HTMLCollection 반환
```

`querySelector`는 CSS 선택자를 그대로 사용할 수 있어 가장 편리합니다. `querySelectorAll`은 정적 NodeList를 반환하여 forEach 사용이 가능합니다.

## 텍스트와 HTML 변경

```javascript
const box = document.querySelector(".box");

box.textContent = "새 텍스트";        // 텍스트만 변경 (XSS 안전)
box.innerHTML = "<strong>굵은 글씨</strong>"; // HTML 포함 (XSS 주의!)
box.innerText = "보이는 텍스트만";      // CSS로 숨긴 텍스트는 제외
```

**보안 주의**: 사용자 입력값을 `innerHTML`에 삽입하면 XSS 공격에 취약합니다. 반드시 `textContent`를 사용하거나, HTML을 이스케이프한 후 삽입하세요.

## 속성과 스타일 조작

```javascript
const link = document.querySelector("a");

// 속성
link.getAttribute("href");
link.setAttribute("target", "_blank");
link.classList.add("active");
link.classList.toggle("hidden");
link.classList.contains("active"); // true/false

// 스타일 (인라인)
link.style.color = "red";
link.style.fontSize = "16px";

// CSS 클래스로 스타일 변경 (권장)
link.classList.add("styled-link");
```

인라인 스타일 대신 CSS 클래스를 추가/제거하는 방식이 유지보수에 유리합니다.

## 요소 생성과 삽입

```javascript
// 새 요소 생성
const newDiv = document.createElement("div");
newDiv.textContent = "새로운 항목";
newDiv.classList.add("card");

// DOM에 삽입
const container = document.querySelector(".container");
container.appendChild(newDiv);          // 마지막 자식으로 추가
container.prepend(newDiv);              // 첫 번째 자식으로 추가
container.insertBefore(newDiv, ref);    // 특정 요소 앞에 삽입

// 요소 제거
newDiv.remove();
```

## 실전 예제 — 동적 리스트

```javascript
const input = document.querySelector("#item-input");
const btn = document.querySelector("#add-btn");
const list = document.querySelector("#item-list");

btn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;

  const li = document.createElement("li");
  li.textContent = text;
  li.addEventListener("click", () => li.remove());
  list.appendChild(li);
  input.value = "";
});
```

## 마무리

- **`querySelector`** 를 기본으로 사용하고, 성능이 중요한 곳에서 ID 선택자를 활용하세요
- **`textContent`** 를 기본으로, HTML 삽입이 꼭 필요할 때만 `innerHTML`을 사용하세요
- DOM 조작은 비용이 비싸므로, 가능하면 **한 번에 여러 요소를 변경**하세요
- **이벤트 리스너**는 다음 수업에서 자세히 다룹니다

다음 수업에서는 이벤트 처리와 이벤트 위임 패턴을 학습합니다!

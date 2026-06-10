---
layout: post
title: "자바스크립트 이벤트 처리 - 리스너, 이벤트 위임, 버블링 정리"
description: "자바스크립트 이벤트 리스너 등록, 이벤트 위임 패턴, 버블링과 캡처링, 커스텀 이벤트까지 실전 예제와 함께 학습합니다."
date: 2016-09-12 10:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, events, front-end, 웹]
---

이벤트는 사용자의 상호작용(클릭, 키보드 입력, 스크롤 등)을 프로그래밍적으로 처리하는 메커니즘입니다. 이벤트 처리를 제대로 이해해야 인터랙티브한 웹 앱을 만들 수 있습니다.

## 이벤트 리스너 등록

```javascript
const btn = document.querySelector("#my-btn");

// addEventListener — 가장 권장되는 방식
btn.addEventListener("click", function(event) {
  console.log("클릭됨!", event.target);
});

// 한 번만 실행되는 리스너
btn.addEventListener("click", handler, { once: true });

// 제거
btn.removeEventListener("click", handler);
```

`onclick` 속성 대신 `addEventListener`를 사용하는 것이 좋습니다. 여러 리스너를 등록할 수 있고, 옵션(once, passive 등)을 설정할 수 있기 때문입니다.

## 이벤트 객체 (Event Object)

```javascript
document.addEventListener("keydown", (e) => {
  console.log(e.key);        // 눌린 키 값 ("a", "Enter" 등)
  console.log(e.code);       // 물리적 키 코드 ("KeyA")
  console.log(e.ctrlKey);    // Ctrl 키 눌림 여부
  console.log(e.preventDefault()); // 기본 동작 중단
});
```

## 버블링과 캡처링

이벤트는 DOM 트리를 두 번 traversal합니다:
1. **캡처링** (위 → 아래): 루트에서 대상 요소까지 전파
2. **버블링** (아래 → 위): 대상 요소에서 루트까지 전파

```javascript
// 버블링 단계에서 처리 (기본값)
parent.addEventListener("click", () => console.log("부모"));

// 캡처링 단계에서 처리
parent.addEventListener("click", () => console.log("부모"), true);
```

## 이벤트 위임 (Event Delegation)

여러 자식 요소에 각각 리스너를 달 대신, 부모 한 곳에 달아 처리하는 패턴입니다.

```javascript
// ❌ 비효율적 — 자식마다 리스너 등록
document.querySelectorAll("li").forEach(li => {
  li.addEventListener("click", handleClick);
});

// ✅ 이벤트 위임 — 부모 한 곳에 리스너
const list = document.querySelector("#list");
list.addEventListener("click", (e) => {
  const li = e.target.closest("li"); // 가장 가까운 li 찾기
  if (!li || !list.contains(li)) return;
  handleClick(li);
});
```

동적으로 요소가 추가/제거되는 상황에서 이벤트 위임은 필수적입니다.

## 실전 팁

```javascript
// 이벤트 전파 중단
e.stopPropagation();

// 기본 동작 중단 (예: 링크 이동, 폼 제출)
e.preventDefault();

// passive 리스너 (스크롤 성능 최적화)
window.addEventListener("scroll", onScroll, { passive: true });
```

## 마무리

- **`addEventListener`** 를 기본으로 사용하세요
- **이벤트 위임**으로 동적 요소 처리와 메모리 사용량을 최적화하세요
- **`e.preventDefault()`** 로 폼 제출, 링크 이동 등의 기본 동작을 제어하세요
- **`e.stopPropagation()`** 은 불필요한 전파를 차단할 때만 사용하세요

다음 수업에서는 비동기 프로그래밍의 기초 개념을 학습합니다!

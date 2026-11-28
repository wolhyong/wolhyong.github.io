---
layout: post
title: "자바스크립트 DOM과 이벤트 — 요소 조작, 이벤트 위임, 웹 스토리지"
description: "DOM 요소를 선택하고 만들고 지우는 방법, textContent와 innerHTML의 차이, 이벤트 버블링과 위임 패턴, localStorage·IndexedDB 선택 기준을 예제로 정리했습니다."
date: 2026-11-28 11:00:00 +0900
category: javascript
level: intermediate
tags: [javascript, dom, 이벤트, 이벤트위임, localStorage, 웹스토리지]
---

브라우저에서 자바스크립트가 하는 일은 대부분 두 가지입니다. DOM을 읽고 바꾸는 일, 그리고 사용자의 입력을 받아 처리하는 일입니다. 이 글은 그 두 가지와, 화면 상태를 브라우저에 남기는 스토리지를 함께 정리합니다.

2016년에 올린 DOM 조작, 이벤트 처리, 웹 스토리지 글 세 편을 합치고, 지금 브라우저에서 달라진 부분을 반영했습니다.

## DOM이란

브라우저는 HTML 문서를 읽어서 트리 구조의 객체로 만듭니다. 이것이 DOM(Document Object Model)입니다. 자바스크립트는 이 트리를 읽고 수정함으로써 화면을 바꿉니다. HTML 파일을 다시 쓰는 것이 아니라 메모리의 트리를 바꾸는 것입니다.

```html
<ul id="list">
  <li class="item">첫째</li>
  <li class="item">둘째</li>
</ul>
```

```javascript
const list = document.getElementById("list");
list.children.length;        // 2
list.firstElementChild.textContent; // "첫째"
```

## 요소 선택

```javascript
// CSS 선택자 — 가장 많이 씀
document.querySelector(".card");        // 첫 번째 일치
document.querySelectorAll(".card");     // 모든 일치 (NodeList)

// ID
document.getElementById("header");

// 태그
document.getElementsByTagName("li");    // HTMLCollection (live)
```

`querySelectorAll()`은 정적 NodeList를 반환합니다. 선택한 뒤에 DOM이 바뀌어도 목록은 그대로입니다. `getElementsByClassName()`이나 `getElementsByTagName()`은 live 컬렉션이라 DOM 변경이 즉시 반영됩니다. 반복문 안에서 DOM을 바꾼다면 이 차이 때문에 무한 루프가 생길 수 있으므로, 요즘은 `querySelectorAll()`을 쓰는 편이 안전합니다.

```javascript
const items = document.querySelectorAll(".item");
items.forEach((el) => console.log(el.textContent)); // NodeList는 forEach 지원

// 배열 메서드를 쓰려면 변환
const arr = Array.from(items);
arr.filter((el) => el.dataset.active === "true");
```

가장 가까운 부모를 찾을 때는 `closest()`를 씁니다. 이벤트 위임에서 핵심적인 메서드입니다.

```javascript
const li = event.target.closest("li");
if (li) { /* li를 찾음 */ }

el.matches(".item.active"); // 선택자 일치 여부
```

## 텍스트와 HTML

```javascript
const box = document.querySelector(".box");

box.textContent = "새 텍스트";          // 텍스트로만 삽입
box.innerHTML = "<strong>굵게</strong>"; // HTML로 해석
box.innerText = "보이는 텍스트";         // 렌더링된 텍스트 (숨긴 요소 제외)
```

`textContent`는 태그를 문자 그대로 넣고, `innerHTML`은 파싱해서 DOM으로 만듭니다. 사용자 입력을 `innerHTML`에 넣으면 XSS가 됩니다.

```javascript
// ❌ 사용자 입력을 그대로
commentEl.innerHTML = userInput;

// ✅ 텍스트로
commentEl.textContent = userInput;

// ✅ HTML이 꼭 필요하면 살균 라이브러리 사용
commentEl.innerHTML = DOMPurify.sanitize(userInput);
```

`innerText`는 화면에 보이는 텍스트만 읽습니다. CSS로 숨긴 요소는 빠지고, 읽는 순간 레이아웃을 계산하므로 반복해서 호출하면 느립니다. 값만 필요하면 `textContent`를 씁니다.

## 속성, 클래스, 스타일

```javascript
const link = document.querySelector("a");

link.getAttribute("href");
link.setAttribute("target", "_blank");
link.removeAttribute("target");

link.classList.add("active");
link.classList.remove("hidden");
link.classList.toggle("open");
link.classList.contains("active"); // true/false

link.dataset.id;         // data-id 값
link.dataset.postId;     // data-post-id → postId (카멜케이스)
```

스타일은 인라인으로 넣기보다 클래스를 바꾸는 편이 유지보수에 좋습니다.

```javascript
// ❌ 값이 바뀔 때마다 JS를 고쳐야 함
el.style.backgroundColor = "#1f6feb";

// ✅ 상태는 클래스로, 표현은 CSS로
el.classList.add("is-active");
```

`data-*` 속성은 문자열만 저장합니다. 숫자로 쓰려면 변환이 필요합니다.

```javascript
el.dataset.count = 3;
typeof el.dataset.count;        // "string"
Number(el.dataset.count) + 1;   // 4
```

## 요소 만들기와 지우기

```javascript
const card = document.createElement("div");
card.className = "card";
card.textContent = "새 카드";

const container = document.querySelector(".container");
container.append(card);      // 마지막 자식으로
container.prepend(card);     // 첫 자식으로
card.before(other);          // card 앞에
card.after(other);           // card 뒤에
card.remove();               // 제거
```

여러 요소를 만들 때는 `DocumentFragment`에 모아 한 번에 붙입니다. 붙일 때마다 레이아웃을 다시 계산하는 비용을 줄일 수 있습니다.

```javascript
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `항목 ${i}`;
  fragment.append(li);
}
list.append(fragment); // DOM 반영은 한 번

// 기존 내용을 통째로 교체
list.replaceChildren(fragment);
```

HTML 문자열을 조합해서 넣어야 한다면 `insertAdjacentHTML()`을 씁니다. `innerHTML +=`는 기존 요소를 전부 다시 만들어 이벤트 리스너와 입력 상태를 잃습니다.

```javascript
// ❌ 기존 리스너가 모두 사라짐
list.innerHTML += "<li>새 항목</li>";

// ✅ 기존 DOM 유지
list.insertAdjacentHTML("beforeend", "<li>새 항목</li>");
```

## 폼 값 다루기

```javascript
const form = document.querySelector("#signup");

form.addEventListener("submit", (e) => {
  e.preventDefault();                    // 페이지 이동 막기
  const data = new FormData(form);
  const name = data.get("name");
  const agree = data.get("agree") === "on";
  console.log({ name, agree });
});
```

`type="button"`을 생략한 버튼은 폼을 제출합니다. 폼 안에서 일반 버튼을 만들 때는 반드시 `type="button"`을 적습니다.

## 이벤트

```javascript
const button = document.querySelector("#save");

function handleClick(event) {
  console.log(event.type, event.target);
}

button.addEventListener("click", handleClick);
button.removeEventListener("click", handleClick);
```

`onclick` 속성보다 `addEventListener`를 씁니다. 같은 이벤트에 여러 리스너를 붙일 수 있고, 옵션을 지정할 수 있습니다.

```javascript
button.addEventListener("click", handler, { once: true });   // 한 번만
window.addEventListener("scroll", onScroll, { passive: true }); // 스크롤 성능
parent.addEventListener("click", handler, { capture: true });   // 캡처 단계
```

`passive: true`는 "이 리스너는 `preventDefault()`를 호출하지 않는다"는 선언입니다. 브라우저가 스크롤을 기다리지 않고 바로 처리할 수 있어 스크롤이 부드러워집니다.

### 이벤트 객체

```javascript
document.addEventListener("keydown", (e) => {
  e.key;        // "a", "Enter", "Escape"
  e.code;       // "KeyA" — 물리 키 위치
  e.ctrlKey;    // Ctrl 조합 여부
  e.repeat;     // 키를 누르고 있을 때 반복 여부
});

input.addEventListener("input", (e) => {
  e.target.value; // 입력 중인 값
});
```

`key`는 배열에 따라 값이 바뀌고(한글 입력 등), `code`는 물리 키 위치라 게임 조작이나 단축키에 적합합니다.

### 버블링과 캡처링

이벤트는 document에서 대상까지 내려갔다가(캡처링) 다시 올라옵니다(버블링).

```javascript
document.querySelector("#outer").addEventListener("click", () => console.log("outer"));
document.querySelector("#inner").addEventListener("click", () => console.log("inner"));

// #inner를 클릭하면: inner → outer
```

`e.target`은 실제로 클릭된 요소, `e.currentTarget`은 리스너가 붙은 요소입니다. 이 차이를 놓치면 엉뚱한 요소를 조작하게 됩니다.

```javascript
list.addEventListener("click", (e) => {
  console.log(e.target);        // 실제 클릭된 span이나 li
  console.log(e.currentTarget); // 항상 list
});
```

### 이벤트 위임

자식마다 리스너를 붙이지 않고 부모에 하나만 붙여 처리하는 패턴입니다. 요소가 동적으로 추가·삭제되어도 동작합니다.

```javascript
// ❌ 항목이 늘어날 때마다 리스너가 늘어남
document.querySelectorAll("li").forEach((li) => {
  li.addEventListener("click", () => li.classList.toggle("done"));
});

// ✅ 부모에 하나
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li || !list.contains(li)) return;
  li.classList.toggle("done");
});
```

`closest()`로 가장 가까운 `li`를 찾고, 목록 밖에서 발생한 이벤트는 `contains()`로 걸러냅니다.

### preventDefault와 stopPropagation

```javascript
form.addEventListener("submit", (e) => {
  e.preventDefault();    // 폼 제출, 링크 이동 같은 기본 동작 취소
});

dropdown.addEventListener("click", (e) => {
  e.stopPropagation();   // 부모로의 전파 차단 (바깥 클릭 닫기 등)
});
```

두 메서드는 하는 일이 다릅니다. `preventDefault()`는 브라우저 기본 동작을 막고, `stopPropagation()`은 이벤트가 부모로 퍼지는 것을 막습니다.

### 커스텀 이벤트

컴포넌트끼리 상태를 알릴 때 씁니다.

```javascript
const event = new CustomEvent("cart:add", {
  detail: { id: 42, quantity: 1 },
  bubbles: true,
});
document.querySelector("#add").dispatchEvent(event);

document.addEventListener("cart:add", (e) => {
  console.log(e.detail.id); // 42
});
```

### 스크립트 실행 시점

`<head>`에서 스크립트를 불러오면 아직 DOM이 만들어지지 않아 `querySelector`가 `null`을 돌려줍니다.

```html
<!-- ✅ defer — DOM 파싱 후 순서대로 실행 -->
<script src="/app.js" defer></script>

<!-- ✅ type="module" — 기본이 defer -->
<script type="module" src="/app.js"></script>
```

`defer`가 없으면 `DOMContentLoaded` 이후로 실행을 미뤄야 합니다.

```javascript
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").textContent = "준비됨";
});
```

## 웹 스토리지

브라우저에 데이터를 남기는 방법은 여러 가지입니다.

| 저장소 | 수명 | 용량 | 특징 |
|--------|------|------|------|
| `localStorage` | 직접 지울 때까지 | 5~10MB | 동기, 문자열만 |
| `sessionStorage` | 탭을 닫을 때까지 | 5MB | 동기, 탭마다 분리 |
| IndexedDB | 직접 지울 때까지 | 기기 여유 공간만큼 | 비동기, 구조화 데이터 |
| Cookie | 만료일까지 | 4KB | 모든 요청에 자동 전송 |

### localStorage

```javascript
localStorage.setItem("theme", "dark");
localStorage.setItem("user", JSON.stringify({ name: "홍길동" }));

const theme = localStorage.getItem("theme");          // "dark"
const user = JSON.parse(localStorage.getItem("user")); // 객체

localStorage.removeItem("theme");
localStorage.clear();
```

문자열만 저장되므로 객체는 JSON으로 바꿉니다. `JSON.parse(null)`은 `null`을 돌려주지만, 저장된 값이 깨진 JSON이면 예외가 납니다.

```javascript
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
```

시크릿 모드나 용량 초과에서는 `setItem`이 예외로 실패합니다.

```javascript
try {
  localStorage.setItem("draft", bigText);
} catch (err) {
  if (err.name === "QuotaExceededError") {
    console.warn("저장 공간이 부족합니다");
  }
}
```

### 다크 모드 저장 예제

```javascript
const KEY = "theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function initTheme() {
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved ?? (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(KEY, next);
}

initTheme();
```

화면이 그려진 뒤에 테마를 적용하면 잠깐 밝은 화면이 보입니다. `<head>` 안의 인라인 스크립트에서 `localStorage`를 읽어 `data-theme`을 먼저 지정하면 이 깜빡임을 줄일 수 있습니다.

### 탭 간 동기화

`storage` 이벤트는 값을 바꾼 탭이 아니라 **다른 탭**에서 발생합니다.

```javascript
window.addEventListener("storage", (e) => {
  if (e.key === "theme") applyTheme(e.newValue);
});
```

### sessionStorage

```javascript
sessionStorage.setItem("step", "2");
sessionStorage.getItem("step");
```

같은 탭 안에서만 유지됩니다. 새 탭, 새 창에서는 비어 있습니다. 여러 단계 폼의 임시 입력값처럼 탭을 닫으면 사라져야 하는 데이터에 맞습니다.

### IndexedDB

구조화된 데이터를 대량으로 다룰 때 씁니다. 모든 작업이 비동기입니다.

```javascript
const request = indexedDB.open("blog", 1);

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
};

request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction("posts", "readwrite");
  tx.objectStore("posts").put({ id: 1, title: "첫 글" });
};
```

트랜잭션은 대기 중인 요청이 끝나면 자동으로 커밋됩니다. `await`로 다른 비동기 작업을 끼워 넣으면 `TransactionInactiveError`가 날 수 있으므로, 콜백 안에서 요청을 이어 붙이거나 `idb` 같은 라이브러리를 씁니다.

## 자주 틀리는 부분

**1. 스크립트가 요소를 못 찾음**

```javascript
// null.textContent → TypeError
document.querySelector("#app").textContent = "...";
```

`defer`를 쓰거나 `DOMContentLoaded` 뒤로 옮깁니다. 선택자 오타도 흔한 원인입니다.

**2. 동적으로 추가한 요소에 리스너가 안 붙음**

`querySelectorAll()`은 실행 시점의 요소만 담습니다. 이후에 추가된 요소에는 리스너가 없습니다. 이벤트 위임으로 해결합니다.

**3. `innerHTML`로 넣은 요소의 이벤트**

문자열로 넣은 HTML의 인라인 `onclick`은 동작하지만, 보안상 권장하지 않습니다. 넣은 뒤 `querySelector`로 찾아 리스너를 붙이거나 위임을 씁니다.

**4. `e.target`과 `e.currentTarget` 혼동**

```javascript
list.addEventListener("click", (e) => {
  e.target.closest("li")?.classList.toggle("done"); // target 기준
});
```

**5. 스크롤 이벤트에서 `preventDefault` 경고**

```javascript
// "Unable to preventDefault inside passive event listener"
window.addEventListener("touchmove", handler, { passive: false });
```

기본값이 passive인 이벤트가 있습니다. `preventDefault()`가 필요하면 `passive: false`를 명시합니다.

**6. 폼 제출 후 페이지 새로고침**

`submit` 핸들러에서 `e.preventDefault()`를 빠뜨린 경우입니다.

## 정리

- 선택은 `querySelector`/`querySelectorAll`로 통일하고, 부모 탐색은 `closest()`를 씁니다.
- 텍스트는 `textContent`, HTML이 꼭 필요하면 살균 후 `innerHTML`을 씁니다.
- 요소를 여러 개 붙일 때는 `DocumentFragment`로 모아 한 번에 반영합니다.
- 동적 요소의 이벤트는 부모에 하나만 붙이는 이벤트 위임으로 처리합니다.
- 화면 설정은 `localStorage`, 탭 단위 임시 값은 `sessionStorage`, 큰 구조 데이터는 IndexedDB가 맞습니다.

다음 글에서는 [자바스크립트 비동기 처리](/2026/11/28/javascript-async/)에서 이벤트 루프, Promise, `async/await`, `fetch`를 다룹니다.

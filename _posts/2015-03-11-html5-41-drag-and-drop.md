---
layout: post
title: "Drag and Drop API 완전 정리 — 드래그 가능한 UI와 파일 드래그 구현"
description: "HTML5 Drag and Drop API로 드래그 가능한 UI를 만드는 방법을 정리합니다. draggable 속성, dragstart·dragover·drop 이벤트, DataTransfer 객체로 데이터 전달, 드래그 앤 드롭 파일 업로드, 칸반 보드 구현 예제까지 다룹니다."
date: 2015-03-11 09:00:00 +0900
category: html
level: advanced
series: "HTML/CSS 처음부터 끝까지"
series_order: 41
tags: [html5, DragAndDrop, draggable, DataTransfer, 파일업로드, 칸반, 드래그UI]
lang: ko
---

카드 순서 변경, 파일 끌어다 놓기, 칸반 보드처럼 드래그 앤 드롭 인터랙션이 필요한 UI가 많습니다. HTML5 Drag and Drop API로 네이티브 드래그 동작을 구현하는 방법을 정리합니다.

---

## 드래그 이벤트 흐름

```
드래그 시작: dragstart (draggable 요소)
드래그 중:   drag       (draggable 요소, 지속 발생)
드롭 존 진입: dragenter (드롭 대상)
드롭 존 위:  dragover   (드롭 대상, 지속 발생) ← preventDefault 필수
드롭 존 이탈: dragleave (드롭 대상)
드롭:        drop       (드롭 대상)
드래그 종료: dragend    (draggable 요소)
```

---

## 기본 드래그 앤 드롭

```html
<div id="drag-item" draggable="true">드래그하세요</div>
<div id="drop-zone">여기에 드롭하세요</div>
```

```javascript
const dragItem = document.getElementById('drag-item');
const dropZone = document.getElementById('drop-zone');

// 드래그 시작 — DataTransfer에 데이터 저장
dragItem.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', '이동할 데이터');
  e.dataTransfer.effectAllowed = 'move'; // copy | move | link | none
  dragItem.classList.add('dragging');
});

dragItem.addEventListener('dragend', () => {
  dragItem.classList.remove('dragging');
});

// 드롭 존 — dragover에서 preventDefault 필수 (드롭 허용 신호)
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const data = e.dataTransfer.getData('text/plain');
  dropZone.textContent = `드롭됨: ${data}`;
});
```

```css
.dragging { opacity: 0.4; cursor: grabbing; }
.drag-over { border: 2px dashed #58a6ff; background: #1f2d3d; }
```

---

## 리스트 아이템 순서 변경

```html
<ul id="sortable-list">
  <li draggable="true" data-id="1">HTML 기초</li>
  <li draggable="true" data-id="2">CSS 기초</li>
  <li draggable="true" data-id="3">JavaScript 기초</li>
  <li draggable="true" data-id="4">React 입문</li>
</ul>
```

```javascript
const list = document.getElementById('sortable-list');
let draggedItem = null;

list.addEventListener('dragstart', (e) => {
  draggedItem = e.target.closest('li');
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => draggedItem.classList.add('dragging'), 0);
});

list.addEventListener('dragend', () => {
  draggedItem.classList.remove('dragging');
  draggedItem = null;
});

list.addEventListener('dragover', (e) => {
  e.preventDefault();
  const target = e.target.closest('li');
  if (!target || target === draggedItem) return;

  // 드래그 중인 아이템을 타겟 앞뒤로 이동
  const rect = target.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  if (e.clientY < midY) {
    list.insertBefore(draggedItem, target);
  } else {
    list.insertBefore(draggedItem, target.nextSibling);
  }
});
```

---

## 파일 드래그 앤 드롭 업로드

```html
<div id="file-drop-zone">
  <p>파일을 여기에 드래그하거나</p>
  <label>
    직접 선택
    <input type="file" id="file-input" multiple hidden>
  </label>
</div>
<ul id="file-list"></ul>
```

```javascript
const zone = document.getElementById('file-drop-zone');
const fileList = document.getElementById('file-list');

// 드래그 이벤트
zone.addEventListener('dragover', (e) => {
  e.preventDefault();
  zone.classList.add('active');
});

zone.addEventListener('dragleave', () => zone.classList.remove('active'));

zone.addEventListener('drop', (e) => {
  e.preventDefault();
  zone.classList.remove('active');
  handleFiles(e.dataTransfer.files);
});

// 파일 선택 버튼
document.getElementById('file-input').addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(fileList_) {
  Array.from(fileList_).forEach(file => {
    // 파일 유효성 검사
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`${file.name}: 파일 크기가 10MB를 초과합니다.`);
      return;
    }

    const li = document.createElement('li');
    li.textContent = `${file.name} (${formatSize(file.size)})`;
    fileList.appendChild(li);

    // 이미지 미리보기
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100px';
        li.prepend(img);
      };
      reader.readAsDataURL(file);
    }

    // 실제 업로드
    uploadFile(file);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    console.log('업로드 완료:', result.url);
  } catch (err) {
    console.error('업로드 실패:', err);
  }
}
```

---

## DataTransfer 주요 속성

```javascript
dragItem.addEventListener('dragstart', (e) => {
  const dt = e.dataTransfer;

  // 여러 형식으로 데이터 저장
  dt.setData('text/plain', '텍스트 데이터');
  dt.setData('text/html', '<strong>HTML 데이터</strong>');
  dt.setData('application/json', JSON.stringify({ id: 42, title: '글 제목' }));

  // 커스텀 드래그 이미지
  const ghost = document.createElement('div');
  ghost.textContent = '이동 중...';
  ghost.style.cssText = 'position:absolute; top:-100px; background:#161b22; padding:8px; border-radius:4px; color:#c9d1d9;';
  document.body.appendChild(ghost);
  dt.setDragImage(ghost, 0, 0);
  setTimeout(() => ghost.remove(), 0);
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const dt = e.dataTransfer;

  // 드롭된 형식 확인
  console.log('드롭 형식:', dt.types); // ['text/plain', 'text/html', ...]

  // 원하는 형식의 데이터 꺼내기
  const json = dt.getData('application/json');
  if (json) {
    const data = JSON.parse(json);
    console.log('게시물 ID:', data.id);
  }
});
```

---

## 접근성 주의사항

Drag and Drop은 키보드 사용자와 모바일 터치 사용자가 접근하기 어렵습니다. 반드시 대체 수단을 함께 제공해야 합니다.

```html
<!-- 순서 변경: 드래그 외에 버튼으로도 가능하게 -->
<li draggable="true">
  <span>아이템 내용</span>
  <div class="order-controls" aria-label="순서 변경">
    <button onclick="moveUp(this)" aria-label="위로 이동">↑</button>
    <button onclick="moveDown(this)" aria-label="아래로 이동">↓</button>
  </div>
</li>
```

---

## 정리

- `draggable="true"` 속성으로 요소를 드래그 가능하게 만듭니다
- `dragover`에서 `preventDefault()`를 호출해야 `drop` 이벤트가 발생합니다
- `DataTransfer`로 드래그 중인 데이터를 저장하고 드롭 시 꺼냅니다
- `e.dataTransfer.files`로 드래그된 파일 목록에 접근합니다
- 키보드/터치 대체 수단을 반드시 함께 제공합니다

다음 글에서는 File API — 파일 읽기, 미리보기, 업로드 처리를 다룹니다.
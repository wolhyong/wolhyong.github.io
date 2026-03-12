---
layout: post
title: "HTML5 SVG 기초 — 인라인 SVG로 벡터 그래픽 만들기 완전 정리"
description: "HTML에 SVG를 삽입하는 방법과 기본 도형 요소(rect, circle, line, path, polygon)를 그리는 방법을 정리합니다. SVG와 Canvas의 차이, viewBox 개념, CSS로 SVG 스타일링, 애니메이션, 실전 아이콘 제작 예제까지 다룹니다."
date: 2015-02-12 09:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 27
tags: [html5, SVG, 벡터그래픽, viewBox, path, 아이콘, CSS애니메이션]
lang: ko
---

SVG(Scalable Vector Graphics)는 수학적 좌표로 정의된 벡터 그래픽입니다. 아무리 확대해도 깨지지 않고, 파일 크기가 작으며, CSS와 JavaScript로 제어할 수 있습니다. 로고, 아이콘, 차트, 일러스트에 적합합니다.

---

## SVG vs Canvas 비교

| 항목 | SVG | Canvas |
|------|-----|--------|
| 렌더링 방식 | 벡터 (수학적 도형) | 래스터 (픽셀) |
| 확대 시 | 깨지지 않음 | 픽셀이 보임 |
| DOM 접근 | 가능 (각 요소 조작) | 불가 (픽셀 덩어리) |
| 이벤트 | 요소별 이벤트 가능 | 좌표로 계산 필요 |
| 적합 | 아이콘, 차트, 로고 | 게임, 이미지 편집, 복잡한 애니메이션 |
| 성능 | 요소 많으면 느려짐 | 요소 많아도 빠름 |

---

## SVG 삽입 방법

**인라인 SVG (권장)**

```html
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#58a6ff"/>
</svg>
```

CSS, JavaScript 접근이 자유롭고 HTTP 요청이 없어 빠릅니다.

**img 태그로 삽입**

```html
<img src="icon.svg" alt="아이콘" width="24" height="24">
```

CSS/JS 제어가 불가하지만 캐싱에 유리합니다.

**CSS background-image**

```css
.icon { background-image: url('icon.svg'); }
```

---

## viewBox 이해하기

`viewBox`는 SVG 내부 좌표계를 정의합니다.

```html
<svg width="200" height="200" viewBox="0 0 100 100">
  <!-- 내부에서는 100x100 좌표계로 그림 -->
  <!-- 실제 화면에는 200x200으로 표시 -->
  <circle cx="50" cy="50" r="40" fill="#58a6ff"/>
</svg>
```

`viewBox="minX minY width height"` 형태입니다. `width`와 `height` 속성을 바꿔도 viewBox 기준 좌표계는 그대로입니다. 이 덕분에 아이콘 크기를 CSS로 자유롭게 조절할 수 있습니다.

```html
<!-- viewBox="0 0 24 24"로 아이콘 제작 후 크기는 자유롭게 -->
<svg width="16" height="16" viewBox="0 0 24 24">...</svg>
<svg width="32" height="32" viewBox="0 0 24 24">...</svg>
<svg width="64" height="64" viewBox="0 0 24 24">...</svg>
```

---

## 기본 도형 요소

**rect — 사각형**

```html
<svg width="200" height="150" viewBox="0 0 200 150">
  <!-- x, y: 왼쪽 위 꼭짓점, width, height: 크기 -->
  <rect x="20" y="20" width="160" height="110"
        fill="#161b22" stroke="#30363d" stroke-width="2"
        rx="8" ry="8"/>  <!-- rx, ry: 모서리 둥글기 -->
</svg>
```

**circle — 원**

```html
<circle cx="100" cy="75" r="50" fill="#58a6ff" opacity="0.8"/>
```

**ellipse — 타원**

```html
<ellipse cx="100" cy="75" rx="80" ry="50" fill="#d29922"/>
```

**line — 선**

```html
<line x1="20" y1="20" x2="180" y2="130"
      stroke="#f85149" stroke-width="3" stroke-linecap="round"/>
```

**polyline — 연결된 선**

```html
<polyline points="20,130 60,30 100,90 140,40 180,120"
          fill="none" stroke="#3fb950" stroke-width="2"/>
```

**polygon — 닫힌 다각형**

```html
<!-- 별 모양 -->
<polygon points="100,10 120,70 180,70 130,110 150,170 100,140 50,170 70,110 20,70 80,70"
         fill="#d29922" stroke="#b08800" stroke-width="1"/>
```

---

## path — 가장 강력한 도형

모든 도형을 표현할 수 있는 범용 명령어입니다.

```html
<path d="M 50 150 L 150 50 L 250 150 Z"
      fill="none" stroke="#58a6ff" stroke-width="3"/>
```

**path d 속성의 주요 명령어**

| 명령어 | 의미 | 예시 |
|--------|------|------|
| `M x y` | Move to (이동) | `M 50 100` |
| `L x y` | Line to (선) | `L 200 100` |
| `H x` | Horizontal line | `H 200` |
| `V y` | Vertical line | `V 150` |
| `C` | Cubic Bezier | 곡선 |
| `A rx ry x-rot laf sf x y` | Arc | 호 |
| `Z` | Close path | `Z` |

대문자는 절대 좌표, 소문자는 상대 좌표입니다.

실제 복잡한 path는 Figma, Illustrator 같은 도구에서 내보내기로 생성합니다.

---

## text — SVG 텍스트

```html
<svg width="300" height="100" viewBox="0 0 300 100">
  <text
    x="150" y="60"
    font-family="Noto Sans KR, sans-serif"
    font-size="24"
    font-weight="bold"
    text-anchor="middle"    <!-- left | middle | right -->
    dominant-baseline="middle"
    fill="#c9d1d9">
    SVG 텍스트
  </text>
</svg>
```

---

## CSS로 SVG 스타일링

인라인 SVG는 CSS로 직접 스타일을 줄 수 있습니다.

```html
<svg width="24" height="24" viewBox="0 0 24 24" class="icon">
  <path class="icon-path" d="M12 2L2 7l10 5 10-5-10-5z"/>
  <path class="icon-path" d="M2 17l10 5 10-5"/>
</svg>

<style>
.icon {
  color: #58a6ff;         /* currentColor 참조용 */
  transition: color 0.2s;
}
.icon:hover {
  color: #79c0ff;
}
.icon-path {
  stroke: currentColor;   /* 부모의 color 값 사용 */
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
```

`currentColor`를 사용하면 CSS `color` 속성만 바꿔도 아이콘 색상이 연동됩니다.

---

## SVG 애니메이션

**CSS 애니메이션**

```html
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" class="pulse-circle"/>
</svg>

<style>
.pulse-circle {
  fill: #58a6ff;
  transform-origin: center;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { r: 40; opacity: 1; }
  50%       { r: 48; opacity: 0.6; }
}
</style>
```

**SMIL 애니메이션 (SVG 내장)**

```html
<circle cx="50" cy="50" r="40" fill="#58a6ff">
  <animate attributeName="r" values="40;48;40" dur="2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
</circle>
```

---

## 실습: 기술 스택 뱃지 SVG 아이콘

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>SVG 아이콘 예제</title>
  <style>
    .tech-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      background: #161b22;
      border: 1px solid #30363d;
      font-size: 14px;
      color: #c9d1d9;
    }
    .tech-badge svg { flex-shrink: 0; }
  </style>
</head>
<body>
  <!-- Python 뱃지 -->
  <span class="tech-badge">
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#3776ab"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    </svg>
    Python
  </span>

  <!-- JavaScript 뱃지 -->
  <span class="tech-badge">
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="#f7df1e"/>
      <text x="5" y="18" font-size="14" font-weight="bold" fill="#000">JS</text>
    </svg>
    JavaScript
  </span>
</body>
</html>
```

---

## 정리

- SVG는 벡터 그래픽으로 확대해도 깨지지 않습니다
- `viewBox`로 내부 좌표계를 독립적으로 관리합니다
- `rect`, `circle`, `line`, `path` 등 기본 도형 요소를 조합합니다
- 인라인 SVG는 CSS와 JavaScript로 직접 제어 가능합니다
- `currentColor`로 CSS 색상과 SVG 색상을 연동합니다

다음 글에서는 picture 태그와 반응형 이미지 — srcset, sizes를 다룹니다.
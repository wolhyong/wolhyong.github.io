---
layout: post
title: "HTML5 Canvas 기초 — 사각형, 원, 선, 텍스트 그리기"
description: "HTML5 Canvas로 그래픽을 그리는 방법은? canvas 태그와 2D Context API로 사각형·원·선·텍스트를 그리고, fill과 stroke의 차이, 그라디언트, 이미지 그리기, 간단한 애니메이션 루프까지 예제 코드와 함께 다룹니다."
date: 2015-07-20 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 29
tags: [html5, canvas, 2D그래픽, Context2D, 애니메이션, 그라디언트]
lang: ko
---

HTML5 Canvas는 JavaScript로 2D 그래픽을 직접 그릴 수 있는 API입니다. 차트, 게임, 이미지 편집기, 시각화 도구 등 여러 곳에 활용됩니다. 기초 API를 하나씩 실습합니다.

---

## canvas 태그 기본 설정

```html
<canvas id="myCanvas" width="600" height="400">
  Canvas를 지원하지 않는 브라우저입니다.
</canvas>
```

`width`와 `height`는 **반드시 HTML 속성으로** 설정합니다. CSS로 설정하면 그려지는 좌표계가 달라져서 이미지가 흐릿하게 렌더링됩니다.

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');  // 2D 렌더링 컨텍스트
```

모든 그리기는 `ctx` 객체를 통해 이루어집니다.

---

## 좌표 시스템

Canvas의 원점(0, 0)은 **왼쪽 상단**입니다. x는 오른쪽으로, y는 아래쪽으로 증가합니다.

```
(0,0) ──────────→ x
```
  |
  |
  ↓
  y
```

---
```
## 사각형 그리기

```javascript
// 채워진 사각형 (fillRect)
ctx.fillStyle = '#58a6ff';          // 채우기 색
ctx.fillRect(50, 50, 200, 100);     // x, y, 너비, 높이

// 테두리만 있는 사각형 (strokeRect)
ctx.strokeStyle = '#f85149';        // 테두리 색
ctx.lineWidth = 3;                  // 테두리 두께
ctx.strokeRect(300, 50, 200, 100);

// 사각형 지우기
ctx.clearRect(60, 60, 50, 50);      // 해당 영역을 투명하게
```

---

## 경로(Path)로 여러 도형

선과 곡선을 연결해 복잡한 도형을 만드는 방법입니다.

```javascript
// 삼각형
ctx.beginPath();          // 새 경로 시작
ctx.moveTo(300, 50);      // 시작점으로 이동
ctx.lineTo(200, 200);     // 선 그리기
ctx.lineTo(400, 200);     // 선 그리기
ctx.closePath();          // 시작점으로 닫기
ctx.fillStyle = '#3fb950';
ctx.fill();               // 내부 채우기
ctx.strokeStyle = '#238636';
ctx.lineWidth = 2;
ctx.stroke();             // 테두리 그리기
```

**선 스타일 옵션**

```javascript
ctx.lineWidth = 5;                  // 선 굵기
ctx.lineCap = 'round';              // 선 끝 모양: butt | round | square
ctx.lineJoin = 'round';             // 꺾임 모양: miter | round | bevel
ctx.setLineDash([10, 5]);           // 점선: [채움, 간격]
ctx.setLineDash([]);                // 실선으로 복원
```

---

## 원과 호 그리기

```javascript
// 원
ctx.beginPath();
ctx.arc(
  300,           // 중심 x
  200,           // 중심 y
  80,            // 반지름
  0,             // 시작 각도 (라디안)
  Math.PI * 2    // 종료 각도 (2π = 360도)
);
ctx.fillStyle = '#d29922';
ctx.fill();

// 반원 (오른쪽 반)
ctx.beginPath();
ctx.arc(300, 200, 60, -Math.PI / 2, Math.PI / 2);
ctx.stroke();

// 파이 차트 조각
ctx.beginPath();
ctx.moveTo(300, 200);
ctx.arc(300, 200, 100, 0, Math.PI * 0.6);
ctx.closePath();
ctx.fillStyle = '#58a6ff';
ctx.fill();
```

각도는 라디안 단위입니다. 도(degree)를 라디안으로 변환: `각도 * Math.PI / 180`

---

## 텍스트 그리기

```javascript
// 채워진 텍스트
ctx.font = 'bold 24px Noto Sans KR, sans-serif';
ctx.fillStyle = '#c9d1d9';
ctx.textAlign = 'center';           // left | center | right
ctx.textBaseline = 'middle';        // top | middle | bottom | alphabetic
ctx.fillText('Hello, Canvas!', 300, 200);

// 테두리 텍스트
ctx.strokeStyle = '#58a6ff';
ctx.lineWidth = 1;
ctx.strokeText('Outlined Text', 300, 250);

// 텍스트 너비 측정
const metrics = ctx.measureText('Hello');
console.log(metrics.width);        // 픽셀 너비
```

---

## 그라디언트

```javascript
// 선형 그라디언트 (왼쪽 → 오른쪽)
const linearGrad = ctx.createLinearGradient(0, 0, 600, 0);
linearGrad.addColorStop(0, '#58a6ff');
linearGrad.addColorStop(0.5, '#bc8cff');
linearGrad.addColorStop(1, '#f85149');

ctx.fillStyle = linearGrad;
ctx.fillRect(0, 0, 600, 100);

// 방사형 그라디언트 (중심에서 바깥으로)
const radialGrad = ctx.createRadialGradient(
  300, 200, 10,   // 내부 원: 중심 x, y, 반지름
  300, 200, 100   // 외부 원: 중심 x, y, 반지름
);
radialGrad.addColorStop(0, '#ffe680');
radialGrad.addColorStop(1, 'transparent');

ctx.fillStyle = radialGrad;
ctx.fillRect(200, 100, 200, 200);
```

---

## 이미지 그리기

```javascript
const img = new Image();
img.src = '/assets/images/logo.png';

img.onload = () => {
  // 원래 크기로 그리기
  ctx.drawImage(img, 50, 50);

  // 크기 지정해서 그리기
  ctx.drawImage(img, 200, 50, 100, 100);

  // 원본에서 잘라내서 그리기 (스프라이트)
  ctx.drawImage(
    img,
    0, 0, 64, 64,    // 원본 영역: sx, sy, sWidth, sHeight
    300, 50, 128, 128 // 캔버스 영역: dx, dy, dWidth, dHeight
  );
};
```

---

## 상태 저장과 복원

스타일 설정을 임시로 바꿨다가 원래대로 되돌릴 수 있습니다.

```javascript
ctx.fillStyle = '#58a6ff';
ctx.save();                    // 현재 상태 저장

ctx.fillStyle = '#f85149';     // 임시 변경
ctx.fillRect(50, 50, 100, 100);

ctx.restore();                 // 저장된 상태 복원
ctx.fillRect(200, 50, 100, 100);  // 파란색으로 그려짐
```

---

## 간단한 애니메이션

`requestAnimationFrame`으로 매 프레임마다 다시 그려서 애니메이션을 만듭니다.

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let x = 0;

function animate() {
  // 이전 프레임 지우기
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 공 그리기
  ctx.beginPath();
  ctx.arc(x, 200, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#58a6ff';
  ctx.fill();

  // 위치 업데이트
  x += 2;
  if (x > canvas.width + 30) x = -30;  // 화면 밖으로 나가면 처음으로

  requestAnimationFrame(animate);
}

animate();
```

---

## 실습: 간단한 막대 그래프

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Canvas 막대 그래프</title>
</head>
<body>
  <canvas id="chart" width="600" height="400"></canvas>
  <script>
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');

    const data = [
      { label: 'HTML', value: 85, color: '#f0883e' },
      { label: 'CSS',  value: 70, color: '#58a6ff' },
      { label: 'JS',   value: 90, color: '#d29922' },
      { label: 'React',value: 60, color: '#bc8cff' },
      { label: 'Node', value: 50, color: '#3fb950' },
    ];

    const barWidth = 80;
    const gap = 30;
    const maxHeight = 300;
    const startX = 50;
    const baseY = 370;

    data.forEach((item, i) => {
      const barHeight = (item.value / 100) * maxHeight;
      const x = startX + i * (barWidth + gap);
      const y = baseY - barHeight;

      // 막대 그리기
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // 레이블
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, baseY + 20);

      // 수치
      ctx.fillText(item.value + '%', x + barWidth / 2, y - 8);
    });
  </script>
</body>
</html>
```

## 실제로 실행해서 비교해보기

직접 실행하면 Canvas와 CSS로 만든 도형의 결정적인 차이를 알 수 있습니다. 브라우저에서 `Ctrl++`로 확대를 여러 번 해보세요. CSS border-radius로 만든 원은 가장자리가 계단처럼 보이지만, Canvas로 그린 원은 부드럽게 유지됩니다.

또한 `requestAnimationFrame` 예제를 실행하면 공이 왼쪽에서 오른쪽으로 움직이는 것을 볼 수 있습니다. `clearRect`로 매 프레임마다 화면을 지우지 않으면 공이 이동한 궤적이 모두 그대로 남습니다. 이 차이를 직접 확인해보는 것이 Canvas의 동작 방식을 이해하는 가장 빠른 방법입니다.

---

## 마치며
- `canvas.getContext('2d')`로 2D 렌더링 컨텍스트를 얻습니다
- `fillRect`, `strokeRect`로 사각형을 그립니다
- `beginPath()` + `arc()`로 원을 그립니다
- `fill()`은 내부 채우기, `stroke()`는 테두리 그리기입니다
- `requestAnimationFrame`으로 부드러운 애니메이션을 만듭니다
- `save()`/`restore()`로 스타일 상태를 저장하고 복원합니다

다음 글에서는 SVG 기초 — 인라인 SVG로 벡터 이미지 만들기를 알아봅니다.


## 실전 예제로 이해하기

HTML의 HTML5 Canvas 기초 개념을 실제 웹 페이지에서 어떻게 활용하는지 예제 코드를 통해 알아보겠습니다. 기본 문법을 익힌 후에 실제 프로젝트에서 자주 마주치는 패턴을 함께 살펴보면 학습 효과가 훨씬 높아집니다.

아래 코드는 HTML5 Canvas 기초을 실제 HTML 문서 내에서 사용한 예시입니다. 각 요소가 페이지에서 어떤 역할을 수행하는지 주석과 함께 확인해 보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5 Canvas 기초 실전 예제</title>
</head>
<body>
  <!-- 실전 예제 코드는 수업별로 적절히 변경 필요 -->
  <p>HTML5 Canvas 기초에 대한 실습을 진행합니다.</p>
</body>
</html>
```

## 자주 하는 실수와 주의점

초보자들이 HTML5 Canvas 기초을 다룰 때 가장 흔히 하는 실수는 닫는 태그를 빼먹거나 속성값을 따옴표로 감싸지 않는 것입니다. HTML은 오류에 관대한 편이지만, 이런 실수는 레이아웃이 깨지거나 스타일이 정상적으로 적용되지 않는 원인이 됩니다. 반드시 모든 태그가 올바르게 열고 닫혔는지, 속성값은 따옴표로 감쌌는지 확인하는 습관을 들이는 것이 좋습니다.

## 브라우저 동작 방식

브라우저는 HTML 문서를 위에서 아래로 읽으며 DOM(Document Object Model) 트리를 생성합니다. HTML5 Canvas 기초 요소가 DOM 트리에서 어떻게 해석되고 배치되는지 이해하면 더 체계적인 마크업을 작성할 수 있습니다. 개발자 도구(F12)의 Elements 패널을 열어 실제 DOM 구조를 확인하는 습관을 추천합니다.

## 실전 활용 팁

실무에서는 HTML5 Canvas 기초을 단독으로 사용하기보다는 CSS와 JavaScript와 함께 조합하여 사용합니다. 시맨틱한 마크업은 검색 엔진 최적화(SEO)와 웹 접근성 향상에 직접적인 도움을 줍니다. 또한 W3C validator를 통해 HTML 문법을 검증하면 크로스 브라우징 이슈를 줄일 수 있습니다.

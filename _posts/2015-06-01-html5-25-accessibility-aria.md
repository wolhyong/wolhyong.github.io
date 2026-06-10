---
layout: post
title: "HTML5 멀티미디어 태그 — video, audio, source, track 사용하기"
description: "HTML5 video와 audio 태그는 어떻게 사용하나요? 플러그인 없이 미디어를 재생하는 방법, controls·autoplay·loop·muted 속성, source로 여러 포맷 제공, track으로 자막 추가, poster 썸네일 설정까지 다룹니다."
date: 2015-06-01 00:00:00 +0900
category: html
level: intermediate
series: "HTML/CSS 처음부터 끝까지"
series_order: 22
tags: [html5, video, audio, source, track, 자막, 멀티미디어, 유튜브삽입]
lang: ko
---

HTML5 이전에는 플래시(Flash)나 QuickTime 같은 플러그인을 설치해야만 웹에서 동영상과 음악을 재생할 수 있었습니다. HTML5에서 video, audio 태그가 추가되면서 브라우저 자체적으로 미디어 재생이 가능해졌습니다. 두 태그의 사용법을 자세히 알아봅니다.

---

## video — 동영상 재생

```html
<video src="demo.mp4" controls width="800" height="450">
  이 브라우저는 video 태그를 지원하지 않습니다.
</video>
```

`controls` 속성이 없으면 재생 버튼, 볼륨 조절 등 UI가 나타나지 않습니다. 사용자가 제어할 수 없게 됩니다.

---

## video 주요 속성

```html
<video
  src="tutorial.mp4"
  controls
  width="100%"
  poster="thumbnail.jpg"
  preload="metadata">
  이 브라우저는 비디오를 지원하지 않습니다.
</video>
```

| 속성 | 설명 |
|------|------|
| `controls` | 재생/일시정지/음량 등 컨트롤 UI 표시 |
| `autoplay` | 페이지 로드 시 자동 재생 |
| `muted` | 음소거 상태로 시작 |
| `loop` | 반복 재생 |
| `poster` | 재생 전 표시할 썸네일 이미지 |
| `preload` | 미리 로드 방식 (none/metadata/auto) |
| `playsinline` | 모바일에서 전체화면 전환 없이 인라인 재생 |
| `width` / `height` | 크기 지정 |

**자동 재생 정책 주의**

대부분의 브라우저는 소리가 있는 영상의 autoplay를 차단합니다. 자동 재생이 필요하다면 반드시 `muted`를 함께 씁니다.

```html
<!-- 소리 없는 배경 영상 자동 재생 (허용됨) -->
<video src="bg.mp4" autoplay muted loop playsinline></video>
```

---

## source — 여러 형식 제공

브라우저마다 지원하는 동영상 포맷이 다릅니다. source 태그로 여러 포맷을 제공하면 브라우저가 지원하는 것을 자동으로 선택합니다.

```html
<video controls width="100%" poster="tutorial.jpg">
  <source src="tutorial.webm" type="video/webm">
  <source src="tutorial.mp4" type="video/mp4">
  <p>
    이 브라우저는 HTML5 video를 지원하지 않습니다.
    <a href="tutorial.mp4">동영상 다운로드</a>
  </p>
</video>
```

위에서부터 순서대로 확인해서 재생 가능한 첫 번째 source를 사용합니다.

**주요 동영상 포맷**

| 포맷 | MIME 타입 | 특징 |
|------|-----------|------|
| MP4 (H.264) | `video/mp4` | 가장 넓은 호환성 |
| WebM (VP9) | `video/webm` | 오픈소스, 파일 크기 작음 |
| OGG | `video/ogg` | Firefox에서 잘 지원 |

실무에서는 MP4와 WebM 두 가지를 제공하는 것이 일반적입니다.

---

## track — 자막과 캡션

track 태그로 자막 파일을 추가합니다.

```html
<video controls width="100%">
  <source src="lecture.mp4" type="video/mp4">
  <track
    src="lecture-ko.vtt"
    kind="subtitles"
    srclang="ko"
    label="한국어"
    default>
  <track
    src="lecture-en.vtt"
    kind="subtitles"
    srclang="ko"
    label="English">
</video>
```

자막 파일은 WebVTT(`.vtt`) 형식을 사용합니다.

```
WEBVTT

00:00:00.000 --> 00:00:03.000
안녕하세요. HTML5 강의를 시작하겠습니다.

00:00:03.500 --> 00:00:07.000
오늘은 video 태그 사용법을 배워봅니다.
```

**track의 kind 속성**

| 값 | 설명 |
|----|------|
| `subtitles` | 자막 (번역 포함) |
| `captions` | 캡션 (음향 효과 포함, 청각 장애인용) |
| `descriptions` | 시각적 내용 설명 (시각 장애인용) |
| `chapters` | 챕터 탐색 |
| `metadata` | JavaScript에서 사용하는 메타데이터 |

---

## audio — 음악/음성 재생

```html
<audio controls>
  <source src="podcast.ogg" type="audio/ogg">
  <source src="podcast.mp3" type="audio/mpeg">
  이 브라우저는 audio 태그를 지원하지 않습니다.
</audio>
```

video와 동일한 속성 대부분을 공유합니다 (controls, autoplay, muted, loop, preload).

**주요 오디오 포맷**

| 포맷 | MIME 타입 | 특징 |
|------|-----------|------|
| MP3 | `audio/mpeg` | 가장 넓은 호환성 |
| OGG | `audio/ogg` | 오픈소스 |
| WAV | `audio/wav` | 무손실, 파일 크기 큼 |
| AAC | `audio/aac` | Apple 기기에서 좋은 성능 |

---

## picture — 반응형 이미지

화면 크기나 해상도에 따라 다른 이미지를 제공합니다. (이미지지만 멀티미디어 맥락에서 함께 정리)

```html
<picture>
  <!-- 화면이 넓을 때 고해상도 이미지 -->
  <source media="(min-width: 800px)" srcset="hero-large.webp" type="image/webp">
  <source media="(min-width: 800px)" srcset="hero-large.jpg">
  <!-- 화면이 좁을 때 작은 이미지 -->
  <source media="(max-width: 799px)" srcset="hero-small.webp" type="image/webp">
  <!-- 최후 수단 (구형 브라우저) -->
  <img src="hero-small.jpg" alt="히어로 이미지" width="800" height="400">
</picture>
```

---

## 실습: 기술 강의 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Docker 입문 강의 1편 — GHW Dev Blog</title>
</head>
<body>
  <article>
    <h1>Docker 입문 강의 1편 — 컨테이너 개념 이해하기</h1>

    <figure>
      <video
        controls
        width="100%"
        poster="docker-lecture-thumb.jpg"
        preload="metadata">
        <source src="docker-lecture-01.webm" type="video/webm">
        <source src="docker-lecture-01.mp4" type="video/mp4">
        <track src="subtitles-ko.vtt" kind="subtitles" srclang="ko" label="한국어" default>
        <p>
          동영상을 재생할 수 없습니다.
          <a href="docker-lecture-01.mp4">MP4 다운로드</a>
        </p>
      </video>
      <figcaption>강의 1편: Docker 컨테이너와 이미지 개념 (13분)</figcaption>
    </figure>

    <h2>강의 요약 (팟캐스트 버전)</h2>
    <audio controls>
      <source src="docker-podcast-01.ogg" type="audio/ogg">
      <source src="docker-podcast-01.mp3" type="audio/mpeg">
    </audio>
  </article>
</body>
</html>
```

## 실제로 실행해보면 어떻게 보일까?

직접 HTML 파일을 만들고 이 코드들을 실행해보면 차이를 바로 느낄 수 있습니다.

- `controls` 속성이 없는 video 태그는 빈 화면만 보입니다. 속성을 넣으면 재생/일시정지/볼륨 슬라이더 등 UI가 나타납니다.
- `source`를 두 개 넣었을 때, WebM을 지원하는 브라우저(Chrome)와 그렇지 않은 브라우저(Safari)에서 어떤 source를 선택하는지 차이가 생깁니다.
- `track`으로 자막을 추가하면 동영상 아래 자막 버튼이 생기고, 껐다 켤 수 있습니다.
- `autoplay`만 단독으로 쓰면 브라우저가 재생을 차단합니다. `muted`까지 함께 넣었을 때만 자동 재생이 됩니다.

---

## 핵심

- `video` — 동영상 재생. `controls` 속성을 빼먹으면 사용자가 아무것도 할 수 없습니다
- `audio` — 음성/음악 재생. video와 같은 속성 공유
- `source` — 여러 포맷을 제공해 브라우저가 알아서 재생 가능한 포맷을 선택
- `track` — 자막/캡션 파일(.vtt) 추가
- 자동 재생은 `muted`와 함께 써야 대부분 브라우저에서 허용
- `picture` — 화면 크기에 따라 다른 이미지를 보여주는 반응형 이미지

다음 글에서는 iframe으로 유튜브 영상을 삽입하고 보안 설정하는 방법을 알아봅니다.
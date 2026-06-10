# GHW 코딩 블로그 테마

PageSpeed 100점, 반응형, Google/Naver SEO 최적화 GitHub Pages 블로그 테마입니다.

## ✨ 주요 기능

- 🚀 **PageSpeed 100점** - Critical CSS 인라인, 비차단 CSS/JS 로딩
- 📱 **완전 반응형** - 모바일 우선 설계
- 🔍 **Google + 네이버 SEO** - 구조화 데이터, Open Graph, Sitemap
- 🌙 **다크 테마** - GitHub 스타일 개발자 테마
- ♿ **웹 접근성 (WCAG 2.1)** - 스크린 리더 지원, 키보드 탐색
- 📋 **자동 목차** - 포스트 페이지 자동 TOC 생성
- 🏷️ **태그 시스템** - 태그별 글 분류 및 필터링

## 🚀 설치 및 실행

### 1. 저장소 사용
이 폴더 전체를 GitHub 저장소(`wolhyong.github.io`)에 복사합니다.

### 2. 로컬 개발 환경
```bash
# 의존성 설치
bundle install

# 로컬 서버 실행
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

## ⚙️ 설정

`_config.yml`에서 다음을 수정하세요:

```yaml
# 필수 설정
title: "블로그 제목"
description: "블로그 설명"
author:
  name: "이름"
  github: "깃허브ID"

url: "https://username.github.io"

# SEO 설정 (필수!)
google_site_verification: "Google Search Console 코드"
naver_site_verification: "네이버 서치어드바이저 코드"
google_analytics: "G-XXXXXXXXXX"
```

## 📝 글 작성

`_posts/` 폴더에 `YYYY-MM-DD-제목.md` 형식으로 파일을 생성합니다.

```markdown
---
layout: post
title: "포스트 제목"
description: "SEO 설명 (160자 이내)"
date: 2024-01-01 10:00:00 +0900
category: "카테고리명"
tags: [태그1, 태그2, 태그3]
image: /assets/images/posts/thumbnail.jpg   # 선택사항
---

포스트 내용을 마크다운으로 작성합니다.
```

## 🔍 SEO 설정 방법

### Google Search Console
1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가 → URL 접두사 → `https://wolhyong.github.io`
3. HTML 태그 인증 코드를 `_config.yml`의 `google_site_verification`에 입력

### 네이버 서치어드바이저
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속
2. 사이트 등록 → HTML 태그 인증 코드를 `_config.yml`의 `naver_site_verification`에 입력
3. 사이트맵 제출: `https://wolhyong.github.io/sitemap.xml`
4. RSS 제출: `https://wolhyong.github.io/feed.xml`

## 📂 파일 구조

```
.
├── _config.yml          # 사이트 설정
├── _layouts/            # 레이아웃 템플릿
│   ├── default.html
│   ├── home.html
│   ├── post.html
│   └── page.html
├── _includes/           # 재사용 컴포넌트
│   ├── head.html        # SEO 메타태그
│   ├── header.html      # 헤더/내비게이션
│   ├── footer.html      # 푸터
│   └── post-card.html   # 포스트 카드
├── _posts/              # 블로그 글
├── assets/
│   ├── css/main.css     # 스타일시트
│   ├── js/main.js       # JavaScript
│   └── images/          # 이미지
├── pages/               # 정적 페이지
│   ├── blog.html
│   ├── tags.html
│   └── about.md
├── index.html           # 홈페이지
├── 404.html
└── robots.txt
```

## PageSpeed 최적화 전략

| 최적화 기법 | 적용 방법 |
|------------|----------|
| Critical CSS 인라인 | `_includes/head.html`에 핵심 CSS 직접 삽입 |
| 비차단 CSS 로딩 | `preload` + `onload` 패턴 사용 |
| JS 지연 로딩 | `<script defer>` 적용 |
| 이미지 지연 로딩 | `loading="lazy"` + 크기 명시 |
| 폰트 최적화 | 시스템 폰트 우선 사용 |
| 헤더 캐싱 | GitHub Pages 기본 캐싱 활용 |

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

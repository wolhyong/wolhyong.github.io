---
layout: post
title: "깃허브 블로그 시작하기, Jekyll로 개발 블로그 만드는 과정"
description: "GitHub Pages와 Jekyll로 무료 개발 블로그를 만들 때 필요한 설치, 프로젝트 생성, 첫 글 작성 과정을 순서대로 설명했습니다."
date: "2015-12-07 10:00:00 +0900"
category: nuxtjs
level: beginner
tags: [jekyll, github-pages, blog, 개발환경]
image:
---

개발자라면 공부한 내용과 문제를 해결한 과정을 남겨둘 공간이 필요합니다. GitHub Pages와 Jekyll을 사용하면 별도 서버 비용 없이 Markdown으로 글을 작성하고 배포할 수 있습니다.

## GitHub Pages와 Jekyll을 쓰는 이유

GitHub Pages는 GitHub 저장소를 기반으로 정적 사이트를 배포해주는 서비스입니다. Jekyll은 Markdown 파일을 블로그 페이지로 변환해주는 정적 사이트 생성기입니다.

- **무료 배포**: 개인 블로그를 운영하는 데 별도 호스팅 비용이 들지 않습니다.
- **Git 기반 관리**: 글과 코드 변경 이력을 함께 관리할 수 있습니다.
- **Markdown 작성**: 개발자에게 익숙한 문법으로 글을 효율적으로 작성할 수 있습니다.
- **자유로운 커스터마이징**: HTML, CSS, Liquid 템플릿을 직접 수정할 수 있습니다.

## 시작 전에 필요한 도구

로컬에서 Jekyll 블로그를 실행하려면 Ruby, Bundler, Jekyll이 필요합니다.

```bash
# Ruby 버전 확인
ruby --version

# Bundler 설치
gem install bundler

# Jekyll 설치
gem install jekyll
```

Windows 환경에서는 RubyInstaller를 사용하면 설치가 비교적 수월합니다. 설치 후 터미널을 새로 열고 버전을 확인하는 것이 좋습니다.

## Jekyll 사이트 만들기

새 블로그 프로젝트는 아래 명령으로 만들 수 있습니다.

```bash
# 새 사이트 생성
jekyll new my-blog

# 디렉터리 이동
cd my-blog

# 로컬 서버 실행
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000`으로 접속하면 로컬에서 블로그를 확인할 수 있습니다.

## 첫 글 작성하기

Jekyll의 게시글은 `_posts` 디렉터리에 `YYYY-MM-DD-title.md` 형식으로 저장합니다.

```markdown
---
layout: post
title: "첫 번째 글"
date: 2024-01-15 10:00:00 +0900
tags: [일상, 개발]
---

안녕하세요. 첫 번째 글입니다.
```

파일 상단의 `---` 사이에 있는 영역을 Front Matter라고 부릅니다. 제목, 날짜, 태그, 레이아웃처럼 Jekyll이 페이지를 만들 때 필요한 정보를 넣습니다.

## 운영할 때 챙기면 좋은 것

블로그를 공개한 뒤에는 검색 엔진이 사이트를 잘 수집하도록 `sitemap.xml`, `robots.txt`, Google Search Console, 네이버 서치어드바이저를 함께 설정하는 것이 좋습니다. 방문 분석이 필요하다면 Google Analytics 추적 ID도 공통 head 영역에 넣어두면 됩니다.

GitHub Pages와 Jekyll 조합은 글 작성, 버전 관리, 배포 흐름이 단순합니다. 꾸준히 기록하는 블로그를 만들기에 충분히 좋은 선택입니다.


## Jekyll의 동작 방식

Jekyll에서 깃허브 블로그 시작하기, Jekyll로 개발 블로그 만드는 과정은 정적 사이트 생성기로서의 핵심 기능과 관련이 있습니다. Jekyll은 마크다운과 Liquid 템플릿 엔진을 사용하여 콘텐츠를 정적 HTML 파일로 변환합니다. 데이터베이스가 필요 없고 서버 사이드 로직이 없기 때문에 GitHub Pages에서 무료로 호스팅할 수 있으며, 보안 취약점과 서버 유지보수 부담이 없습니다.

## 설정과 구조

```yaml
# _config.yml 예제
title: 깃허브 블로그 시작하기, Jekyll로 개발 블로그 만드는 과정 설정 예제
description: Jekyll 블로그 설명
baseurl: ""
url: "https://example.github.io"
```

Jekyll 프로젝트는 `_config.yml`, `_layouts/`, `_includes/`, `_posts/` 등 명확한 폴더 구조를 따릅니다. 이러한 규칙을 이해하면 플러그인 없이도 체계적인 블로그나 문서 사이트를 구축할 수 있습니다.

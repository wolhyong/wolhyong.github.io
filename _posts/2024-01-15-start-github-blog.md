---
layout: post
title: "깃허브 블로그 만들기 — GitHub Pages와 Jekyll로 시작하기"
description: "GitHub Pages와 Jekyll로 개발 블로그를 만드는 과정을 정리했습니다. 루비 설치, 사이트 생성, 폴더 구조와 설정, 첫 글 작성, 저장소 연결과 배포 확인, 검색 도구 등록까지 순서대로 다룹니다."
date: 2024-01-15 10:00:00 +0900
category: git
level: beginner
tags: [git, github-pages, jekyll, 블로그, 개발환경]
---

개발 기록을 남길 곳이 필요할 때 GitHub Pages와 Jekyll 조합은 여전히 실용적입니다. 서버 비용이 들지 않고, 글을 마크다운 파일로 쓰며, 변경 이력이 Git에 그대로 남습니다. 이 글은 설치부터 첫 배포, 검색 엔진 등록까지 순서대로 정리합니다.

## GitHub Pages와 Jekyll이 하는 일

GitHub Pages는 저장소에 있는 정적 파일을 웹으로 내보내는 호스팅 서비스입니다. Jekyll은 마크다운 파일과 템플릿을 미리 HTML로 만들어 두는 정적 사이트 생성기입니다.

- **비용**: 개인 블로그 기준으로 호스팅 비용이 들지 않습니다.
- **버전 관리**: 글과 설정이 모두 Git 이력으로 남습니다.
- **작성 방식**: 마크다운으로 쓰고, 레이아웃은 한 번만 만들어 재사용합니다.
- **수정 자유도**: HTML, CSS, Liquid 템플릿을 직접 고칠 수 있습니다.

데이터베이스와 서버 사이드 로직이 없으므로 보안 취약점과 서버 유지보수 부담도 없습니다.

## 준비물

로컬에서 빌드와 미리보기를 하려면 Ruby, Bundler, Jekyll이 필요합니다.

```bash
ruby --version
gem install bundler
gem install jekyll
```

Windows에서는 RubyInstaller로 설치하는 편이 수월합니다. 설치 후 터미널을 새로 열어 버전을 확인합니다. 로컬 빌드 없이 GitHub에 올려서만 운영할 수도 있지만, 오류를 미리 보려면 로컬 실행 환경을 갖추는 편이 좋습니다.

## 사이트 만들기

```bash
jekyll new my-blog
cd my-blog
bundle exec jekyll serve
```

`http://localhost:4000`으로 접속하면 기본 테마가 적용된 블로그가 열립니다. `jekyll new`는 `Gemfile`, `_config.yml`, `_posts`, `_layouts`, `_includes` 등 기본 구조를 만들어 줍니다.

## 폴더 구조

| 경로 | 역할 |
|------|------|
| `_config.yml` | 사이트 제목, URL, 플러그인 등 전역 설정 |
| `_posts/` | 글 파일. `YYYY-MM-DD-제목.md` 형식 |
| `_layouts/` | 페이지 골격 템플릿 |
| `_includes/` | 레이아웃에서 재사용하는 조각(헤더, 푸터) |
| `assets/` | CSS, 이미지, 스크립트 |
| `index.md` | 첫 페이지 |
| `_site/` | 빌드 결과물. Git에 올리지 않음 |

Jekyll은 밑줄로 시작하는 폴더를 특별한 용도로 처리합니다. 빌드 결과물인 `_site/`는 `.gitignore`에 넣습니다.

```bash
echo "_site/" >> .gitignore
echo ".jekyll-cache/" >> .gitignore
```

## 설정 파일

```yaml
title: "내 개발 블로그"
description: "공부한 내용과 문제 해결 과정을 기록합니다."
url: "https://아이디.github.io"
baseurl: ""
timezone: "Asia/Seoul"
markdown: kramdown

permalink: /:year/:month/:day/:title/

plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
```

`permalink`는 글 주소 규칙입니다. 나중에 바꾸면 기존 글 주소가 모두 달라지므로 처음에 정하는 편이 좋습니다. `baseurl`은 사용자 사이트(`아이디.github.io`)라면 비워 두고, 프로젝트 사이트(`아이디.github.io/저장소이름`)라면 `/저장소이름`을 넣습니다. 이 값을 틀리면 CSS와 이미지 경로가 모두 어긋납니다.

## 첫 글 작성

`_posts` 폴더에 `2024-01-15-first-post.md`처럼 파일을 만듭니다.

```markdown
---
layout: post
title: "첫 번째 글"
date: 2024-01-15 10:00:00 +0900
category: diary
tags: [일상, 개발]
---

안녕하세요. 첫 번째 글입니다.
```

위아래 `---` 사이를 프런트 매터(front matter)라고 합니다. 이 영역에 있는 값으로 Jekyll이 제목, 날짜, 태그, 레이아웃을 결정합니다. 파일 이름의 날짜와 프런트 매터의 `date`가 다르면 프런트 매터가 우선합니다.

본문에서는 마크다운과 Liquid 문법을 함께 쓸 수 있습니다. 코드 블록은 백틱 세 개로 감싸고 언어 이름을 붙이면 구문 강조가 적용됩니다.

```javascript
const hello = "world";
console.log(hello);
```

## GitHub에 올리고 배포하기

1. GitHub에서 `아이디.github.io` 이름으로 저장소를 만듭니다. 사용자 사이트는 이 이름이어야 합니다.
2. 로컬 저장소를 연결하고 푸시합니다.

```bash
git init
git add .
git commit -m "블로그 초기 설정"
git branch -M main
git remote add origin https://github.com/아이디/아이디.github.io.git
git push -u origin main
```

3. 저장소의 Settings → Pages에서 Source를 `main` 브랜치, 루트(`/`)로 지정합니다.

저장소 이름이 `아이디.github.io`가 아니면 프로젝트 사이트가 되어 주소가 `아이디.github.io/저장소이름`이 됩니다. 이때는 `_config.yml`의 `baseurl`을 반드시 맞춰야 합니다.

푸시 후 빌드에는 보통 1~2분이 걸립니다. 저장소의 Actions 탭이나 Pages 설정 화면에서 마지막 빌드 상태를 확인할 수 있습니다.

## 커스텀 도메인

도메인이 있다면 Settings → Pages의 Custom domain에 입력하고, DNS에 `CNAME` 레코드를 `아이디.github.io`로 지정합니다. HTTPS 강제 설정을 켜면 인증서가 자동으로 발급됩니다. 저장소 루트에 `CNAME` 파일이 생기는데, 이 파일이 사라지면 도메인 연결이 풀립니다.

## 검색과 분석 도구 연결

배포 후에는 다음을 함께 설정합니다.

- **sitemap.xml**: `jekyll-sitemap` 플러그인을 켜면 자동 생성됩니다.
- **robots.txt**: 사이트맵 위치를 적어 두면 수집이 빨라집니다.
- **Google Search Console**: 사이트 소유 확인 후 사이트맵을 제출합니다.
- **네이버 서치어드바이저**: 국내 검색 유입이 필요하면 함께 등록합니다.
- **방문 분석**: Google Analytics 추적 ID를 공통 `<head>`에 넣습니다.

```text
User-agent: *
Allow: /

Sitemap: https://아이디.github.io/sitemap.xml
```

## 운영하면서 챙길 것

- 글 주소 규칙은 처음에 정하고 바꾸지 않습니다. 바꿔야 한다면 이전 주소에서 새 주소로 리다이렉트를 남깁니다.
- 이미지 파일명은 영문 소문자와 하이픈으로 통일합니다. 한글 파일명은 배포 환경에 따라 깨질 수 있습니다.
- 초안은 `_drafts/` 폴더에 두고 `--drafts` 옵션으로만 미리 봅니다. `_posts`에 올리는 순간 공개됩니다.
- 날짜를 미래로 지정하면 빌드 시점에 글이 보이지 않습니다. 예약 발행처럼 보이지만 빌드가 언제 도는지에 따라 달라집니다.
- 테마를 바꾸면 `_layouts`와 `_includes`가 통째로 바뀌므로, 직접 고친 내용이 있다면 diff를 먼저 확인합니다.

## 자주 막히는 곳

**로컬은 되는데 배포 페이지가 깨짐**

`baseurl`과 `url` 설정이 사이트 유형과 맞는지 확인합니다. 프로젝트 사이트인데 `baseurl`을 비워 두면 CSS 경로가 루트를 가리켜 404가 됩니다.

**푸시했는데 글이 안 보임**

파일 이름이 `YYYY-MM-DD-제목.md` 형식인지, 프런트 매터의 `---`가 첫 줄부터 시작하는지 확인합니다. 마크다운 파일 맨 위에 빈 줄이 있으면 프런트 매터로 인식되지 않습니다.

**빌드가 실패함**

Pages 설정 화면에 오류 메시지가 표시됩니다. YAML 문법 오류가 가장 흔합니다. 콜론 뒤 띄어쓰기, 따옴표 누락, 탭 문자 사용을 확인합니다.

**한글이 깨짐**

`_config.yml`에 `encoding: utf-8`을 넣고 파일 인코딩도 UTF-8로 저장합니다.

**빌드가 오래 걸림**

글이 수백 편이 되면 빌드 시간이 늘어납니다. 이미지 용량을 줄이고, 플러그인을 최소로 유지합니다.

## 정리

- GitHub Pages와 Jekyll은 서버 없이 마크다운 블로그를 운영하는 조합입니다.
- `permalink`와 `baseurl`은 처음에 정확히 설정합니다. 나중에 바꾸면 주소가 모두 달라집니다.
- 글은 `_posts`에 `YYYY-MM-DD-제목.md`로 두고, 프런트 매터에 제목과 날짜를 적습니다.
- 배포 후에는 사이트맵, robots.txt, Search Console을 함께 설정합니다.

이 블로그도 같은 구조로 운영하고 있습니다. 정적 사이트에서 검색 노출을 다루는 방법은 [구조화 데이터 — Schema.org와 JSON-LD](/2015/07/13/html5-31-responsive-images/) 글에서 이어집니다.

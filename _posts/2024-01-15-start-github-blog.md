---
layout: post
title: "Start Github Blog"
date: 2024-01-15 10:00:00 +0900
category: unknown
level: beginner
tags: [unknown, web]
---


개발자라면 한 번쯤 나만의 블로그를 운영해보고 싶다는 생각을 하게 됩니다. GitHub Pages와 Jekyll을 사용하면 **무료로** 나만의 기술 블로그를 만들 수 있습니다.

## 왜 GitHub Pages + Jekyll인가?

GitHub Pages는 깃허브에서 제공하는 무료 정적 웹사이트 호스팅 서비스입니다. 다음과 같은 장점이 있습니다.

- **완전 무료**: 도메인부터 호스팅까지 무료
- **버전 관리**: Git으로 블로그 글도 버전 관리
- **마크다운 작성**: 개발자에게 익숙한 마크다운으로 글 작성
- **커스터마이징**: HTML/CSS를 자유롭게 수정 가능

## 시작하기 전에

아래 도구들이 설치되어 있어야 합니다.

```bash
# Ruby 버전 확인
ruby --version

# Bundler 설치
gem install bundler

# Jekyll 설치
gem install jekyll
```

## 새 Jekyll 사이트 생성

```bash
# 새 사이트 생성
jekyll new my-blog

# 디렉토리 이동
cd my-blog

# 로컬 서버 실행
bundle exec jekyll serve
```

이제 `http://localhost:4000`으로 접속하면 블로그를 확인할 수 있습니다.

## 첫 번째 글 작성하기

`_posts` 디렉토리에 `YYYY-MM-DD-제목.md` 형식으로 파일을 만듭니다.

```markdown
---
layout: post
title: "나의 첫 번째 글"
date: 2024-01-15 10:00:00 +0900
tags: [일상, 개발]
---

안녕하세요! 첫 번째 글입니다.
```

## 마무리

Jekyll과 GitHub Pages의 조합은 개발자 블로그를 시작하기에 매우 좋은 선택입니다. 마크다운으로 편하게 글을 쓰면서 Git으로 버전 관리까지 할 수 있습니다.

다음 글에서는 커스텀 도메인 연결 방법을 알아보겠습니다!

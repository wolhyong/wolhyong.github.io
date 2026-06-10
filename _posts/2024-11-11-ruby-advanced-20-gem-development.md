---
layout: post
title: "Ruby Gem 개발 — Gem 구조, Bundler, RubyGems 배포, 의존성 관리, 버전 규약"
description: "Ruby에서 Gem을 개발하고 배포하는 전체 과정을 시스템 레벨에서 심층 학습합니다. Gem의 디렉토리 구조(lib/bin/spec)가 $LOAD_PATH에 추가되어 require로 로드되는 과정, gemspec 파일이 Gem::Specification 클래스를 통해 Gem의 메타데이터(이름/버전/의존성/파일 목록)를 정의하는 방식, Semantic Versioning(MAJOR.MINOR.PATCH)이 Gem::Version으로 비교되어 의존성 해결에 사용되는 과정, Bundler의 Gemfile.lock이 Gem::DependencyResolver를 사용하여 모든 Gem의 의존성 트리를 해결하고 정확한 버전을 고정하는 방식, gem push 명령어가 RubyGems.org API로 Gem 패키지를 업로드하여 전 세계 Ruby 개발자에게 배포하는 과정을 다룹니다."
date: 2024-11-11 10:00:00 +0900
category: ruby
tags: [ruby, gem-development, rubygems, bundler, gem-publish, versioning]
level: advanced
---

Ruby의 패키지 시스템은 Gem과 Bundler로 구성됩니다.

> **핵심 정리** · Gem은 `gemspec`으로 메타데이터를 정의합니다. `Gem::Version`은 Semantic Versioning을 처리합니다. Bundler의 `Gemfile.lock`은 `Gem::DependencyResolver`로 의존성 트리를 해결합니다. `gem push`는 RubyGems.org API로 Gem을 배포합니다.

---

## 수업 목표

- Gem의 디렉토리 구조와 로딩 방식을 이해합니다.
- gemspec 파일의 구성을 이해합니다.
- Semantic Versioning의 버전 비교를 이해합니다.
- Bundler의 의존성 해결 과정을 이해합니다.
- Gem 배포 과정을 이해합니다.

## Gem 구조

```ruby
# my_gem.gemspec
Gem::Specification.new do |spec|
  spec.name          = "my_gem"
  spec.version       = "0.1.0"
  spec.authors       = ["Your Name"]
  spec.email         = ["you@example.com"]
  spec.summary       = "My awesome Ruby gem"
  spec.description   = "A longer description of my gem"
  spec.homepage      = "https://github.com/you/my_gem"
  spec.license       = "MIT"

  spec.required_ruby_version = ">= 3.0"

  spec.metadata = {
    "homepage_uri" => spec.homepage,
    "source_code_uri" => "https://github.com/you/my_gem",
    "changelog_uri" => "https://github.com/you/my_gem/CHANGELOG.md"
  }

  # 실행 가능한 파일
  spec.bindir        = "exe"
  spec.executables   = ["my_gem"]

  # 실제 코드 파일
  spec.files = Dir.glob("{lib,exe}/**/*") + ["my_gem.gemspec"]

  # 의존성
  spec.add_dependency "zeitwerk", "~> 2.6"
  spec.add_development_dependency "rspec", "~> 3.12"
  spec.add_development_dependency "rubocop", "~> 1.50"
end
```

`Gem::Specification`은 Gem의 메타데이터를 정의합니다. `spec.files`는 Gem에 포함될 파일 목록입니다. `spec.add_dependency`는 런타임 의존성을, `spec.add_development_dependency`는 개발 환경 의존성을 선언합니다. `required_ruby_version`은 필요한 Ruby 버전을 제한합니다.

`Gem::Version`은 Semantic Versioning(MAJOR.MINOR.PATCH)을 처리합니다: `Gem::Version.new('2.1.3') <=> Gem::Version.new('2.0.10')`은 `1`을 반환합니다(2.1.3이 더 큼). 프리릴리스 버전은 `Gem::Version.new('1.0.0.beta1')`처럼 접미사를 붙입니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Gem의 파일 구조는 어떻게 되나요?</strong></summary>

일반적인 Gem 구조: `lib/` — 실제 Ruby 코드. `lib/my_gem.rb`가 진입점. `lib/my_gem/`에 서브 모듈. `exe/` 또는 `bin/` — 실행 파일. `spec/` 또는 `test/` — 테스트 코드. `README.md`, `LICENSE`, `CHANGELOG.md` — 문서. `Gemfile` — 개발 의존성. `my_gem.gemspec` — Gem 메타데이터. `lib/` 디렉토리가 `$LOAD_PATH`에 추가되므로, `require 'my_gem'`으로 로드됩니다.
</details>

<details>
<summary><strong>Q: Bundler는 어떻게 의존성을 해결하나요?</strong></summary>

`bundle install`은 `Gemfile`의 의존성 선언을 읽고, `Gem::DependencyResolver`를 사용하여 모든 Gem의 의존성 트리를 해결합니다. 각 Gem의 `gemspec`에서 추가 의존성을 재귀적으로 수집합니다. 충돌이 발생하면(서로 다른 버전이 필요한 경우) 가능한 모든 버전 조합을 평가하여 충돌을 해결합니다. 해결된 의존성은 `Gemfile.lock`에 고정됩니다. `bundle update`는 `Gemfile.lock`을 무시하고 최신 버전으로 재해결합니다.
</details>

<details>
<summary><strong>Q: ~> 버전 제약 조건은 어떻게 동작하나요?</strong></summary>

`~>`(pessimistic version constraint)는 마지막 자리만 자유롭게 업데이트할 수 있습니다. `~> 2.5`는 `>= 2.5`와 `< 3.0`으로 해석됩니다. `~> 2.5.1`은 `>= 2.5.1`과 `< 2.6.0`으로 해석됩니다. API 호환성이 유지되는 범위 내에서만 업데이트를 허용합니다. `>= 2.5`는 `2.5`부터 `10.0`까지 모두 허용하므로, 메이저 업데이트로 인한 호환성 문제가 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q: gem push와 gem build의 과정은 어떻게 되나요?</strong></summary>

`gem build my_gem.gemspec`은 gemspec을 읽어 `.gem` 파일을 생성합니다(내부적으로 `Gem::Package.build` 호출). `.gem` 파일은 tar.gz 형식으로, `metadata.gz`(YAML 형식 메타데이터)와 `data.tar.gz`(실제 코드)로 구성됩니다. `gem push my_gem-0.1.0.gem`은 RubyGems.org의 `/api/v1/gems` 엔드포인트로 PUT 요청을 전송합니다. API 키는 `~/.gem/credentials`에 저장됩니다. `gem yank my_gem -v 0.1.0`으로 배포된 버전을 제거할 수 있습니다.
</details>

<details>
<summary><strong>Q: Gem의 네이밍 규칙은 무엇인가요?</strong></summary>

Gem 이름은 소문자, 숫자, 밑줄, 하이픈만 사용합니다. `my_gem`(밑줄)은 `require 'my_gem'`으로 로드됩니다. `my-gem`(하이픈)은 `require 'my/gem'`으로 로드됩니다(디렉토리 구조로 변환). 파일명은 Gem 이름과 일치해야 합니다. `lib/my_gem.rb`가 `require 'my_gem'`의 진입점입니다. 네임스페이스는 카멜케이스를 사용합니다: `MyGem`, `MyGem::Config`.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **gemspec** | Gem 메타데이터 | Gem::Specification → 이름/버전/의존성 정의 |
| **Gem::Version** | 버전 관리 | Semantic Versioning 비교 (MAJOR.MINOR.PATCH) |
| **Bundler** | 의존성 관리 | Gem::DependencyResolver → Gemfile.lock 고정 |
| **gem build** | Gem 패키징 | tar.gz 형식 → metadata.gz + data.tar.gz |
| **gem push** | Gem 배포 | RubyGems.org API PUT /api/v1/gems |

## 다음 수업

다음 글에서는 성능 최적화 — YJIT, 프로파일링, 벤치마킹을 배웁니다.

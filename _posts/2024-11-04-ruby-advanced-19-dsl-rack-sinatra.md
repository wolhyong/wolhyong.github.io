---
layout: post
title: "Ruby 웹 프레임워크 — Rack 인터페이스, Sinatra DSL, Rails MVC 구조"
description: "Ruby의 웹 프레임워크 생태계를 시스템 레벨에서 심층 학습합니다. Rack이 웹 서버와 Ruby 애플리케이션 간의 최소 인터페이스를 정의하여(env 해시 → [status, headers, body] 배열) Thin/Unicorn/Puma 등 다양한 웹 서버와 Rails/Sinatra/Roda 등 다양한 웹 프레임워크를 연결하는 미들웨어 체인의 동작 방식, Sinatra의 get/post/put/delete DSL이 instance_eval로 라우트를 등록하고 Rack의 call 인터페이스로 요청을 처리하는 과정, Rails의 MVC 아키텍처가 Action Dispatch(라우팅) → Action Controller(비즈니스 로직) → Action View(템플릿 렌더링)의 3단계 파이프라인으로 동작하는 방식을 다룹니다."
date: 2024-11-04 10:00:00 +0900
category: ruby
tags: [ruby, rack, sinatra, rails, web-framework, middleware, dsl]
level: advanced
---

Ruby의 웹 프레임워크는 Rack 인터페이스를 중심으로 발전했습니다.

> **핵심 정리** · Rack은 `env` 해시를 받아 `[status, headers, body]`를 반환하는 최소 인터페이스입니다. Sinatra는 `instance_eval`로 라우팅 DSL을 구현합니다. Rails는 Action Dispatch → Action Controller → Action View의 MVC 파이프라인입니다. Rack 미들웨어 체인은 요청을 순차적으로 처리합니다.

---

## 수업 목표

- Rack 인터페이스의 `call(env)` 규약을 이해합니다.
- Rack 미들웨어 체인의 동작을 이해합니다.
- Sinatra의 DSL과 Rack 통합을 이해합니다.
- Rails MVC 파이프라인을 이해합니다.

## Rack 기본

```ruby
# Rack 애플리케이션 — call(env)만 구현하면 됨
class HelloApp
  def call(env)
    [200, { 'Content-Type' => 'text/plain' }, ['Hello, Rack!']]
  end
end

# Rack 미들웨어
class LoggerMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    puts "요청: #{env['REQUEST_METHOD']} #{env['PATH_INFO']}"
    start = Time.now
    status, headers, body = @app.call(env)
    duration = Time.now - start
    puts "응답: #{status} (#{duration.round(3)}s)"
    [status, headers, body]
  end
end

# 사용
app = Rack::Builder.new do
  use LoggerMiddleware
  run HelloApp.new
end
```

Rack은 `call(env)` 메서드 하나만 구현하면 모든 웹 서버에서 동작하는 최소 인터페이스입니다. `env` 해시는 CGI 변수(`REQUEST_METHOD`, `PATH_INFO`, `QUERY_STRING`, `rack.input` 등)를 포함합니다. 미들웨어는 `@app.call(env)`를 호출하여 체인을 형성합니다. `Rack::Builder`는 `use`와 `run` DSL로 미들웨어 체인을 구성합니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Rack 미들웨어와 Rails의 관계는 무엇인가요?</strong></summary>

Rails는 내부적으로 여러 Rack 미들웨어를 사용합니다. `Rails.application` 자체가 Rack 애플리케이션입니다. `config.middleware`로 미들웨어를 추가/제거할 수 있습니다: `config.middleware.use(Rack::Deflater)`. Rails의 기본 미들웨어 체인에는 세션 관리, 쿠키 파서, HTTP 메서드 오버라이드, 요청 로깅, 정적 파일 서빙 등이 포함됩니다. 각 미들웨어는 요청을 가로채거나 수정한 후 체인의 다음 미들웨어로 전달합니다.
</details>

<details>
<summary><strong>Q: Sinatra와 Rails 중 어떤 것을 선택해야 하나요?</strong></summary>

Sinatra는 **가벼운 DSL**로, 단순한 API 서버, 마이크로서비스, 작은 웹 애플리케이션에 적합합니다. Rails는 **풀스택 프레임워크**로, 복잡한 비즈니스 로직, 데이터베이스 중심 애플리케이션, 대규모 팀 프로젝트에 적합합니다. Sinatra는 학습 곡선이 낮고 설정이 거의 필요 없지만, Rails는 ORM(Active Record), 템플릿 엔진(ERB/Haml), 테스팅(RSpec), 자산 파이프라인(Sprockets) 등이 내장되어 있습니다.
</details>

<details>
<summary><strong>Q: Rack::Builder의 use와 run의 차이는 무엇인가요?</strong></summary>

`use`는 **미들웨어**를 추가합니다. `use`로 추가된 각 컴포넌트는 `initialize(app)`과 `call(env)`를 구현해야 합니다. 미들웨어는 체인을 형성하여 요청을 순차적으로 처리합니다. `run`은 **실제 애플리케이션**을 지정합니다. 미들웨어 체인의 마지막에 위치하며, 실제 비즈니스 로직을 처리합니다. 하나의 `Rack::Builder` 블록에는 하나의 `run`만 있을 수 있지만, 여러 개의 `use`가 있을 수 있습니다.
</details>

<details>
<summary><strong>Q: Rails의 MVC 파이프라인은 어떻게 동작하나요?</strong></summary>

Rails의 요청 처리 파이프라인: (1) **Rack 미들웨어 체인**이 요청을 전처리(세션 로드, 쿠키 파싱). (2) **Action Dispatch**가 `config/routes.rb`의 라우트 정의와 요청 URL을 매칭하여 적절한 컨트롤러와 액션을 결정. (3) **Action Controller**가 컨트롤러 액션을 실행하여 비즈니스 로직 처리, 모델과 상호작용. (4) **Action View**가 ERB/Haml 템플릿을 렌더링하여 HTML 응답 생성. (5) 응답이 Rack 미들웨어 체인을 역순으로 통과하여 최종 HTTP 응답 반환.
</details>

<details>
<summary><strong>Q: Rack의 body는 왜 배열인가요?</strong></summary>

Rack 응답 body는 `each` 메서드에 응답하는 객체여야 하며, 관례적으로 문자열 배열을 사용합니다. `['Hello']`처럼 배열로 감싸는 이유는 스트리밍과 메모리 효율성 때문입니다. 큰 응답(파일 다운로드, SSE)은 `Rack::BodyProxy`나 `Rack::File`을 사용하여 청크 단위로 스트리밍할 수 있습니다. `Rack::BodyProxy`는 `close` 콜백을 지원하여 연결 종료 시 정리 작업을 수행합니다.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **Rack** | 웹 서버 인터페이스 | call(env) → [status, headers, body] |
| **Rack 미들웨어** | 요청/응답 처리 체인 | initialize(app) + call(env) → @app.call |
| **Sinatra** | 경량 웹 DSL | instance_eval 라우팅 + Rack 통합 |
| **Rails MVC** | 풀스택 프레임워크 | Dispatch → Controller → View 파이프라인 |

## 다음 수업

다음 글에서는 Gem 개발 — RubyGem 패키징과 배포를 배웁니다.

---
layout: post
title: "Ruby 아키텍처와 베스트 프랙티스 — 프로젝트 구조, SOLID 원칙, Ruby 방식의 코드, 디자인 패턴"
description: "Ruby 프로젝트의 아키텍처 설계와 베스트 프랙티스를 시스템 레벨에서 심층 학습합니다. 도메인 기반 프로젝트 구조가 app/lib/spec 디렉토리를 features/services/domains 레이어로 분리하는 방식, SOLID 원칙(Single Responsibility/Open-Closed/Liskov Substitution/Interface Segregation/Dependency Inversion)을 Ruby에서 Duck Typing과 Mixin으로 구현하는 방법, Ruby 방식의 코드 작성(POLA: Principle of Least Surprise, TIMTOWTDI의 적절한 사용, 메서드 체이닝과 블록의 활용), 전략/팩토리/옵저버/데코레이터 패턴을 Ruby의 Proc/Module/prepend로 구현하는 방식, 성능/보안/유지보수성을 고려한 코드 리뷰 체크리스트를 다룹니다."
date: 2024-12-09 10:00:00 +0900
category: ruby
tags: [ruby, architecture, best-practices, solid, design-patterns, code-quality]
level: advanced
---

Ruby 프로젝트의 아키텍처는 도메인 기반 구조와 SOLID 원칙을 따릅니다.

> **핵심 정리** · 도메인 기반 구조는 features/services/domains 레이어로 분리합니다. SOLID 원칙을 Duck Typing과 Mixin으로 구현합니다. Ruby 방식(POLA, TIMTOWTDI)은 가독성과 유지보수성을 우선합니다. 주요 디자인 패턴(전략/팩토리/옵저버/데코레이터)을 Proc/Module/prepend로 간결하게 구현합니다.

---

## 수업 목표

- 도메인 기반 프로젝트 구조를 이해합니다.
- SOLID 원칙의 Ruby 구현을 이해합니다.
- Ruby 방식의 코드 작성 철학을 이해합니다.
- Ruby 디자인 패턴을 이해합니다.

## 도메인 기반 프로젝트 구조

```
project/
├── app/
│   ├── controllers/      # 요청 처리 (Sinatra/Rails)
│   ├── models/           # 도메인 모델
│   ├── services/         # 비즈니스 로직
│   │   ├── user/
│   │   │   ├── registration_service.rb
│   │   │   ├── authentication_service.rb
│   │   │   └── password_reset_service.rb
│   │   └── payment/
│   │       ├── checkout_service.rb
│   │       └── refund_service.rb
│   ├── repositories/     # 데이터 접근 추상화
│   └── policies/         # 권한 검사
├── config/               # 설정
├── lib/                  # 공유 유틸리티
│   ├── core_ext/         # 코어 클래스 확장
│   └── middleware/       # Rack 미들웨어
├── spec/                 # 테스트 (RSpec)
│   ├── models/
│   ├── services/
│   └── support/
└── Gemfile
```

도메인 기반 구조는 각 도메인(사용자, 결제, 주문)을 독립적인 모듈로 분리합니다. `services/user/` 디렉토리 아래에 사용자 관련 비즈니스 로직을 응집합니다. `repositories/`는 데이터 접근을 추상화하여 ORM(Active Record)에 대한 의존성을 낮춥니다. `policies/`는 `Pundit` Gem과 함께 권한 검사를 캡슐화합니다.

## SOLID 원칙과 Ruby

```ruby
# SRP (단일 책임 원칙) — Duck Typing
class ReportGenerator
  def generate(data, formatter)
    formatted = formatter.format(data)
    File.write('report.txt', formatted)
  end
end

class JSONFormatter
  def format(data)
    data.to_json
  end
end

class CSVFormatter
  def format(data)
    data.map { |row| row.join(',') }.join("\n")
  end
end

# OCP (개방-폐쇄 원칙) — Module + prepend
module Loggable
  def execute(*args)
    puts "[LOG] 호출: #{self.class}##{__method__}(#{args.inspect})"
    super
  rescue => e
    puts "[ERROR] #{e.message}"
    raise
  end
end

class PaymentProcessor
  prepend Loggable

  def execute(amount)
    # 결제 처리 로직
    "Processed: $#{amount}"
  end
end

# DI (의존성 역전) — Constructor Injection
class EmailService
  def initialize(delivery: DefaultDelivery.new)
    @delivery = delivery
  end

  def send_welcome(user)
    @delivery.deliver(
      to: user.email,
      subject: 'Welcome!',
      body: "Hello, #{user.name}!"
    )
  end
end

# Observer 패턴 — Module + Callback
module Observable
  def observers
    @observers ||= []
  end

  def add_observer(observer)
    observers << observer
  end

  def notify_observers(event, *args)
    observers.each { |obs| obs.update(event, *args) }
  end
end
```

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Ruby에서 SOLID 원칙을 적용할 때 주의할 점은 무엇인가요?</strong></summary>

Ruby의 Duck Typing은 LSP(Liskov Substitution Principle)를 자연스럽게 지원합니다(인터페이스가 아닌 메서드 응답으로 타입 판단). SRP는 메서드가 하나의 책임만 갖도록 유지합니다(class당 100줄 이내, method당 5줄 이내 권장). OCP는 `prepend`와 Module로 기존 클래스를 확장합니다. ISP는 최소 인터페이스를 유지합니다(하나의 거대한 모듈보다 여러 개의 작은 모듈). DI는 생성자 주입을 사용하여 의존성을 명시적으로 전달합니다.
</details>

<details>
<summary><strong>Q: Ruby 방식(Ruby Way)의 코드란 무엇인가요?</strong></summary>

Ruby 방식은 POLA(Principle of Least Surprise, 최소 놀람의 원칙)를 따릅니다: (1) 코드가 읽는 사람의 예상대로 동작해야 합니다. (2) `map`, `select`, `reduce` 등 Enumerable 메서드를 적극 사용합니다. (3) 블록과 yield를 활용하여 간결한 이터레이터를 작성합니다. (4) 메서드 체이닝으로 선언적 스타일을 유지합니다. (5) `unless`, `until` 등 자연어에 가까운 문법을 사용합니다. (6) 작은 메서드(5줄 이하)로 구성합니다. (7) `attr_accessor`로 캡슐화를 유지하면서도 간결하게 접근자를 정의합니다.
</details>

<details>
<summary><strong>Q: Ruby에서 팩토리 패턴은 어떻게 구현하나요?</strong></summary>

Ruby의 팩토리 패턴은 `send`나 `const_get`으로 간결하게 구현됩니다: `def create(type) Kernel.const_get(type.to_s.capitalize).new end`. `respond_to?`로 객체의 기능을 확인하는 팩토리도 가능합니다. `Class.new`로 런타임에 동적으로 클래스를 생성할 수도 있습니다. Proc을 팩토리로 사용할 수도 있습니다: `factory = -> { User.new(name: 'default') }`.
</details>

<details>
<summary><strong>Q: Ruby 프로젝트에서 코드 리뷰 시 확인해야 할 주요 사항은 무엇인가요?</strong></summary>

(1) 메서드 길이 — 5줄 이상이면 리팩터링 고려. (2) 클래스 길이 — 100줄 이상이면 SRP 위반 가능성. (3) nil 체크 과다 — `&.`(안전 항해 연산자)나 `fetch` 사용 고려. (4) 긴 메서드 체인 — 데메테르 법칙(Law of Demeter) 위반 확인. (5) 글로벌 변수/상태 — 전역 상태는 피하고 의존성 주입 사용. (6) 뮤테이션 — 가변 상태보다 불변 객체 선호. (7) 테스트 커버리지 — 중요한 로직에 테스트가 있는지 확인. (8) N+1 쿼리 — `includes`/`eager_load` 사용 확인.
</details>

<details>
<summary><strong>Q: Ruby 3의 패턴 매칭은 어떻게 사용하나요?</strong></summary>

Ruby 3.0+의 패턴 매칭: `case value; in pattern; ...; end`. 배열 패턴: `in [a, b, c]`. 해시 패턴: `in { name:, age: }`. 값 패턴: `in 42`. 변수 패턴: `in Integer => x`. 대체 패턴: `in 0 | 1`. 가드 조건: `in [a, b] if a > b`. 핀 연산자: `in ^expected`. One-line 패턴 매칭(Ruby 3.1+): `value => { name:, age: }`.
</details>

---

## 요약

| 개념 | 설명 | Ruby 구현 |
|------|------|----------|
| **도메인 구조** | 기능별 디렉토리 분리 | app/services/user/, lib/core_ext/ |
| **SOLID** | 객체지향 설계 원칙 | Duck Typing + Module + prepend |
| **패턴 매칭** | 데이터 구조 분해 | case...in 배열/해시/값 패턴 |
| **Ruby Way** | POLA/TIMTOWTDI | 블록, 체이닝, 작은 메서드 |
| **리뷰 체크리스트** | 코드 품질 검증 | 메서드 길이, nil 체크, N+1 쿼리 |

---

## 시리즈 완료

축하합니다! 이로써 Ruby의 기초부터 고급 아키텍처까지 24개의 수업을 완료했습니다. 이 시리즈에서는 Ruby의 핵심 철학(Matz의 순수 객체지향), 내부 동작 원리(MRI/YARV/iseq), 고급 기능(Ractor/YJIT/Fiber Scheduler), 메타프로그래밍, C 확장, 디자인 패턴을 시스템 레벨에서 학습했습니다.

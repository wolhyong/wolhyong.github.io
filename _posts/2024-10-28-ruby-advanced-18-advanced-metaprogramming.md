---
layout: post
title: "Ruby 고급 메타프로그래밍 — DSL 구축, TracePoint, 고유 메서드, 상속 훅, const_missing"
description: "Ruby의 고급 메타프로그래밍 기법을 시스템 레벨에서 심층 학습합니다. DSL(Domain-Specific Language) 구축을 위한 instance_eval/class_eval 패턴이 레시버를 변경하여 블록 내 self를 조작하는 방식(RSpec, Sinatra의 내부 구조), TracePoint가 Ruby VM의 이벤트 후크 시스템을 통해 라인/호출/반환/클래스/예외 이벤트를 캡처하는 과정(TracePoint.new(:call) { |tp| ... }), inherited/included/extended/method_added 등의 상속 훅이 Module#include 시점에 자동 호출되어 메타프로그래밍 패턴을 가능하게 하는 방식, const_missing이 정의되지 않은 상수 참조 시 호출되어 자동 로딩(Autoloading)을 구현하는 과정(Rails의 Zeitwerk가 이 방식을 사용), removed_method/undef_method로 메서드를 동적으로 제거하는 방식을 다룹니다."
date: 2024-10-28 10:00:00 +0900
category: ruby
tags: [ruby, metaprogramming, dsl, tracepoint, hooks, const-missing, autoload]
level: advanced
---

Ruby의 고급 메타프로그래밍은 DSL 구축과 VM 레벨 이벤트 후킹까지 확장됩니다.

> **핵심 정리** · DSL은 `instance_eval`로 블록의 self를 변경하여 구축합니다. `TracePoint`는 Ruby VM의 이벤트 후크 시스템으로 라인/호출/반환 등을 캡처합니다. 상속 훅(`inherited`/`included`/`method_added`)은 메타프로그래밍 패턴의 기반입니다. `const_missing`은 Rails Zeitwerk의 자동 로딩 엔진의 핵심입니다.

---

## DSL 구축

```ruby
# DSL 예제 — 간단한 라우팅 DSL
class Router
  def initialize
    @routes = []
  end

  def get(path, &handler)
    @routes << { method: 'GET', path: path, handler: handler }
  end

  def post(path, &handler)
    @routes << { method: 'POST', path: path, handler: handler }
  end

  def draw(&block)
    instance_eval(&block)
  end

  def match(method, path)
    @routes.find { |r| r[:method] == method && r[:path] == path }
  end
end

router = Router.new
router.draw do
  get '/hello' do
    "Hello, World!"
  end
  post '/data' do
    "Data received"
  end
end

route = router.match('GET', '/hello')
puts route[:handler].call  # "Hello, World!"
```

`instance_eval(&block)`은 블록의 self를 레시버 객체로 변경합니다. `draw` 메서드 내에서 `get`과 `post`는 `Router` 인스턴스의 메서드로 호출됩니다. 이는 Sinatra의 `get '/' do ... end`와 RSpec의 `describe Class do ... end`의 내부 동작 방식입니다. `class_eval`은 클래스 컨텍스트에서 메서드를 정의하는 데 사용됩니다.

## TracePoint

```ruby
# TracePoint로 메서드 호출 추적
trace = TracePoint.new(:call, :return) do |tp|
  case tp.event
  when :call
    puts "→ 호출: #{tp.defined_class}##{tp.method_id}"
    puts "  파일: #{tp.path}:#{tp.lineno}"
    puts "  인자: #{tp.binding.local_variables.map { |v| \"#{v}=#{tp.binding.local_variable_get(v)}\" }.join(', ')}"
  when :return
    puts "← 반환: #{tp.defined_class}##{tp.method_id} => #{tp.return_value.inspect}"
  end
end

trace.enable

def add(a, b)
  a + b
end

result = add(3, 4)
puts "결과: #{result}"

trace.disable
```

`TracePoint`는 Ruby VM의 이벤트 후크 시스템을 래핑합니다. `:call`(메서드 호출), `:return`(메서드 반환), `:line`(새 줄 실행), `:class`(클래스 정의), `:end`(클래스 정의 종료), `:raise`(예외 발생), `:b_call`(블록 호출), `:c_call`(C 메서드 호출) 등의 이벤트를 지원합니다. `tp.binding`으로 호출 컨텍스트의 모든 지역 변수에 접근할 수 있습니다. 성능 오버헤드가 있으므로 프로덕션에서는 사용을 자제해야 합니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: instance_eval과 class_eval의 차이를 DSL 관점에서 설명해주세요.</strong></summary>

`instance_eval`은 객체의 **싱글톤 컨텍스트**에서 블록을 실행합니다. 블록 내의 `self`는 객체 자신이 됩니다. DSL에서 `instance_eval`을 사용하면 블록 내에서 메서드 호출이 DSL 객체의 메서드로 직접 전달됩니다(RSpec, Sinatra 스타일). `class_eval`은 **클래스 컨텍스트**에서 블록을 실행하여 인스턴스 메서드를 정의합니다. Active Record의 `validates :name, presence: true`는 `class_eval`을 통해 클래스 수준 DSL을 구현합니다.
</details>

<details>
<summary><strong>Q: TracePoint의 성능 영향은 어느 정도인가요?</strong></summary>

TracePoint가 활성화되면 VM의 모든 이벤트(메서드 호출/반환, 라인 실행 등)가 후킹되어, 코드 실행 속도가 10~100배 느려질 수 있습니다. 특히 `:line` 이벤트는 매 라인마다 발생하므로 가장 큰 오버헤드가 있습니다. 프로덕션에서 TracePoint를 사용해야 한다면, 최소한의 이벤트만 활성화하고 꼭 필요한 코드 영역에서만 활성화하는 것이 좋습니다. 디버깅/프로파일링 목적으로만 사용하는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q: const_missing은 어떻게 자동 로딩을 구현하나요?</strong></summary>

`Module#const_missing`은 정의되지 않은 상수가 참조될 때 호출됩니다. Rails의 Zeitwerk는 이 방식을 사용합니다. 예를 들어 `User` 상수가 참조되면 `const_missing`이 호출되고, Zeitwerk는 `app/models/user.rb` 파일을 로드합니다. 로드 후 다시 `const_get(:User)`를 시도합니다. `autoload` 메서드는 `Module#autoload`로 상수-파일 매핑을 등록하여, 상수가 처음 참조될 때 파일을 로드합니다.
</details>

<details>
<summary><strong>Q: inherited 훅은 언제 호출되나요?</strong></summary>

`inherited`는 클래스가 서브클래싱될 때 호출됩니다: `class Child < Parent; end`. `ActiveRecord::Base`의 `inherited` 훅은 서브클래스의 테이블명, 컬럼 정보를 자동으로 설정합니다. `included`는 모듈이 `include`될 때, `extended`는 `extend`될 때, `method_added`는 새 메서드가 정의될 때 호출됩니다. 이러한 훅들은 ORM, 테스팅 프레임워크, 직렬화 라이브러리 등에서 광범위하게 사용됩니다.
</details>

<details>
<summary><strong>Q: method_removed와 undef_method의 차이는 무엇인가요?</strong></summary>

`method_removed`는 `remove_method`로 메서드가 제거될 때 호출됩니다. `undef_method`는 메서드를 완전히 삭제하여(상속된 메서드도 차단) 호출 시 NoMethodError가 발생하게 합니다. `remove_method`는 해당 클래스에서 직접 정의한 메서드만 제거하고, 상속된 메서드는 제거되지 않습니다. `undef_method`는 상속 체인 전체에서 해당 이름의 메서드를 차단합니다. `method_undefined` 훅은 `undef_method` 호출 시 발생합니다.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **instance_eval DSL** | self 변경 블록 | 레시버 변경 → 메서드 직접 호출 |
| **TracePoint** | VM 이벤트 후크 | :call/:return/:line/:raise 등 이벤트 캡처 |
| **상속 훅** | 상속/include/extend 시 콜백 | inherited/included/extended 자동 호출 |
| **const_missing** | 자동 로딩 | 상수 참조 실패 → 파일 로드 + 재시도 |
| **undef_method** | 메서드 차단 | 상속 체인에서 메서드 제거 |

## 다음 수업

다음 글에서는 DSL과 웹 프레임워크 — Rack, Sinatra, Rails 기초를 배웁니다.

---
layout: post
title: "Ruby 3 심층 분석 — Ractor, YJIT, Fiber Scheduler, RBS 타입 시스템, Ruby 4 전망"
description: "Ruby 3.x 시리즈의 주요 신기능을 시스템 레벨에서 심층 학습합니다. Ractor의 Actor 모델이 GVL 없이 완전한 병렬 처리를 제공하는 방식과 Ractor 간 객체 공유 제한이 Marshal.dump 기반의 deep copy로 구현되는 과정, YJIT의 4단계 최적화 파이프라인(해석 → 모니터링 → 컴파일 → 네이티브 코드 실행)이 iseq에서 x86_64/AArch64 기계어를 생성하는 방식, Fiber Scheduler가 커널 스레드를 사용하지 않고 rb_thread_io_wait()를 후킹하여 수천 개의 동시 연결을 단일 스레드에서 처리하는 과정, RBS(Type Definition)와 TypeProf(Type Inference)가 선택적 타입 검사를 제공하는 방식과 Ruby 3의 3×3 성능 목표 달성 현황, Ruby 4에서 예상되는 주요 기능(Guilds, 타입 시스템 강화, 패턴 매칭 심화)을 다룹니다."
date: 2024-12-02 10:00:00 +0900
category: ruby
tags: [ruby, ruby3, ractor, yjit, fiber-scheduler, type-system, rbs, typeprof]
level: advanced
---

Ruby 3.x 시리즈는 성능, 동시성, 타입 시스템에서 큰 변화를 가져왔습니다.

> **핵심 정리** · Ruby 3.0은 3×3 성능 목표(Ruby 2.0 대비 3배)를 달성했습니다. Ractor는 Actor 모델 기반 완전 병렬 실행, YJIT는 iseq→기계어 JIT 컴파일, Fiber Scheduler는 수천 개 동시 연결 처리, RBS+TypeProf는 선택적 타입 검사를 제공합니다.

---

## 수업 목표

- Ractor의 메시지 전달과 객체 공유 제한을 이해합니다.
- YJIT의 4단계 최적화 파이프라인을 이해합니다.
- Fiber Scheduler의 non-blocking I/O를 이해합니다.
- RBS 타입 시스템을 이해합니다.

## Ruby 3 아키텍처

```ruby
# Ractor 예제 (Ruby 3.0+)
ractor = Ractor.new do
  sum = 0
  Ractor.receive.times do |i|
    sum += i
  end
  sum
end

ractor.send(10_000_000)
result = ractor.take
puts "결과: #{result}"  # 49999995000000

# Ractor 간 메시지 전달 (deep copy)
data = { key: 'value', array: [1, 2, 3] }
r = Ractor.new do
  received = Ractor.receive
  received[:key] = 'modified'  # 원본에 영향 없음 (deep copy)
  received
end
r.send(data)
puts data[:key]  # "value" (원본 유지)

# Fiber Scheduler 예제
require 'async'

Fiber.set_scheduler(Async::Scheduler.new)

Fiber.schedule do
  # non-blocking HTTP 요청
  response = Net::HTTP.get(URI('https://httpbin.org/delay/1'))
  puts "응답 수신: #{response.length} bytes"
end

Fiber.schedule do
  sleep 0.5
  puts "동시 실행"
end
```

Ractor는 `Ractor.new` 블록 내에서 코드를 실행합니다. `ractor.send(data)`로 메시지를 전송하면 `Marshal.dump`로 deep copy되어 전달됩니다. `ractor.take`로 결과를 수신합니다. Ractor 간에는 `Ractor::Unsafe`를 사용하지 않는 한 공유 가변 상태가 허용되지 않습니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Ruby 3의 3×3 성능 목표란 무엇인가요?</strong></summary>

Ruby 3.0의 3×3 성능 목표는 "Ruby 2.0 대비 3배 빠른 Ruby 3"이었습니다. YJIT, Ractor, 최적화된 VM으로 실제로 달성했습니다. 구체적으로: (1) YJIT로 CPU 바운드 코드 30~60% 향상. (2) Ractor로 멀티코어 활용(8코어에서 6~7배 향상). (3) Fiber Scheduler로 I/O 바운드 동시성 향상(수천 연결 처리). 벤치마크 도구(`benchmark-driver`)로 특정 작업(Optcarrot, Liquid 템플릿)에서 3배 이상의 성능 향상을 확인했습니다.
</details>

<details>
<summary><strong>Q: RBS와 TypeProf의 차이는 무엇인가요?</strong></summary>

RBS(Ruby Signature)는 **명시적 타입 정의 파일**(`.rbs`)입니다. 개발자가 직접 타입을 선언합니다: `class User attr_reader name: String def initialize(name: String) -> void end`. TypeProf는 **타입 추론 도구**로, Ruby 코드를 정적으로 분석하여 타입을 자동 추론하고 RBS 파일을 생성합니다. TypeProf는 완벽한 타입 추론이 어려워(동적 타이핑의 한계), RBS로 명시적 타입 정의를 권장합니다. Steep Gem이 RBS 타입 검사기로 동작합니다.
</details>

<details>
<summary><strong>Q: Fiber Scheduler의 async/await 패턴은 어떻게 동작하나요?</strong></summary>

Fiber Scheduler는 non-blocking I/O 작업을 위해 `rb_thread_io_wait()`를 후킹합니다. `Fiber.schedule { ... }`로 새 Fiber를 생성하면, 블록 내의 `sleep`이나 `Net::HTTP` 호출이 발생할 때 Scheduler가 `io_wait`/`kernel_sleep` 메서드를 호출합니다. Scheduler는 현재 Fiber를 일시 중단하고(suspend), I/O가 완료되면 다시 재개(resume)합니다. 이 과정에서 OS 스레드는 블로킹되지 않으므로, 수천 개의 동시 연결을 단일 스레드에서 효율적으로 처리할 수 있습니다.
</details>

<details>
<summary><strong>Q: Ruby 4에서 예상되는 주요 기능은 무엇인가요?</strong></summary>

Ruby 4(예정)의 주요 기능: (1) **Guilds** — Ractor의 진화된 형태로, 더 유연한 메모리 공유 모델. (2) **타입 시스템 강화** — RBS 2.0, 더 정확한 TypeProf, 제네릭 타입 지원 확대. (3) **패턴 매칭 심화** — `case...in` 패턴 매칭의 데이터 구조 분해 기능 강화. (4) **YJIT 확장** — 더 많은 코드 패턴의 JIT 컴파일, 컴파일된 코드 캐시 최적화. (5) **GVL 축소** — 특정 조건에서 GVL을 해제하는 모드 도입. (6) **성능** — Ruby 3 대비 2~3배 추가 성능 향상 목표.
</details>

<details>
<summary><strong>Q: Ruby 3.x에서 프로덕션 준비가 완료된 기능은 무엇인가요?</strong></summary>

YJIT(Ruby 3.1+ 기본 활성화, 프로덕션 검증 완료), Fiber Scheduler(async Gem과 함께 프로덕션 사용 가능), 패턴 매칭(Ruby 3.0 안정화), Ractor(실험적 → Ruby 3.3+에서 점진적 도입 권장), RBS(Ruby 3.1+ 공식 지원). 현재 가장 큰 성능 향상을 보여주는 기능은 YJIT입니다(Rails 애플리케이션에서 30~60% 성능 향상).
</details>

---

## 요약

| 개념 | 버전 | 설명 |
|------|------|------|
| **Ractor** | 3.0 | Actor 모델 병렬 실행, GVL 없음, deep copy 메시지 전달 |
| **YJIT** | 3.1+ | iseq → x86_64/AArch64 기계어, 30~60% 성능 향상 |
| **Fiber Scheduler** | 3.0 | non-blocking I/O, 수천 동시 연결 |
| **RBS** | 3.0 | 명시적 타입 정의 파일 (.rbs) |
| **TypeProf** | 3.0 | 타입 추론 도구 → RBS 생성 |

## 다음 수업

다음 글에서는 Ruby 아키텍처와 베스트 프랙티스 — 프로젝트 구조, 디자인 패턴, Ruby 방식의 코드 작성법을 배웁니다.

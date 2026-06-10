---
layout: post
title: "Ruby 성능 최적화 — YJIT JIT 컴파일러, Benchmark/Profile, 메모리 최적화, GC 튜닝"
description: "Ruby 애플리케이션의 성능 최적화 방법을 시스템 레벨에서 심층 학습합니다. YJIT(Yet Another JIT)가 Ruby 3.1+에서 기본 활성화되어 iseq(명령어 시퀀스)를 런타임에 x86_64/AArch64 기계어로 컴파일하여 특정 코드 경로의 실행 속도를 30~60% 향상시키는 과정, Benchmark.bm과 Benchmark.bmbm이 wall clock 시간을 측정하여 코드 조각의 성능을 비교하는 방식, StackProf이 Signal.trap(:PROF)로 샘플링 프로파일링을 수행하여 CPU 시간을 가장 많이 소비하는 메서드를 식별하는 과정, ObjectSpace로 메모리 할당을 추적하여 GC(Garbage Collection) 부담이 큰 코드를 찾는 방법, Ruby GC의 Generational Mark&Sweep 알고리즘(Young 객체와 Old 객체를 구분하여 마킹)을 이해하고 GC.disable/GC.start로 GC 동작을 제어하는 방식을 다룹니다."
date: 2024-11-18 10:00:00 +0900
category: ruby
tags: [ruby, performance, yjit, profiling, benchmarking, optimization, gc]
level: advanced
---

Ruby 성능 최적화는 YJIT, 프로파일링, GC 튜닝의 세 가지 축으로 구성됩니다.

> **핵심 정리** · YJIT는 iseq를 x86_64/AArch64 기계어로 JIT 컴파일하여 성능을 30~60% 향상시킵니다. `Benchmark.bm`으로 wall clock 시간을 측정합니다. `StackProf`은 샘플링 프로파일러입니다. Ruby GC는 Generational Mark&Sweep으로 Young/Old 객체를 구분하여 수집합니다.

---

## 수업 목표

- YJIT의 JIT 컴파일 과정을 이해합니다.
- Benchmark와 profile 도구 사용법을 이해합니다.
- 메모리 최적화 방법을 이해합니다.
- GC의 Generational 알고리즘을 이해합니다.

## YJIT

```ruby
# YJIT 활성화 확인
$ ruby --yjit -e 'puts RubyVM::YJIT.enabled?'  # true

# YJIT 통계
$ ruby --yjit --yjit-stats -e '
  10000.times { |i| i * 2 }
  puts RubyVM::YJIT.runtime_stats
'

# YJIT 코드에서 확인
if defined?(RubyVM::YJIT) && RubyVM::YJIT.enabled?
  puts "YJIT 활성화됨"
  puts "컴파일된 코드 크기: #{RubyVM::YJIT.runtime_stats[:code_region_size]} bytes"
end
```

YJIT(Yet Another JIT)는 Ruby 3.1+에서 기본 활성화된 JIT 컴파일러입니다. iseq(명령어 시퀀스)의 핫 경로(hot path, 여러 번 실행된 코드)를 x86_64 또는 AArch64 기계어로 컴파일합니다. 컴파일된 코드는 캐시되어 동일한 코드 경로가 다시 실행될 때 VM 해석(interpretation)을 건너뜁니다. YJIT는 특정 코드 패턴(메서드 호출, 블록 실행, 루프)을 최적화하며, 실제 애플리케이션(Rails 등)에서 30~60%의 성능 향상을 보여줍니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: YJIT는 모든 코드를 컴파일하나요?</strong></summary>

YJIT는 **핫 경로(hot path)**만 컴파일합니다. 초기에는 iseq를 해석(interpret)하다가, 특정 진입 지점(메서드/블록)이 일정 횟수 이상 실행되면(기본값 10회) 해당 경로를 기계어로 컴파일합니다. 컴파일된 코드는 메모리에 캐시됩니다. 한 번만 실행되는 코드(초기화, 설정)는 컴파일되지 않습니다. `--yjit-exec-method-threshold` 옵션으로 컴파일 임계값을 조정할 수 있습니다.
</details>

<details>
<summary><strong>Q: Benchmark.bm과 Benchmark.bmbm의 차이는 무엇인가요?</strong></summary>

`Benchmark.bm`은 각 벤치마크를 실행하고 wall clock 시간을 측정합니다. GC로 인한 첫 번째 벤치마크의 성능 저하를 보정하지 않습니다. `Benchmark.bmbm`은 예비 실행(rehearsal)을 먼저 수행하여 GC와 캐시 영향을 줄입니다. 예비 실행 후 본 실행에서 더 정확한 측정값을 얻을 수 있습니다. 측정값은 `user CPU time`, `system CPU time`, `total`, `real`(wall clock)로 구성됩니다.
</details>

<details>
<summary><strong>Q: Ruby GC는 Generational Mark&Sweep을 어떻게 구현하나요?</strong></summary>

Ruby 2.1+의 GC는 **Generational Mark&Sweep**(세대별 표시-쓸기)을 사용합니다. 객체를 Young(신생)과 Old(성숙) 세대로 구분하고, 주로 Young 객체만 스캔하여 GC 시간을 단축합니다(Minor GC). Old 객체가 많아지면 전체 힙을 스캔합니다(Major GC). `RUBY_GC_HEAP_INIT_SLOTS`(초기 힙 크기), `RUBY_GC_HEAP_GROWTH_FACTOR`(힙 증가율), `RUBY_GC_OLDMALLOC_LIMIT`(Old 객체 malloc 제한) 환경 변수로 GC 튜닝이 가능합니다.
</details>

<details>
<summary><strong>Q: 메모리 누수를 탐지하는 방법은 무엇인가요?</strong></summary>

(1) `ObjectSpace.count_objects`로 객체 타입별 개수를 확인합니다. (2) `GC.start` 후 `ObjectSpace.count_objects[:T_STRING]`으로 해제되지 않은 문자열을 확인합니다. (3) `ObjectSpace.each_object(String) { |s| puts s if s.bytesize > 10000 }`로 큰 객체를 찾습니다. (4) `memory_profiler` Gem으로 객체 할당을 추적합니다. (5) Memprof2나 Valgrind의 Massif로 C 레벨 메모리 할당을 분석합니다. (6) 클로저 변수 캡처로 인한 메모리 누수를 주의합니다.
</details>

<details>
<summary><strong>Q: 메서드 호출 성능을 최적화하는 방법은 무엇인가요?</strong></summary>

(1) `method_missing` 대신 `define_method`로 실제 메서드를 생성합니다(method_missing은 호출될 때마다 메서드 부재 확인 → rb_method_missing 호출의 오버헤드). (2) 동적 메서드 호출 대신 직접 호출을 사용합니다(`send(:method)`보다 `obj.method`가 빠름). (3) 루프 내에서 반복되는 메서드 호출을 변수에 캐시합니다. (4) freeze된 문자열 리터럴을 사용합니다(`# frozen_string_literal: true`). (5) `while` 대신 `times`/`each`를 사용합니다(YARV가 이터레이터를 최적화함). (6) YJIT를 활성화합니다.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **YJIT** | JIT 컴파일러 | iseq → x86_64/AArch64 기계어 (30~60% 향상) |
| **Benchmark** | 성능 측정 | wall clock / CPU time 측정 |
| **StackProf** | 샘플링 프로파일러 | Signal.trap(:PROF) → 호출 스택 샘플링 |
| **GC** | Generational Mark&Sweep | Young/Old 세대 구분 → Minor/Major GC |
| **메모리 최적화** | GC 부담 감소 | 객체 할당 최소화, frozen literal, 캐싱 |

## 다음 수업

다음 글에서는 C 확장 — Ruby C API로 네이티브 확장 개발을 배웁니다.

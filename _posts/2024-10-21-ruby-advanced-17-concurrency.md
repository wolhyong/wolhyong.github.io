---
layout: post
title: "Ruby 동시성 — Thread의 GVL, Fiber의 협력적 스케줄링, Ractor의 병렬 처리 모델"
description: "Ruby의 세 가지 동시성 모델(Thread, Fiber, Ractor)을 시스템 레벨에서 심층 학습합니다. Thread가 pthread(OS 스레드)로 생성되지만 GVL(Global VM Lock)에 의해 동시에 하나의 스레드만 Ruby 코드를 실행할 수 있는 과정(GVL 회전율이 I/O 바운드 작업에는 95% 이상의 효율을 보이지만 CPU 바운드 작업에서는 단일 코어 성능으로 제한됨), Mutex#synchronize가 MonitorMixin을 통해 스레드 간 임계 구역을 보호하여 경쟁 조건을 방지하는 방식, Thread::Queue가 조건 변수(ConditionVariable)로 생산자-소비자 패턴을 구현하는 과정, Fiber가 사용자 공간(user-space)에서 협력적 스케줄링(cooperative scheduling)을 통해 명시적인 Fiber.yield로 제어권을 전환하는 방식과 Fiber Scheduler가 non-blocking I/O를 위해 rb_thread_io_wait()를 후킹하는 원리, Ractor가 Actor 모델로 GVL 없이 완전한 병렬 실행을 제공하며 Ractor 간 메시지 전달을 위해 Ractor#send/Ractor#receive를 사용하는 과정을 다룹니다."
date: 2024-10-21 10:00:00 +0900
category: ruby
tags: [ruby, threads, fiber, ractor, concurrency, parallelism, gvl, mutex]
level: advanced
---

Ruby는 Thread, Fiber, Ractor의 세 가지 동시성 모델을 제공합니다.

> **핵심 정리** · Thread는 OS 스레드이지만 GVL(Global VM Lock)에 의해 동시 실행이 제한됩니다(I/O 작업에서 효율적). Fiber는 사용자 공간 협력적 스케줄링으로 명시적 yield로 전환합니다. Ractor는 Actor 모델로 GVL 없이 진정한 병렬 실행을 제공합니다(Ractor 간 공유 상태 없음, 메시지 전달만 가능).

---

## 수업 목표

- Thread의 GVL 동작 방식과 I/O 최적화를 이해합니다.
- Mutex와 Queue의 스레드 동기화를 이해합니다.
- Fiber의 협력적 스케줄링을 이해합니다.
- Ractor의 Actor 모델 병렬 처리를 이해합니다.

## Thread와 GVL

```ruby
# Ruby 스레드는 OS 스레드지만 GVL에 의해 제한됨
threads = 5.times.map do |i|
  Thread.new do
    puts "Thread #{i} 시작 (PID: #{Thread.current.object_id})"
    sleep(1)  # I/O 대기 — GVL 해제, 다른 스레드 실행 가능
    puts "Thread #{i} 종료"
  end
end

threads.each(&:join)

# Mutex로 동기화
counter = 0
mutex = Mutex.new

10.times.map do
  Thread.new do
    1000.times do
      mutex.synchronize { counter += 1 }
    end
  end
end.each(&:join)

puts counter  # 10000 (경쟁 조건 없음)

# Thread::Queue (생산자-소비자)
queue = Queue.new

producer = Thread.new do
  5.times { |i| queue << "데이터 #{i}" }
  queue.close
end

consumer = Thread.new do
  while item = queue.pop
    puts "소비: #{item}"
  end
end

[producer, consumer].each(&:join)
```

Thread는 `pthread_create()`로 OS 스레드를 생성하지만, GVL(Global VM Lock)에 의해 동시에 하나의 스레드만 Ruby 코드(바이트코드)를 실행할 수 있습니다. I/O 작업(`sleep`, `read`, `write`) 중에는 GVL이 해제되어 다른 스레드가 실행됩니다. 따라서 I/O 바운드 작업에서는 멀티스레드가 효과적이지만(한 스레드가 I/O 대기 중 다른 스레드가 CPU 사용), CPU 바운드 작업에서는 단일 코어 성능으로 제한됩니다.

`Mutex#synchronize`는 내부적으로 `pthread_mutex_lock()`을 호출합니다. `Thread::Queue`는 조건 변수(ConditionVariable)를 사용하여 생산자 스레드가 데이터를 추가하면 소비자 스레드를 깨웁니다.

## Fiber와 Fiber Scheduler

```ruby
# Fiber 기본
fiber = Fiber.new do
  puts "Fiber: 1단계"
  Fiber.yield "중간값"
  puts "Fiber: 2단계"
  "최종값"
end

puts fiber.resume  # "Fiber: 1단계" 출력, "중간값" 반환
puts fiber.resume  # "Fiber: 2단계" 출력, "최종값" 반환
# puts fiber.resume  # FiberError: dead fiber called

# Fiber Scheduler (Ruby 3.0+)
require 'async'

Fiber.set_scheduler(Async::Scheduler.new)

Fiber.schedule do
  puts "Task 1 시작"
  sleep(1)  # non-blocking sleep
  puts "Task 1 종료"
end

Fiber.schedule do
  puts "Task 2 시작"
  sleep(1)
  puts "Task 2 종료"
end
```

Fiber는 사용자 공간(user-space)에서 동작하는 경량 실행 단위입니다. OS 스레드와 달리 커널의 개입 없이 협력적 스케줄링(cooperative scheduling)으로 동작합니다. `Fiber.yield`로 명시적으로 제어권을 반환하고, `fiber.resume`으로 실행을 재개합니다. Fiber Scheduler(Ruby 3.0+)는 `sleep`, `IO#read`, `IO#write` 등의 블로킹 작업을 `rb_thread_io_wait()`를 후킹하여 non-blocking으로 전환합니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Thread, Fiber, Ractor 중 어떤 것을 선택해야 하나요?</strong></summary>

I/O 바운드 작업(파일 읽기, HTTP 요청, DB 쿼리)에는 **Thread**가 적합합니다(GVL이 I/O 중 해제되어 효율적). 경량 동시성이 필요하고 명시적 제어권 전환이 가능한 구조에는 **Fiber**가 적합합니다(수천 개의 Fiber를 단일 스레드에서 실행 가능). CPU 바운드 작업(계산, 데이터 처리)에서는 **Ractor**만이 진정한 병렬 처리를 제공합니다(GVL 없음). Fiber Scheduler는 Thread와 유사한 API로 Fiber를 자동 관리합니다.
</details>

<details>
<summary><strong>Q: Ractor는 어떻게 메시지를 전달하나요?</strong></summary>

Ractor는 공유 상태 대신 메시지 전달(message passing)을 사용합니다. `ractor.send(data)`로 메시지를 보내고, `ractor.receive`로 메시지를 받습니다. 전달되는 데이터는 **deep copy**(Marshal.dump → Marshal.load)되므로, 원본 객체와 복사본이 분리됩니다. `Ractor.receive_if { |msg| msg.is_a?(Integer) }`로 조건부 수신이 가능합니다. 특수 객체(`Ractor::Unsafe`)를 사용하면 공유 상태를 허용할 수 있지만, 데이터 경합의 위험이 있습니다.
</details>

<details>
<summary><strong>Q: Thread의 GVL은 어떻게 확인할 수 있나요?</strong></summary>

`Thread#backtrace`로 각 스레드의 호출 스택을 확인할 수 있습니다. GVL 대기 중인 스레드는 `ruby_thread_has_gvl_p()`로 GVL 보유 여부를 확인할 수 있습니다. `STDERR.puts Thread.current.status`로 스레드 상태(run, sleep, aborting 등)를 출력할 수 있습니다. C 확장에서 `rb_thread_call_without_gvl()`을 호출하여 GVL 없이 C 코드를 실행할 수 있습니다.
</details>

<details>
<summary><strong>Q: Fiber Scheduler를 직접 구현할 수 있나요?</strong></summary>

네, `Fiber::Scheduler` 인터페이스를 구현하여 커스텀 스케줄러를 만들 수 있습니다. 주요 메서드: `block(blocker, timeout)` — Fiber가 블로킹될 때 호출, `unblock(blocker, fiber)` — 블로킹 해제 시 호출, `kernel_sleep(duration)` — sleep 호출 시, `io_wait(io, events)` — I/O 대기 시, `address_resolve(hostname)` — DNS 조회 시. Async gem, Polyphony gem 등이 커스텀 스케줄러를 제공합니다.
</details>

<details>
<summary><strong>Q: Ruby 3.3+의 Ractor 성능은 어떤가요?</strong></summary>

Ruby 3.3+에서 Ractor는 CPU 바운드 작업에서 스레드 수에 비례하여 선형적인 성능 향상을 보여줍니다. 8코어 CPU에서 8개의 Ractor를 사용하면 단일 스레드 대비 약 6~7배의 성능 향상을 기대할 수 있습니다. 메시지 전달 오버헤드(Marshal 직렬화)는 미미합니다(작은 데이터의 경우 1μs 미만). 단, Ractor 간 객체 공유가 필요한 `Ractor::Unsafe` 사용 시 성능이 저하됩니다.
</details>

---

## 요약

| 개념 | 설명 | GVL | 병렬 실행 | 스케줄링 |
|------|------|-----|----------|---------|
| **Thread** | OS 스레드 | 있음 (I/O 시 해제) | 부분적 | 선점형(OS) |
| **Fiber** | 사용자 공간 경량 스레드 | 상속 | 불가 | 협력적(yield) |
| **Ractor** | Actor 모델 병렬 실행 | 없음 | 가능 (완전 병렬) | 선점형(OS) |

## 다음 수업

다음 글에서는 고급 메타프로그래밍 — DSL 구축, 고급 훅, TracePoint를 배웁니다.

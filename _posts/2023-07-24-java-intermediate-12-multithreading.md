---
layout: post
title: "Java 멀티스레딩 — Thread, Runnable, 동기화, Executor, 동시성 컬렉션"
description: "Java 멀티스레딩을 JVM 스레드 모델과 OS 레벨에서 심층 학습합니다. Thread와 Runnable의 차이(start()가 OS 스레드를 생성하고 run()을 실행하는 과정), synchronized 키워드가 객체의 모니터(monitor)를 획득하는 바이트코드 레벨 동작(monitorenter/monitorexit), volatile이 가시성을 보장하는 Happens-Before 규칙, ExecutorService의 스레드 풀(ThreadPoolExecutor) 구조와 작업 큐 처리, 동시성 컬렉션(ConcurrentHashMap)의 세그먼트 기반 락 구조를 다룹니다."
date: 2023-07-24 10:00:00 +0900
category: java
tags: [java, multithreading, thread, synchronization, executor, concurrent-hashmap, volatile]
level: intermediate
---

멀티스레딩은 Java 애플리케이션의 성능을 극대화하는 핵심 기술입니다. Java는 스레드 관리와 동기화를 위한 풍부한 API를 제공합니다.

> **💡 핵심 정리** · Java 스레드는 JVM이 OS의 native thread(1:1 매핑)로 생성하며, `Thread.start()`가 네이티브 메서드를 통해 새 OS 스레드를 만들고 그 위에서 `run()`을 실행합니다. `synchronized` 블록은 바이트코드의 `monitorenter`/`monitorexit`으로 변환되어 객체 헤더의 mark word에 있는 모니터를 획득/해제합니다. `volatile`은 `Lock prefix`(x86) 명령어로 메모리 베리어를 생성하여 CPU 캐시가 아닌 주메모리에서 직접 읽고 쓰도록 합니다.

---

## 📚 수업 목표

- Thread와 Runnable의 차이를 이해합니다.
- synchronized의 모니터 기반 동작을 이해합니다.
- volatile과 Happens-Before 규칙을 이해합니다.
- ExecutorService로 스레드 풀을 관리할 수 있습니다.
- 동시성 컬렉션의 특징을 이해합니다.

## 스레드 생성

```java
// Thread 상속
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread 실행: " + Thread.currentThread().getName());
    }
}

// Runnable 구현 (권장)
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable 실행: " + Thread.currentThread().getName());
    }
}

// 사용
Thread t1 = new MyThread();
Thread t2 = new Thread(new MyRunnable());
t1.start();  // 새 OS 스레드 생성
t2.start();
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Thread 상속보다 Runnable 구현이 권장되는 이유는 무엇인가요?</strong></summary>

1) **유연성**: Thread를 상속하면 다른 클래스를 상속할 수 없습니다. Runnable은 인터페이스이므로 다른 클래스를 상속하면서 스레드를 만들 수 있습니다. 2) **재사용성**: 같은 Runnable 인스턴스를 여러 스레드에서 실행할 수 있습니다. 3) **테스트 용이성**: Runnable은 단순한 인터페이스라 테스트하기 쉽습니다. 4) **Executor와의 호환성**: ExecutorService는 Runnable(또는 Callable)을 기본 단위로 사용합니다.
</details>

<details>
<summary><strong>Q: synchronized 메서드와 synchronized 블록의 차이는 무엇인가요?</strong></summary>

**synchronized 메서드**는 전체 메서드에 락이 걸려 기간이 깁니다. **synchronized 블록**은 필요한 부분만 락을 걸어 동시성을 높입니다. 동기화 메서드는 this(인스턴스 메서드) 또는 Class 객체(static 메서드)에 락을 걸지만, 블록은 어떤 객체라도 락을 걸 수 있어 더 세밀한 제어가 가능합니다. 성능이 중요하다면 synchronized 블록으로 최소한의 범위만 동기화하세요.
</details>

<details>
<summary><strong>Q: volatile과 synchronized의 차이는 무엇인가요?</strong></summary>

**volatile**은 가시성(visibility)만 보장하고 상호 배제(mutual exclusion)는 보장하지 않습니다. 읽기/쓰기가 원자적으로 이루어지지만, `count++` 같은 복합 연산은 원자적이지 않습니다. **synchronized**는 가시성과 상호 배제를 모두 보장합니다. volatile은 boolean 플래그나 상태 표시에 적합하고, 복합 연산이 필요하면 synchronized(또는 AtomicInteger)를 사용해야 합니다.
</details>

<details>
<summary><strong>Q: ExecutorService에서 스레드 풀 크기는 어떻게 설정해야 하나요?</strong></summary>

**CPU 바운드 작업**: `N_threads = CPU_cores + 1` (하이퍼스레딩 고려). **I/O 바운드 작업**: `N_threads = CPU_cores * (1 + wait_time / compute_time)` (대기 시간 비율 고려). 일반적인 웹 서버라면 CPU 코어 수의 2~4배가 적당합니다. 정확한 값은 부하 테스트로 결정하세요. `Executors.newFixedThreadPool()` 대신 `new ThreadPoolExecutor()`로 직접 생성하여 큐 용량과 거부 정책을 지정하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: ConcurrentHashMap이 Hashtable보다 성능이 좋은 이유는 무엇인가요?</strong></summary>

Hashtable은 모든 메서드에 `synchronized`를 사용하여 **전체 테이블에 락**을 겁니다. ConcurrentHashMap(Java 8+)은 **개별 버킷(노드) 단위로 락**을 걸어 동시성을 크게 향상시킵니다. 또한 `get()`은 대부분 락 없이 읽기 가능하고, `put()`만 CAS(Compare-And-Swap)와 synchronized로 동기화합니다. 이론적으로 Hashtable보다 동시 쓰기 성능이 N배(버킷 수) 향상됩니다.
</details>

<details>
<summary><strong>Q: 데드락은 어떻게 방지하나요?</strong></summary>

데드락의 네 가지 조건: 1) **상호 배제**, 2) **점유와 대기**, 3) **비선점**, 4) **순환 대기**. 방지 방법: 1) **고정된 락 순서** 유지(모든 스레드가 같은 순서로 락 획득), 2) `tryLock()`(시간 제한 락 시도, 실패 시 기존 락 해제), 3) 락 범위 최소화, 4) `java.util.concurrent.locks.ReentrantLock`의 공정성 설정. 가장 확실한 방법은 **락 순서를 문서화하고 강제하는 것**입니다.
</details>

---

## 요약

- **Thread(start → OS 스레드 생성 → run() 실행)**: 1:1 네이티브 스레드 매핑
- **synchronized**: monitorenter/monitorexit, 객체 헤더 mark word의 모니터
- **volatile**: 메모리 베리어(Lock prefix), 가시성만 보장
- **ExecutorService**: ThreadPoolExecutor, 작업 큐 + 워커 스레드 풀
- **ConcurrentHashMap**: 버킷 단위 락(Java 8+), CAS + synchronized
- **데드락 방지**: 고정된 락 순서, tryLock(), 락 범위 최소화

---
layout: post
title: "Java 소개 — JVM, JDK, JRE, Hello World, 개발 환경"
description: "Java 프로그래밍의 기초를 시스템 레벨에서 심층 학습합니다. JVM의 클래스 로딩 메커니즘과 바이트코드 실행 구조, JDK와 JRE의 구성 요소 차이, main() 메서드가 JVM에서 호출되는 과정(Java Invocation API), javac 컴파일러의 소스-바이트코드 변환 단계, JVM 메모리 구조(Heap/Metaspace/Stack)와 GC의 기본 원리를 다룹니다."
date: 2023-05-08 10:00:00 +0900
category: java
tags: [java, jvm, jdk, jre, bytecode, classloader, hello-world]
level: basic
---

Java는 "Write Once, Run Anywhere"라는 철학 아래, JVM(Java Virtual Machine) 위에서 실행되는 강력한 객체지향 언어입니다.

> **💡 핵심 정리** · Java 소스 코드는 `javac` 컴파일러가 `.class` 바이트코드로 변환하고, JVM이 클래스 로더(부트스트랩 → 확장 → 애플리케이션)를 통해 `ClassLoader.loadClass()`로 메모리에 로드합니다. `main()` 메서드는 JVM의 Java Invocation API가 `CallStaticVoidMethod()`로 호출하며, 이때 JVM은 Heap(객체 저장), Metaspace(클래스 메타데이터), Stack(메서드 호출) 메모리 영역을 초기화합니다.

---

## 📚 수업 목표

- JVM의 구조와 클래스 로딩 과정을 이해합니다.
- JDK, JRE, JVM의 차이를 설명할 수 있습니다.
- Java 소스 코드가 실행되기까지의 과정을 이해합니다.
- 기본적인 Hello World 프로그램을 작성할 수 있습니다.
- JVM 메모리 구조를 이해합니다.

## Hello World

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
```

**깊이 있는 설명 — main() 메서드가 실행되는 과정:**

```text
1. java HelloWorld 명령어 실행
2. JVM 생성 → 부트스트랩 클래스 로더(jre/lib/rt.jar) 로딩
3. 확장 클래스 로더(jre/lib/ext/*) 로딩
4. 애플리케이션 클래스 로더가 HelloWorld.class 검색
5. ClassLoader.loadClass("HelloWorld") → 메서드 영역에 클래스 정보 저장
6. JVM이 HelloWorld.main() 호출: CallStaticVoidMethod()
7. main()의 String[] args = new String[0] → Heap 할당
8. System.out.println() → 표준 출력
9. main() 종료 → JVM 종료 (System.exit())
```

### JVM 메모리 구조

| 영역 | 저장 내용 | GC 대상 |
|------|----------|:-------:|
| **Heap** | 모든 객체와 배열 | ✅ Young/Old Generation |
| **Stack** | 메서드 호출 프레임, 지역 변수, 피연산자 스택 | ❌ (프레임 종료 시 자동 해제) |
| **Metaspace** | 클래스 메타데이터, 상수 풀, 메서드 바이트코드 | ❌ (Native memory) |
| **PC Register** | 현재 실행 중인 JVM 명령어 주소 | ❌ |

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: JDK와 JRE의 차이는 무엇인가요?</strong></summary>

**JRE**(Java Runtime Environment)는 Java 프로그램을 실행하는 데 필요한 최소 환경입니다(JVM + 핵심 라이브러리). **JDK**(Java Development Kit)는 JRE에 개발 도구(javac, jar, javadoc, jdb 등)가 추가된 전체 패키지입니다. Java 프로그램을 개발하려면 JDK가 필요하고, 실행만 하려면 JRE로 충분합니다.
</details>

<details>
<summary><strong>Q: JVM은 어떻게 플랫폼 독립성을 보장하나요?</strong></summary>

Java 소스는 플랫폼에 종속되지 않는 **바이트코드(.class)**로 컴파일됩니다. 각 운영체제용 JVM이 이 바이트코드를 해당 OS의 네이티브 코드로 변환하여 실행합니다. 즉, "한 번 컴파일하면 어디서든 실행"되지만, JVM 자체는 각 플랫폼에 맞게 구현되어 있습니다.
</details>

<details>
<summary><strong>Q: public static void main(String[] args)의 각 키워드는 무엇을 의미하나요?</strong></summary>

**public**: JVM이 어디서든 접근할 수 있어야 함. **static**: 객체 생성 없이 JVM이 직접 호출. **void**: JVM에 반환할 값 없음. **main**: JVM이 찾는 메서드 이름(고정). **String[] args**: 명령줄 인자를 전달받는 문자열 배열. Java 21부터는 `String... args`(가변 인자)도 사용 가능합니다. JVM은 이 시그니처를 정확히 찾아내어 실행합니다.
</details>

<details>
<summary><strong>Q: 자바의 GC는 어떻게 동작하나요?</strong></summary>

GC는 Heap에서 더 이상 참조되지 않는 객체를 자동으로 회수합니다. Young Generation(Eden → S0 → S1)에서 빈번하게 Minor GC가 발생하고, 살아남은 객체가 Old Generation으로 승격됩니다. Old Generation이 가득 차면 Major GC(Full GC)가 발생합니다. G1GC, ZGC, Shenandoah 등 다양한 GC 알고리즘이 있으며, Java 21에서는 ZGC가 기본에 가까워지고 있습니다.
</details>

<details>
<summary><strong>Q: Java와 C++의 가장 큰 차이는 무엇인가요?</strong></summary>

1) **메모리 관리**: Java는 GC가 자동 관리, C++는 수동(new/delete). 2) **플랫폼 독립성**: Java는 JVM 위에서 실행, C++는 네이티브 컴파일. 3) **포인터**: Java는 포인터 연산이 없음(참조만). 4) **다중 상속**: Java는 인터페이스로만 다중 상속, C++는 클래스 다중 상속 가능. 5) **성능**: C++가 일반적으로 더 빠르지만, 최신 Java(JIT 컴파일)는 격차를 줄이고 있습니다.
</details>

---

## 요약

- **Java**: JVM 기반, 객체지향, 플랫폼 독립적
- **JDK > JRE > JVM**: JDK = JRE + 개발 도구, JRE = JVM + 라이브러리
- **컴파일 → 실행**: javac(바이트코드) → 클래스 로더 → JVM 실행
- **메모리**: Heap(객체), Stack(호출), Metaspace(클래스)
- **GC**: 자동 메모리 관리, Young/Old Generation

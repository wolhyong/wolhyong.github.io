---
layout: post
title: "Java 배열과 메서드 — 배열 생성, 다차원 배열, 메서드 호출, 오버로딩, 가변 인자"
description: "Java의 배열과 메서드를 JVM 메모리 구조와 함께 심층 학습합니다. 배열이 Heap의 연속된 메모리 블록에 저장되는 방식과 length 필드의 JVM 내부 구현, 다차원 배열이 배열의 배열(ragged array)로 Heap에 할당되는 구조, 메서드 호출 시 JVM Stack 프레임이 생성/소멸되는 과정(Call Stack), 메서드 오버로딩의 컴파일 타임 다형성(정적 디스패치), 가변 인자(varargs)가 배열로 변환되는 원리를 다룹니다."
date: 2023-06-05 10:00:00 +0900
category: java
tags: [java, array, method, overloading, varargs, jvm-stack, call-stack]
level: basic
---

배열과 메서드는 Java 프로그래밍의 가장 기본적인 구성 요소입니다. 효율적인 코드를 위해 이들의 메모리 동작을 이해하는 것이 중요합니다.

> **💡 핵심 정리** · Java 배열은 Heap에 연속된 메모리 블록으로 할당되며, `length`는 JVM이 객체 헤더에 저장한 고정 필드입니다. 다차원 배열은 배열의 배열(ragged array)로, 각 행이 독립적인 Heap 객체입니다. 메서드 호출 시 JVM Stack에 새로운 프레임(지역 변수 배열 + 피연산자 스택 + 프레임 데이터)이 push되고, 종료 시 pop됩니다. 메서드 오버로딩은 컴파일 타임에 인자 타입으로 결정되는 정적 디스패치이며, 가변 인자(`...`)는 컴파일러가 배열로 변환합니다.

---

## 📚 수업 목표

- 배열의 메모리 구조를 이해합니다.
- 다차원 배열이 배열의 배열인 이유를 이해합니다.
- 메서드 호출 시 JVM Stack의 변화를 이해합니다.
- 메서드 오버로딩의 동작 원리를 이해합니다.
- 가변 인자의 내부 처리를 이해합니다.

## 배열

```java
// 배열 선언과 생성
int[] numbers = new int[5];        // {0, 0, 0, 0, 0}
String[] names = new String[3];    // {null, null, null}

// 배열 초기화
int[] scores = {85, 92, 78, 95, 88};
String[] fruits = {"Apple", "Banana", "Cherry"};

// 배열 사용
System.out.println(scores.length);     // 5
scores[0] = 90;                         // 첫 번째 요소 변경
System.out.println(scores[scores.length - 1]);  // 마지막 요소: 88
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 배열의 length는 메서드인가요, 필드인가요?</strong></summary>

**필드**입니다. `length`는 JVM이 배열 객체 생성 시 설정하는 고정 필드로, 메서드 호출이 아니므로 괄호가 없습니다. JVM은 배열 타입의 객체에 대해 `arraylength`라는 별도의 바이트코드 명령어로 `length` 값을 읽습니다. String의 `length()`는 메서드(문자 수 계산)이고, 배열의 `length`는 필드(고정 길이)입니다.
</details>

<details>
<summary><strong>Q: 배열을 복사하는 가장 효율적인 방법은 무엇인가요?</strong></summary>

**`System.arraycopy()`**가 가장 빠릅니다. 네이티브 코드(C/C++)로 구현되어 JNI 레벨에서 메모리 블록을 직접 복사합니다. `Arrays.copyOf()`도 내부에서 `System.arraycopy()`를 호출합니다. `for` 루프로 복사하는 것보다 3~5배 빠릅니다. `clone()`은 얕은 복사를 수행합니다. 객체 배열의 깊은 복사는 직접 구현해야 합니다.
</details>

<details>
<summary><strong>Q: 메서드 오버로딩과 오버라이딩의 차이는 무엇인가요?</strong></summary>

**오버로딩(Overloading)**은 같은 이름의 메서드를 매개변수 타입/개수로 구분하는 **컴파일 타임 다형성**(정적 바인딩)입니다. **오버라이딩(Overriding)**은 상속받은 메서드를 재정의하는 **런타임 다형성**(동적 바인딩)입니다. 오버로딩은 호출할 메서드가 컴파일 타임에 결정되고, 오버라이딩은 런타임에 객체의 실제 타입에 따라 결정됩니다. 오버로딩은 반환 타입만 다른 것은 허용되지 않습니다.
</details>

<details>
<summary><strong>Q: 가변 인자(varargs)는 내부적으로 어떻게 동작하나요?</strong></summary>

`void method(String... args)`는 컴파일러에 의해 `void method(String[] args)`로 변환됩니다. 호출 시 전달된 인자들은 컴파일러가 새 배열을 생성하여 담습니다. 따라서 가변 인자는 메서드의 **마지막 매개변수**여야 하며, 오버로딩 시 배열 타입과 충돌할 수 있습니다. 성능이 중요한 경우 가변 인자 사용을 최소화하세요(매 호출마다 새 배열 생성).
</details>

<details>
<summary><strong>Q: 배열을 출력하면 이상한 값이 나오는 이유는 무엇인가요?</strong></summary>

`System.out.println(array)`는 배열 내용이 아니라 **객체의 toString()** 결과를 출력합니다. 배열의 toString()은 `[I@1a2b3c` 같은 형식으로, 타입(`[I` = int 배열)과 해시코드(@ 뒤)를 표시합니다. 배열 내용을 보려면 `Arrays.toString(intArray)`(1차원) 또는 `Arrays.deepToString(multiArray)`(다차원)을 사용해야 합니다.
</details>

---

## 요약

- **배열**: Heap의 연속 메모리 블록, `length` 필드, 0-based 인덱스
- **다차원 배열**: 배열의 배열, 각 행이 독립적 Heap 객체
- **메서드 호출**: Stack 프레임 생성(push) → 실행 → 프레임 제거(pop)
- **오버로딩**: 컴파일 타임 정적 디스패치, 매개변수 타입/개수로 구분
- **가변 인자**: 컴파일러가 배열로 변환, 메서드 마지막 파라미터에만 사용

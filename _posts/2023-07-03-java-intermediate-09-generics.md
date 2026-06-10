---
layout: post
title: "Java 제네릭 — 타입 파라미터, 와일드카드, 타입 소거, 한정적 타입"
description: "Java 제네릭을 컴파일러와 바이트코드 레벨에서 심층 학습합니다. 타입 파라미터가 컴파일 타임에만 존재하고 런타임에는 Object로 변환되는 타입 소거(Type Erasure) 과정, 와일드카드(? extends T / ? super T)의 공변/반공변 생산자-소비자 원칙(PECS), 한정적 타입 파라미터(<T extends Comparable>)의 바운드 정보 보존, 제네릭 메서드의 타입 추론 과정, raw type과의 호환성 유지를 위한 브리지 메서드 생성을 다룹니다."
date: 2023-07-03 10:00:00 +0900
category: java
tags: [java, generics, type-erasure, wildcard, pecs, type-parameter]
level: intermediate
---

제네릭은 Java 5에서 도입된 타입 안전성 메커니즘입니다. 컴파일 타임에 타입을 검증하고, 런타임에는 타입 정보가 제거됩니다.

> **💡 핵심 정리** · Java 제네릭의 타입 소거(Type Erasure)는 컴파일러가 `<T>`를 `Object`(또는 바운드 타입)로 변환하고, 필요한 `cast` 바이트코드를 삽입하는 과정입니다. `List<String>`과 `List<Integer>`는 모두 런타임에 `List`(raw type)로 동일합니다. 와일드카드 `? extends T`는 공변(covariant, 읽기 전용), `? super T`는 반공변(contravariant, 쓰기 전용)이며, PECS(Producer-Extends, Consumer-Super) 원칙으로 기억할 수 있습니다.

---

## 📚 수업 목표

- 제네릭의 타입 소거 과정을 이해합니다.
- 와일드카드와 PECS 원칙을 이해합니다.
- 한정적 타입 파라미터를 사용할 수 있습니다.
- 제네릭 메서드를 작성할 수 있습니다.
- 제네릭의 제한사항과 우회 방법을 이해합니다.

## 제네릭 기본

```java
// 제네릭 클래스
public class Box<T> {
    private T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }
}

// 제네릭 메서드
public static <T> T getMiddle(T... args) {
    return args[args.length / 2];
}

// 사용
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String value = stringBox.get();  // 캐스팅 불필요
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 타입 소거로 인해 어떤 제한이 생기나요?</strong></summary>

1) `new T()` 불가(타입을 알 수 없음), 2) `new T[10]` 불가(제네릭 배열 생성 불가), 3) `instanceof T` 불가, 4) `List<Integer>.class` 불가(raw type List.class만 가능), 5) static 필드에 타입 파라미터 사용 불가. 이러한 제한은 모두 타입 소거 때문입니다. 리플렉션으로 타입 정보가 필요하면 `TypeToken` 패턴이나 수퍼 타입 토큰을 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: PECS 원칙이 무엇인가요?</strong></summary>

PECS는 **Producer-Extends, Consumer-Super**의 약자입니다. 데이터를 **생산**(읽기)하는 컬렉션은 `? extends T`를 사용하고, 데이터를 **소비**(쓰기)하는 컬렉션은 `? super T`를 사용하세요. 예: `void copy(List<? extends T> src, List<? super T> dest)`에서 src는 읽기만(Producer → extends), dest는 쓰기만(Consumer → super) 가능합니다.
</details>

<details>
<summary><strong>Q: 제네릭 배열을 생성할 수 없는 이유는 무엇인가요?</strong></summary>

`new List<String>[10]`은 컴파일되지 않습니다. 이유: 배열은 **공변**(covariant)이지만 제네릭은 **불공변**(invariant)이기 때문입니다. `Object[] objArr = new String[10]`은 가능하지만, `List<String>[]`을 `List<Integer>`로 오염시킬 위험이 있습니다. 타입 안전성을 위해 제네릭 배열 생성을 금지합니다. 해결 방법으로 `ArrayList<ArrayList<String>>`을 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: 제네릭을 사용할 때 오토박싱이 성능에 영향을 주나요?</strong></summary>

네, `List<Integer>`에 int 값을 추가하면 오토박싱이 발생하여 Integer 객체가 생성됩니다. 수백만 번 반복하면 GC 부하가 증가합니다. 성능이 중요한 경우 `IntList` 같은 전용 라이브러리나 배열을 사용하세요. Java 10+의 `var`는 오토박싱을 막지 않지만, 컴파일러 경고를 통해 인지할 수 있습니다.
</details>

<details>
<summary><strong>Q: 브리지 메서드(Bridge Method)는 무엇인가요?</strong></summary>

브리지 메서드는 **타입 소거로 인해 시그니처가 달라진 메서드를 연결**하기 위해 컴파일러가 생성하는 메서드입니다. 예: `Comparable<T>`의 `compareTo(T)`는 소거 후 `compareTo(Object)`가 됩니다. 서브클래스가 `compareTo(MyClass)`로 오버라이드하면, 컴파일러가 `compareTo(Object)` 브리지 메서드를 만들어 내부적으로 `compareTo(MyClass)`를 호출합니다. 이는 제네릭의 다형성을 유지하기 위해 필요합니다.
</details>

---

## 요약

- **타입 소거**: `<T>` → `Object`(또는 바운드), 컴파일 타임에만 타입 검증
- **PECS**: Producer(읽기) → `? extends T`, Consumer(쓰기) → `? super T`
- **한정적 타입**: `<T extends Comparable<T>>`로 특정 메서드 보장
- **제네릭 메서드**: `<T> T method(T arg)`로 타입 파라미터를 메서드 레벨에서 선언
- **브리지 메서드**: 타입 소거 후 오버라이딩 유지를 위한 컴파일러 생성 메서드

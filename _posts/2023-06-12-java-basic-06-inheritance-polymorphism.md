---
layout: post
title: "Java 상속과 다형성 — extends, super, @Override, instanceof, 추상 클래스, 인터페이스"
description: "Java의 상속과 다형성을 JVM 가상 메서드 테이블(VTable) 레벨에서 심층 학습합니다. extends에 의한 클래스 계층 구조와 super() 생성자 체이닝, @Override 애너테이션의 컴파일 타임 검증, instanceof 연산자가 객체의 실제 타입을 검사하는 과정, 추상 클래스와 인터페이스의 차이(다중 상속/상태), 다형성의 동적 바인딩(Virtual Method Invocation)을 다룹니다."
date: 2023-06-12 10:00:00 +0900
category: java
tags: [java, inheritance, polymorphism, extends, override, interface, abstract]
level: basic
---

상속과 다형성은 객체지향 프로그래밍의 핵심 개념입니다. Java는 강력한 타입 시스템을 기반으로 이들을 구현합니다.

> **💡 핵심 정리** · Java의 상속은 `extends` 키워드로 단일 상속만 가능하며, 모든 클래스는 암시적으로 `Object`를 상속합니다. `@Override`는 컴파일러가 상위 클래스에 같은 시그니처의 메서드가 있는지 검증하게 합니다. 다형성은 JVM의 VTable(Virtual Method Table)을 통해 동작하며, `invokevirtual` 바이트코드가 런타임에 객체의 실제 타입 VTable에서 메서드 주소를 조회합니다. 인터페이스는 `invokeinterface`로 별도 테이블(ITable)을 사용합니다.

---

## 📚 수업 목표

- 상속의 계층 구조와 생성자 체이닝을 이해합니다.
- @Override의 컴파일 타임 검증을 이해합니다.
- instanceof 연산자의 동작을 이해합니다.
- 추상 클래스와 인터페이스의 차이를 이해합니다.
- 다형성의 동적 바인딩을 이해합니다.

## 상속

```java
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void speak() {
        System.out.println("...");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name);  // Animal 생성자 호출
    }

    @Override
    public void speak() {
        System.out.println("멍멍!");
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 추상 클래스와 인터페이스 중 어떤 것을 선택해야 하나요?</strong></summary>

**공통 상태(필드)**가 있고 관련 클래스들의 기본 구현을 제공하려면 **추상 클래스**를 선택하세요. **완전한 추상화**(다중 상속)가 필요하거나 전혀 다른 클래스들이 같은 계약을 구현해야 한다면 **인터페이스**를 선택하세요. Java 8+에서는 인터페이스에 `default` 메서드로 기본 구현을 제공할 수 있어 차이가 좁아졌습니다. 일반적으로는 인터페이스를 우선 고려하는 것이 유연성에서 유리합니다.
</details>

<details>
<summary><strong>Q: instanceof 사용이 안전하지 않은 이유는 무엇인가요?</strong></summary>

과도한 `instanceof` 사용은 **다형성의 이점을 무력화**하고, OCP(개방-폐쇄 원칙)를 위반합니다. 새로운 서브클래스가 추가될 때마다 모든 instanceof 코드를 수정해야 합니다. `instanceof`가 자주 필요하다면, 메서드 오버라이딩이나 방문자 패턴으로 구조를 개선할 수 있습니다. Java 16+의 `Pattern Matching for instanceof`는 타입 검사와 캐스팅을 결합하여 더 안전한 사용을 가능하게 합니다.
</details>

<details>
<summary><strong>Q: super()는 왜 생성자의 첫 줄에만 와야 하나요?</strong></summary>

부모 클래스의 초기화가 **자식 클래스 초기화보다 먼저** 완료되어야 하기 때문입니다. 자식 클래스가 부모의 필드나 메서드에 접근할 때, 부모 객체가 완전히 초기화되지 않은 상태면 오류가 발생합니다. 만약 `super()`가 첫 줄이 아니라면, 자식의 필드가 부모보다 먼저 초기화되는 역전 현상이 발생할 수 있습니다.
</details>

<details>
<summary><strong>Q: 상속보다 컴포지션(composition)이 더 좋은 이유는 무엇인가요?</strong></summary>

상속은 **캡슐화를 깨고**(부모의 내부 구현에 의존), **강한 결합**을 만듭니다. 컴포지션은 "has-a" 관계로 **약한 결합**과 **높은 유연성**을 제공합니다. "is-a" 관계가 명확하고 부모의 구현이 안정적일 때만 상속을 사용하세요. 대부분의 경우 `private` 필드로 포함시키고 필요한 메서드만 위임하는 컴포지션이 더 좋습니다.
</details>

<details>
<summary><strong>Q: Java는 왜 다중 상속을 지원하지 않나요?</strong></summary>

**다이아몬드 문제** 때문입니다. 두 부모 클래스가 같은 메서드를 가질 때, 자식이 어떤 부모의 메서드를 상속받을지 모호해집니다. C++은 가상 상속으로 해결하지만 복잡성이 증가합니다. Java는 인터페이스(Java 8+ default 메서드)로 다중 상속의 이점을 제공하면서, 명시적 재정의를 통해 모호성을 해결합니다.
</details>

---

## 요약

- **상속**: 단일 상속, 생성자 체이닝(super()), @Override 검증
- **VTable**: 런타임 동적 바인딩, invokevirtual → VTable 조회
- **추상 클래스**: 상태+일부 구현, 단일 상속, abstract 메서드
- **인터페이스**: 완전 추상화, 다중 구현, default 메서드(Java 8+)
- **instanceof**: 타입 검사, 과도한 사용은 OCP 위반
- **다형성**: 상위 타입 참조로 하위 타입 객체 제어

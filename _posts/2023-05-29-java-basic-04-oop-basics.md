---
layout: post
title: "Java OOP 기초 — 클래스, 객체, 생성자, this, 접근 제어자, static"
description: "Java 객체지향 프로그래밍의 기초를 메모리와 바이트코드 레벨에서 심층 학습합니다. new 키워드가 Heap에 객체를 생성하는 과정과 생성자 체이닝(super() 호출), this 키워드의 레퍼런스 의미와 this() 생성자 호출, 접근 제어자(public/protected/default/private)의 가시성 범위, static 멤버가 메서드 영역에 단일 인스턴스로 로딩되는 과정, 패키지와 임포트의 클래스 로딩을 다룹니다."
date: 2023-05-29 10:00:00 +0900
category: java
tags: [java, oop, class, object, constructor, this, access-modifier, static]
level: basic
---

Java는 철저한 객체지향 언어입니다. 모든 것은 클래스로 시작하고, 클래스에서 객체가 생성됩니다.

> **💡 핵심 정리** · Java의 `new` 키워드는 JVM이 Heap에 객체 크기만큼 메모리를 할당하고, 필드를 기본값으로 초기화한 후 생성자를 호출합니다. 생성자 첫 줄의 `super()`는 컴파일러가 자동 삽입하여 부모 클래스의 생성자를 연결(생성자 체이닝)합니다. `static` 멤버는 클래스 로딩 시 메서드 영역에 단일 인스턴스로 생성되며, 인스턴스 없이 `ClassName.member`로 접근합니다.

---

## 📚 수업 목표

- 클래스와 객체의 차이를 이해합니다.
- new 키워드로 객체가 생성되는 과정을 이해합니다.
- 생성자의 역할과 this()를 이해합니다.
- 접근 제어자의 가시성 범위를 이해합니다.
- static 멤버의 특징을 이해합니다.

## 클래스와 객체

```java
public class Student {
    // 필드 (인스턴스 변수)
    String name;
    int age;
    String major;

    // 생성자
    public Student(String name, int age, String major) {
        this.name = name;
        this.age = age;
        this.major = major;
    }

    // 메서드
    public void introduce() {
        System.out.println("안녕하세요, " + name + "입니다.");
    }
}

// 객체 생성
Student s1 = new Student("Alice", 20, "Computer Science");
s1.introduce();
```

**깊이 있는 설명 — new 키워드의 JVM 메모리 할당 과정:**

```text
Student s1 = new Student("Alice", 20, "CS");

1. Student.class 로딩 (한 번만):
   → 클래스 로더가 메서드 영역에 Student 클래스 정보 로딩
   → static 변수/메서드 초기화

2. Heap 할당:
   → new: Student 객체에 필요한 메모리(필드 총합 + 헤더) 할당
   → 모든 필드를 기본값으로 초기화 (name=null, age=0, major=null)

3. 생성자 호출:
   → Student("Alice", 20, "CS") 생성자 실행
   → this는 Heap에 할당된 객체의 참조
   → 첫 줄에 super() 자동 호출 (Object의 생성자)
   → this.name = "Alice" (name 필드에 "Alice"의 참조 할당)
   → this.age = 20 (age 필드에 20 할당)

4. 참조 반환:
   → Stack의 s1 변수에 Heap 객체의 주소 저장
   → s1 = 0x7ffe... (4/8바이트 주소)
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 생성자에서 this()를 사용하는 이유는 무엇인가요?</strong></summary>

`this()`는 **같은 클래스의 다른 생성자를 호출**하여 코드 중복을 줄입니다. 예를 들어, 기본값을 설정하는 기본 생성자와 매개변수를 받는 생성자가 있을 때, 기본 생성자에서 `this(기본값)`을 호출하면 중복 코드를 제거할 수 있습니다. 단, `this()`는 생성자의 첫 줄에만 위치해야 합니다.
</details>

<details>
<summary><strong>Q: private 생성자는 언제 사용하나요?</strong></summary>

private 생성자는 클래스 외부에서 인스턴스 생성을 막습니다. 1) **싱글턴 패턴**: 하나의 인스턴스만 존재하도록 제한. 2) **유틸리티 클래스**: 모든 멤버가 static인 경우(Math, Arrays). 3) **팩토리 메서드**: 생성자 대신 정적 메서드로 인스턴스 생성. 4) **빌더 패턴**: 직접 생성 대신 빌더를 통해 객체 생성.
</details>

<details>
<summary><strong>Q: static 메서드에서 인스턴스 변수에 접근할 수 없는 이유는 무엇인가요?</strong></summary>

static 메서드는 **클래스 로딩 시점에 메서드 영역에 로딩**되지만, 인스턴스 변수는 **객체 생성 시점에 Heap에 할당**됩니다. 따라서 static 메서드가 실행될 때 인스턴스 변수가 아직 존재하지 않을 수 있습니다. static 메서드는 `this` 키워드도 사용할 수 없습니다(this는 현재 객체의 참조인데, static 메서드는 객체 없이 호출되기 때문입니다).
</details>

<details>
<summary><strong>Q: 접근 제어자별 가시성 범위가 어떻게 되나요?</strong></summary>

**private** → 같은 클래스 내에서만 접근. **default(생략)** → 같은 패키지 내에서 접근. **protected** → 같은 패키지 + 상속받은 클래스에서 접근. **public** → 모든 클래스에서 접근. 캡슐화 원칙에 따라 필드는 private으로 선언하고, public getter/setter로 접근하는 것이 표준 패턴입니다.
</details>

<details>
<summary><strong>Q: 클래스 변수(static)와 인스턴스 변수의 생명주기는 어떻게 되나요?</strong></summary>

**static 변수**는 클래스가 로딩될 때 생성되어 JVM이 종료될 때까지 유지됩니다(프로그램 전체 수명). **인스턴스 변수**는 객체가 생성될 때(new) Heap에 할당되고, GC가 회수할 때까지 유지됩니다. static 변수는 모든 인스턴스가 공유하고, 인스턴스 변수는 각 객체마다 독립적으로 존재합니다.
</details>

---

## 요약

- **클래스**: 객체의 청사진, 메서드 영역에 로딩
- **객체**: Heap에 할당된 실체, new 키워드로 생성
- **생성자**: 객체 초기화, this()로 생성자 체이닝
- **접근 제어자**: private < default < protected < public
- **static**: 클래스 레벨 멤버, 인스턴스 없이 접근

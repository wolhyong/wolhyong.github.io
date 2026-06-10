---
layout: post
title: "Kotlin 클래스와 객체 — 프로퍼티, 생성자, 상속, 인터페이스, 데이터 클래스, object 키워드"
description: "Kotlin의 클래스와 객체 시스템을 컴파일러 레벨에서 학습합니다. class 키워드로 클래스를 정의하며 프로퍼티는 자동으로 getter/setter를 생성합니다. 주 생성자는 클래스 헤더에 정의하며 init 블록으로 초기화 로직을 작성합니다. 보조 생성자는 constructor 키워드로 정의하며 this()로 주 생성자를 호출합니다. 상속은 : BaseClass() 문법으로 단일 상속만 지원하며 open 키워드로 상속을 허용합니다. 인터페이스는 interface 키워드로 정의하며 다중 구현을 지원합니다. 데이터 클래스는 data class로 정의하며 equals, hashCode, toString, copy를 자동 생성합니다. object 키워드는 싱글톤과 익명 객체를 생성합니다."
date: 2025-10-01 10:00:00 +0900
category: kotlin
tags: [kotlin, classes, objects, properties, constructors, inheritance, interfaces, data-class]
level: basic
---

Kotlin의 클래스와 객체 시스템은 간결하고 안전하며 표현력이 풍부합니다.

> **핵심 정리** · `class`로 클래스를 정의합니다. 프로퍼티는 자동 getter/setter를 생성합니다. 주 생성자는 클래스 헤더에 정의합니다. `open`으로 상속을 허용합니다. 인터페이스는 다중 구현을 지원합니다. `data class`로 데이터 모델을 정의합니다. `object`로 싱글톤을 생성합니다.


## 수업 목표

- 클래스 정의와 사용법을 이해합니다.
- 프로퍼티를 이해합니다.
- 생성자를 이해합니다.
- 상속을 이해합니다.
- 인터페이스를 이해합니다.
- 데이터 클래스를 이해합니다.
- object 키워드를 이해합니다.

## 클래스 정의

```kotlin
// 기본 클래스
class Person {
    var name: String = ""
    var age: Int = 0

    fun greet() {
        println("안녕하세요, 저는 $name이고 $age살입니다.")
    }
}

// 인스턴스 생성
val person = Person()
person.name = "Wolhyong"
person.age = 30
person.greet()
```

`class` 키워드로 클래스를 정의합니다. 프로퍼티는 자동으로 getter/setter를 생성합니다. `new` 키워드 없이 인스턴스를 생성합니다.

## 프로퍼티

```kotlin
class Person {
    // 읽기 전용 프로퍼티 (val)
    val name: String = "Wolhyong"

    // 변경 가능 프로퍼티 (var)
    var age: Int = 30

    // 지연 초기화
    val lazyValue: String by lazy {
        println("초기화")
        "Lazy Value"
    }

    // 사용자 정의 getter
    val isAdult: Boolean
        get() = age >= 18

    // 사용자 정의 setter
    var email: String = ""
        set(value) {
            if (value.contains("@")) {
                field = value
            }
        }
}

val person = Person()
println(person.name)  // Wolhyong
println(person.isAdult)  // true
person.email = "test@example.com"
println(person.email)  // test@example.com
```

`val`은 읽기 전용 프로퍼티, `var`는 변경 가능 프로퍼티입니다. `by lazy`로 지연 초기화를 수행합니다. 사용자 정의 getter/setter를 정의할 수 있습니다. `field`는 backing field입니다.

## 주 생성자

```kotlin
// 주 생성자
class Person(val name: String, var age: Int) {
    fun greet() {
        println("안녕하세요, 저는 $name이고 $age살입니다.")
    }
}

val person = Person("Wolhyong", 30)
person.greet()

// 기본값
class PersonWithDefaults(val name: String = "Unknown", var age: Int = 0)

val person1 = PersonWithDefaults()
val person2 = PersonWithDefaults("Wolhyong")
val person3 = PersonWithDefaults("Wolhyong", 30)

// init 블록
class PersonWithInit(val name: String, var age: Int) {
    init {
        println("초기화: $name, $age")
        require(age >= 0) { "나이는 0 이상이어야 합니다." }
    }
}
```

주 생성자는 클래스 헤더에 정의합니다. `val`/`var`로 프로퍼티를 동시에 정의할 수 있습니다. 기본값을 지정할 수 있습니다. `init` 블록으로 초기화 로직을 작성합니다.

## 보조 생성자

```kotlin
class Person(val name: String) {
    var age: Int = 0

    // 보조 생성자
    constructor(name: String, age: Int) : this(name) {
        this.age = age
    }

    fun greet() {
        println("안녕하세요, 저는 $name이고 $age살입니다.")
    }
}

val person1 = Person("Wolhyong")
val person2 = Person("Wolhyong", 30)

// 여러 보조 생성자
class PersonMultipleConstructors(val name: String) {
    var age: Int = 0
    var city: String = "Seoul"

    constructor(name: String, age: Int) : this(name) {
        this.age = age
    }

    constructor(name: String, age: Int, city: String) : this(name, age) {
        this.city = city
    }
}
```

보조 생성자는 `constructor` 키워드로 정의합니다. `this()`로 주 생성자나 다른 보조 생성자를 호출해야 합니다. 여러 보조 생성자를 정의할 수 있습니다.

## 상속

```kotlin
// open으로 상속 허용
open class Animal(val name: String) {
    open fun makeSound() {
        println("$name이(가) 소리를 냅니다.")
    }
}

// 상속
class Dog(name: String, val breed: String) : Animal(name) {
    override fun makeSound() {
        println("$name이(가) 멍멍!")
    }

    fun bark() {
        println("$name이(가) 짖습니다.")
    }
}

val dog = Dog("바둑이", "골든 리트리버")
dog.makeSound()  // 바둑이이(가) 멍멍!
dog.bark()  // 바둑이이(가) 짖습니다.
```

상속은 `: BaseClass()` 문법으로 정의합니다. `open` 키워드로 상속을 허용해야 합니다. `override`로 메서드를 재정의합니다. Kotlin은 단일 상속만 지원합니다.

## 인터페이스

```kotlin
// 인터페이스 정의
interface Flyable {
    fun fly()
    fun canFly(): Boolean = true
}

// 인터페이스 구현
class Bird(val name: String) : Flyable {
    override fun fly() {
        println("$name이(가) 날아갑니다.")
    }
}

val bird = Bird("참새")
bird.fly()  // 참새이(가) 날아갑니다.

// 다중 인터페이스
interface Swimmable {
    fun swim()
}

class Duck(val name: String) : Flyable, Swimmable {
    override fun fly() {
        println("$name이(가) 날아갑니다.")
    }

    override fun swim() {
        println("$name이(가) 헤엄칩니다.")
    }
}

val duck = Duck("오리")
duck.fly()  // 오리이(가) 날아갑니다.
duck.swim()  // 오리이(가) 헤엄칩니다.
```

인터페이스는 `interface` 키워드로 정의합니다. 다중 구현을 지원합니다. 기본 구현을 제공할 수 있습니다. 클래스는 `: Interface1, Interface2`로 구현합니다.

## 데이터 클래스

```kotlin
// 데이터 클래스
data class Person(val name: String, val age: Int)

val person1 = Person("Wolhyong", 30)
val person2 = Person("Wolhyong", 30)

// equals, hashCode 자동 생성
println(person1 == person2)  // true
println(person1.hashCode() == person2.hashCode())  // true

// toString 자동 생성
println(person1)  // Person(name=Wolhyong, age=30)

// copy 함수
val person3 = person1.copy(age = 31)
println(person3)  // Person(name=Wolhyong, age=31)

// 구조 분해
val (name, age) = person1
println(name)  // Wolhyong
println(age)   // 30

// componentN 함수
println(person1.component1())  // Wolhyong
println(person1.component2())  // 30
```

`data class`는 데이터 모델을 정의합니다. `equals`, `hashCode`, `toString`, `copy`, `componentN`을 자동 생성합니다. 불변 데이터 모델에 적합합니다.

## object 키워드

```kotlin
// 싱글톤
object Database {
    private var connectionCount = 0

    fun connect() {
        connectionCount++
        println("연결됨 (연결 수: $connectionCount)")
    }

    fun disconnect() {
        connectionCount--
        println("연결 해제 (연결 수: $connectionCount)")
    }
}

Database.connect()  // 연결됨 (연결 수: 1)
Database.connect()  // 연결됨 (연결 수: 2)
Database.disconnect()  // 연결 해제 (연결 수: 1)

// 익명 객체
interface OnClickListener {
    fun onClick()
}

val listener = object : OnClickListener {
    override fun onClick() {
        println("클릭됨")
    }
}

listener.onClick()  // 클릭됨

// 동반 객체 (Companion Object)
class MyClass {
    companion object {
        const val CONSTANT = "상수"

        fun staticMethod() {
            println("정적 메서드")
        }
    }
}

MyClass.staticMethod()  // 정적 메서드
println(MyClass.CONSTANT)  // 상수
```

`object` 키워드는 싱글톤을 생성합니다. 익명 객체를 생성할 때도 사용합니다. `companion object`는 정적 멤버를 정의합니다. Java의 static과 유사합니다.

## 추상 클래스

```kotlin
// 추상 클래스
abstract class Shape(val name: String) {
    abstract fun calculateArea(): Double

    fun display() {
        println("$name: 넓이 = ${calculateArea()}")
    }
}

class Circle(val radius: Double) : Shape("원") {
    override fun calculateArea(): Double {
        return Math.PI * radius * radius
    }
}

class Rectangle(val width: Double, val height: Double) : Shape("직사각형") {
    override fun calculateArea(): Double {
        return width * height
    }
}

val circle = Circle(5.0)
circle.display()  // 원: 넓이 = 78.53981633974483

val rectangle = Rectangle(10.0, 20.0)
rectangle.display()  // 직사각형: 넓이 = 200.0
```

`abstract class`는 추상 클래스를 정의합니다. `abstract` 메서드는 구현이 없으며 서브클래스에서 구현해야 합니다. 인스턴스화할 수 없습니다. 부분 구현을 제공할 때 유용합니다.

## 봉인 클래스

```kotlin
// 봉인 클래스
sealed class Result

data class Success(val data: String) : Result()
data class Error(val message: String) : Result()
object Loading : Result()

fun handleResult(result: Result) {
    when (result) {
        is Success -> println("성공: ${result.data}")
        is Error -> println("오류: ${result.message}")
        is Loading -> println("로딩 중")
    }
}

handleResult(Success("데이터"))  // 성공: 데이터
handleResult(Error("오류 발생"))  // 오류: 오류 발생
handleResult(Loading)  // 로딩 중
```

`sealed class`는 봉인 클래스를 정의합니다. 같은 파일 내에서만 서브클래스를 정의할 수 있습니다. `when` 표현식에서 모든 케이스를 처리할 수 있습니다. 상태 머신, 결과 처리에 유용합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> 주 생성자와 보조 생성자 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

주 생성자를 우선 사용해야 합니다. 간결하며 프로퍼티를 동시에 정의할 수 있습니다. 보조 생성자는 여러 생성자가 필요할 때 사용합니다. 대부분의 경우 주 생성자로 충분합니다.
</details>

<details>
<summary><strong>Q> val과 var 프로퍼티 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`val`을 우선 사용해야 합니다. 불변성은 스레드 안전성을 높이며 버그를 줄입니다. 상태 변경이 필요할 때만 `var`를 사용합니다. 함수형 프로그래밍 원칙을 따르는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> data class는 언제 사용해야 하나요?</strong></summary>

`data class`는 데이터 모델에 사용합니다. DTO, VO, 엔티티 등에 적합합니다. 불변 데이터 모델에 특히 유용합니다. 비즈니스 로직이 있는 클래스에는 사용하지 않는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> object와 companion object 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`object`는 싱글톤에 사용합니다. `companion object`는 정적 멤버에 사용합니다. `object`는 독립적인 싱글톤, `companion object`는 클래스와 연결된 정적 멤버입니다.
</details>

<details>
<summary><strong>Q> sealed class는 언제 사용해야 하나요?</strong></summary>

`sealed class`는 제한된 계층 구조에 사용합니다. 상태 머신, 결과 처리, 이벤트 처리에 유용합니다. `when` 표현식에서 모든 케이스를 처리할 수 있습니다. 타입 안전성을 높입니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **class** | 클래스 정의 | 프로퍼티 자동 getter/setter |
| **val** | 읽기 전용 프로퍼티 | 불변 |
| **var** | 변경 가능 프로퍼티 | 가변 |
| **주 생성자** | 클래스 헤더 | init 블록 |
| **보조 생성자** | constructor | this() 호출 |
| **상속** | : BaseClass() | open 키워드 |
| **인터페이스** | interface | 다중 구현 |
| **data class** | 데이터 모델 | 자동 메서드 |
| **object** | 싱글톤 | 익명 객체 |
| **companion object** | 정적 멤버 | Java static |
| **추상 클래스** | abstract class | 인스턴스화 불가 |
| **sealed class** | 봉인 클래스 | when 완전성 |


## 다음 수업

다음 글에서는 Kotlin 기본 — 널 안전성 심화, 스마트 캐스트, 안전한 캐스트, 널 가능성 어노테이션을 배웁니다.

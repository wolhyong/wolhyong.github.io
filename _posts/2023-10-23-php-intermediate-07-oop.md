---
layout: post
title: "PHP 객체지향 프로그래밍 — 클래스, 상속, 인터페이스, 트레이트, 의존성 주입"
description: "PHP의 객체지향 프로그래밍을 Zend Engine 객체 모델 레벨에서 심층 학습합니다. PHP 클래스가 내부적으로 `zend_class_entry` 구조체(properties_info, methods_table, ce_flags, default_properties_table)로 저장되는 방식, 객체가 `zend_object` 구조체(ce, properties, handlers)로 인스턴스화되는 과정, 가시성(public/protected/private)이 `zend_property_info`의 `flags`로 컴파일 타임에 검사되는 원리, 인터페이스와 트레이트의 충돌 해소(트레이트 우선순위: 자식 클래스 > 트레이트 > 부모 클래스), 의존성 주입(DI) 패턴과 ReflectionClass를 통한 자동 와이어링을 다룹니다."
date: 2023-10-23 10:00:00 +0900
category: php
tags: [php, oop, class, inheritance, interface, trait, dependency-injection]
level: intermediate
---

PHP의 객체지향 시스템은 Zend Engine의 `zend_class_entry`와 `zend_object` 구조체를 기반으로 합니다. PHP 8+에서 도입된 속성(Attributes), 생성자 프로퍼티 프로모션, enum 타입이 OOP를 더욱 강력하게 만듭니다.

> **💡 핵심 정리** · PHP 클래스는 `zend_class_entry`로 컴파일되어 `properties_info`(속성 해시 테이블), `methods_table`(메서드 해시 테이블), `default_properties_table`(기본값 배열)에 정보를 저장합니다. `new ClassName()` 호출 시 `zend_object_alloc()`으로 `zend_object` 구조체를 할당하고, `__construct()`를 실행합니다. 트레이트는 컴파일 단계에서 클래스의 `function_table`에 복사(Copy)되며, 동일한 메서드가 있으면 `insteadof`/`as` 키워드로 충돌을 해소합니다.

---

## 📚 수업 목표

- PHP 클래스의 zend_class_entry 구조를 이해합니다.
- 객체 인스턴스화 과정을 이해합니다.
- 상속과 인터페이스의 동작을 이해합니다.
- 트레이트의 메서드 충돌 해소를 이해합니다.
- 의존성 주입 패턴을 이해합니다.

## 클래스 기본

```php
<?php
class User
{
    // 생성자 프로퍼티 프로모션 (PHP 8+)
    public function __construct(
        private string $name,
        private int $age,
        private array $roles = []
    ) {}

    // 게터
    public function getName(): string
    {
        return $this->name;
    }

    // 메서드
    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles, true);
    }

    // 정적 메서드
    public static function createAdmin(string $name): self
    {
        return new self($name, 30, ['admin']);
    }
}

// 사용
$user = new User('Alice', 25, ['editor']);
$admin = User::createAdmin('Bob');
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: PHP에서 인터페이스와 추상 클래스의 차이는 무엇인가요?</strong></summary>

**인터페이스**는 메서드 시그니처만 정의하고 구현은 없습니다. 다중 상속이 가능하며(클래스 하나가 여러 인터페이스 구현), 프로퍼티를 가질 수 없습니다(PHP 8.4+에서 상수는 가능). **추상 클래스**는 구현된 메서드와 구현되지 않은 추상 메서드를 모두 가질 수 있습니다. 단일 상속만 가능하고, 프로퍼티를 가질 수 있습니다. 행동 규약(contract)은 인터페이스로, 기본 구현을 제공하는 템플릿은 추상 클래스로 정의하세요.
</details>

<details>
<summary><strong>Q: 트레이트의 메서드 충돌은 어떻게 해결하나요?</strong></summary>

트레이트에서 동일한 메서드명이 충돌하면 `insteadof`와 `as` 연산자로 해결합니다: `use TraitA, TraitB { TraitA::method insteadof TraitB; TraitB::method as aliasedMethod; }`. `insteadof`는 우선순위를 지정하고, `as`는 별칭을 만들어 접근을 허용합니다. 트레이트는 컴파일 타임에 클래스로 복사(Copy)되므로 런타임 성능 영향이 거의 없습니다.
</details>

<details>
<summary><strong>Q: 의존성 주입(DI)이 필요한 이유는 무엇인가요?</strong></summary>

의존성 주입은 **결합도를 낮추고 테스트 용이성을 높입니다**. `new` 키워드로 객체를 직접 생성하면 클래스 간 강한 결합이 생겨 테스트에서 목(mock) 객체로 대체할 수 없습니다. DI 컨테이너는 생성자의 타입 힌트를 ReflectionClass로 분석하여 자동으로 의존성을 주입합니다. 프레임워크(Laravel, Symfony)의 DI 컨테이너는 서비스 등록, 자동 와이어링, 싱글톤 관리까지 제공합니다.
</details>

<details>
<summary><strong>Q: PHP 8의 enum은 어떻게 동작하나요?</strong></summary>

PHP 8.1+의 `enum`은 클래스와 유사하게 구현되지만, 제한된 인스턴스 집합을 가집니다. **Pure enum**은 상수 기반으로 동작하고, **Backed enum**은 int/string 값을 가집니다. 내부적으로 enum은 `UnitEnum`/`BackedEnum` 인터페이스를 구현하는 특별한 클래스로 컴파일됩니다. `tryFrom()`으로 안전하게 값을 매핑하고, `from()`은 잘못된 값에 ValueError를 던집니다. switch/match와 함께 사용하면 완전성 검사가 가능합니다.
</details>

<details>
<summary><strong>Q: readonly 프로퍼티(PHP 8.1+)의 동작 방식은 무엇인가요?</strong></summary>

`readonly` 프로퍼티는 선언된 클래스의 `__construct()` 내에서만 한 번 설정할 수 있습니다. 이후에는 읽기만 가능하고 쓰기는 불가능합니다. 내부적으로 `zend_property_info`의 플래그에 `ZEND_ACC_READONLY`가 설정됩니다. 할당 시도 시 엔진 레벨에서 예외가 발생하므로, getter 없이 `$user->name`으로 안전하게 읽을 수 있습니다. PHP 8.2+에서는 `readonly` 클래스도 선언 가능합니다(모든 프로퍼티가 자동 readonly).
</details>

---

## 요약

- **zend_class_entry**: properties_info + methods_table + ce_flags + default_properties_table
- **zend_object**: ce(클래스) + properties(속성 저장소) + handlers(가상 테이블)
- **가시성**: public(어디서나) / protected(자식) / private(자기 자신)
- **트레이트**: 컴파일 타임 복사, `insteadof`/`as`로 충돌 해소
- **DI 패턴**: ReflectionClass로 의존성 자동 분석, 결합도 감소
- **PHP 8+**: readonly, enum, 생성자 프로퍼티 프로모션

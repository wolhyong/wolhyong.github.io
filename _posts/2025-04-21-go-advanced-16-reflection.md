---
layout: post
title: "Go 리플렉션 — reflect 패키지, Type/Value 객체, 동적 타입 검사, Struct 필드 조작과 태그 읽기"
description: "Go의 reflect(리플렉션) 패키지를 런타임 레벨에서 학습합니다. reflect.TypeOf(v)가 interface{}에 저장된 구체적 타입 정보를 runtime._type 구조체에서 읽어 reflect.Type 인터페이스로 반환하는 과정, reflect.ValueOf(v)가 runtime.eface/iface의 data 포인터에서 실제 값을 읽어 reflect.Value 구조체로 감싸는 방식, reflect.Value.Elem()으로 포인터가 가리키는 값이나 인터페이스에 저장된 값에 접근하고 reflect.Value.Set()으로 값을 변경하는 방법(변경 가능한 경우에만), 구조체 필드를 reflect.Type.NumField()/Field(i)로 순회하고 Field.Tag.Get()으로 태그 값을 읽어 JSON/XML 직렬화를 동적으로 처리하는 방식, reflect.MakeFunc()로 런타임에 함수를 동적 생성하는 고급 패턴, 리플렉션 사용 시 성능 비용(리플렉션 호출은 일반 호출보다 10~100배 느림)과 이를 완화하는 캐싱 전략을 다룹니다."
date: 2025-04-21 10:00:00 +0900
category: go
tags: [go, golang, reflection, reflect, runtime, dynamic, struct-tags, performance]
level: advanced
---

리플렉션은 런타임에 타입 정보를 검사하고 값을 동적으로 조작합니다.

> **핵심 정리** · `reflect.TypeOf(v)`는 `*_type`에서 타입 정보를, `reflect.ValueOf(v)`는 `eface/iface`에서 값을 읽습니다. `Value.Elem()`으로 포인터 역참조, `Value.Set()`으로 값 변경이 가능합니다. Struct 필드와 태그는 `Type.NumField()/Field(i).Tag.Get()`으로 읽습니다. 리플렉션은 일반 호출보다 10~100배 느리므로, 결과를 캐싱하여 성능을 개선합니다.

## 수업 목표

- reflect.Type과 reflect.Value의 관계를 이해합니다.
- 동적 타입 검사와 값 조작 방법을 이해합니다.
- 구조체 필드와 태그를 동적으로 읽는 방법을 이해합니다.
- 리플렉션의 성능 특성과 캐싱 전략을 이해합니다.
- 리플렉션의 적절한 사용 사례를 이해합니다.

## 리플렉션 기초

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    Name  string `json:"name" validate:"required"`
    Age   int    `json:"age" validate:"min=0"`
    Email string `json:"email,omitempty" validate:"email"`
}

func (u User) Greet() string {
    return fmt.Sprintf("Hi, I'm %s", u.Name)
}

func main() {
    u := User{Name: "Alice", Age: 30, Email: "alice@test.com"}

    // reflect.Type — 타입 정보
    t := reflect.TypeOf(u)
    fmt.Println("Type:", t.Name())          // User
    fmt.Println("Kind:", t.Kind())           // struct
    fmt.Println("PkgPath:", t.PkgPath())    // main

    // reflect.Value — 값 정보
    v := reflect.ValueOf(u)
    fmt.Println("Value:", v)                // {Alice 30 alice@test.com}
    fmt.Println("Interface:", v.Interface()) // {Alice 30 alice@test.com}

    // 메서드 호출
    method := v.MethodByName("Greet")
    result := method.Call(nil)
    fmt.Println("Greet:", result[0].String()) // Hi, I'm Alice
}
```

`reflect.TypeOf(u)`는 `u`의 타입 정보를 담은 `reflect.Type`을 반환합니다. 내부적으로 `interface{}`에 저장된 `*_type` 포인터를 읽어옵니다. `t.Name()`은 타입 이름, `t.Kind()`는 기반 종류(struct, slice, map 등)를 반환합니다. `reflect.ValueOf(u)`는 `u`의 값을 담은 `reflect.Value`를 반환합니다. `v.Interface()`는 `Value`를 다시 `interface{}`로 변환합니다. `v.MethodByName("Greet").Call(nil)`은 리플렉션으로 메서드를 동적으로 호출합니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 리플렉션은 언제 사용해야 하나요?</strong></summary>

리플렉션은 다음과 같은 경우에 사용합니다: (1) **JSON/XML 직렬화** — `encoding/json`이 구조체 필드와 태그를 읽어 동적으로 직렬화. (2) **ORM** — 데이터베이스 테이블과 구조체를 매핑. (3) **의존성 주입 프레임워크** — 동적 타입 검사. (4) **테스트 도구** — 테스트 더블 생성. (5) **설정 파일 바인딩** — 환경 변수나 설정 파일을 구조체에 바인딩. 리플렉션은 강력하지만 성능 비용이 크고 타입 안전성이 떨어지므로, 꼭 필요한 경우에만 사용하고 가능하면 제네릭(Go 1.18+)으로 대체하는 것이 좋습니다. "리플렉션은 프레임워크나 라이브러리 개발에 사용하고, 애플리케이션 코드에서는 피하라"가 Go의 관례입니다.
</details>

<details>
<summary><strong>Q: 리플렉션 성능 최적화는 어떻게 하나요?</strong></summary>

리플렉션 호출은 일반 호출보다 10~100배 느립니다. 최적화 방법: (1) **캐싱** — `reflect.Type`, `reflect.Method`, `StructField` 등을 한 번 조회하고 재사용합니다. (2) **인터페이스로 우회** — 가능하면 타입별로 인터페이스를 구현하게 하고, 리플렉션 대신 인터페이스 메서드를 호출합니다. (3) **핫 경로 회피** — 성능이 중요한 코드 경로에서는 리플렉션을 피합니다. (4) **go:linkname** — 극한의 최적화가 필요하면 `unsafe` 패키지와 함께 사용합니다(권장하지 않음). 실제로는 리플렉션 결과를 캐싱하는 것만으로도 성능 문제의 80%를 해결할 수 있습니다.
</details>

<details>
<summary><strong>Q: 구조체 태그는 어떻게 읽나요?</strong></summary>

`reflect.Type.Field(i).Tag.Get("json")`으로 특정 태그 값을 읽습니다. 예: `field.Tag.Get("validate")`는 `required`를 반환합니다. `field.Tag.Lookup("json")`은 태그 존재 여부를 함께 반환합니다(값이 빈 문자열일 때 유용). 태그 값은 공백으로 구분된 `key:"value"` 쌍입니다: `json:"name" validate:"required"`. `Get()`은 키가 없으면 빈 문자열을, `Lookup()`은 (value, bool)을 반환합니다. JSON 태그는 `json:"field_name,omitempty"`처럼 옵션(comma-separated)도 포함할 수 있습니다.
</details>

<details>
<summary><strong>Q: reflect.Value.Set()으로 값을 변경하려면 어떻게 해야 하나요?</strong></summary>

`Set()`으로 값을 변경하려면 **변경 가능한(settable)** Value여야 합니다. 기본적으로 `reflect.ValueOf(u)`는 복사본이므로 변경할 수 없습니다. 변경하려면: (1) 포인터를 전달: `v := reflect.ValueOf(&u).Elem()` (2) `v.Field(0).SetString("Bob")`으로 필드 변경. `Elem()`으로 포인터 역참조를 해야 원본에 접근할 수 있습니다. `CanSet()` 메서드로 변경 가능 여부를 확인할 수 있습니다. 슬라이스나 맵의 요소는 직접 변경 가능합니다: `v.Index(0).SetInt(100)`. 구조체의 unexported(소문자) 필드는 리플렉션으로도 변경할 수 없습니다(panic 발생).
</details>

<details>
<summary><strong>Q: reflect.DeepEqual의 동작 방식은 무엇인가요?</strong></summary>

`reflect.DeepEqual(a, b)`는 a와 b를 **구조적 동등성**(structural equality)으로 비교합니다. 일반 `==` 연산자는 비교 불가능한 타입(슬라이스, 맵, 구조체)도 DeepEqual로 비교할 수 있습니다. 내부적으로 각 요소를 순회하며 재귀적으로 비교합니다: (1) 기본 타입은 값 비교 (2) 슬라이스는 길이와 각 요소 비교 (3) 맵은 모든 키-값 쌍 비교 (4) 구조체는 모든 필드 비교 (5) 포인터는 가리키는 값 비교. 단점: 리플렉션 기반이므로 느리고, 순환 참조(cyclic reference)가 있으면 스택 오버플로우가 발생합니다. 성능이 중요하면 직접 비교 함수를 작성하는 것이 좋습니다.
</details>

## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **reflect.TypeOf** | 타입 정보 획득 | runtime._type 읽기 |
| **reflect.ValueOf** | 값 정보 획득 | eface/iface data 읽기 |
| **Value.Elem** | 포인터/인터페이스 역참조 | 간접 값 접근 |
| **Value.Set** | 값 변경 | settable=true 필요 |
| **StructField.Tag** | 필드 태그 읽기 | Get/Lookup 메서드 |
| **DeepEqual** | 구조적 동등성 비교 | 재귀적 요소 순회 |
| **성능** | 일반 호출 대비 10~100배 느림 | 캐싱으로 완화 |

## 다음 수업

다음 글에서는 Go unsafe 패키지와 CGO — 저수준 메모리 조작과 C 코드 호출을 배웁니다.

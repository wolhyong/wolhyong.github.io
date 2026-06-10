---
layout: post
title: "Go 고급 인터페이스 패턴 — iface/eface 내부 구조, 덕 타이핑 심화, 의존성 주입과 데코레이터"
description: "Go 인터페이스의 고급 패턴과 내부 구조를 런타임 레벨에서 학습합니다. runtime.iface 구조체(tab *itab + data unsafe.Pointer)는 인터페이스 타입과 구체적 타입의 메서드 테이블을 캐싱합니다. 빈 인터페이스 runtime.eface(type *_type + data unsafe.Pointer)는 타입 메타데이터만 저장하는 더 가벼운 구조입니다. 인터페이스 nil 검사에서 (type nil, value nil) 쌍의 의미와 (*T)(nil)을 인터페이스에 할당할 때 type이 nil이 아닌 이유를 설명합니다. io.Reader/io.Writer 같은 단일 메서드 인터페이스로 미니멀한 추상화를 달성하는 방법을 다룹니다. 인터페이스는 의존성 주입(DI) 패턴과 데코레이터 패턴에도 활용됩니다. 인터페이스 분리 원칙(ISP)과 Go의 철학적 연관성을 다룹니다."
date: 2025-03-10 10:00:00 +0900
category: go
tags: [go, golang, interfaces, iface, eface, duck-typing, dependency-injection, decorator, itab]
level: intermediate
---

인터페이스는 Go에서 가장 강력한 추상화 도구이며, 내부적으로 iface/eface 구조체로 구현됩니다.

> **핵심 정리** · 인터페이스는 `iface{tab *itab, data unsafe.Pointer}`로 구현됩니다. `itab`은 (인터페이스_타입, 구체적_타입) 쌍의 메서드 테이블을 캐싱합니다. 빈 인터페이스는 `eface{type *_type, data unsafe.Pointer}`로 더 가볍습니다. 표준 라이브러리는 단일 메서드 인터페이스(io.Reader, io.Writer)로 미니멀한 추상화를 제공합니다.

## 수업 목표

- iface와 eface의 내부 구조를 이해합니다.
- 인터페이스 nil 검사의 함정을 이해합니다.
- 단일 메서드 인터페이스의 디자인 패턴을 이해합니다.
- 의존성 주입과 데코레이터 패턴을 구현할 수 있습니다.
- 인터페이스 분리 원칙을 Go에 적용하는 방법을 이해합니다.

## 인터페이스 내부 구조

```go
package main

import (
    "fmt"
    "unsafe"
)

type Stringer interface {
    String() string
}

type User struct {
    Name string
    Age  int
}

func (u User) String() string {
    return fmt.Sprintf("%s (%d)", u.Name, u.Age)
}

func main() {
    var s Stringer
    fmt.Printf("nil 인터페이스: %v\n", s == nil)  // true

    s = User{"Alice", 30}
    fmt.Println(s.String())  // Alice (30)

    // 인터페이스 크기 확인 (iface 구조체)
    var iface struct {
        tab unsafe.Pointer  // *itab
        data unsafe.Pointer // 실제 값
    }
    fmt.Println("iface 크기:", unsafe.Sizeof(iface))  // 16 (포인터 2개)

    // 빈 인터페이스 크기 (eface 구조체)
    var eface struct {
        typ unsafe.Pointer  // *_type
        data unsafe.Pointer
    }
    fmt.Println("eface 크기:", unsafe.Sizeof(eface))  // 16

    // 실제 인터페이스 값의 크기
    var s1 Stringer
    var e1 interface{}
    fmt.Println("Stringer:", unsafe.Sizeof(s1))  // 16
    fmt.Println("any:", unsafe.Sizeof(e1))       // 16
}
```

인터페이스 값은 내부적으로 `runtime.iface` 구조체(16바이트)로 표현됩니다: `type iface struct { tab *itab; data unsafe.Pointer }`. `tab`은 `itab`(interface table)으로, 인터페이스 타입 메타데이터와 구체적 타입의 메서드 주소를 담고 있습니다. `itab`은 `(interface_type, concrete_type)` 쌍에 대해 한 번 생성되어 전역 캐시에 저장되므로, 반복적인 인터페이스 호출이 효율적입니다. 빈 인터페이스 `interface{}`(`any`)는 `runtime.eface` 구조체(`type *_type`, `data unsafe.Pointer`)로 구현됩니다. eface는 메서드가 없으므로 itab이 필요 없고, `*_type`만 저장하여 더 가볍습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 인터페이스의 nil 검사가 예상대로 동작하지 않는 이유는 무엇인가요?</strong></summary>

인터페이스는 `(type, value)` 쌍으로, `nil`이려면 **둘 다 nil**이어야 합니다. `var s Stringer = (*User)(nil)`을 할당하면 `type`은 `*User`, `value`는 `nil`이므로 `s == nil`은 `false`입니다. 이는 함수가 `*User` 타입의 nil을 반환할 때 자주 발생하는 함정입니다: `func find() Stringer { var u *User = nil; return u }` — 반환값은 nil이 아닌 `(*User, nil)` 인터페이스입니다. 해결: 항상 `var s Stringer`를 명시적으로 nil로 선언하거나, 반환값을 `(Stringer, error)` 패턴으로 사용합니다.
</details>

<details>
<summary><strong>Q: 단일 메서드 인터페이스의 장점은 무엇인가요?</strong></summary>

Go의 단일 메서드 인터페이스(io.Reader, io.Writer, http.Handler)는 인터페이스 분리 원칙(ISP)을 완벽히 따릅니다. 장점: (1) **조합성** — 여러 인터페이스를 조합하여 새로운 인터페이스를 만들 수 있음 (`ReadWriter`는 `Reader + Writer`). (2) **테스트 용이성** — 목(mock) 객체를 만들기 쉬움 (3) **데코레이터 패턴** — `bufio.NewReader(r io.Reader)`처럼 기존 구현을 감싸서 기능을 확장. (4) **유연성** — 함수가 필요한 기능의 최소 인터페이스만 받으면, 다양한 구현체를 수용할 수 있음. 대규모 인터페이스보다 여러 개의 작은 인터페이스가 Go의 철학에 더 적합합니다.
</details>

<details>
<summary><strong>Q: 인터페이스를 사용한 의존성 주입의 일반적인 패턴은 무엇인가요?</strong></summary>

Go에서 의존성 주입은 보통 생성자 함수 패턴을 사용합니다: `func NewService(db Database, logger Logger, cache Cache) *Service`. 인터페이스를 파라미터로 받으면 테스트 시 목(mock) 구현체를 주입할 수 있습니다. Wire(Google) 같은 DI 프레임워크도 있지만, Go 커뮤니티는 명시적 DI를 선호합니다. 구조체 임베딩과 인터페이스 조합으로 유연한 아키텍처를 만들 수 있습니다. 중요한 점은 "인터페이스는 소비자(호출자)가 정의한다"는 Go의 철학으로, 인터페이스는 사용하는 쪽에서 정의하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q: 인터페이스 분리 원칙과 Go의 관계는 무엇인가요?</strong></summary>

인터페이스 분리 원칙(Interface Segregation Principle, ISP)은 "클라이언트는 자신이 사용하지 않는 메서드에 의존하면 안 된다"는 원칙입니다. Go의 인터페이스는 **암시적 구현**(implicit implementation)과 **덕 타이핑** 덕분에 ISP를 자연스럽게 따릅니다. 큰 인터페이스를 미리 정의할 필요 없이, 필요한 메서드만 있는 작은 인터페이스를 각 사용처에서 정의할 수 있습니다. `io.Reader`(Read 메서드 하나)가 대표적인 예입니다. Go에서는 "interface should be as small as possible"이 원칙입니다.
</details>

<details>
<summary><strong>Q: itab이 캐싱되는 방식은 어떻게 되나요?</strong></summary>

`itab`은 `(interface_type, concrete_type)` 쌍에 대해 한 번 생성되면 전역 itab 테이블에 캐싱됩니다. 캐시는 해시 테이블로 구현되어 O(1) 조회가 가능합니다. 따라서 처음 인터페이스 변환 시 itab 생성 비용이 들지만, 이후에는 캐시된 itab을 재사용하여 거의 무료입니다. `itab`에는 인터페이스의 각 메서드에 대한 함수 포인터가 저장되어 있어, 인터페이스 메서드 호출 시 itab에서 직접 함수 주소를 찾아 호출합니다. 이는 리플렉션(reflect)보다 훨씬 빠릅니다.
</details>

## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **iface** | 메서드가 있는 인터페이스 | {tab *itab, data unsafe.Pointer} |
| **eface** | 빈 인터페이스 (any) | {type *_type, data unsafe.Pointer} |
| **itab** | 인터페이스 타입 + 구체적 타입 메서드 테이블 | 전역 캐시, O(1) 조회 |
| **단일 메서드 인터페이스** | 최소 추상화 | io.Reader, io.Writer, http.Handler |
| **DI 패턴** | 생성자 함수로 의존성 주입 | 인터페이스 파라미터 + 목 구현체 |
| **ISP** | 인터페이스 분리 원칙 | Go의 암시적 구현으로 자연스럽게 달성 |

## 다음 수업

다음 글에서는 Go 고루틴과 동시성 — goroutine의 스택 구조, M:N 스케줄러, sync 패키지를 배웁니다.

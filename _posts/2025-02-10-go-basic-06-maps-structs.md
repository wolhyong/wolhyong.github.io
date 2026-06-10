---
layout: post
title: "Go 맵과 구조체 — 해시 테이블 map의 bucket 체인과 struct의 메모리 정렬, 필드 태그와 JSON 직렬화"
description: "Go의 맵(map)과 구조체(struct)의 메모리 구조와 동작을 심층 학습합니다. map[K]V 해시 테이블은 runtime.hmap 구조체(buckets unsafe.Pointer, oldbuckets unsafe.Pointer, B uint8, count int)로 구현됩니다. key의 해시값 하위 B비트로 bucket을 선택하고, bucket 내부 tophash 배열에 키-값 쌍을 저장합니다. 충돌 시 overflow bucket 체인(linked list)으로 해결합니다. map 리터럴과 make(map[K]V, hint)로 생성하고 키-값을 할당/조회/삭제하는 방법을 설명합니다. struct는 필드 타입의 메모리 정렬(memory alignment) 요구사항에 따라 필드 사이에 패딩(padding)을 추가해 정렬 경계를 맞춥니다. 필드 순서 최적화로 구조체 크기를 줄이는 방법도 다룹니다. 구조체 필드 태그(tag)는 encoding/json이나 encoding/xml 같은 표준 라이브러리가 리플렉션(reflection)으로 읽어 직렬화를 제어합니다. 값 타입인 구조체는 함수 인자로 전달될 때 전체가 복사되며 포인터 리시버와 차이가 있습니다."
date: 2025-02-10 10:00:00 +0900
category: go
tags: [go, golang, map, struct, hash-table, memory-alignment, json, struct-tags, reflection]
level: basic
---

Go의 맵은 해시 테이블 기반의 동적 컬렉션이고, 구조체는 필드를 그룹화하는 사용자 정의 타입입니다.

> **핵심 정리** · map은 `runtime.hmap` 구조체로 구현된 해시 테이블입니다. key의 해시값 → bucket 선택 → tophash 비교 → 키-값 쌍 접근 순서로 동작합니다. struct는 필드를 연속 메모리에 배치하지만, CPU 메모리 정렬 요구사항에 따라 필드 사이에 패딩이 추가될 수 있습니다. struct 태그는 리플렉션으로 읽혀 JSON 직렬화 동작을 제어합니다.


## 수업 목표

- 맵의 해시 테이블 구조와 bucket 체인을 이해합니다.
- 맵의 조회/추가/삭제 동작을 이해합니다.
- 구조체의 메모리 정렬과 패딩을 이해합니다.
- 구조체 태그와 JSON 직렬화를 이해합니다.
- 구조체 값 타입과 포인터의 차이를 이해합니다.

## 맵 (Map)

```go
package main

import "fmt"

func main() {
    // 1. make로 생성
    scores := make(map[string]int)
    scores["Alice"] = 95
    scores["Bob"] = 87
    scores["Charlie"] = 92

    // 2. 리터럴로 생성
    grades := map[string]string{
        "Alice":   "A",
        "Bob":     "B+",
        "Charlie": "A-",
    }

    // 3. 조회
    aliceScore := scores["Alice"]
    fmt.Println("Alice:", aliceScore)   // 95

    // 4. 존재 확인 (콤마-ok 패턴)
    value, exists := scores["David"]
    if exists {
        fmt.Println("David:", value)
    } else {
        fmt.Println("David: 없음")       // 출력
        fmt.Println("제로값:", value)     // 0 (string이면 "")
    }

    // 5. 삭제
    delete(scores, "Charlie")
    fmt.Println(scores)                  // map[Alice:95 Bob:87]

    // 6. 길이
    fmt.Println(len(scores))             // 2

    // 7. 맵 순회 (순서 무작위)
    for name, grade := range grades {
        fmt.Printf("%s: %s\n", name, grade)
    }

    // 8. nil 맵
    var emptyMap map[string]int          // nil, 읽기 가능, 쓰기 불가(panic)
    fmt.Println(emptyMap["test"])        // 0 (제로값 반환)
    // emptyMap["test"] = 1              // panic: assignment to entry in nil map
}
```

`map[string]int`는 문자열 키를 정수 값에 매핑하는 해시 테이블입니다. `make(map[string]int)`로 생성하거나 리터럴로 초기화할 수 있습니다. `scores["Alice"]`로 값을 조회하면, 키가 없으면 **제로값**을 반환합니다. 따라서 키의 실제 존재 여부는 **콤마-ok 패턴** `value, exists := scores["David"]`로 확인해야 합니다. `exists`는 키가 존재하면 `true`, 없으면 `false`입니다. `delete(scores, "Charlie")`는 키-값 쌍을 삭제합니다. 키가 없어도 panic 없이 안전하게 동작합니다. `for name, grade := range grades`로 맵을 순회할 수 있지만, **순서는 무작위**입니다(Go가 의도적으로 랜덤화합니다). `var emptyMap map[string]int`는 nil 맵으로, 읽기는 가능하지만 쓰기는 panic이 발생합니다.

### 맵의 내부 구조

```go
// 내부 구현 (의사 코드)
type hmap struct {
    count      int              // 현재 키-값 쌍의 수
    B          uint8            // bucket 수 = 2^B
    buckets    unsafe.Pointer   // bucket 배열 포인터
    oldbuckets unsafe.Pointer   // 이전 bucket (점진적 확장)
    hash0      uint32           // 해시 시드 (랜덤)
}

type bmap struct {
    tophash [8]uint8   // 해시값 상위 8비트 (빠른 비교)
    // keys   [8]keyType   // 키 배열 (8개)
    // values [8]valueType // 값 배열 (8개)
}
```

```go
package main

import "fmt"

func main() {
    // map의 동작 확인
    m := make(map[string]int, 8)  // hint로 초기 용량 지정

    // 콤마-ok 패턴
    if v, ok := m["key"]; ok {
        fmt.Println("값:", v)
    } else {
        fmt.Println("키 없음, 제로값:", v)
    }

    // 요소 추가
    for i := 0; i < 10; i++ {
        key := fmt.Sprintf("key%d", i)
        m[key] = i * 10
    }
    fmt.Println("맵 크기:", len(m))

    // 맵은 참조 타입
    m2 := m
    m2["new"] = 100
    fmt.Println(m["new"])   // 100 — m2와 m이 같은 데이터를 참조
}
```

맵의 내부 `hmap` 구조체에서 `B`는 bucket 개수를 결정합니다(bucket 수 = 2^B). 키가 추가될 때: (1) 키의 해시값 계산 (hash0 시드로 랜덤화) (2) 해시 하위 B비트로 bucket 인덱스 결정 (3) bucket 내 tophash 배열에서 해시 상위 8비트와 일치하는 항목 검색 (4) 일치하면 키 비교 후 값 반환 (5) 없으면 새 bucket이나 overflow bucket에 저장. `make(map[string]int, 8)`의 `hint`는 초기 용량으로, 내부 bucket 수를 최적화하여 재할당(rehashing)을 줄입니다. 맵은 **참조 타입**이므로, `m2 := m`은 `hmap` 포인터를 복사하여 같은 데이터를 공유합니다.

### 구조체 (Struct)

```go
package main

import (
    "encoding/json"
    "fmt"
)

// 기본 구조체
type Person struct {
    Name string
    Age  int
    City string
}

// 구조체 임베딩 (상속 대신 포함)
type Employee struct {
    Person                    // 임베딩 — Person의 모든 필드 승격
    Company     string
    Position    string
}

// 태그가 있는 구조체
type User struct {
    ID        int    `json:"id"`
    Username  string `json:"username"`
    Email     string `json:"email,omitempty"`
    Password  string `json:"-"`              // JSON 직렬화 제외
    CreatedAt string `json:"created_at"`
}

func main() {
    // 구조체 리터럴
    p1 := Person{"Alice", 30, "Seoul"}
    p2 := Person{Name: "Bob", Age: 25, City: "Busan"}
    p3 := Person{Name: "Charlie"}             // Age=0, City="" (제로값)

    fmt.Println(p1.Name, p1.Age, p1.City)     // Alice 30 Seoul
    fmt.Println(p2)                            // {Bob 25 Busan}
    fmt.Println(p3)                            // {Charlie 0 }

    // 임베딩 접근
    e := Employee{
        Person:   Person{Name: "David", Age: 35, City: "Seoul"},
        Company:  "Google",
        Position: "Developer",
    }
    fmt.Println(e.Name)       // David — Person.Name이 승격됨
    fmt.Println(e.Company)    // Google

    // JSON 직렬화
    user := User{
        ID:        1,
        Username:  "gopher",
        Email:     "gopher@example.com",
        Password:  "secret123",
        CreatedAt: "2025-01-06",
    }

    jsonData, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonData))
    // {
    //   "id": 1,
    //   "username": "gopher",
    //   "email": "gopher@example.com",
    //   "created_at": "2025-01-06"
    // }
    // Password는 json:"-" 태그로 제외됨
}
```

`type Person struct { ... }`는 새로운 구조체 타입을 정의합니다. 필드는 `Name Type` 형태로 선언합니다. 구조체 리터럴은 `Person{"Alice", 30, "Seoul"}`처럼 순서대로(필드 선언 순서) 또는 `Person{Name: "Bob"}`처럼 필드명으로 초기화할 수 있습니다. 필드명 초기화는 순서에 관계없이 사용할 수 있어 더 명확합니다. **구조체 임베딩**(`Employee`에 `Person` 포함)은 상속(inheritance)이 아닌 포함(composition)입니다. `e.Name`으로 `Person`의 필드에 직접 접근할 수 있는데, 이를 **필드 승격(field promotion)**이라고 합니다. `json:"username"` 같은 **구조체 태그**는 리플렉션(reflection)을 통해 `encoding/json` 패키지가 읽습니다. `json:"-"`는 해당 필드를 JSON 직렬화에서 제외하고, `omitempty`는 값이 제로값이면 생략합니다.

### 메모리 정렬과 패딩

```go
package main

import (
    "fmt"
    "unsafe"
)

// 패딩이 있는 구조체
type BadStruct struct {
    A bool    // 1바이트 + 7바이트 패딩
    B int64   // 8바이트
    C bool    // 1바이트 + 7바이트 패딩
}  // 총 24바이트

// 패딩 최적화 구조체
type GoodStruct struct {
    B int64   // 8바이트
    A bool    // 1바이트
    C bool    // 1바이트 + 6바이트 패딩
}  // 총 16바이트

func main() {
    bad := BadStruct{}
    good := GoodStruct{}

    fmt.Println("BadStruct  크기:", unsafe.Sizeof(bad))    // 24
    fmt.Println("GoodStruct 크기:", unsafe.Sizeof(good))   // 16

    // 각 필드의 오프셋 확인
    fmt.Println("BadStruct.A offset:", unsafe.Offsetof(bad.A))  // 0
    fmt.Println("BadStruct.B offset:", unsafe.Offsetof(bad.B))  // 8 (7바이트 패딩)
    fmt.Println("BadStruct.C offset:", unsafe.Offsetof(bad.C))  // 16

    fmt.Println("GoodStruct.B offset:", unsafe.Offsetof(good.B)) // 0
    fmt.Println("GoodStruct.A offset:", unsafe.Offsetof(good.A)) // 8
    fmt.Println("GoodStruct.C offset:", unsafe.Offsetof(good.C)) // 9
}
```

CPU는 메모리를 읽을 때 특정 **정렬 경계(alignment boundary)**를 기준으로 읽습니다. `int64`는 8바이트 정렬이 필요하므로, 주소가 8의 배수여야 합니다. `BadStruct`에서 `bool`(1바이트) 뒤에 `int64`(8바이트)가 오면, `int64`의 시작 주소를 8의 배수로 맞추기 위해 7바이트의 패딩이 추가됩니다. `GoodStruct`처럼 큰 타입을 먼저 배치하면 패딩을 최소화할 수 있습니다. `unsafe.Offsetof()`는 각 필드의 시작 오프셋을 보여줍니다. 구조체 크기는 `BadStruct` 24바이트, `GoodStruct` 16바이트로, **단순히 필드 순서만 바꿔도 33% 절약**됩니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 맵의 키로 사용할 수 있는 타입은 무엇인가요?</strong></summary>

맵의 키로는 **비교 가능(comparable)**한 타입만 사용할 수 있습니다. 비교 가능한 타입은 `==`와 `!=` 연산자를 지원하는 타입으로, `bool`, `int`, `float64`, `string`, `pointer`, `channel`, `struct`(모든 필드가 comparable), `array`(요소 타입이 comparable)가 해당됩니다. **비교 불가능**한 타입은 슬라이스(`[]T`), 맵(`map[K]V`), 함수(`func`)입니다. 이 타입들은 런타임에 비교가 불가능하므로 맵의 키로 사용할 수 없습니다. 인터페이스 타입은 가능하지만, 런타임에 저장된 값이 비교 가능해야 합니다.
</details>

<details>
<summary><strong>Q: 맵의 요소를 수정하려면 어떻게 해야 하나요?</strong></summary>

맵의 값을 직접 수정하려면, 값이 포인터나 슬라이스 같은 참조 타입이거나, 구조체 전체를 교체해야 합니다. `m["key"].Field = value`는 컴파일 오류입니다(맵 인덱스가 주소를 반환하지 않으므로). 해결 방법: (1) 구조체를 통째로 읽고 수정 후 다시 할당: `v := m["key"]; v.Field = value; m["key"] = v` (2) 값 타입을 포인터로 사용: `map[string]*MyStruct` (3) 맵 값 자체를 슬라이스나 다른 참조 타입으로 설계. 구조체 값의 포인터를 맵에 저장하면 직접 필드 수정이 가능합니다.
</details>

<details>
<summary><strong>Q: 구조체는 값 타입인데, 큰 구조체는 함수 인자로 전달할 때 비효율적이지 않나요?</strong></summary>

네, 구조체는 **값 타입**이므로 함수 인자로 전달하면 전체가 복사됩니다. 큰 구조체(수백 바이트 이상)는 복사 비용이 큽니다. 따라서 큰 구조체는 **포인터**로 전달하는 것이 일반적입니다: `func Process(p *Person)`. 하지만 작은 구조체(수십 바이트 이하)는 값 전달이 오히려 빠를 수 있습니다(포인터 간접 참조 비용 제거). Go의 관례는 일관성을 위해 메서드 리시버를 포함하여: (1) 변경이 필요하면 포인터 리시버 (`func (p *Person) Update()`) (2) 변경이 없고 작으면 값 리시버 (`func (p Person) String() string`). 가이드라인: **일관성**을 유지하세요. 같은 타입의 리시버는 모두 값 또는 모두 포인터로 통일합니다.
</details>

<details>
<summary><strong>Q: struct 태그는 어떤 용도로 사용되나요?</strong></summary>

struct 태그는 **메타데이터**를 필드에 첨부하는 기능입니다. 주요 용도: (1) **JSON 직렬화**: `json:"field_name,omitempty"` (2) **XML 직렬화**: `xml:"element,attr"` (3) **데이터베이스 ORM**: `gorm:"column:user_name;type:varchar(100)"` (4) **폼 검증**: `validate:"required,min=3,max=100"` (5) **YAML**: `yaml:"field_name"` (6) **환경 변수**: `env:"MY_VAR"`. 태그는 리플렉션(`reflect` 패키지)으로 읽히며, 런타임에 `field.Tag.Get("json")`으로 접근할 수 있습니다. 태그 값은 공백으로 구분된 `key:"value"` 쌍의 형태입니다.
</details>

<details>
<summary><strong>Q: make(map[K]V, hint)의 hint는 어떤 역할을 하나요?</strong></summary>

`hint`는 맵의 **예상 크기(초기 용량)**를 지정합니다. hint가 주어지면, Go 런타임은 추가적인 재해싱(rehashing) 없이 hint 개수의 요소를 저장할 수 있는 충분한 bucket을 미리 할당합니다. hint가 없거나 작으면, 요소가 추가될 때마다 bucket이 부족해져 재할당이 발생합니다. 재해싱은 모든 키-값 쌍을 새 bucket에 다시 분배하므로 O(n) 비용이 듭니다. 따라서 예상 크기를 알고 있다면 hint를 지정하는 것이 성능에 좋습니다. hint는 **최대 요소 수**가 아니라 예상 값이며, 실제로는 hint에 가장 가까운 2의 제곱수에 비례하는 bucket이 할당됩니다.
</details>


## 요약

| 개념 | 설명 | 내부 구조 |
|------|------|----------|
| **map** | 해시 테이블 | hmap{buckets, oldbuckets, B, count, hash0} |
| **bucket 체인** | 해시 충돌 해결 | tophash[8] + overflow 포인터 (linked list) |
| **콤마-ok** | 키 존재 확인 | `value, ok := m[key]` |
| **struct** | 필드 그룹화 | 연속 메모리 + 필드별 패딩 |
| **메모리 정렬** | CPU 접근 최적화 | 큰 타입을 먼저 배치하여 패딩 최소화 |
| **struct 태그** | 메타데이터 | 리플렉션으로 런타임 접근 |


## 다음 수업

다음 글에서는 Go의 메서드와 인터페이스 — 타입에 동작을 연결하고 추상화하는 방법을 배웁니다.

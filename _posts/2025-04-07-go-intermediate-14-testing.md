---
layout: post
title: "Go 테스팅 — testing 패키지, table-driven tests, 커버리지, 벤치마크, fuzzing과 mock"
description: "Go의 테스팅 시스템을 표준 라이브러리 레벨에서 학습합니다. testing.T 구조체가 테스트 함수의 컨텍스트를 관리하고 t.Error/t.Fatal/t.Skip/t.Log 등으로 테스트 결과를 제어하는 방식, Go 1.18에 도입된 fuzzing이 입력을 변형(mutating)하면서 예상치 못한 버그를 찾는 방법, go test -cover로 전체 테스트 커버리지를 측정하고 -coverprofile로 파일로 내보내 상세 분석하는 방법, table-driven tests 패턴이 입력 케이스를 구조체 배열로 정의하여 모든 테스트 케이스를 체계적으로 검증하는 Go의 관행, testing.B 구조체로 벤치마크를 실행하고 b.ResetTimer()로 설정 시간을 제외하며 b.N으로 반복 횟수를 자동 조절하는 방식, httptest.Server로 HTTP 서버 목(mock)을 생성하여 클라이언트 코드를 통합 테스트하는 방식을 다룹니다."
date: 2025-04-07 10:00:00 +0900
category: go
tags: [go, golang, testing, table-driven, coverage, benchmark, fuzzing, mock]
level: intermediate
---

Go의 testing 패키지는 표준 라이브러리로 제공되는 강력한 테스팅 도구입니다.

> **핵심 정리** · 테스트 함수는 `func TestXxx(t *testing.T)` 형태입니다. `t.Error/Fatal/Skip/Log`로 결과를 제어합니다. table-driven tests는 입력 케이스를 배열로 정의합니다. `go test -cover`로 커버리지를 측정합니다. `testing.B`로 벤치마크를 실행하고 `b.N`으로 반복 횟수를 자동 조절합니다. `httptest.Server`로 HTTP 목 서버를 생성합니다.

## 수업 목표

- testing.T의 주요 메서드를 이해합니다.
- table-driven tests 패턴을 이해합니다.
- 테스트 커버리지 측정을 이해합니다.
- 벤치마크 작성과 실행을 이해합니다.
- fuzzing과 mock 패턴을 이해합니다.

## 단위 테스트

```go
// math.go
package main

func Add(a, b int) int {
    return a + b
}

func Divide(a, b int) (int, error) {
    if b == 0 {
        return 0, ErrDivisionByZero
    }
    return a / b, nil
}

var ErrDivisionByZero = fmt.Errorf("0으로 나눌 수 없음")

// math_test.go
package main

import "testing"

// 기본 테스트
func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5
    if result != expected {
        t.Errorf("Add(2, 3) = %d; want %d", result, expected)
    }
}

// Table-driven test
func TestDivide(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        want     int
        wantErr  bool
    }{
        {"정상 나눗셈", 10, 2, 5, false},
        {"0으로 나누기", 10, 0, 0, true},
        {"음수 나눗셈", -6, 3, -2, false},
        {"1로 나누기", 7, 1, 7, false},
        {"자기 자신 나누기", 5, 5, 1, false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Divide(tt.a, tt.b)
            if (err != nil) != tt.wantErr {
                t.Errorf("Divide(%d, %d) error = %v, wantErr %v",
                    tt.a, tt.b, err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("Divide(%d, %d) = %d, want %d",
                    tt.a, tt.b, got, tt.want)
            }
        })
    }
}
```

`func TestAdd(t *testing.T)`는 **테스트 함수**입니다. `t.Errorf`는 테스트 실패를 보고하지만 테스트를 계속 실행합니다. `t.Fatalf`는 즉시 테스트를 중단합니다. `t.Skip`은 조건부로 테스트를 건너뜁니다. `t.Log`는 테스트 출력을 남깁니다.

**Table-driven tests**는 Go의 대표적인 테스트 패턴입니다. 여러 테스트 케이스를 구조체 슬라이스로 정의하고, `for` 루프로 모든 케이스를 실행합니다. `t.Run(tt.name, ...)`은 각 케이스를 하위 테스트(subtest)로 실행하여 실패 시 어떤 케이스가 실패했는지 명확히 알 수 있습니다. `go test -v -run TestDivide/정상`으로 특정 하위 테스트만 실행할 수도 있습니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: 테스트 커버리지는 어떻게 측정하나요?</strong></summary>

`go test -cover`로 전체 커버리지 백분율을 확인합니다. `go test -coverprofile=coverage.out`으로 상세 정보를 파일로 저장하고, `go tool cover -html=coverage.out`으로 HTML 리포트를 생성합니다(브라우저에서 각 라인의 커버 여부를 시각적으로 확인 가능). `go test -covermode=count`는 각 라인이 실행된 횟수를 기록합니다. Go의 커버리지는 **문장(statement) 커버리지**를 측정합니다. 커버리지가 100%라고 버그가 없는 것은 아니지만, 테스트되지 않은 코드를 식별하는 데 유용합니다.
</details>

<details>
<summary><strong>Q: 벤치마크는 어떻게 작성하나요?</strong></summary>

`func BenchmarkXxx(b *testing.B)` 형태로 작성합니다. `b.N`은 벤치마크 러너가 자동으로 조절하는 반복 횟수입니다. 보통 1초 정도 실행되는 횟수로 설정됩니다. `b.ResetTimer()`로 설정 코드의 시간을 제외할 수 있습니다. `b.RunParallel()`로 병렬 벤치마크를 실행합니다. 실행: `go test -bench=. -benchmem`. `-benchmem`은 메모리 할당 통계를 추가로 출력합니다. 출력 예: `BenchmarkAdd-8 1000000000 0.25 ns/op 0 B/op 0 allocs/op` (연산 1회당 시간, 할당 메모리, 할당 횟수).
</details>

<details>
<summary><strong>Q: fuzzing(Fuzz testing)은 어떻게 사용하나요?</strong></summary>

Go 1.18부터 fuzzing이 정식 지원됩니다. `func FuzzXxx(f *testing.F)` 형태로 작성합니다. `f.Add()`로 시드 코퍼스(seed corpus)를 추가하고, `f.Fuzz(func(t *testing.T, data ...) { ... })`로 퍼징 타겟을 정의합니다. 실행: `go test -fuzz=Fuzz -fuzztime=30s`. 퍼저는 시드 입력을 변형(mutation)하여 새로운 입력을 생성하고, 패닉이나 실패를 유발하는 입력을 찾으면 `testdata/fuzz/FuzzXxx/` 디렉토리에 저장합니다. 주로 JSON 파서, 입력 검증 함수 등 경계 조건이 많은 함수의 버그를 찾는 데 유용합니다.
</details>

<details>
<summary><strong>Q: HTTP 서버 테스트는 어떻게 하나요?</strong></summary>

`net/http/httptest` 패키지를 사용합니다. `httptest.NewServer(handler)`로 실제 HTTP 서버를 띄우지 않고 테스트용 서버를 생성합니다. 서버는 랜덤 포트에서 수신하므로 충돌이 없습니다. `httptest.NewRequest(method, url, body)`로 요청을 생성하고, `httptest.NewRecorder()`로 응답을 기록합니다. 예: `req := httptest.NewRequest("GET", "/api/users", nil); w := httptest.NewRecorder(); handler.ServeHTTP(w, req); resp := w.Result()`. 클라이언트 테스트는 `httptest.NewServer`의 URL로 요청을 보냅니다.
</details>

<details>
<summary><strong>Q: 목(Mock) 객체는 어떻게 만드나요?</strong></summary>

Go에는 표준 Mock 라이브러리가 없지만, 인터페이스를 활용하여 쉽게 Mock을 만들 수 있습니다. 방법: (1) **직접 Mock 구조체 작성** — 인터페이스를 구현하는 단순한 Mock 구조체를 직접 작성. (2) **gomock** — Google의 Mock 프레임워크로, 코드 생성으로 Mock을 자동 생성. (3) **testify/mock** — 간단한 Assertion과 Mock을 제공. (4) **interfaces** — Go의 암시적 구현 덕분에 생산 환경의 실제 객체와 테스트의 Mock 객체를 쉽게 교체 가능. Mock의 핵심은 의존성을 인터페이스로 추상화하는 것입니다.
</details>

## 요약

| 개념 | 설명 | 사용법 |
|------|------|--------|
| **testing.T** | 테스트 컨텍스트 | t.Error/Fatal/Log/Skip |
| **Table-driven** | 케이스 배열 테스트 | 구조체 슬라이스 + t.Run |
| **커버리지** | 테스트 범위 측정 | go test -cover -coverprofile |
| **testing.B** | 성능 벤치마크 | b.N, b.ResetTimer, b.RunParallel |
| **Fuzzing** | 자동 입력 변형 | f.Add + f.Fuzz |
| **httptest** | HTTP 테스트 | NewServer, NewRecorder |

## 다음 수업

다음 글에서는 Go 고급 동시성 패턴 — worker pool, fan-in/fan-out, pipeline을 배웁니다.

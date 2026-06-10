---
layout: post
title: "Go 언어 소개 — Ken Thompson이 설계한 정적 컴파일 언어의 철학과 실행 구조"
description: "Go(Golang) 언어의 탄생 배경과 설계 철학, 실행 구조를 시스템 레벨에서 학습합니다. Robert Griesemer, Rob Pike, Ken Thompson이 Google 내부의 복잡한 빌드 시스템과 느린 컴파일 속도를 해결하기 위해 Go를 설계한 과정을 다룹니다. Go 컴파일러(gc)는 소스 코드를 lexing하고 recursive descent 파싱으로 AST를 구성한 뒤 SSA 중간 표현으로 변환하고 네이티브 머신 코드로 컴파일합니다. go mod init/go build/go run/go fmt/go vet 등의 도구는 단일 실행 파일(binary)을 생성하는 통합 설계 철학을 보여줍니다. Go 런타임의 고루틴 스케줄러는 M:N 스레딩 모델로 수만 개의 경량 스레드를 OS 스레드 위에서 관리합니다. 정적 컴파일로 생성된 단일 바이너리의 장점과 CGO를 통한 C 라이브러리 호출 방식을 다룹니다."
date: 2025-01-06 10:00:00 +0900
category: go
tags: [go, golang, compiler, goroutine, static-linking, google, ken-thompson, ssa]
level: basic
---

Go는 Robert Griesemer, Rob Pike, Ken Thompson이 2009년에 발표한 정적 컴파일 언어입니다. "간결함과 효율성"을 최우선 설계 목표로 합니다.

> **핵심 정리** · Go 컴파일러(gc)는 소스 코드를 lexing → recursive descent parsing → AST → SSA 중간 표현 → 네이티브 코드(x86-64/ARM64) 순서로 AOT 컴파일합니다. 정적 링크로 단일 바이너리가 생성되며, Go 런타임은 M:N 스케줄링으로 수만 개의 고루틴을 관리합니다. `go build` 하나로 컴파일, 링크, 바이너리 생성을 완료합니다.


## 수업 목표

- Go의 탄생 배경과 설계 철학을 이해합니다.
- Go 컴파일러의 AOT 컴파일 과정을 이해합니다.
- 고루틴과 M:N 스케줄링 모델의 개념을 이해합니다.
- go mod/build/run 도구 체인의 동작을 이해합니다.
- Hello World를 작성하고 실행할 수 있습니다.

## Go의 탄생 배경과 설계 철학

Go는 2007년 Google 내부에서 시작된 프로젝트입니다. 당시 Google은 C++와 Java로 방대한 규모의 분산 시스템을 개발하고 있었고, 두 언어에 대한 불만이 쌓여 있었습니다.

| 문제 | 기존 언어(C++/Java) | Go의 해결책 |
|------|-------------------|------------|
| **느린 컴파일** | C++ 헤더 의존성으로 수십 분 | 모든 의존성을 단일 패스로 처리, 빠른 컴파일 |
| **복잡한 문법** | C++의 템플릿/다중 상속 | 단 25개의 키워드, 최소한의 문법 |
| **병렬 처리 어려움** | 스레드 기반, 복잡한 동기화 | 고루틴과 채널로 내장된 동시성 |
| **의존성 관리** | 서드파티 도구 필요 | go mod로 내장된 모듈 시스템 |
| **배포 복잡성** | JRE/DLL 의존성 | 정적 링크 단일 바이너리 |

### Hello World

```go
// hello.go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
    fmt.Println("안녕, Go!")
}
```

`package main`은 이 파일이 실행 가능한 프로그램임을 선언합니다. Go의 모든 파일은 `package` 선언으로 시작하며, `main` 패키지는 특별히 프로그램의 진입점(entry point)을 정의합니다. `import "fmt"`는 표준 입출력 패키지(format)를 가져옵니다. `func main()`은 프로그램 시작 시 자동으로 호출되는 함수로, `main` 패키지 안에 정확히 하나만 존재해야 합니다. `fmt.Println`은 문자열을 표준 출력에 쓰고 개행 문자를 추가합니다. Go에서 `Println`은 대문자로 시작하는데, 이는 이 함수가 **exported**(외부에 공개)된 식별자임을 의미합니다. Go는 대문자 첫 글자가 public, 소문자 첫 글자가 package-private입니다.

### Go 도구 체인

```bash
# 모듈 초기화
go mod init example.com/hello

# 실행 (빌드 후 실행)
go run hello.go

# 빌드 (바이너리 생성)
go build hello.go

# 바이너리 실행 (Windows)
hello.exe

# 바이너리 실행 (Linux/macOS)
./hello

# 코드 포매팅
go fmt hello.go

# 정적 분석
go vet hello.go
```

`go mod init example.com/hello`는 `go.mod` 파일을 생성하여 모듈 경로(`example.com/hello`)와 Go 버전을 기록합니다. `go run`은 소스 파일을 임시 디렉토리에 컴파일한 후 즉시 실행하고 바이너리를 삭제합니다. `go build`는 현재 디렉토리의 이름을 딴 실행 바이너리를 생성합니다. `go fmt`는 Go 언어의 유일한 코드 스타일 규칙(탭 들여쓰기, 80자 제한 등)을 자동으로 적용합니다. `go vet`는 정적 분석으로 의심스러운 코드 패턴(예: `Printf`에 인자 누락)을 찾아냅니다.

### Go 프로젝트 구조

```
hello/
├── go.mod          # 모듈 정의 (module path, go version, dependencies)
├── hello.go        # 소스 파일
├── hello.exe       # 빌드 결과 (gitignore 권장)
└── go.sum          # 의존성 체크섬 (변조 방지)
```

`go.mod` 파일은 다음과 같은 구조입니다:

```
module example.com/hello

go 1.22
```

`go.sum`은 각 의존성 모듈의 특정 버전에 대한 SHA-256 체크섬을 저장하여, 서브버전 공격(subversion attack)이나 변조를 방지합니다. Go는 재현 가능한 빌드(reproducible build)를 보장합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: Go와 C의 주요 차이점은 무엇인가요?</strong></summary>

Go와 C는 모두 정적 컴파일 언어이지만 설계 철학에서 큰 차이가 있습니다: (1) **메모리 안전성**: Go는 가비지 컬렉터(GC)가 내장되어 있어 메모리를 자동 관리합니다. C는 수동 `malloc/free`가 필요합니다. (2) **포인터**: Go는 포인터 연산(pointer arithmetic)을 금지하여 버퍼 오버플로우를 원천 차단합니다. C는 자유로운 포인터 연산이 가능합니다. (3) **동시성**: Go는 고루틴과 채널을 언어 수준에서 내장했습니다. C는 pthreads 같은 외부 라이브러리가 필요합니다. (4) **컴파일 속도**: Go는 단일 패스 컴파일러로 매우 빠릅니다. C는 헤더 파일 처리로 규모가 커질수록 컴파일이 느려집니다. (5) **GC 오버헤드**: Go는 GC로 인한 STW(Stop-The-World) pause가 발생합니다. C는 GC가 없어 예측 가능한 성능을 제공합니다.
</details>

<details>
<summary><strong>Q: Go 컴파일러(gc)와 gccgo의 차이는 무엇인가요?</strong></summary>

`gc`(Go Compiler)는 Go 팀이 만든 공식 컴파일러로, `go build` 명령어가 기본으로 사용합니다. Go 전용으로 설계되어 빠른 컴파일 속도와 우수한 에러 메시지를 제공합니다. `gccgo`는 GCC 프론트엔드로 구현된 Go 컴파일러로, GCC 백엔드의 최적화(특히 -O2, -O3)를 활용할 수 있습니다. `gc`는 SSA 기반의 최적화를 자체 구현했으며, 최신 Go 버전에서 `gccgo`보다 더 나은 성능을 보이는 경우가 많습니다. 대부분의 경우 `gc`를 사용하고, 특정 플랫폼에서 GCC의 최적화가 필요할 때 `gccgo`를 고려합니다.
</details>

<details>
<summary><strong>Q: go mod, GOPATH, vendor의 차이는 무엇인가요?</strong></summary>

**GOPATH 모드**(Go 1.11 이전)는 모든 Go 프로젝트가 `$GOPATH/src` 아래에 있어야 했고, 의존성은 `go get`으로 `$GOPATH/pkg`에 설치되었습니다. **Go Modules**(Go 1.11+, 1.16부터 기본)은 `go.mod` 파일로 프로젝트별 의존성을 관리하며, GOPATH 외부에서도 프로젝트를 생성할 수 있습니다. **vendor 디렉토리**는 `go mod vendor`로 의존성 소스 코드를 프로젝트 내에 복사하여, 인터넷이 없는 환경에서도 빌드할 수 있게 합니다. 현재는 Go Modules이 표준이며, `GO111MODULE=off`로 설정하지 않는 한 Go Modules이 활성화됩니다.
</details>

<details>
<summary><strong>Q: Go의 빌드 결과물이 단일 바이너리인 이유는 무엇인가요?</strong></summary>

Go 컴파일러는 **정적 링크(static linking)**를 기본으로 사용합니다. 즉, Go 런타임과 표준 라이브러리의 모든 코드를 바이너리에 직접 포함시킵니다. 이는 C의 동적 링크(dynamic linking, .so/.dll)와 대조적입니다. 결과로 생성된 바이너리는 외부 의존성 없이 단독으로 실행 가능합니다. `CGO_ENABLED=0` 환경 변수로 CGO를 비활성화하면 완전한 정적 바이너리가 생성됩니다. 단점은 바이너리 크기가 약 5~15MB로 커진다는 점이지만, Docker 이미지(scratch/alpine 기반)로 배포할 때는 단일 바이너리가 큰 장점이 됩니다.
</details>

<details>
<summary><strong>Q: go run과 go build의 내부 차이는 무엇인가요?</strong></summary>

`go run`은 내부적으로 `go build`와 동일한 컴파일 과정을 수행하지만, 결과 바이너리를 임시 디렉토리(예: `$TMPDIR/go-build...`)에 저장하고 실행한 후 삭제합니다. `go build`는 현재 디렉토리의 이름을 딴 바이너리를 같은 디렉토리에 생성합니다. 둘 다 동일한 컴파일러(gc)를 사용하므로 성능 차이는 없습니다. 개발 중에는 `go run`, 배포할 때는 `go build`를 사용합니다. `go install`은 바이너리를 `$GOPATH/bin`에 설치합니다.
</details>


## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **gc 컴파일러** | 공식 Go 컴파일러 | lexing → parsing → AST → SSA → 네이티브 코드 |
| **정적 링크** | 외부 의존성 없는 단일 바이너리 | Go 런타임 + std 라이브러리를 바이너리에 포함 |
| **go mod** | 모듈 시스템 | go.mod로 의존성 버전 관리 |
| **고루틴** | 경량 스레드 | M:N 스케줄링, 스택 크기 2KB부터 시작 |
| **go fmt** | 강제 코드 스타일 | AST 변환 후 재생성 (탭 들여쓰기) |


## 다음 수업

다음 글에서는 Go의 변수 선언과 데이터 타입 — 정적 타이핑과 제로값, 타입 추론을 배웁니다.

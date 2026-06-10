---
layout: post
title: "WebAssembly 중급(12) — WASI: WebAssembly System Interface"
description: "WebAssembly System Interface(WASI) 실무 안내 — 파일 시스템 접근, 표준 입출력, 시계/시간, 난수 생성, 네트워크, 환경 변수, Wasmtime/Wasmer/Node.js 런타임 비교"
date: 2022-02-28 10:00:00 +0900
category: webassembly
tags: [webassembly, wasi, system-interface, wasmtime, wasmer, filesystem, networking, clock, random, cli, server-side-wasm]
level: intermediate
---

> **💡 한 줄 요약:** WASI는 WebAssembly가 브라우저 밖에서 OS 기능(파일 시스템, 네트워크, 시계, 난수 생성 등)에 접근할 수 있게 해주는 표준 시스템 인터페이스로, WASM을 브라우저 독립적인 보안 샌드박스 애플리케이션 플랫폼으로 확장합니다.

## WASI가 필요한 이유

WebAssembly는 원래 브라우저에서 JavaScript를 보완하기 위해 설계되었습니다. 하지만 WASM의 **보안성, 이식성, 성능** 특성은 서버, CLI, 엣지 컴퓨팅, IoT 등 브라우저 밖에서도 매우 유용합니다.

문제는 WASM이 기본적으로 **OS 기능에 접근할 수 없다**는 점입니다:
- ❌ 파일 읽기/쓰기
- ❌ 네트워크 요청
- ❌ 현재 시간 확인
- ❌ 난수 생성
- ❌ 환경 변수 접근

WASI는 이러한 시스템 기능에 **표준화되고 안전한 방식**으로 접근할 수 있는 인터페이스를 정의합니다.

---

## 수업 목표

- WASI의 설계 철학과 Capability-based Security 모델 이해
- 주요 WASI API(파일 시스템, 네트워크, 시계, 난수) 사용법 습득
- Wasmtime, Wasmer, Node.js 등 WASI 런타임 비교
- C/Rust에서 WASI를 활용한 CLI 애플리케이션 개발 방법 이해
- WASI의 한계와 앞으로의 발전 방향 파악

---

## 1. WASI의 설계 철학 — Capability-based Security

WASI의 가장 중요한 설계 원칙은 **Capability-based Security(권한 기반 보안)** 입니다. 전통적인 애플리케이션이 모든 시스템 리소스에 접근할 수 있는 반면, WASI 애플리케이션은 **명시적으로 부여된 권한(capability)** 만 사용할 수 있습니다.

> **🔬 깊이 있는 설명 — Capability 기반 보안의 실제 의미:** 전통적인 보안 모델(예: Linux의 DAC)은 "이 사용자는 이 파일을 읽을 수 있다"는 식으로 사용자/그룹 기준으로 권한을 관리합니다. 반면 Capability 모델은 "이 애플리케이션 인스턴스는 이 특정 파일 디스크립터(3번)만 쓸 수 있다"는 식으로 **개별 리소스에 대한 구체적인 권한**을 부여합니다. WASI에서는 호스트가 WASM 모듈에 특정 파일 핸들, 특정 네트워크 소켓만 전달합니다. 모듈이 그 외의 리소스에 접근하는 것은 **구조적으로 불가능**합니다. 이는 컨테이너의 루트 탈출(root escape) 같은 보안 취약점이 원천적으로 발생할 수 없음을 의미합니다.

```bash
# WASI 런타임(Wasmtime)에서의 권한 부여 예시
# 현재 디렉토리만 읽기 권한 부여
wasmtime run --dir=. myapp.wasm

# 특정 파일만 읽기 권한 부여
wasmtime run --dir=/data/config.toml myapp.wasm

# 네트워크 권한 부여
wasmtime run --tcplisten=0.0.0.0:8080 myapp.wasm

# 모든 권한 부여 (보안 취약 — 테스트용)
wasmtime run --dir=. --tcplisten=0.0.0.0:8080 --env=* myapp.wasm
```

---

### 1.1 WASI API 개요

| WASI 함수 | 설명 | 권한 필요 | 호출 비용 |
|----------|------|----------|---------|
| `wasi_snapshot_preview1.fd_read` | 파일 디스크립터에서 읽기 | 파일/표준 입력 권한 | 1~5μs |
| `wasi_snapshot_preview1.fd_write` | 파일 디스크립터에 쓰기 | 파일/표준 출력 권한 | 1~5μs |
| `wasi_snapshot_preview1.path_open` | 파일 열기 | 디렉토리 권한 | 10~50μs |
| `wasi_snapshot_preview1.clock_time_get` | 현재 시간 가져오기 | 시계 권한 | 0.1~0.5μs |
| `wasi_snapshot_preview1.random_get` | 난수 생성 | 난수 권한 | 0.5~2μs |
| `wasi_snapshot_preview1.environ_get` | 환경 변수 읽기 | 환경 변수 권한 | 1~5μs |
| `wasi_snapshot_preview1.args_get` | 명령줄 인수 읽기 | 인수 권한 | 0.5~1μs |

---

## 2. C 언어로 WASI 애플리케이션 만들기

WASI를 사용하면 C의 표준 라이브러리 함수(`printf`, `fopen`, `time` 등)가 WASI 시스템 콜로 자동 매핑됩니다.

```c
// cli_tool.c — WASI 기반 CLI 도구
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

int main(int argc, char* argv[]) {
    // 표준 출력 (WASI fd_write로 자동 매핑)
    printf("WASI CLI Tool v1.0\n");
    printf("Arguments: %d\n", argc);
    
    for (int i = 0; i < argc; i++) {
        printf("  argv[%d]: %s\n", i, argv[i]);
    }
    
    // 파일 쓰기 (WASI path_open + fd_write로 매핑)
    FILE* fp = fopen("/output.txt", "w");
    if (fp) {
        fprintf(fp, "WASI test at %ld\n", time(NULL));
        fclose(fp);
        printf("File written successfully.\n");
    } else {
        printf("Failed to open file.\n");
    }
    
    // 현재 시간 (WASI clock_time_get으로 매핑)
    time_t now = time(NULL);
    printf("Current time: %s", ctime(&now));
    
    return 0;
}
```

```bash
# WASI 타겟으로 컴파일 (wasi-sdk 필요)
# wasi-sdk 설치: https://github.com/WebAssembly/wasi-sdk
clang --target=wasm32-wasi -O3 cli_tool.c -o cli_tool.wasm

# Wasmtime으로 실행 (현재 디렉토리 권한 필요)
wasmtime run --dir=. cli_tool.wasm -- hello world

# 출력:
# WASI CLI Tool v1.0
# Arguments: 3
#   argv[0]: cli_tool.wasm
#   argv[1]: hello
#   argv[2]: world
# File written successfully.
# Current time: Mon Feb 28 10:00:00 2022
```

#### WASM/WASI와 네이티브 바이너리 비교

| 특성 | WASM + WASI | 네이티브 바이너리 (Linux) |
|------|------------|------------------------|
| **파일 크기** | 15~50KB | 50~500KB |
| **시작 시간** | 1~5ms (컴파일 + 인스턴스화) | 0.1~0.5ms |
| **실행 속도** | 네이티브의 80~95% | 100% (기준) |
| **보안 모델** | Capability 기반 (구조적으로으로 안전) | 사용자/그룹 기반 (루트 탈출 가능) |
| **플랫폼 독립성** | 완전 (한 번 빌드하면 어디서나) | 플랫폼별 재컴파일 필요 |
| **메모리 안전성** | Rust + WASM: 완전 보장 | 안전하지 않은 언어: 취약점 가능 |

---

## 3. Rust로 WASI 애플리케이션 만들기

Rust는 WASI를 가장 잘 지원하는 언어 중 하나입니다. `wasm32-wasi` 타겟으로 컴파일하면 됩니다.

```rust
// src/main.rs — Rust WASI 애플리케이션
use std::fs;
use std::io::{self, BufRead, Write};
use std::time::{SystemTime, UNIX_EPOCH};

fn main() -> io::Result<()> {
    // 표준 입력에서 읽기 (WASI fd_read)
    let stdin = io::stdin();
    print!("Enter your name: ");
    io::stdout().flush()?;
    
    let mut name = String::new();
    stdin.lock().read_line(&mut name)?;
    let name = name.trim();
    
    // 표준 출력에 쓰기 (WASI fd_write)
    println!("Hello, {}!", name);
    
    // 현재 시간 가져오기 (WASI clock_time_get)
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap();
    println!("Current timestamp: {} sec", now.as_secs());
    
    // 파일 쓰기 (WASI path_open + fd_write)
    fs::write(
        "/hello.txt",
        format!("Hello, {}! Written at {}", name, now.as_secs())
    )?;
    println!("File saved!");
    
    // 환경 변수 읽기 (WASI environ_get)
    if let Ok(path) = std::env::var("DATA_PATH") {
        println!("DATA_PATH = {}", path);
    }
    
    Ok(())
}
```

```bash
# Rust WASI 타겟 추가
rustup target add wasm32-wasi

# 빌드
cargo build --target wasm32-wasi --release

# 실행
wasmtime run --dir=. --env=DATA_PATH=/data target/wasm32-wasi/release/myapp.wasm

# Wasmer로 실행 (대체 런타임)
wasmer run --dir=. target/wasm32-wasi/release/myapp.wasm

# Node.js로 실행 (실험적)
node --experimental-wasi-unstable-preview1 ./myapp.wasm
```

> **🔬 깊이 있는 설명 — Rust의 std가 WASI에서 동작하는 방식:** Rust 표준 라이브러리(std)의 `fs::read_to_string`, `std::time::SystemTime`, `io::stdin()` 등의 함수는 내부적으로 OS 시스템 콜을 호출합니다. WASI 타겟(wasm32-wasi)으로 컴파일하면, 이러한 시스템 콜이 자동으로 **WASI 함수 호출**로 변환됩니다. 예를 들어 `fs::write`는 내부적으로 `path_open` → `fd_write` WASI 함수를 호출합니다. Rust 표준 라이브러리가 WASI를 **첫 시민(first-class)**으로 지원하기 때문에, 기존 Rust 코드를 거의 수정 없이 WASI 환경에서 실행할 수 있습니다.

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASI에서 네트워크 소켓을 사용할 수 있나요?</strong></summary>
WASI preview1에서는 네트워크 소켓이 **공식적으로 지원되지 않습니다**. 하지만 Wasmtime, Wasmer 등 대부분의 WASI 런타임은 자체 확장 API로 소켓을 지원합니다. WASI preview2(진행 중)에서는 `wasi-poll`, `wasi-io`, `wasi-tcp`, `wasi-udp` 등 네트워크 API가 표준화될 예정입니다. 지금 당장 소켓이 필요하다면, 런타임별 확장 API를 사용하거나 HTTP 요청을 위해 wasi-outbound-http 같은 실험적 API를 활용할 수 있습니다.
</details>

<details>
<summary><strong>Q: Wasmtime, Wasmer, Node.js 중 어떤 WASI 런타임을 선택해야 하나요?</strong></summary>
**Wasmtime**(Mozilla/Wasmtime 프로젝트)은 가장 성숙하고 표준에 충실한 런타임으로, 프로덕션 환경에 권장합니다. **Wasmer**는 패키지 관리(WAPM)와 다양한 언어 바인딩을 제공하여 개발자 경험이 좋습니다. **Node.js**의 WASI 지원은 실험적이며 제한적입니다. **선택 기준**: 서버/엣지 → Wasmtime, CLI 도구/개발 → Wasmer, Node.js 생태계 통합 → Node.js
</details>

<details>
<summary><strong>Q: WASI가 Docker/컨테이너보다 더 안전한가요?</strong></summary>
네, 보안 측면에서 WASI는 Docker보다 **구조적으로 더 안전합니다**. Docker 컨테이너는 호스트 OS의 커널을 공유하므로, 커널 취약점(CVE)이 발견되면 컨테이너 탈출이 가능합니다(예: CVE-2022-0185). 반면 WASI에서 WASM 모듈은 Capability 기반으로 작동하므로, 부여되지 않은 권한의 리소스에는 **접근 자체가 구조적으로 불가능**합니다. 단, WASM의 실행 속도는 네이티브의 80~95%로 Docker(네이티브의 95~99%)보다 약간 느립니다. **적합한 사용처**: 보안이 중요한 엣지 컴퓨팅(Fastly Compute@Edge, Cloudflare Workers), 플러그인 시스템(Enarx), IoT 디바이스.
</details>

---

## 4. WASI 런타임 비교

```bash
# 주요 WASI 런타임 설치
# Wasmtime
curl https://wasmtime.dev/install.sh -sSf | bash

# Wasmer
curl https://get.wasmer.io -sSfL | sh

# Node.js (v20+ 실험적)
node --experimental-wasi-unstable-preview1 app.wasm
```

| 기능 | Wasmtime | Wasmer | Node.js WASI | WasmEdge |
|------|---------|-------|-------------|---------|
| **WASI preview1** | ✅ 완벽 | ✅ 완벽 | ✅ 기본 | ✅ 완벽 |
| **네트워크 소켓** | ✅ TCP/UDP | ✅ TCP | ❌ | ✅ TCP/UDP |
| **HTTP 클라이언트** | ✅ wasi-outbound-http | ✅ WAPM 패키지 | ✅ 내장 fetch | ✅ wasi-http |
| **멀티스레딩** | ⚠️ 실험적 | ❌ | ❌ | ✅ |
| **성능 (네이티브 대비)** | 85~95% | 80~90% | 70~80% | 90~95% |
| **언어 바인딩** | Rust, C, Python, Go | Rust, C, Python, JS | JavaScript | Rust, C, Go |
| **프로덕션 사용** | Fastly, Shopify | Wasmer Cloud | — | CNCF (sandbox) |
| **시작 시간** | 1~3ms | 2~5ms | 10~50ms | 1~3ms |

---

### 실전 노하우 — WASI 애플리케이션 5계명

1. **권한 최소화**: `wasmtime run --dir=.` 대신 `--dir=/specific/path`로 필요한 디렉토리만 허용
2. **WASI preview2 준비**: preview1은 레거시, preview2(2025년 안정화 예정)의 비동기(async) API에 대비
3. **경량 CLI 도구**: WASI + Rust 조합으로 10~50KB CLI 도구 생성. Go로 작성된 유사 도구의 1/10 크기
4. **엣지에 배포**: Fastly Compute@Edge, Cloudflare Workers, Fermyon Spin에서 WASI 애플리케이션 호스팅
5. **npm 패키지와 통합**: `wasm-pack -t nodejs`로 빌드한 WASM을 npm 패키지로 배포

---

## 요약 — WASI 핵심 포인트

- **WASI 정의**: WebAssembly System Interface — 브라우저 밖에서 OS 기능에 접근하는 표준 인터페이스
- **보안 모델**: Capability-based Security — 명시적으로 부여된 권한만 사용 가능 (구조적 안전)
- **주요 API**: fd_read/fd_write(표준 I/O), path_open(파일 시스템), clock_time_get(시계), random_get(난수)
- **WASI preview1**: 현재 안정 버전 (동기식 API), preview2: 비동기(async) API + 네트워크 표준화
- **런타임 선택**: Wasmtime(프로덕션/성숙), Wasmer(개발/편의), Node.js(실험적)
- **실전 활용**: CLI 도구, 엣지 컴퓨팅, 플러그인 시스템, IoT 디바이스

**다음 강의 예고:** 고급 13강에서는 **성능 최적화 심화(Performance)** — 프로파일링 도구 심화, 메모리 접근 패턴 최적화, 컴파일러 최적화 플래그, WASM 성능 벤치마크 방법론을 다룹니다.

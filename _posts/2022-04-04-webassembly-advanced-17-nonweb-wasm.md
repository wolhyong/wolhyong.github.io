---
layout: post
title: "WebAssembly 고급(17) — 비웹 환경의 WASM: 임베디드, IoT, 플러그인"
description: "WebAssembly의 비웹 환경 활용 — 임베디드 시스템(Wasm Micro Runtime), IoT 디바이스(ESP32, ARM Cortex-M), 플러그인 시스템(Enarx, Extism), 데이터 파이프라인, 블록체인 스마트 컨트랙트, 게임 스크립팅"
date: 2022-04-04 10:00:00 +0900
category: webassembly
tags: [webassembly, embedded, iot, plugin-systems, wasm-micro-runtime, esp32, enarx, extism, blockchain, game-scripting, polyglot]
level: advanced
---

> **💡 한 줄 요약:** WebAssembly의 진정한 잠재력은 브라우저 밖에 있습니다 — 임베디드 시스템(WAMR: 50KB 풋프린트로 ESP32에서 동작), 안전한 플러그인 시스템(Extism, Enarx로 어떤 언어에서든 WASM 플러그인 실행), 블록체인 스마트 컨트랙트(Ethereum 2.0 eWASM), 게임 스크립팅(Minecraft Bedrock) 등에서 WASM은 **범용 샌드박스 실행 환경**으로 자리잡고 있습니다.

## 비웹 환경에서 WASM의 가치

WebAssembly는 브라우저용으로 시작되었지만, 그 핵심 가치인 **보안, 이식성, 성능**은 다양한 비웹 환경에서도 큰 장점을 제공합니다.

| 환경 | WASM의 가치 전달 | 대체 기술 |
|------|----------------|---------|
| **임베디드/IoT** | 50KB 런타임으로 제한된 리소스에서 안전한 코드 실행 | MicroPython, Lua, JerryScript |
| **플러그인 시스템** | 호스트 애플리케이션을 크래시시키지 않는 안전한 확장 | Lua, Python, DLL/SO |
| **블록체인** | 결정적(Deterministic) 실행 + 샌드박스 + 스마트 컨트랙트 | EVM (Ethereum Virtual Machine) |
| **게임 스크립팅** | 고성능 모드/스크립트 실행 환경 | Lua, C# (Mono) |
| **데이터 파이프라인** | 안전한 UDF(User Defined Function) 실행 | Python, Java |

---

## 수업 목표

- 비웹 WASM 런타임(WAMR, Wasmtime, WasmEdge)의 특징과 선택 기준 이해
- 임베디드/IoT 환경에서 WASM의 제약과 최적화 방법 습득
- 플러그인 시스템 아키텍처(호스트 → WASM 격리) 설계 방법 이해
- 블록체인 스마트 컨트랙트에서 WASM(eWASM)의 역할 이해
- 게임 스크립팅과 데이터 파이프라인에서의 WASM 활용 사례 파악

---

## 1. 임베디드/IoT — WAMR(Wasm Micro Runtime)

WAMR은 임베디드 환경을 위해 설계된 초경량 WASM 런타임입니다.

```bash
# WAMR 설치 및 빌드
git clone https://github.com/bytecodealliance/wasm-micro-runtime.git
cd wasm-micro-runtime/product-mini/platforms/linux/
mkdir build && cd build
cmake .. -DWAMR_BUILD_TARGET=THUMB \
         -DWAMR_BUILD_INTERP=1 \
         -DWAMR_BUILD_AOT=1 \
         -DWAMR_BUILD_SIMD=0
make
```

```c
// C — ESP32에서 WASM 함수 호출 (WAMR API)
#include "wasm_export.h"

// ESP32의 GPIO 제어를 WASM에 노출
static int32_t gpio_write(wasm_exec_env_t exec_env, int32_t pin, int32_t value) {
    // 실제 GPIO 핀 제어
    gpio_set_level(pin, value);
    return 0;
}

// WASM 함수 등록 테이블
static NativeSymbol native_symbols[] = {
    { "gpio_write", gpio_write, "(ii)i", NULL }
};

void app_main() {
    // WASM 런타임 초기화 (17KB RAM)
    wasm_runtime_init();
    
    // WASM 모듈 로드 (from flash)
    uint8_t* wasm_file = load_from_spi_flash("/wasm/blink.wasm");
    
    wasm_module_t module = wasm_runtime_load(wasm_file, size, error_buf, error_buf_size);
    wasm_module_inst_t inst = wasm_runtime_instantiate(module, 4096,  // 4KB 스택
                                                       8192,           // 8KB 힙
                                                       error_buf, sizeof(error_buf));
    
    // WASM 함수 호출
    wasm_application_execute_func(inst, "blink_led", 3, 100);  // 100ms 간격
}
```

#### 임베디드 WASM 런타임 비교

| 런타임 | 최소 RAM | 최소 Flash | 인터프리터 | AOT | SIMD | 적합한 MCU |
|-------|---------|----------|-----------|-----|------|----------|
| **WAMR (classic)** | 17KB | 50KB | ✅ | ✅ | ❌ | ESP32, STM32 |
| **WAMR (Xtensa)** | 8KB | 35KB | ✅ | ❌ | ❌ | ESP8266 |
| **Wasm3** | 4KB | 20KB | ✅ | ❌ | ❌ | ARM Cortex-M0 |
| **MicroPython** | 128KB | 256KB | ✅ | ❌ | ❌ | ESP32 (큼) |
| **Lua** | 32KB | 120KB | ✅ | ❌ | ❌ | ESP32 |

> **🔬 깊이 있는 설명 — 임베디드 WASM이 MicroPython보다 적합한 이유:** MicroPython은 인터프리터 자체가 256KB 이상의 Flash를 차지하고, 런타임에 128KB 이상의 RAM이 필요합니다. 반면 WAMR은 인터프리터/AOT 모드에서 17KB RAM + 50KB Flash로 동작합니다. 또한 MicroPython은 동적 타입으로 인해 실행 속도가 C의 1~5% 수준이지만, WASM AOT 모드는 네이티브의 60~80% 성능을 냅니다. 배터리로 동작하는 IoT 디바이스에서는 이 차이가 결정적입니다 — 동일한 작업을 WASM은 10ms에 처리하지만 MicroPython은 200ms가 걸려 배터리 소모가 20배 차이납니다.

---

## 2. 플러그인 시스템 — 안전한 확장

WASM의 가장 실행 가능한 유즈케이스 중 하나는 **애플리케이션 확장을 위한 안전한 플러그인 시스템**입니다.

### 2.1 Extism — 언어 중립적 WASM 플러그인

```rust
{% raw %}
// Rust — Extism WASM 플러그인
use extism_pdk::*;

#[plugin_fn]
pub fn process_text(input: String) -> FnResult<String> {
    // 호스트의 HTTP 요청 함수 호출
    let response = http::request::new("POST", "https://api.example.com/process")
        .with_header("Content-Type", "application/json")
        .with_body(format!(r#"{{"text":"{}"}}"#, input))
        .send()?;
    
    Ok(response.body())
}

#[plugin_fn]
pub fn validate_config(config: Json<Config>) -> FnResult<bool> {
    Ok(config.some_field.is_some())
}
{% endraw %}
```

```javascript
// JavaScript — Extism 호스트에서 WASM 플러그인 로드
import { createPlugin } from 'extism';

// 사용자 정의 플러그인 로드
const plugin = await createPlugin(
    await readFile('user_plugin.wasm'),
    {
        useWasi: true,
        allowedHosts: ['https://api.example.com'],
        allowedPaths: { '/data': './data' }
    }
);

// 플러그인 함수 호출 (샌드박스 내에서 안전하게 실행)
const result = await plugin.call('process_text', 'Hello, WASM!');
console.log(result);

// 다른 플러그인으로 교체
const plugin2 = await createPlugin(
    await readFile('another_plugin.wasm'),
    { useWasi: true }
);
```

#### 플러그인 시스템 비교

| 시스템 | 언어 | 샌드박스 | 성능 | 생태계 |
|-------|------|---------|------|-------|
| **Extism + WASM** | 모든 언어 (PDK 제공) | ✅ Capability 기반 | 네이티브 85~95% | 🌱 성장 중 |
| **Lua** | C 호스트 | ⚠️ 제한적 (debug API) | 네이티브 10~30% | 🌳 성숙 |
| **Python (embed)** | C 호스트 | ❌ 없음 | 네이티브 1~5% | 🌳 성숙 |
| **DLL/SO** | 호스트와 동일 | ❌ 없음 (크래시 가능) | 네이티브 100% | 🌳 성숙 |

> **🔬 깊이 있는 설명 — WASM 플러그인이 DLL보다 안전한 이유:** 전통적인 DLL/SO 기반 플러그인은 호스트 프로세스와 **동일한 메모리 공간과 권한**을 공유합니다. 플러그인의 버그(세그폴트, 무한 루프, 메모리 누수)는 호스트 애플리케이션을 즉시 크래시시킵니다. 반면 WASM 플러그인은 (1) 분리된 선형 메모리 — 호스트 메모리에 접근 불가, (2) 명시적 Capability — 파일/네트워크 접근은 호스트가 부여한 것만 가능, (3) CPU 시간 제한 — 무한 루프 방지, (4) 메모리 한계 — `memory.grow` 최대 크기 제한으로 메모리 고갈 방지 등의 안전 장치가 구조적으로 내장되어 있습니다.

---

### 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: WASM을 블록체인 스마트 컨트랙트에 사용할 수 있나요?</strong></summary>
네, 가능합니다. Ethereum 2.0은 eWASM(Ethereum-flavored WebAssembly)을 채택하여 EVM(Ethereum Virtual Machine)을 대체할 계획입니다. eWASM은 EVM보다 (1) 컴파일이 2배 빠르고, (2) 다양한 언어(Rust, C, C++)로 컨트랙트 작성 가능, (3) 네이티브에 가까운 실행 속도를 제공합니다. Polkadot(Substrate), Cosmos, EOS, NEAR 등 다른 블록체인도 WASM 기반 스마트 컨트랙트를 사용합니다. WASM의 **결정적(Deterministic) 실행** 특성(동일한 입력 → 동일한 출력)이 블록체인 컨센서스에 이상적입니다.
</details>

<details>
<summary><strong>Q: 게임 엔진에서 WASM을 스크립팅 언어로 사용할 수 있나요?</strong></summary>
네, 이미 사용되고 있습니다. Minecraft Bedrock Edition은 Add-on 시스템에서 WASM을 사용합니다. Unity는 WebGL 빌드 타겟에서 WASM을 사용하고, Unreal Engine도 HTML5 타겟에서 WASM을 지원합니다. 게임 스크립팅에서 WASM의 장점: (1) Lua보다 3~10배 빠른 실행 속도, (2) Rust로 작성된 모드는 메모리 안전성 보장, (3) 호스트 게임 엔진과의 격리로 크래시 방지. 단점: (1) Lua/C#보다 빌드 체인이 복잡함, (2) 핫 리로딩 지원이 제한적.
</details>

<details>
<summary><strong>Q: 데이터 파이프라인에서 WASM UDF가 Python UDF보다 나은 점은 무엇인가요?</strong></summary>
WASM UDF(User Defined Function)는 데이터 파이프라인(예: Apache Spark, Flink, Kafka)에서 다음과 같은 이점이 있습니다: (1) **성능**: WASM UDF는 Python UDF보다 10~50배 빠름 (Python GIL 없음, JIT 컴파일), (2) **메모리**: Python UDF는 대량 데이터 처리 시 메모리 사용량이 2~5배 높음 (객체 오버헤드), (3) **의존성**: Python UDF는 모든 노드에 동일한 패키지 설치 필요, WASM UDF는 단일 바이너리만 배포. (4) **버전 관리**: Python UDF는 패키지 버전 충돌이 빈번하지만, WASM UDF는 완전히 격리됨. 단점: 복잡한 비즈니스 로직은 Python이 작성하기 더 쉬움.
</details>

---

## 3. Rust 기반 게임 스크립팅 예제

```rust
// Rust — 게임용 WASM 스크립트 (Minecraft Bedrock Add-on 스타일)
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct GameEntity {
    health: f32,
    position: (f32, f32, f32),
    inventory: Vec<String>,
}

#[wasm_bindgen]
impl GameEntity {
    pub fn new() -> GameEntity {
        GameEntity {
            health: 100.0,
            position: (0.0, 0.0, 0.0),
            inventory: Vec::new(),
        }
    }
    
    pub fn take_damage(&mut self, amount: f32) -> bool {
        self.health -= amount;
        if self.health <= 0.0 {
            self.health = 0.0;
            false  // 사망
        } else {
            true   // 생존
        }
    }
    
    pub fn move_to(&mut self, x: f32, y: f32, z: f32) {
        self.position = (x, y, z);
    }
    
    pub fn add_item(&mut self, item: String) -> bool {
        if self.inventory.len() < 36 {  // 핫바 + 인벤토리
            self.inventory.push(item);
            true
        } else {
            false  // 인벤토리 가득 참
        }
    }
}
```

---

## 실전 노하우 — 비웹 WASM 도입 5계명

1. **임베디드는 WAMR**: 최소 17KB RAM + 50KB Flash. ESP32, STM32, Cortex-M 시리즈에 최적
2. **플러그인은 Extism**: 언어 중립적 PDK(Plugin Development Kit)로 Rust, JS, Python, Go 등에서 플러그인 작성
3. **성능 측정 필수**: WASM 전환 전에 프로파일링으로 계산 집약적인 핫스팟 식별. I/O 바운드 작업은 WASM 이점 없음
4. **바이너리 크기 관리**: `wasm-opt -Oz`로 30~50% 축소. 임베디드 환경에서는 100KB 미만 유지
5. **WASI preview2 준비**: 네트워크, 비동기 API가 필요한 프로젝트는 preview2 (2025 안정화)에 대비한 아키텍처 설계

---

## 요약 — 비웹 WASM 핵심 포인트

- **임베디드/IoT**: WAMR(17KB RAM)로 ESP32/Cortex-M에서 WASM 실행. MicroPython 대비 10~50배 빠름
- **플러그인 시스템**: Extism + WASM = 모든 언어로 작성된 안전한 플러그인. DLL 대비 구조적 보안 우위
- **블록체인**: eWASM(Ethereum 2.0), Polkadot, Cosmos. 결정적 실행 + 샌드박스 + 네이티브 성능
- **게임 스크립팅**: Minecraft Bedrock Add-on. Lua 대비 3~10배 빠름. Rust 메모리 안전성
- **데이터 파이프라인**: WASM UDF는 Python UDF 대비 10~50배 빠름. 단일 바이너리 배포의 편의성
- **도입 원칙**: 플러그인 시스템 > 데이터 파이프라인 > 엣지 컴퓨팅 > 임베디드 순으로 성숙도가 높음

---
layout: post
title: "WebAssembly 제어 흐름 — 블록, 루프, 분기와 함수 호출"
description: "WebAssembly의 제어 흐름 명령어를 심층 학습합니다. block, loop, if-else, br/br_if/br_table, 그리고 함수 호출(call/call_indirect)의 매커니즘을 이해합니다."
date: 2022-01-17 10:00:00 +0900
category: webassembly
tags: [webassembly, wasm, control-flow, branch, function-call, structured-control]
level: beginner
---

> **💡 핵심 정리** ・ WASM의 제어 흐름은 **structured control flow**만 허용합니다. 임의의 goto나 점프가 불가능하고, `block`/`loop`/`if`라는 명시적 구조 내에서만 분기가 가능합니다. `block`의 `br`은 **블록 끝**으로 분기하고, `loop`의 `br`은 **루프 시작**으로 분기합니다. `br_table`로 **O(1)** 다중 분기(switch/case)를 구현할 수 있습니다. 함수 호출은 직접 호출(`call`)과 간접 호출(`call_indirect`)을 지원합니다.

## 학습 목표

- WASM의 블록 구조(block/loop/if)와 분기(br/br_if) 명령어를 이해한다
- 스택 기반 제어 흐름의 동작 방식을 안다
- br_table로 switch/case를 구현하는 방법을 이해한다
- 함수 호출(call, call_indirect)의 매커니즘을 안다

## WASM 제어 흐름의 설계 원칙 — 왜 goto가 없을까?

WASM의 제어 흐름은 **structured control flow**만 허용합니다. 즉, 임의의 goto나 점프가 불가능하고, block/loop/if라는 명시적인 구조 내에서만 분기가 가능합니다.

```
❌ C의 goto:       ✅ WASM의 br:
  goto LABEL;        (block $label
  ...                  br $label    ; block 끝으로만 분기
  LABEL: ...         )
```

**이유:** structured control flow는 검증(validation)이 단순하고, 실행 전에 모든 분기 대상이 유효함을 증명할 수 있습니다. 이는 WASM의 안전성 보장의 핵심입니다.

> **이해를 돕는 비유:** WASM의 제어 흐름은 **지하철 노선도**와 같습니다. C의 goto는 "자동차로 아무 길이나 달리는 것"이라면, WASM의 structured control flow는 "정해진 역(block/loop/if)만 정차하는 지하철"입니다. 지하철은 경로가 예측 가능하므로 안전하고 검증하기 쉽습니다.

---

## block — 순차 실행 블록

```wat
(block $end
  i32.const 1
  i32.const 2
  i32.add            ;; 3
  br $end            ;; 블록 끝으로 분기
  i32.const 99       ;; 실행되지 않음! (br로 건너뜀)
)
```

**스택 상태 추적:**
```
시작:     스택 = []
i32.const 1:  push 1 → 스택 = [1]
i32.const 2:  push 2 → 스택 = [1, 2]
i32.add:      pop 2, pop 1, push 3 → 스택 = [3]
br $end:      블록 종료 → 스택에서 3을 꺼내 반환
i32.const 99: (실행되지 않음)
```

block은 **값을 반환**할 수 있습니다:
```wat
(block $exit (result i32)
  i32.const 10
  i32.const 20
  i32.add           ;; 스택 = [30]
  br $exit          ;; 30을 반환하며 종료
  i32.const 999     ;; 미실행
)
;; 결과: 스택에 30이 남음
```

---

## loop — 반복

```wat
;; 1부터 n까지 합계 계산
(func $sum_to_n (param $n i32) (result i32)
  (local $sum i32)    ;; 합계 저장
  (local $i i32)      ;; 카운터
  
  (loop $continue
    ;; i >= n 이면 종료
    local.get $i
    local.get $n
    i32.ge_s
    br_if $end
    
    ;; sum += i
    local.get $sum
    local.get $i
    i32.add
    local.set $sum
    
    ;; i += 1
    local.get $i
    i32.const 1
    i32.add
    local.set $i
    
    br $continue      ;; 루프 처음으로 (loop 시작점)
  )
  (block $end)        ;; 종료 지점은 loop 밖에 위치
  local.get $sum
)
```

### loop와 block의 핵심 차이

| 구조 | br의 방향 | 용도 | C언어 대응 |
|------|----------|------|-----------|
| **block** | 블록 **끝(END)** 으로 분기 | 조기 종료, 에러 처리 | `break`, `if(...) return` |
| **loop** | 루프 **시작(BLOCK 앞)** 으로 분기 | 반복 실행 | `continue`, `while`의 시작 |

```
block:  br → ────────────→ END (다음으로 진행)
loop:   br → START ←───── (처음으로 돌아감)
```

> **🤖 AI 용어 설명 — Structured Control Flow:** 모든 분기(br, br_if)가 명시적인 구조(block/loop/if) 내에서만 발생하도록 제한하는 설계 원칙입니다. 이는 WASM 바이너리 검증(validation)을 O(n) 시간에 완료할 수 있게 합니다. JVM 바이트코드도 유사한 원칙을 따릅니다. 반면 네이티브 어셈블리는 임의 주소로 점프(jmp)할 수 있어 검증이 어렵습니다.

---

## if-else — 조건부 실행

```wat
;; if-else는 값을 반환할 수 있음 (삼항 연산자처럼)
(if (result i32)
  (i32.eqz (local.get $n))    ;; 조건: n == 0 ?
  (then i32.const 0)          ;; 참이면 0 반환
  (else
    local.get $n
    i32.const 2
    i32.mul                   ;; 거짓이면 n * 2 반환
  )
)
```

**if-else 체인으로 else-if 구현:**
```wat
;; 점수에 따른 학점 반환
(func $grade (param $score i32) (result i32)
  (if (result i32)
    (i32.ge_s (local.get $score) (i32.const 90))
    (then i32.const 0)          ;; 'A' (0)
    (else
      (if (result i32)
        (i32.ge_s (local.get $score) (i32.const 80))
        (then i32.const 1)      ;; 'B' (1)
        (else
          (if (result i32)
            (i32.ge_s (local.get $score) (i32.const 70))
            (then i32.const 2)  ;; 'C' (2)
            (else i32.const 3)  ;; 'F' (3)
          )
        )
      )
    )
  )
)
```

**⚠️ if-else 체인의 문제:** 깊이가 깊어질수록 O(n) 시간이 걸리고, WAT 코드도 복잡해집니다. 3개 이상의 분기에는 br_table이 더 효율적입니다.

---

## br_table — 다중 분기 (O(1) 점프 테이블)

br_table은 **O(1)** 시간에 동작하는 점프 테이블입니다. if-else 체인의 O(n)보다 훨씬 빠릅니다.

```wat
;; 브라우저 DevTools 메뉴 예제
(func $handle_menu (param $choice i32) (result i32)
  (block $default
    (block $save
      (block $load
        (block $exit
          local.get $choice
          br_table $save $load $exit $default  ;; 0→save, 1→load, 2→exit, 그 외→default
        )
      )
    )
  )
)
```

### br_table vs if-else 성능 비교

| 분기 개수 | if-else 체인 (O(n)) | br_table (O(1)) |
|----------|-------------------|-----------------|
| 2개 | ~2 비교 | ~1 점프 |
| 4개 | ~4 비교 | **~1 점프** ✨ |
| 8개 | ~8 비교 | **~1 점프** ✨ |
| 16개 | ~16 비교 | **~1 점프** ✨ |

**br_table 동작 방식:**
```
choice = 0 → br_table → $save 블록 끝으로 점프
choice = 1 → br_table → $load 블록 끝으로 점프
choice = 2 → br_table → $exit 블록 끝으로 점프
choice = 3 → br_table → $default 블록 끝으로 점프 (기본값)
choice = 999 → br_table → $default (인덱스 범위 초과 시 기본값)
```

**실용 예제 — 간단한 계산기:**
```wat
(func $calc (param $a i32) (param $b i32) (param $op i32) (result i32)
  (block $div
    (block $mul
      (block $sub
        (block $add
          local.get $op
          br_table $add $sub $mul $div   ;; op: 0=덧셈, 1=뺄셈, 2=곱셈, 3=나눗셈
        )
      )
    )
  )
  
  ;; $add 처리
  local.get $a local.get $b i32.add
  return
  
  ;; $sub 처리
  local.get $a local.get $b i32.sub
  return
  
  ;; $mul 처리
  local.get $a local.get $b i32.mul
  return
  
  ;; $div 처리
  local.get $a local.get $b i32.div_s
)
```

**성능 비교:**
```
if-else 체인 (O(n)):
  if op == 0: add
  else if op == 1: sub
  else if op == 2: mul    ← 3번째 비교
  else: div
  
br_table (O(1)):
  jump_table[op]로 직접 이동 → 단 1번의 연산
```

---

## unreachable — 도달하면 안 되는 코드

```wat
(func $assert (param $condition i32)
  (if (i32.eqz (local.get $condition))
    (then unreachable)     ;; 조건이 거짓이면 trap!
  )
)
```

`unreachable`은 실행 즉시 trap을 발생시킵니다. **방어적 프로그래밍**에 유용합니다:

```wat
(func $divide (param $a i32) (param $b i32) (result i32)
  (if (i32.eqz (local.get $b))
    (then unreachable)     ;; 0으로 나누기 방지
  )
  local.get $a
  local.get $b
  i32.div_s                ;; 이 시점에 도달한다면 $b ≠ 0이 보장됨
)
```

**컴파일러 최적화에서의 unreachable:** LLVM은 `unreachable` 이후의 코드를 **데드 코드로 간주하고 제거**합니다. 예를 들어 `switch`문의 default 케이스에 unreachable을 넣으면, 컴파일러가 해당 경로를 고려하지 않아 더 작은 바이너리를 생성합니다.

---

## 함수 호출 — 직접 호출과 간접 호출

```wat
;; 직접 호출 — 함수 인덱스로 호출
(type $bin_op (func (param i32 i32) (result i32)))

(func $add (type $bin_op)
  local.get 0
  local.get 1
  i32.add
)

;; 호출 시
i32.const 3
i32.const 4
call $add            ;; 결과: 7

;; 간접 호출 — 함수 포인터 (테이블 기반)
(type $handler (func (param i32) (result i32)))

(table 4 funcref)
(elem (i32.const 0) $handleA $handleB $handleC $handleD)

(func $dispatch (param $idx i32) (param $val i32) (result i32)
  local.get $val
  local.get $idx
  call_indirect (type $handler)  ;; 테이블[idx]의 함수 호출
                                  ;; 타입 불일치시 trap!
)
```

### 함수 호출 오버헤드 비교

| 호출 유형 | 오버헤드 | 설명 |
|----------|---------|------|
| WASM 내부 직접 호출 (`call`) | **~1ns** | 인덱스만 확인 |
| WASM 내부 간접 호출 (`call_indirect`) | **~2-3ns** | 인덱스 + 타입 검증 |
| JS → WASM 호출 | **~5-20ns** | 경계 통과 비용 |
| WASM → JS 호출 | **~10-50ns** | 경계 통과 + 인자 변환 |

> **AI가 자주 질문하는 패턴:**
> - "WASM에서 goto가 없는 이유는?" → 검증(validation) 단순화와 보안 강화를 위해
> - "br_table과 if-else 중 어떤 것이 더 빠른가?" → br_table이 O(1)로 더 빠름 (3개 이상 분기)
> - "call_indirect가 직접 호출보다 느린 이유는?" → 타입 검증(인덱스 + 타입 일치 확인)이 추가되기 때문

---

## 자주 묻는 질문 — AI 검색 엔진이 자주 노출하는 질문들

**WASM에 goto가 없는 이유는?**
모든 분기 대상을 명확히 하여 검증(validation)을 단순화하고 보안을 강화합니다. structured control flow는 실행 전에 모든 분기가 유효함을 증명 가능하게 합니다.

**함수 호출 오버헤드는?**
WASM 내부 호출은 가볍지만(~1ns), JS 경계를 넘는 호출은 10-50ns 오버헤드가 있습니다. 성능이 중요한 루프 내에서는 호출을 인라인화하는 것이 좋습니다.

**if와 if-else의 차이는?**
`if` 단독은 값을 반환하지 않지만, `if-else`는 `(result type)`으로 값을 반환할 수 있습니다. `if`만 쓰면 else 없이 조건이 거짓일 때 아무 일도 일어나지 않습니다.

---

## 요약 — 제어 흐름 핵심

- **structured control flow**만 허용하며, 임의 분기(goto)는 없습니다 (보안 + 검증 단순화)
- **block**은 순차 실행 + 탈출(→END), **loop**는 반복 + 재시작(→START)
- **if-else**는 조건부 실행, 값을 반환할 수 있음 (삼항 연산자와 유사)
- **br_table**은 O(1) 다중 분기로 if-else 체인보다 효율적 (3개 이상 분기 시)
- **unreachable**로 방어적 코딩과 컴파일러 최적화 가능 (데드 코드 제거)
- 함수 호출: 직접 호출 **~1ns** / 간접 호출 **~2-3ns** / JS 경계 호출 **~10-50ns**

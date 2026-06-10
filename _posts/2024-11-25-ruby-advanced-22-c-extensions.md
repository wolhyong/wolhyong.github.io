---
layout: post
title: "Ruby C 확장 — Ruby C API로 네이티브 확장 개발, MRI 내부 구조, GVL 제어"
description: "Ruby의 C 확장(C extension) 개발을 시스템 레벨에서 심층 학습합니다. extconf.rb가 mkmf 라이브러리를 통해 Makefile을 생성하고 컴파일러 플래그와 라이브러리 의존성을 설정하는 과정, C 코드에서 VALUE 타입과 Ruby 객체를 다루는 Ruby C API(rb_define_class/rb_define_method/rb_iv_get/rb_yield)를 사용하여 Ruby 클래스와 메서드를 정의하는 방식, rb_scan_args로 Ruby 인자를 C 변수로 변환하는 과정, GVL(Global VM Lock)을 제어하는 rb_thread_call_without_gvl과 rb_thread_call_with_gvl로 블로킹 C 코드에서 GVL을 해제하여 Ruby 스레드가 계속 실행될 수 있게 하는 방식, Ruby 객체 참조를 보호하는 rb_gc_mark/rb_gc_register_address와 GC-safe한 C 코드 작성 방법을 다룹니다."
date: 2024-11-25 10:00:00 +0900
category: ruby
tags: [ruby, c-extension, ruby-c-api, native-extension, ffi, gvl, mkmf]
level: advanced
---

Ruby의 C 확장은 MRI의 C API를 직접 사용하여 고성능 네이티브 코드를 Ruby에서 사용할 수 있게 합니다.

> **핵심 정리** · `extconf.rb`가 `mkmf` 라이브러리로 Makefile을 생성합니다. Ruby C API(`rb_define_class`, `rb_define_method`, `rb_yield`)로 Ruby 객체와 상호작용합니다. `rb_thread_call_without_gvl`로 C 코드에서 GVL을 해제하여 다른 Ruby 스레드의 실행을 허용합니다. `rb_gc_register_address`로 GC로부터 C 변수를 보호합니다.

---

## 수업 목표

- extconf.rb의 Makefile 생성 과정을 이해합니다.
- Ruby C API의 VALUE 타입을 이해합니다.
- rb_scan_args의 인자 변환을 이해합니다.
- GVL 해제를 통한 블로킹 C 코드 처리를 이해합니다.
- GC-safe한 C 코드 작성을 이해합니다.

## 기본 C 확장

```c
/* ext/my_extension/my_extension.c */
#include "ruby.h"

/* Ruby 메서드: MyExtension.reverse_string(str) */
static VALUE rb_reverse_string(VALUE self, VALUE str) {
  Check_Type(str, T_STRING);  // String 타입 검증

  const char *cstr = StringValueCStr(str);
  long len = RSTRING_LEN(str);
  char *result = ALLOC_N(char, len + 1);

  for (long i = 0; i < len; i++) {
    result[i] = cstr[len - 1 - i];
  }
  result[len] = '\0';

  VALUE ruby_result = rb_str_new_cstr(result);
  xfree(result);
  return ruby_result;
}

/* Ruby 메서드: MyExtension.compute(n) — GVL 해제 예 */
static VALUE rb_compute_without_gvl(VALUE self, VALUE n) {
  return rb_ulong2inum((unsigned long)rb_num2long(n) * 2);
}

/* Ruby 클래스 초기화 */
void Init_my_extension(void) {
  VALUE mMyExt = rb_define_module("MyExtension");
  rb_define_module_function(mMyExt, "reverse_string", rb_reverse_string, 1);
  rb_define_module_function(mMyExt, "compute", rb_compute_without_gvl, 1);
}
```

```ruby
# ext/my_extension/extconf.rb
require 'mkmf'
create_makefile('my_extension/my_extension')
```

`VALUE`는 Ruby 객체를 나타내는 C 타입(32비트 또는 64비트 부호 없는 정수)입니다. `Check_Type(obj, T_STRING)`은 객체가 String 타입인지 검증합니다. `StringValueCStr(str)`은 Ruby String을 C 문자열(`const char*`)로 변환합니다. `RSTRING_LEN(str)`은 Ruby String의 길이를 반환합니다. `rb_str_new_cstr(str)`은 C 문자열로 Ruby String을 생성합니다. `ALLOC_N(type, n)`은 타입-안전 메모리 할당 매크로입니다.

---

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: C 확장과 FFI의 차이는 무엇인가요?</strong></summary>

C 확장(C extension)은 `ruby.h` 헤더를 직접 사용하므로, MRI의 내부 C API에 접근할 수 있습니다(Ruby 객체 생성, 메서드 호출, GC 제어). Ruby 버전에 따라 API가 변경될 수 있어 유지보수가 필요합니다. FFI(Foreign Function Interface)는 `ffi` Gem을 사용하여 공유 라이브러리(.so/.dll)의 함수를 동적으로 호출합니다. Ruby 버전에 독립적이지만, Ruby 객체를 직접 생성할 수 없고 GVL 제어가 어렵습니다. 간단한 라이브러리 바인딩은 FFI로, 복잡한 Ruby 통합은 C 확장으로 개발합니다.
</details>

<details>
<summary><strong>Q: rb_thread_call_without_gvl은 어떻게 동작하나요?</strong></summary>

`rb_thread_call_without_gvl(func, data, ubf, ubf_data)`는 C 함수 `func`가 실행되는 동안 GVL(Global VM Lock)을 해제합니다. 이 기간 동안 다른 Ruby 스레드가 실행될 수 있습니다. `ubf`(unblock function)는 중단 함수로, 메인 스레드에서 이 함수를 중단해야 할 때 호출됩니다. `func`가 종료되면 GVL을 다시 획득하고 결과를 반환합니다. 이미지 처리, 암호화, 파일 I/O 등 CPU/블로킹 작업이 길어질 때 사용합니다. `rb_thread_call_with_gvl`은 GVL을 다시 획득합니다.
</details>

<details>
<summary><strong>Q: C 확장에서 Ruby 객체의 참조를 보호하는 방법은 무엇인가요?</strong></summary>

C 변수에 저장된 Ruby 객체 참조는 GC가 추적하지 않으므로, GC가 발생하면 객체가 해제될 수 있습니다. `rb_gc_register_address(&value)`로 C 변수를 GC 루트로 등록합니다. 등록된 주소는 GC가 객체를 해제하지 못하게 보호합니다. 더 이상 필요 없으면 `rb_gc_unregister_address(&value)`로 등록을 해제합니다. 또는 `DATA_WRAP_STRUCT`와 `rb_data_object_alloc`을 사용하여 C 구조체를 Ruby 객체와 연결하고, 마크 함수에서 `rb_gc_mark`으로 참조되는 Ruby 객체를 표시할 수 있습니다.
</details>

<details>
<summary><strong>Q: rb_scan_args는 어떻게 사용하나요?</strong></summary>

`rb_scan_args(argc, argv, format, ...)`는 Ruby 메서드 인자를 C 변수로 변환합니다. 형식 문자열: `"3"` — 3개의 필수 인자. `"11"` — 1개의 필수 + 1개의 선택 인자(선택 인자는 `Qnil`일 수 있음). `"1*"` — 1개의 필수 + 나머지 배열. `"1:"` — 1개의 필수 + 키워드 해시. `"01"` — 0개 또는 1개의 선택 인자. 예: `rb_scan_args(argc, argv, "12", &a, &b, &c)`는 1개의 필수 + 2개의 선택 인자를 처리합니다.
</details>

<details>
<summary><strong>Q: C 확장에서 Ruby 블록을 yield하려면 어떻게 하나요?</strong></summary>

`rb_yield(value)`로 C 코드에서 Ruby 블록을 호출할 수 있습니다. `rb_block_given_p()`로 블록이 전달되었는지 확인합니다. `rb_yield_values(n, v1, v2, ...)`로 여러 인자를 블록에 전달합니다. `rb_iterate`로 이터레이터를 등록할 수 있습니다. `rb_protect(func, data, &error)`로 예외를 보호하고, `rb_errinfo()`로 예외 정보를 확인합니다. C 확장에서 발생한 Ruby 예외는 자동으로 Ruby 스택으로 전파됩니다.
</details>

---

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **extconf.rb** | 확장 빌드 설정 | mkmf → Makefile → 컴파일 |
| **VALUE** | Ruby 객체 표현 | C 부호 없는 정수 → 타입 플래그 + 포인터 |
| **Ruby C API** | Ruby-C 상호작용 | rb_define_class/rb_define_method/rb_yield |
| **GVL 제어** | 스레드 동기화 | rb_thread_call_without_gvl/with_gvl |
| **GC 보호** | 객체 참조 관리 | rb_gc_register_address/rb_gc_mark |

## 다음 수업

다음 글에서는 Ruby 3 심층 분석 — Ractor, YJIT, Fiber Scheduler, RBS 타입 시스템을 배웁니다.

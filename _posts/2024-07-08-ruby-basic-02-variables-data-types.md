---


layout: post


title: "Ruby 변수와 데이터 타입 — 동적 타이핑, 변수 종류, 숫자/문자열/심볼의 내부 구조"


description: "Ruby의 변수 시스템과 데이터 타입을 시스템 레벨에서 심층 학습합니다. 지역/전역/인스턴스/클래스 변수의 네 가지 종류와 $/@/@@ 접두사가 스코프를 결정하는 방식, Ruby의 동적 타이핑이 변수 선언 없이 값 할당으로 타입이 결정되고 실행 중에 타입이 변경될 수 있는 원리, Integer/Float/String/Symbol/Nil/Boolean의 내부 C 구조체(RBasic, RString, RArray)와 메모리 할당 방식, 문자열의 UTF-8 인코딩과 frozen string literal 최적화, Symbol이 Integer 기반 ID로 메모리에 단일 저장되어 문자열보다 빠른 비교가 가능한 원리, 형 변환(to_s/to_i/to_f) 메서드가 각 클래스의 변환 로직을 구현하는 방식을 다룹니다."


date: 2024-07-08 10:00:00 +0900


category: ruby


tags: [ruby, variables, data-types, dynamic-typing, string, symbol, integer, encoding]


level: basic


---





Ruby는 동적 타입 언어로, 변수 선언 없이 값 할당만으로 타입이 결정됩니다.





> **핵심 정리** · Ruby의 네 가지 변수 종류(지역 `name`, 전역 `$name`, 인스턴스 `@name`, 클래스 `@@name`)는 접두사로 스코프가 결정됩니다. 동적 타이핑은 변수에 값이 할당될 때 RValue의 VALUE 타입 플래그로 결정됩니다. Integer는 고정 숫자(Fixnum) 또는 Bignum으로 `VALUE`에 직접 저장되거나 힙에 할당됩니다. String은 `RString` 구조체로 ascii_only/encoding/frozen 플래그를 관리합니다. Symbol은 `ID` 타입으로 고유 Integer에 매핑되어 메모리에 단일 저장됩니다.





---





## 수업 목표





- 네 가지 변수 종류와 스코프 규칙을 이해합니다.


- 동적 타이핑의 내부 동작을 이해합니다.


- Integer/Float의 메모리 표현을 이해합니다.


- String의 인코딩과 frozen 최적화를 이해합니다.


- Symbol의 ID 기반 단일 저장 방식을 이해합니다.





## 변수 종류와 스코프





```ruby


# 변수의 네 가지 종류


name = "Ruby"           # 지역 변수 (local)


$global_count = 0       # 전역 변수 (global) — 사용 자제


@user_name = "Matz"     # 인스턴스 변수 (instance)


@@class_counter = 0     # 클래스 변수 (class)





# 상수 (대문자로 시작)


PI = 3.14159


LANGUAGE = "Ruby"





puts name               # "Ruby"


puts $global_count      # 0


puts @user_name         # "Matz"


puts @@class_counter    # 0


puts PI                 # 3.14159


```





지역 변수는 소문자 또는 `_`로 시작하며, 현재 스코프(메서드/블록/클래스/모듈) 내에서만 접근 가능합니다. 전역 변수는 `$` 접두사로 어디서든 접근 가능하지만, 의존성을 높이고 디버깅을 어렵게 만드므로 사용을 자제해야 합니다. 인스턴스 변수는 `@` 접두사로 객체의 상태를 저장하며, `nil`을 기본값으로 가집니다(초기화하지 않아도 에러가 발생하지 않음). 클래스 변수는 `@@` 접두사로 클래스와 그 인스턴스 및 서브클래스 간에 공유됩니다. 상수는 대문자로 시작하며, 값을 변경하면 경고(warning)가 발생합니다.





### 동적 타이핑





```ruby


value = 42


puts value.class       # Integer


puts value             # 42





value = "Ruby"


puts value.class       # String


puts value.upcase      # "RUBY"





value = [1, 2, 3]


puts value.class       # Array


puts value.length      # 3





# 타입 변환


puts "42".to_i          # 42 — 문자열을 정수로


puts 42.to_s            # "42" — 정수를 문자열로


puts 3.14.to_i          # 3 — 실수를 정수로 (버림)


puts 42.to_f            # 42.0 — 정수를 실수로


puts "hello".to_sym     # :hello — 문자열을 심볼로


```





Ruby에서 변수는 값의 참조(reference)입니다. `value = 42`에서 `value`는 `Integer` 객체 `42`의 참조를 저장합니다. `value = "Ruby"`에서 `value`는 새로운 `String` 객체 `"Ruby"`의 참조로 변경됩니다. 이는 C 포인터의 재할당과 유사합니다. `to_i`, `to_s`, `to_f` 등 변환 메서드는 각 클래스에 정의된 명시적 변환 메서드입니다.





### 데이터 타입과 메서드





```ruby


# nil 체크


puts nil.nil?           # true


puts "".nil?            # false


puts false.nil?         # false





# truthy / falsy


if 0


  puts "0은 truthy"     # 실행됨 (0도 truthy)


end





if ""


  puts "빈 문자열도 truthy"  # 실행됨


end





if nil


  puts "실행되지 않음"


end





if false


  puts "실행되지 않음"


end


```





Ruby에서 `false`와 `nil`만 **falsy**이고, 그 외의 모든 값(`0`, `""`, `[]`, `{}` 등)은 **truthy**입니다. 이는 JavaScript(`0`과 `""`가 falsy)나 Python(`0`과 `[]`가 falsy)과 다른 중요한 차이점입니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Ruby에서 변수명이 소문자로 시작해야 하는 이유는 무엇인가요?</strong></summary>





Ruby 파서가 변수와 상수/메서드 호출을 구분하는 규칙입니다. 소문자 또는 `_`로 시작하면 지역 변수 또는 메서드 호출, 대문자로 시작하면 상수입니다. 클래스명도 대문자로 시작하므로 상수로 취급됩니다(실제로 클래스명은 상수입니다). `@`로 시작하면 인스턴스 변수, `@@`로 시작하면 클래스 변수, `$`로 시작하면 전역 변수입니다. 이러한 접두사 규칙 덕분에 Ruby 파서는 변수의 종류를 명확히 구분할 수 있습니다.


</details>





<details>


<summary><strong>Q: Integer와 Float의 내부 메모리 표현은 어떻게 되나요?</strong></summary>





MRI에서 `Integer`는 VALUE 타입(64비트 시스템에서 64비트 부호 없는 정수)의 하위 3비트 플래그로 표현됩니다. 하위 비트가 `001`이면 Fixnum(직접 값), `011`/`101`이면 Bignum(힙 할당)입니다. Fixnum은 64비트 시스템에서 61비트 정수(-2^61 ~ 2^61-1)를 VALUE 자체에 직접 저장하므로, Integer 객체를 위한 힙 할당이 필요 없습니다. 이 범위를 넘으면 Bignum이 되어 `RBigNum` C 구조체로 힙에 할당됩니다. `Float`은 항상 `RFloat` 구조체로 힙에 할당되며, C의 `double` 타입(64비트 IEEE 754)을 래핑합니다.


</details>





<details>


<summary><strong>Q: String의 frozen 최적화는 어떻게 동작하나요?</strong></summary>





`frozen_string_literal: true` 매직 코멘트를 파일 상단에 추가하면 동일한 내용의 문자열 리터럴이 매번 새로운 객체를 생성하는 대신, `fstring_table`(frozen string 테이블)에서 동일한 문자열을 찾아 재사용합니다. 예를 들어 루프 안에서 `"hello"`가 1000번 사용되면, frozen 모드에서는 단 하나의 `String` 객체만 생성됩니다. `freeze` 메서드를 호출하면 `FL_FREEZE` 플래그가 설정되어 해당 문자열의 변경을 방지합니다. Frozen string은 Hash의 키, Symbol 등의 내부 구현에서도 사용됩니다.


</details>





<details>


<summary><strong>Q: Symbol과 String의 차이는 무엇인가요?</strong></summary>





Symbol은 `:name` 형태로, 내부적으로 `ID` 타입(정수)에 매핑되어 메모리에 단일 인스턴스만 존재합니다. 동일한 심볼은 항상 같은 객체 ID를 가집니다(`:name.object_id` == `:name.object_id`). String은 매번 새로운 객체를 생성합니다(`"name".object_id` != `"name".object_id`). Symbol은 Hash의 키로 사용될 때 문자열보다 빠르고 메모리 효율적입니다. 단점은 GC(Garbage Collection)의 대상이 아니므로(동적으로 생성된 심볼 제외) 메모리에서 해제되지 않습니다. 사용자 입력을 Symbol로 변환하는 것은 Symbol DoS 공격 위험이 있으므로 주의해야 합니다.


</details>





<details>


<summary><strong>Q: Parallel Assignment(병렬 할당)은 어떻게 동작하나요?</strong></summary>





Ruby는 병렬 할당을 지원합니다: `a, b, c = 1, 2, 3`은 각 변수에 순서대로 할당됩니다. `a, b = b, a`는 두 값을 교환(swap)합니다. `a, *rest = 1, 2, 3, 4`에서 `a`는 `1`, `rest`는 `[2, 3, 4]`가 됩니다(splat 연산자). `a, b = [1, 2]`는 배열이 자동으로 풀립니다(Array decomposition). 내부적으로는 `rb_ary_store()`로 배열을 생성하고 각 변수에 `rb_ary_entry()`로 값을 할당합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **지역 변수** | 현재 스코프 내 접근 | 소문자/`_` 시작, 스택 프레임에 저장 |


| **인스턴스 변수** | 객체 상태 저장 | `@` 접두사, `iv_tbl`(인스턴스 변수 테이블) |


| **동적 타이핑** | 실행 중 타입 결정 | VALUE 타입 플래그로 RValue 구분 |


| **Integer** | Fixnum/Bignum | VALUE 하위 3비트 → 직접 저장 또는 힙 할당 |


| **String** | UTF-8 인코딩 문자열 | RString 구조체 + frozen 최적화 |


| **Symbol** | 단일 저장 ID | ID 타입(Integer) → `sym_tbl`에 단일 저장 |





## 다음 수업





다음 글에서는 Ruby의 제어문 — if/unless/case/when과 조건부 수식어를 배웁니다.



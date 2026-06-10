---


layout: post


title: "Ruby 소개 — Matz가 설계한 순수 객체지향 스크립트 언어의 철학과 실행 원리"


description: "Ruby 언어의 탄생 배경과 설계 철학, 실행 원리를 시스템 레벨에서 심층 학습합니다. Yukihiro Matsumoto(Matz)가 Perl의 실용성과 Smalltalk의 순수 객체지향을 결합하여 Ruby를 설계한 과정, Ruby의 MRI(YARV) 인터프리터가 소스 코드를 파싱하여 AST(Abstract Syntax Tree)를 생성하고 YARV(Yet Another Ruby VM) 명령어로 컴파일한 후 스택 기반 VM에서 실행하는 과정, IRB(Pry)가 Readline 라이브러리로 사용자 입력을 읽고 eval() 루프로 Ruby 코드를 즉시 실행하는 REPL(Read-Eval-Print Loop) 구조, 모든 값이 객체(Object)이며 메서드 호출(message passing)이 기본 실행 단위인 Ruby의 순수 객체지향 철학을 다룹니다."


date: 2024-07-01 10:00:00 +0900


category: ruby


tags: [ruby, matz, yarv, mri, irb, oop, interpreted, repl]


level: basic


---





Ruby는 Yukihiro Matsumoto(Matz)가 1995년에 발표한 순수 객체지향 스크립트 언어입니다. "프로그래머의 행복"을 최우선 설계 목표로 합니다.





> **핵심 정리** · Ruby의 MRI 인터프리터는 소스 코드를 Ripper로 파싱하여 AST를 생성하고, YARV(Yet Another Ruby VM) 명령어(iseq)로 컴파일한 후 스택 기반 VM에서 실행합니다. 모든 값은 Object 클래스의 인스턴스이며, 메서드 호출은 객체에 메시지를 전송(message passing)하는 방식으로 동작합니다. IRB는 Readline + eval() 루프로 REPL을 구현합니다.





---





## 수업 목표





- Ruby의 설계 철학과 탄생 배경을 이해합니다.


- MRI/YARV의 코드 실행 과정을 이해합니다.


- IRB/Pry REPL의 내부 동작을 이해합니다.


- Ruby의 순수 객체지향 개념을 이해합니다.


- 기본적인 Ruby 코드를 작성하고 실행할 수 있습니다.





## Ruby의 설계 철학





| 철학 | 의미 | 코드 예 |


|------|------|--------|


| **Programmer Happiness** | 개발자의 행복이 최우선 | 여러 가지 방법으로 같은 일을 할 수 있음 |


| **Natural Language** | 자연어처럼 읽히는 문법 | `3.times { puts "Hi" }` — "3번 'Hi'를 출력해" |


| **Convention over Configuration** | 관행을 따르면 설정이 적음 | 파일명/디렉토리 구조가 곧 규칙 |


| **MINASWAN** | Matz is Nice And So We Are Nice | 커뮤니티의 친근함과 포용성 |





## Hello World





```ruby


# hello.rb


puts "Hello, Ruby!"


puts "안녕, 루비!"





# 모든 것이 객체


puts 1.class           # Integer


puts "text".class      # String


puts true.class        # TrueClass


puts nil.class         # NilClass


puts [1, 2, 3].class  # Array


puts /regex/.class     # Regexp





# 객체에 메시지 보내기


puts "Hello".length        # 5 — 문자열에 length 메시지 전송


puts "Hello".upcase        # "HELLO"


puts 3.times { print "Ho " }  # "Ho Ho Ho " — 정수에 times 메시지


```





`puts`는 Kernel 모듈의 메서드로, 인자로 전달된 객체에 `to_s` 메시지를 보내 문자열로 변환한 후 표준 출력에 씁니다. Ruby에서는 모든 것이 `Object` 클래스의 인스턴스입니다. `1.class`는 `Integer`를 반환하는데, 이는 `1`이 `Integer` 클래스의 인스턴스이기 때문입니다. `3.times { print "Ho " }`는 정수 `3`에 `times` 메시지를 보내 블록(`{ }`)을 3회 실행합니다. 이는 Smalltalk의 정수에 반복 메시지를 보내는 방식을 계승한 것입니다.





### Ruby 코드 실행 과정





```bash


# 실행


ruby hello.rb





# 내부 과정 추적


ruby --dump=insns -e 'puts 1 + 2'


ruby --dump=parsetree -e 'puts 1 + 2'


```





`ruby hello.rb` 명령어는 MRI 인터프리터가 다음 단계로 실행합니다: (1) **토크나이징**: Ripper 라이브러리가 소스 코드를 문자 단위로 읽어 토큰(`tSTRING`, `tINTEGER`, `kPUTS` 등)으로 분할합니다. (2) **파싱**: LALR(1) 파서가 토큰 스트림을 AST(Abstract Syntax Tree, `NODE` 구조체 트리)로 변환합니다. (3) **컴파일**: `iseq.c`의 `compile.c`가 AST를 YARV 명령어 시퀀스(iseq, Instruction Sequence)로 변환합니다. `--dump=insns` 옵션으로 이 iseq를 확인할 수 있습니다. (4) **실행**: YARV VM이 iseq를 스택 기반으로 실행합니다. `1 + 2`는 `putobject 1`, `putobject 2`, `opt_plus` 명령어로 컴파일되어 VM 스택에서 연산됩니다.





### REPL 사용





```bash


irb


# 또는


pry


```





```ruby


# IRB 세션 예


irb(main):001:0> puts "Hello, Ruby!"


Hello, Ruby!


=> nil


irb(main):002:0> 3.times { |i| puts "#{i}: Hi" }


0: Hi


1: Hi


2: Hi


=> 3


irb(main):003:0> "Ruby".reverse


=> "ybuR"


```





IRB(Interactive Ruby)는 `readline` 라이브러리로 사용자 입력을 읽고, `RubyVM::InstructionSequence.compile()`으로 입력된 코드를 컴파일한 후 `Kernel#eval()`로 실행합니다. `=> nil`은 `puts`의 반환값이 `nil`임을 의미합니다. `=> 3`은 `times` 메서드가 자기 자신(3)을 반환하기 때문입니다. Pry는 IRB의 대체제로, 소스 코드 브라우징, `cd`/`ls` 명령어, `show-source` 등 고급 기능을 제공합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Ruby와 Python의 주요 차이점은 무엇인가요?</strong></summary>





Ruby와 Python은 모두 고수준 스크립트 언어이지만 설계 철학에서 차이가 있습니다: (1) **객체지향**: Ruby는 모든 것이 객체(심지어 정수도)이고, Python은 일부 타입(int, str)이 객체이지만 연산자는 특별 메서드(`__add__`)로 처리됩니다. (2) **블록**: Ruby는 블록(`do...end`, `{ }`)이 언어의 핵심 문법으로, iterator 패턴이 자연스럽습니다. Python은 lambda가 단일 표현식으로 제한됩니다. (3) **철학**: Ruby는 "다양한 방법"(TIMTOWTDI), Python은 "하나의 명확한 방법"을 추구합니다. (4) **타입 시스템**: Python 3.5+는 타입 힌트를 공식 지원하고, Ruby 3.0+는 Sorbet/RBS로 타입을 선택적으로 추가할 수 있습니다.


</details>





<details>


<summary><strong>Q: MRI, YARV, JRuby, Rubinius의 차이는 무엇인가요?</strong></summary>





MRI(Matz's Ruby Interpreter)는 C로 작성된 공식 Ruby 구현체입니다. YARV(Yet Another Ruby VM)는 Ruby 1.9부터 MRI에 통합된 스택 기반 VM으로, 기존 MRI의 AST 워커(트리 순회) 방식보다 10배 이상 빠릅니다. JRuby는 JVM에서 동작하는 Ruby 구현체로, Java 라이브러리와의 통합이 쉽고 진정한 멀티스레딩을 지원합니다. TruffleRuby는 GraalVM 위에서 동작하는 고성능 구현체로, JIT 컴파일로 MRI보다 10~50배 빠를 수 있습니다. 대부분의 경우 MRI(YARV)를 사용하고, Java 통합이 필요하면 JRuby를 선택합니다.


</details>





<details>


<summary><strong>Q: require와 load의 차이는 무엇인가요?</strong></summary>





`require`는 한 번만 로드하고, 이미 로드된 파일은 `$LOADED_FEATURES`(`$"`) 배열에서 확인하여 중복 로드를 방지합니다. `load`는 매번 파일을 다시 로드하므로, 개발 중에 변경 사항을 즉시 반영할 때 사용합니다. `require './hello'`는 `.rb` 확장자를 자동으로 추가합니다. `require_relative`는 현재 파일의 위치를 기준으로 상대 경로로 로드합니다. `autoload`는 상수가 처음 참조될 때 지연 로딩합니다.


</details>





<details>


<summary><strong>Q: puts, p, print, pp의 차이는 무엇인가요?</strong></summary>





`puts`는 인자에 `to_s`를 호출하고 개행 문자(`


`)를 추가합니다. `print`는 개행 문자를 추가하지 않습니다. `p`는 인자에 `inspect`를 호출하고 개행을 추가합니다. 배열/객체의 내부 구조를 디버깅할 때 유용합니다. `pp`(pretty_print)는 복잡한 중첩 객체를 들여쓰기하여 가독성 좋게 출력합니다. `puts [1, 2, 3]`는 각 요소를 줄바꿈하여 출력하고, `p [1, 2, 3]`는 `[1, 2, 3]`을 한 줄로 출력합니다.


</details>





<details>


<summary><strong>Q: Ruby 3.x의 주요 새 기능은 무엇인가요?</strong></summary>





Ruby 3.0에서 도입된 주요 기능: (1) **Ractor**: Actor 모델 기반 병렬 실행으로 GVL(Global VM Lock) 없이 진정한 병렬 처리가 가능. (2) **Fiber Scheduler**: 경량 동시성을 위한 Fiber 스케줄러로, async/await 패턴을 구현. (3) **Type System**: RBS(타입 정의 파일)와 TypeProf(타입 추론 도구)로 선택적 타입 검사. (4) **YJIT**: Ruby 3.1+에서 기본 활성화된 JIT 컴파일러로, 실제 애플리케이션 성능을 30~60% 향상. (5) **Hash#except**, **Numbered Parameters**, **Endless Method** 등 문법 개선.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **MRI/YARV** | 공식 Ruby 구현체 | Ripper 파싱 → AST → YARV iseq → VM 실행 |


| **IRB/Pry** | REPL 환경 | Readline 입력 → eval() 루프 |


| **순수 객체지향** | 모든 것이 객체 | Object 클래스, 메시지 패싱 |


| **puts/p/print** | 출력 메서드 | to_s/inspect 호출 → 표준 출력 |





## 다음 수업





다음 글에서는 Ruby의 변수와 데이터 타입 — 동적 타이핑과 타입 변환을 배웁니다.



---


layout: post


title: "Ruby 예외 처리 — begin/rescue/ensure/raise, 예외 클래스 계층, 커스텀 예외"


description: "Ruby의 예외 처리 시스템을 시스템 레벨에서 심층 학습합니다. begin/rescue/ensure 블록이 YARV 스택에서 예외가 발생하면 throw_data로 예외 객체를 전파하고 rescue가 Exception#===로 예외 타입을 매칭하여 해당 rescue 절의 iseq를 실행하는 과정, StandardError/RuntimeError/ArgumentError/TypeError/NoMethodError 등의 예외 클래스 계층 구조가 Exception을 루트로 하는 트리 구조로 상속되는 방식, ensure 블록이 rescue 실행 후에도 항상 실행되어 파일/네트워크 연결 등을 정리하는 과정, raise가 Kernel#raise를 호출하여 예외 객체를 생성하고 throw 태그로 YARV 스택을 역으로 탐색하며 rescue_handler를 찾는 방식, rescue가 inline(단일 문장 뒤)으로도 사용 가능한 문법, retry가 rescue 블록 내에서 begin 블록을 다시 실행하는 방식을 다룹니다."


date: 2024-09-09 10:00:00 +0900


category: ruby


tags: [ruby, exceptions, error-handling, begin, rescue, ensure, raise]


level: intermediate


---





Ruby의 예외 처리는 프로그램의 안정성을 보장합니다.





> **핵심 정리** · `begin/rescue/ensure`는 YARV 스택에서 예외를 `throw_data`로 전파합니다. `rescue`는 `Exception#===`로 예외 타입을 매칭합니다. `ensure`는 항상 실행됩니다. `raise`는 `Kernel#raise`로 예외를 생성하고 `throw` 태그로 스택을 역탐색합니다. 예외 클래스는 `Exception`을 루트로 하는 트리 구조입니다.





---





## 수업 목표





- begin/rescue의 예외 매칭 방식과 throw_data 전파를 이해합니다.


- 예외 클래스 계층 구조를 이해합니다.


- ensure의 항상 실행 보장을 이해합니다.


- raise의 예외 생성과 전파를 이해합니다.


- retry와 inline rescue를 이해합니다.





## 기본 예외 처리





```ruby


def divide(a, b)


  begin


    result = a / b


    puts "결과: #{result}"


    result


  rescue ZeroDivisionError => e


    puts "0으로 나눌 수 없습니다: #{e.message}"


    nil


  rescue TypeError => e


    puts "타입이 올바르지 않습니다: #{e.message}"


    nil


  end


end





def process_file(filename)


  file = File.open(filename, 'r')


  content = file.read


  content.upcase


rescue Errno::ENOENT => e


  puts "파일을 찾을 수 없습니다: #{filename}"


  nil


rescue => e  # StandardError (기본)


  puts "오류 발생: #{e.message}"


  nil


ensure


  file&.close  # 항상 파일 닫기


end


```





`begin/rescue` 블록은 YARV의 `throw` 명령어와 `catch` 테이블을 사용하여 구현됩니다. 예외가 발생하면 VM은 현재 iseq(instruction sequence)의 `catch_table`에서 `rescuer` 타입 엔트리를 찾습니다. 각 rescue 절의 예외 클래스는 `Exception#===`로 매칭됩니다(클래스 일치 또는 서브클래스). `rescue => e`는 `StandardError`와 그 서브클래스를 모두 캐치합니다. `ensure`는 YARV의 `catch_table`에서 `ensurer` 타입으로 등록되어, 예외 발생 여부와 관계없이 항상 실행됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Exception과 StandardError의 차이는 무엇인가요?</strong></summary>





`Exception`은 모든 예외의 루트 클래스입니다. `StandardError`는 일반적인 예외의 부모 클래스로, `rescue`에 예외 클래스를 명시하지 않으면 StandardError와 그 서브클래스를 캐치합니다. `SystemExit`, `Interrupt`, `NoMemoryError`, `SignalException` 등 시스템 레벨 예외는 Exception의 직접 서브클래스이므로 `rescue Exception`으로만 캐치할 수 있습니다. `rescue Exception`은 거의 사용하지 않으며, 특별한 경우(프로세스 종료 방지)에만 사용합니다.


</details>





<details>


<summary><strong>Q: ensure와 else의 차이는 무엇인가요?</strong></summary>





`else` 블록은 예외가 발생하지 않았을 때만 실행됩니다. `ensure` 블록은 예외 발생 여부와 관계없이 항상 실행됩니다. 실행 순서: `begin` → 예외 발생 시 `rescue` → (항상) `ensure`. `begin` → 정상 완료 시 `else` → (항상) `ensure`. `else`는 예외 없이 정상 완료된 후에 실행되어야 하는 코드(예: 로깅)에 사용됩니다.


</details>





<details>


<summary><strong>Q: raise와 fail의 차이는 무엇인가요?</strong></summary>





`raise`와 `fail`은 완전히 동일합니다. `Kernel#raise`의 alias가 `Kernel#fail`입니다. Ruby 커뮤니티에서는 예외를 발생시킬 때는 `raise`를, 예외가 발생했음을 나타내는 조건문에서는 `fail`을 사용하는 관례가 있습니다: `fail ArgumentError, "invalid argument" unless valid?`.


</details>





<details>


<summary><strong>Q: retry는 어떻게 동작하나요?</strong></summary>





`retry`는 `rescue` 블록 내에서 사용되어 `begin` 블록을 처음부터 다시 실행합니다. 주로 일시적인 오류(네트워크 타임아웃, 파일 잠금) 후 재시도에 사용됩니다. `retry`는 rescue 블록 밖에서는 사용할 수 없습니다(LocalJumpError). 무한 재시도를 방지하기 위해 재시도 횟수 제한을 구현해야 합니다.


</details>





<details>


<summary><strong>Q: catch와 throw는 rescue/raise와 어떻게 다른가요?</strong></summary>





`catch`/`throw`는 예외 처리와 다른 목적을 가집니다. `throw`는 `catch` 블록으로 즉시 탈출하여 값을 반환합니다. 예외가 아니라 **흐름 제어**를 위한 것입니다. `catch(:done) { (1..100).each { |i| throw :done, i if i == 50 } }`는 50을 반환합니다. `throw`는 예외 스택과 다른 `throw` 테이블을 사용하므로 `rescue`로 캐치되지 않습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **begin/rescue** | 예외 처리 블록 | YARV catch_table의 rescuer 엔트리 |


| **Exception 계층** | 예외 클래스 트리 | Exception → StandardError → *Error |


| **ensure** | 정리 보장 | catch_table의 ensurer → 항상 실행 |


| **raise** | 예외 발생 | Kernel#raise → throw 태그로 스택 역탐색 |


| **retry** | 블록 재실행 | rescue 내에서 begin으로 jump-back |





## 다음 수업





다음 글에서는 파일 I/O — File/IO/Dir 클래스와 데이터 직렬화를 배웁니다.



---


layout: post


title: "Ruby 제어문 — if/unless/case/when과 조건부 수식어, 삼항 연산자의 내부 평가 방식"


description: "Ruby의 제어문과 조건부 평가 방식을 시스템 레벨에서 심층 학습합니다. if/elsif/else가 조건식을 평가하여 truthy/falsy(nil/false만 falsy)를 판별하고 해당 분기의 AST 노드를 실행하는 과정, unless가 조건이 false일 때만 실행되는 if의 역전(negation) 형태로 동작하는 원리, case/when이 === 연산자(세 번째 등호)로 when 절을 평가하여 Range#===는 include?와 동일하게 동작하는 방식, 조건부 수식어(statement modifier)가 if/unless를 문장 뒤에 배치하여 가독성을 높이는 문법 설탕(syntactic sugar)의 내부 파싱 과정, 삼항 연산자(?:)가 단일 표현식 내에서 조건부 값을 선택하는 방식과 C의 조건 연산자와의 차이점을 다룹니다."


date: 2024-07-15 10:00:00 +0900


category: ruby


tags: [ruby, control-flow, if, unless, case, when, ternary, conditional]


level: basic


---





Ruby의 제어문은 if/unless/case/when과 조건부 수식어로 구성됩니다.





> **핵심 정리** · Ruby에서 `nil`과 `false`만 falsy이고 나머지는 모두 truthy입니다. `unless`는 `if not`의 문법 설탕입니다. `case/when`은 `===` 연산자(세 번째 등호)로 when 절을 평가합니다. `Range#===`는 `include?`와 동일합니다. 조건부 수식어(`puts "Hi" if x > 0`)는 if를 문장 뒤에 배치합니다.





---





## 수업 목표





- if/elsif/else의 조건 평가 방식을 이해합니다.


- unless의 if not 동작을 이해합니다.


- case/when의 === 연산자 평가를 이해합니다.


- 조건부 수식어와 삼항 연산자의 차이를 이해합니다.





## if/elsif/else





```ruby


score = 85





if score >= 90


  grade = "A"


elsif score >= 80


  grade = "B"


elsif score >= 70


  grade = "C"


else


  grade = "D"


end





puts grade  # "B"





# if는 값을 반환합니다


result = if score >= 80


           "Pass"


         else


           "Fail"


         end


puts result  # "Pass"


```





Ruby에서 `if`는 **표현식(expression)**이므로 값을 반환합니다. 마지막으로 평가된 표현식의 값이 if 전체의 반환값이 됩니다. 위 예에서 `result`에는 `"Pass"`가 할당됩니다. 이는 C/Java의 삼항 연산자 `score >= 80 ? "Pass" : "Fail"`와 유사하지만, Ruby의 if는 여러 줄의 코드 블록을 값으로 반환할 수 있습니다. 조건절에서 `nil`과 `false`만 falsy입니다. `0`, `""`, `[]`는 모두 truthy입니다.





## unless





```ruby


age = 15





unless age >= 18


  puts "미성년자입니다"


end





# unless-else도 가능


unless age >= 18


  puts "미성년자"


else


  puts "성인"


end





# 한 줄 조건부 수식어


puts "미성년자" unless age >= 18


```





`unless`는 `if not`의 문법 설탕입니다. 조건이 `false`일 때 본문을 실행합니다. `unless age >= 18`은 `if !(age >= 18)` 또는 `if age < 18`과 동일합니다. Ruby 커뮤니티에서는 `unless`를 `else` 없이 사용하는 것을 권장합니다. `unless...else`는 가독성을 해치므로 `if...else`를 사용하는 것이 좋습니다.





## case/when





```ruby


# 기본 case/when


case score


when 90..100


  grade = "A"


when 80...90


  grade = "B"


when 70...80


  grade = "C"


when 60...70


  grade = "D"


else


  grade = "F"


end





# === 연산자의 다양한 활용


case "Hello"


when String


  puts "문자열입니다"       # String === "Hello" → true


end





case 42


when 1..50


  puts "1에서 50 사이"      # (1..50) === 42 → true (include?와 동일)


end





case /^R/


when "Ruby"


  puts "R로 시작합니다"     # /^R/ === "Ruby" → true (match?와 동일)


end





# when에 여러 값


case fruit


when "사과", "배", "복숭아"


  puts "과일입니다"


when "당근", "브로콜리"


  puts "채소입니다"


end


```





`case/when`은 `===` 연산자(세 번째 등호, case equality operator)로 when 절을 평가합니다. `when 90..100`은 `(90..100) === score`로 평가됩니다. `Range#===`는 `include?`와 동일하여 범위 내 포함 여부를 검사합니다. `when String`은 `String === "Hello"`로, `Class#===`는 `is_a?`와 동일하여 타입 검사를 수행합니다. `when /^R/`은 `/^R/ === "Ruby"`로, `Regexp#===`는 `match?`와 동일합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: if와 unless 중 어떤 것을 사용해야 하나요?</strong></summary>





긍정 조건(값이 존재할 때 실행)은 `if`를, 부정 조건(값이 없을 때 실행)은 `unless`를 사용하는 것이 관례입니다. 예를 들어 `if user`보다 `unless user.nil?`이 자연스럽고, `if !user.admin?`보다 `unless user.admin?`이 더 읽기 쉽습니다. 단, `unless`에 `else`를 사용하면 가독성이 떨어지므로 이 경우는 `if...else`를 사용합니다. 조건부 수식어(`do_something if condition`)는 간단한 조건에서만 사용합니다.


</details>





<details>


<summary><strong>Q: case/when과 if/elsif의 성능 차이는 있나요?</strong></summary>





성능 차이는 거의 없습니다. Ruby 컴파일러가 `case/when`과 `if/elsif`를 유사한 YARV 명령어 시퀀스로 컴파일하기 때문입니다. `case/when`은 `===` 메서드 호출을, `if/elsif`는 `!` 메서드 호출(falsy 검사)을 각각 수행합니다. when 절의 수가 많아도 바이너리 서치 같은 최적화는 없습니다. 따라서 성능보다는 가독성과 의도 표현에 따라 선택하는 것이 좋습니다. 타입 검사나 Range 검사에는 `case/when`, 복잡한 부울 조건에는 `if/elsif`가 적합합니다.


</details>





<details>


<summary><strong>Q: 조건부 수식어(statement modifier)는 어떤 경우에 사용하나요?</strong></summary>





`puts "Debug: #{value}" if debug_mode`처럼 **간단한 조건의 단일 문장**에 사용합니다. 조건부 수식어는 if/unless를 문장 뒤에 배치하여 주요 동작을 먼저 읽을 수 있게 합니다. 단, 복잡한 조건이나 여러 줄의 코드에는 사용하지 않는 것이 좋습니다. `return if user.nil?`은 메서드 초반의 가드 절(guard clause)로 자주 사용됩니다.


</details>





<details>


<summary><strong>Q: 삼항 연산자(ternary operator)는 어떻게 동작하나요?</strong></summary>





`condition ? true_value : false_value`는 조건이 truthy면 `true_value`를, falsy면 `false_value`를 반환합니다. C/Java와 동일한 문법이지만, Ruby에서는 **모든 것이 표현식**이므로 if도 값을 반환할 수 있어 삼항 연산자의 필요성이 상대적으로 낮습니다. `x > 0 ? "positive" : "non-positive"`는 `if x > 0 then "positive" else "non-positive" end`와 동일합니다. 삼항 연산자는 단순하고 짧은 조건에만 사용하고, 중첩은 절대 피해야 합니다.


</details>





<details>


<summary><strong>Q: until 루프는 while과 어떻게 다른가요?</strong></summary>





`until`은 `while not`의 문법 설탕입니다. `until condition`은 조건이 `true`가 될 때까지 본문을 반복합니다. `while !condition`과 동일합니다. `begin...end while`과 `begin...end until`은 조건 검사를 본문 실행 **후**에 하므로, 최소 한 번은 실행됩니다(do-while 패턴). `until`도 `unless`와 마찬가지로 `else` 없이 사용하는 것이 좋습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **if** | 조건부 분기 | truthy/falsy 평가 → 해당 AST 노드 실행 |


| **unless** | if not의 문법 설탕 | 조건이 false일 때 실행 |


| **case/when** | === 연산자 기반 분기 | when 절을 ===로 평가 |


| **=== 연산자** | case equality | Class#=== → is_a?, Range#=== → include? |


| **조건부 수식어** | if/unless를 문장 뒤에 배치 | 단일 문장 조건부 실행 |


| **삼항 연산자** | 표현식 내 조건값 선택 | condition ? true_val : false_val |





## 다음 수업





다음 글에서는 루프와 이터레이터 — while/until/each/times/loop를 배웁니다.



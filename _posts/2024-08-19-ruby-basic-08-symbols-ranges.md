---


layout: post


title: "Ruby 심볼과 범위 — Symbol의 ID 테이블, Range의 순회와 Include 검사, 상수 조회 경로"


description: "Ruby의 Symbol과 Range, 상수 시스템의 내부 동작을 시스템 레벨에서 심층 학습합니다. Symbol이 C 레벨에서 ID 타입(정수)으로 관리되며 global_symbols 테이블에 단일 인스턴스로 저장되어 문자열보다 빠른 비교와 메모리 효율성을 제공하는 과정, Range가 C 레벨에서 RRange 구조체로 begin/end/exclude_end? 플래그를 관리하고 Range#===가 include?로 Range#cover?와 Range#include?의 차이점, Range#each가 Integer/String 등 순회 가능한 타입에서만 동작하고 Float에서는 NoMethodError를 발생시키는 이유, 상수 조회 경로가 Module.nesting과 Module.constants를 따라 현재 네임스페이스에서 조상 체인으로 올라가며 탐색하는 과정을 다룹니다."


date: 2024-08-19 10:00:00 +0900


category: ruby


tags: [ruby, symbols, ranges, object-model, constants]


level: basic


---





Ruby의 Symbol과 Range는 고유한 특성을 가진 특별한 객체입니다.





> **핵심 정리** · Symbol은 `ID` 타입의 Integer로 `global_symbols` 테이블에 단일 인스턴스로 저장됩니다. Range는 `RRange` 구조체로 `begin`/`end`/`exclude_end?`를 관리합니다. `Range#===`는 `include?`와 동일합니다. 상수 조회는 `Module.nesting` → `Module.constants` 순서로 탐색합니다.





---





## 수업 목표





- Symbol의 ID 테이블 저장 방식을 이해합니다.


- Range의 구조체와 include?/cover? 차이를 이해합니다.


- Range가 순회 가능한 타입과 그렇지 않은 타입을 이해합니다.


- 상수 조회 경로와 네임스페이스 탐색을 이해합니다.





## 심볼





```ruby


# 심볼 생성


sym1 = :name


sym2 = :"user name"


sym3 = :"with space"


sym4 = :"#{prefix}_method"  # 동적 심볼


sym5 = "string".to_sym      # 문자열 → 심볼





# 심볼의 고유성


puts :name.object_id    # 1234568 (매번 동일)


puts :name.object_id    # 1234568 (동일)


puts "name".object_id  # 7890123 (매번 다름)


puts "name".object_id  # 4567890 (매번 다름)





# 심볼 테이블


puts Symbol.all_symbols.size  # 현재까지 생성된 모든 심볼 개수





# 심볼과 문자열 비교


puts :name == "name"    # false (타입이 다름)


puts :name.to_s == "name"  # true (to_s로 변환 후 비교)


puts "name".to_sym == :name  # true (to_sym으로 변환 후 비교)


```





`Symbol`은 내부적으로 `ID` 타입(정수)에 매핑되어 `global_symbols`(또는 `sym_tbl`) 테이블에 단일 인스턴스로 저장됩니다. `:name.object_id`가 항상 같은 값을 반환하는 이유가 여기에 있습니다. 반면 `"name".object_id`는 호출할 때마다 새로운 `String` 객체를 생성하므로 매번 다른 값을 반환합니다. 동적 심볼 생성(`"#{prefix}_method".to_sym`)은 런타임에 새 심볼을 `global_symbols` 테이블에 추가합니다. 동적 심볼은 GC(Garbage Collection)의 대상이 아닌 일반 심볼과 달리, Ruby 2.2+에서 GC될 수 있습니다(Symbol GC).





## 범위 (Range)





```ruby


# Range 생성


r1 = 1..5        # 1, 2, 3, 4, 5 (..는 끝 포함)


r2 = 1...5       # 1, 2, 3, 4 (...는 끝 미포함)


r3 = 'a'..'e'    # 'a', 'b', 'c', 'd', 'e'


r4 = Date.new(2024, 1, 1)..Date.new(2024, 12, 31)





# Range 메서드


puts r1.begin     # 1


puts r1.end       # 5


puts r1.exclude_end?  # false


puts (1..5).to_a  # [1, 2, 3, 4, 5]


puts (1...5).to_a # [1, 2, 3, 4]





# include? vs cover?


puts (1..10).include?(5)    # true (순회하며 검사)


puts (1..10).cover?(5)      # true (begin/end 비교)


puts (1..10).include?(5.5)  # true


puts (1..10).cover?(5.5)    # true


puts (1..10).include?(15)   # false


puts ("a".."z").cover?("abc")  # true (begin <= abc <= end)


puts ("a".."z").include?("abc")  # false (abc는 a..z에 없음)





# case/when에서 Range


score = 85


grade = case score


        when 90..100 then "A"


        when 80...90 then "B"


        when 70...80 then "C"


        else "F"


        end


puts grade  # "B"


```





`1..5`는 `Range.new(1, 5, false)`와 동일하고, `1...5`는 `Range.new(1, 5, true)`와 동일합니다. `..`와 `...` 연산자는 파서에서 `DOT2`/`DOT3` 토큰으로 처리되어 `NEW_RANGE` 노드로 변환됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: include?와 cover?의 차이는 무엇인가요?</strong></summary>





`include?`는 Range의 `each`를 사용하여 **실제로 순회하면서** 값이 존재하는지 확인합니다. 따라서 순회 가능한 타입(Integer, String)에서만 동작합니다. `cover?`는 `begin <= value <= end` (또는 `begin <= value < end` for exclude_end?)로 **비교 연산자**만 사용하여 확인하므로, 순회 불가능한 타입(Float, Time)에서도 동작하고 Integer Range에서도 `include?`보다 빠릅니다. `(1..1000000).cover?(500000)`은 O(1)이지만, `(1..1000000).include?(500000)`은 O(n)입니다. 일반적으로 `cover?`를 사용하는 것이 더 안전하고 빠릅니다.


</details>





<details>


<summary><strong>Q: Float Range에서 each가 동작하지 않는 이유는 무엇인가요?</strong></summary>





`each`는 `succ`(successor, 다음 값) 메서드를 호출하여 순회합니다. `Integer#succ`는 `n + 1`을 반환하지만, `Float#succ`는 정의되어 있지 않습니다(부동소수점의 연속성 때문). `(1.0..5.0).each { |f| puts f }`는 `NoMethodError: undefined method 'succ' for 1.0:Float`를 발생시킵니다. Float Range는 `cover?`로 포함 여부를 확인하거나, `step`으로 증분을 지정하여 순회할 수 있습니다: `(1.0..5.0).step(0.5) { |f| puts f }`.


</details>





<details>


<summary><strong>Q: Symbol#to_proc과 Symbol#id2name은 무엇인가요?</strong></summary>





`:upcase.to_proc`는 Proc 객체를 반환합니다: `->(obj, *args) { obj.send(:upcase, *args) }`. `&:upcase` 구문으로 블록 대신 사용됩니다. `Symbol#id2name`(또는 `to_s`)는 심볼의 문자열 표현을 반환합니다: `:name.id2name #=> "name"`. 동적 심볼 조회는 `send` 또는 `respond_to?`와 함께 사용되어 메서드 이름을 동적으로 지정할 수 있습니다.


</details>





<details>


<summary><strong>Q: 상수 조회 경로는 어떻게 결정되나요?</strong></summary>





Ruby는 상수 참조 시 다음 순서로 조회합니다: (1) 현재 어휘 스코프(lexical scope)의 `Module.nesting`을 확인합니다. (2) 현재 클래스/모듈의 `ancestors` 체인을 확인합니다(include/extend/prepend된 모듈 포함). (3) `Kernel#autoload`를 확인합니다. (4) 존재하지 않으면 `NameError` 또는 `const_missing`을 호출합니다. `::` 접두사(예: `::Math::PI`)는 최상위 네임스페이스에서 검색을 시작합니다. 상수는 메서드와 달리 동적 스코프가 아닌 정적(어휘적) 스코프를 사용합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Symbol** | 고유 ID | global_symbols 테이블 → ID(Integer) 매핑 |


| **Range** | 값의 범위 | RRange → begin/end/exclude_end? |


| **.. / ...** | 범위 연산자 | DOT2(끝 포함) / DOT3(끝 미포함) |


| **cover?** | 비교 기반 검사 | begin <= value <= end (O(1)) |


| **include?** | 순회 기반 검사 | each + 비교 (O(n)) |


| **상수 조회** | 네임스페이스 탐색 | nesting → ancestors 체인 탐색 |





## 다음 수업





다음 글에서는 Ruby의 클래스와 객체 — OOP의 핵심을 배웁니다.



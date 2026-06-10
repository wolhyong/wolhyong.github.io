---


layout: post


title: "Ruby 배열과 해시 — Array의 동적 확장, Hash의 해시 테이블 구조, 고급 컬렉션 메서드"


description: "Ruby의 배열(Array)과 해시(Hash)의 내부 구조와 고급 메서드를 시스템 레벨에서 심층 학습합니다. Array가 C 레벨에서 RArray 구조체로 구현되어 내부적으로 VALUE* 포인터 배열을 관리하며 요소 추가 시 1.5배씩 동적 확장(capa 재할당)하는 과정, push/pop/shift/unshift가 각각 배열의 앞/뒤에서 요소를 추가/제거할 때 발생하는 메모리 이동(shift는 모든 요소를 한 칸씩 앞으로 이동), Hash가 st_table(심볼 테이블) 기반의 해시 테이블로 구현되어 key의 hash 값을 버킷 인덱스로 변환하고 충돌 시 체이닝으로 해결하는 방식, default_proc가 Hash#[] 호출 시 키가 없을 때 동적 기본값을 생성하는 Proc 실행 과정, Array#&/Array#|/Array#- 등의 집합 연산자가 내부적으로 해시를 사용하여 O(n)으로 동작하는 방식, splat 연산자(*)가 배열을 풀어 여러 인자로 변환하는 과정을 다룹니다."


date: 2024-08-05 10:00:00 +0900


category: ruby


tags: [ruby, arrays, hashes, collections, data-structures]


level: basic


---





Ruby의 배열과 해시는 가장 중요한 컬렉션 타입입니다.





> **핵심 정리** · Array는 C의 RArray 구조체로 `VALUE*` 포인터 배열을 관리하고, 요소 추가 시 `1.5배`씩 재할당합니다. `shift`는 모든 요소를 한 칸씩 앞으로 이동시킵니다(O(n)). Hash는 `st_table` 기반 해시 테이블로, 충돌은 체이닝으로 해결합니다. `default_proc`은 키 부재 시 동적으로 기본값을 생성합니다. `Array#&`와 `Array#|`는 내부적으로 해시를 사용하여 O(n)으로 동작합니다.





---





## 수업 목표





- Array의 동적 확장과 메모리 관리 방식을 이해합니다.


- push/pop/shift/unshift의 시간 복잡도를 이해합니다.


- Hash의 해시 테이블 구조와 충돌 해결을 이해합니다.


- default_proc의 동적 기본값 생성을 이해합니다.


- splat 연산자와 집합 연산의 내부 동작을 이해합니다.





## 배열 기본





```ruby


# 배열 생성


arr = [1, 2, 3, 4, 5]


arr2 = Array.new(5, 0)        # [0, 0, 0, 0, 0]


arr3 = Array.new(5) { |i| i } # [0, 1, 2, 3, 4]


arr4 = %w[a b c]              # ["a", "b", "c"]


arr5 = %i[red green blue]     # [:red, :green, :blue]





# 요소 추가/제거


arr = [1, 2]


arr.push(3)       # [1, 2, 3] — 끝에 추가 (O(1) amortized)


arr << 4          # [1, 2, 3, 4] — push의 문법 설탕


arr.unshift(0)    # [0, 1, 2, 3, 4] — 앞에 추가 (O(n))


arr.pop           # 4 — 끝에서 제거 (O(1))


arr.shift         # 0 — 앞에서 제거 (O(n))





# 배열 연산


a = [1, 2, 3]


b = [3, 4, 5]


puts a + b          # [1, 2, 3, 3, 4, 5] — 결합


puts a - b          # [1, 2] — 차집합


puts a & b          # [3] — 교집합


puts a | b          # [1, 2, 3, 4, 5] — 합집합


puts a * 2          # [1, 2, 3, 1, 2, 3] — 반복


```





`Array.new(5, 0)`는 5개 요소를 모두 같은 `0` 객체로 채웁니다(얕은 복사). 따라서 가변 객체(예: `Array.new(3, [])`)는 모든 요소가 같은 배열을 참조하게 됩니다. `Array.new(5) { |i| i }`는 블록으로 각 요소를 독립적으로 초기화하므로 안전합니다. `<<` 연산자는 `push`의 문법 설탕으로 C 레벨의 `rb_ary_push()`를 호출합니다. `shift`는 배열의 첫 요소를 제거하고 모든 나머지 요소를 한 칸씩 앞으로 이동시키므로 O(n)입니다. `Array#&`와 `Array#|`는 내부적으로 임시 해시를 생성하여 각 요소의 포함 여부를 O(1)로 확인하므로 전체 O(n)입니다.





## 해시 기본





```ruby


# 해시 생성


h1 = { "a" => 1, "b" => 2 }       # 문자열 키


h2 = { name: "Ruby", age: 30 }     # 심볼 키 (Ruby 1.9+)





# 기본값 설정


h = Hash.new(0)           # 기본값 0


puts h[:count]            # 0 (키가 없어도 에러 없음)


h[:count] += 1


puts h[:count]            # 1





# 블록 기본값 (default_proc)


word_count = Hash.new(0)


"hello world hello".split.each { |w| word_count[w] += 1 }


puts word_count  # {"hello"=>2, "world"=>1}





# default_proc 동적 생성


deep = Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }


deep[:a][:b][:c] = 42


puts deep  # {:a=>{:b=>{:c=>42}}}


```





`Hash.new(0)`는 모든 부재 키에 대해 `0`을 반환합니다. `Hash.new { |h, k| h[k] = 0 }`는 블록을 `default_proc`으로 저장하여 키가 처음 참조될 때 블록을 실행하고 결과를 자동 저장합니다. `default_proc`은 키 부재 시마다 실행되므로, 복잡한 초기화 로직이 필요할 때 유용합니다. `Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }`는 무한히 중첩되는 해시(autovivification)를 생성합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Array의 push와 <<의 차이는 무엇인가요?</strong></summary>





`push`와 `<<`는 완전히 동일합니다. `<<`는 C 레벨에서 `rb_ary_push()`로 컴파일되며, `push`도 같은 함수를 호출합니다. `<<`는 연산자(operator)로, `arr << 1 << 2`처럼 체이닝할 수 있습니다. `push`는 여러 인자를 받을 수 있습니다: `arr.push(1, 2, 3)`은 한 번에 세 요소를 추가합니다. 두 메서드 모두 amortized O(1)입니다.


</details>





<details>


<summary><strong>Q: Hash가 키로 사용할 수 있는 객체는 무엇인가요?</strong></summary>





Hash의 키는 `hash` 메서드와 `eql?` 메서드가 구현된 모든 객체입니다. `hash`는 객체의 해시 코드(Integer)를 반환하고, `eql?`은 두 객체가 논리적으로 동일한지 확인합니다. String, Symbol, Integer, Float, Array는 기본적으로 구현되어 있습니다. 커스텀 객체를 키로 사용하려면 `hash`와 `eql?` 메서드를 정의해야 합니다. `==`가 아니라 `eql?`을 사용한다는 점에 주의해야 합니다(==가 더 관대함).


</details>





<details>


<summary><strong>Q: splat 연산자(*)는 어떻게 동작하나요?</strong></summary>





`*`(splat) 연산자는 배열을 개별 요소로 풀어줍니다. `[1, *[2, 3], 4]`는 `[1, 2, 3, 4]`가 됩니다. 메서드 호출에서 `arr = [1, 2, 3]; puts(*arr)`는 `puts(1, 2, 3)`과 동일합니다. `first, *rest = [1, 2, 3, 4]`에서 `first`는 1, `rest`는 [2, 3, 4]입니다. 더블 스플랫(`**`)은 해시를 키워드 인자로 풀어줍니다: `def method(a:, b:); end; hash = { a: 1, b: 2 }; method(**hash)`.


</details>





<details>


<summary><strong>Q: Hash의 기본값을 변경하면 이전에 저장된 값도 영향을 받나요?</strong></summary>





`Hash.new(0)`의 `0`은 기본값일 뿐, 해시에 저장된 값과는 별개입니다. 이미 저장된 키-값 쌍은 영향받지 않습니다. `default=` 메서드로 기본값을 변경해도 기존 키에는 영향을 주지 않고, 이후에 접근하는 부재 키에만 새 기본값이 적용됩니다. `default_proc=`로 기본값 생성 블록을 변경해도 기존 값은 그대로 유지됩니다.


</details>





<details>


<summary><strong>Q: Array와 Hash 중 어떤 것이 메모리를 더 효율적으로 사용하나요?</strong></summary>





순수 요소 저장은 Array가 더 효율적입니다. Array는 연속된 메모리 블록에 VALUE 포인터를 저장합니다. Hash는 해시 테이블 구조(버킷 배열 + 체이닝)로 인해 Array보다 2~3배 더 많은 메모리를 사용합니다. 요소가 1000개일 때 Array는 약 8KB(64비트 시스템), Hash는 약 20~30KB를 사용합니다. 따라서 순서가 중요하고 키가 필요 없으면 Array를, 키-값 검색이 필요하면 Hash를 사용합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Array** | 동적 배열 | RArray → VALUE* 포인터 배열, 1.5배 확장 |


| **push/pop** | 끝 추가/제거 | O(1) amortized / O(1) |


| **shift/unshift** | 앞 제거/추가 | O(n) — 모든 요소 이동 |


| **Hash** | 해시 테이블 | st_table → 해시 + 체이닝 |


| **default_proc** | 동적 기본값 | 키 부재 시 블록 실행 → 결과 저장 |


| **splat** | 배열 풀기 | * → 여러 인자, ** → 키워드 인자 |





## 다음 수업





다음 글에서는 Ruby의 문자열과 정규표현식 — String 메서드와 Regexp 패턴 매칭을 배웁니다.



---


layout: post


title: "Ruby Enumerable과 Lazy Enumerator — 템플릿 메서드 패턴, 지연 평가, 무한 시퀀스"


description: "Ruby의 Enumerable 모듈과 Lazy Enumerator의 고급 기능을 시스템 레벨에서 심층 학습합니다. Enumerable 모듈의 60여 개 메서드가 each 메서드만으로 구현되는 템플릿 메서드 패턴(Template Method Pattern)의 구조와 Ruby VM이 이러한 메서드들을 C 레벨에서 최적화하는 방식, Enumerator::Lazy가 map/select/filter_map을 지연 평가(lazy evaluation)하여 중간 배열을 생성하지 않고 최종 결과만을 생성하는 과정, lazy 체인에서 take(n)이 평가를 조기 종료시키는 방식(무한 시퀀스에서 유용), Enumerator.new(yield)와 Enumerator.produce로 사용자 정의 생성기를 만드는 방법, Enumerator#next와 Enumerator#rewind로 외부 반복자 패턴을 구현하는 방식을 다룹니다."


date: 2024-10-07 10:00:00 +0900


category: ruby


tags: [ruby, enumerable, lazy, enumerator, generator, lazy-evaluation]


level: intermediate


---





Ruby의 Enumerable 모듈은 컬렉션 처리를 위한 강력한 도구를 제공합니다.





> **핵심 정리** · Enumerable의 60여 개 메서드는 `each` 하나로 구현됩니다(Template Method 패턴). `Enumerator::Lazy`는 중간 배열을 생성하지 않고 지연 평가합니다. `take(n)`은 lazy 체인에서 조기 종료됩니다. `Enumerator.new`와 `Enumerator.produce`로 사용자 정의 생성기를 만듭니다.





---





## 수업 목표





- Enumerable의 템플릿 메서드 패턴을 이해합니다.


- Lazy Enumerator의 지연 평가를 이해합니다.


- 무한 시퀀스의 조기 종료를 이해합니다.


- Enumerator.new로 생성기를 만드는 방법을 이해합니다.


- next/rewind의 외부 반복자 패턴을 이해합니다.





## Enumerable 템플릿 메서드 패턴





```ruby


# Enumerable의 내부 구현 의사 코드


# (실제 구현은 C 레벨)


module Enumerable


  # each만 구현하면 나머지는 자동 제공


  def map


    result = []


    each { |element| result << yield(element) }


    result


  end





  def select


    result = []


    each { |element| result << element if yield(element) }


    result


  end





  def reduce(initial = nil)


    accumulator = initial


    each do |element|


      if accumulator.nil?


        accumulator = element


      else


        accumulator = yield(accumulator, element)


      end


    end


    accumulator


  end


end


```





## Lazy Enumerator





```ruby


# Eager (즉시 평가) — 중간 배열 생성


result = (1..Float::INFINITY)


  .select { |n| puts "select: #{n}"; n.even? }


  .map { |n| puts "map: #{n}"; n * 2 }


  .first(3)


# select: 1... select: 2... select: 3... (무한히 계속됨!)





# Lazy (지연 평가) — 필요할 때만 계산


result = (1..Float::INFINITY).lazy


  .select { |n| puts "select: #{n}"; n.even? }


  .map { |n| puts "map: #{n}"; n * 2 }


  .first(3)


# select: 1


# select: 2


# map: 2


# select: 3


# select: 4


# map: 4


# select: 5


# select: 6


# map: 6


# 결과: [4, 8, 12]


```





`Enumerator::Lazy`는 각 메서드가 새로운 Enumerator 객체를 반환하고, 최종 메서드(`to_a`, `first`, `take`)가 호출될 때까지 실제 계산을 지연합니다. `first(3)`가 호출되면 lazy 체인이 역순으로 평가되며, 조건을 만족하는 3개의 요소가 발견되면 `take(3)`에 의해 조기 종료됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Lazy Enumerator는 항상 더 효율적인가요?</strong></summary>





항상 그렇지는 않습니다. Lazy Enumerator는 각 요소별로 체인의 모든 단계를 실행하므로, 조건을 만족하는 요소가 많거나 전체 결과가 필요할 때는 오히려 느릴 수 있습니다. 소수의 결과만 필요한 경우(예: `first(5)`)나 무한 시퀀스를 다룰 때 Lazy가 효과적입니다. 전체 데이터를 변환해야 한다면 Eager가 더 효율적입니다.


</details>





<details>


<summary><strong>Q: Enumerator.new와 Enumerator.produce의 차이는 무엇인가요?</strong></summary>





`Enumerator.new`는 블록에서 `yield`로 값을 전달합니다: `Enumerator.new { |y| 10.times { |i| y << i } }`. `Enumerator.produce`(Ruby 2.7+)는 초기값과 블록으로 무한 시퀀스를 생성합니다: `Enumerator.produce(0) { |n| n + 1 }`는 `0, 1, 2, 3, ...` 무한 시퀀스입니다. `Enumerator.produce`는 Fibonacci, Collatz 추측 등 점화식 기반 시퀀스에 적합합니다.


</details>





<details>


<summary><strong>Q: 외부 반복자(Enumerator)와 내부 반복자(each)의 차이는 무엇인가요?</strong></summary>





`each`(내부 반복자)는 블록에 제어권을 넘기고 블록이 종료될 때까지 기다립니다. `Enumerator`(외부 반복자)는 `next`로 요소를 하나씩 가져오고, `peek`로 다음 요소를 확인합니다. `rewind`로 처음으로 되돌릴 수 있습니다. 외부 반복자는 두 컬렉션을 동시에 순회하거나, 조건에 따라 순회를 중단/재개해야 할 때 유용합니다. `to_enum` 또는 `enum_for`로 모든 객체를 Enumerator로 변환할 수 있습니다.


</details>





<details>


<summary><strong>Q: Enumerator::ArithmeticSequence는 무엇인가요?</strong></summary>





`Numeric#step`과 `Range#step`이 반환하는 특별한 Enumerator입니다. `(1..10).step(2)`는 `[1, 3, 5, 7, 9]`의 등차수열을 생성하는 ArithmeticSequence를 반환합니다. `begin`, `end`, `step`, `exclude_end?` 속성에 접근할 수 있습니다. Ruby 2.6+에서 도입되었습니다.


</details>





<details>


<summary><strong>Q: Enumerator#next를 호출할 때 StopIteration 예외는 무엇인가요?</strong></summary>





`Enumerator#next`는 더 이상 요소가 없으면 `StopIteration` 예외를 발생시킵니다. 이 예외는 `loop`에서 자동으로 캐치되어 루프를 종료합니다: `loop { puts enumerator.next }`는 StopIteration 발생 시 자동으로 루프를 탈출합니다. 이는 내부적으로 `rb_iterator_break()`와 유사한 메커니즘을 사용합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Enumerable** | 컬렉션 메서드 | each → map/select/reduce (Template Method) |


| **Lazy** | 지연 평가 | 중간 배열 없이 최종 결과만 생성 |


| **take(n)** | 조기 종료 | n개 충족 시 평가 중단 |


| **Enumerator.new** | 사용자 정의 생성기 | yield로 값 전달 |


| **Enumerator.produce** | 점화식 기반 시퀀스 | 초기값 + 블록 → 무한 시퀀스 |





## 다음 수업





다음 글에서는 테스팅 — Minitest와 RSpec의 내부 구조와 TDD를 배웁니다.



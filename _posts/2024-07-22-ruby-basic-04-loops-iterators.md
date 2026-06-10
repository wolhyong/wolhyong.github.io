---


layout: post


title: "Ruby 루프와 이터레이터 — while/until/each/times/loop와 Enumerable 모듈의 내부 동작"


description: "Ruby의 반복문과 이터레이터 시스템을 시스템 레벨에서 심층 학습합니다. while/until 키워드가 YARV의 jump/branchif/branchunless 명령어로 컴파일되어 조건 검사와 점프를 반복하는 과정, Integer#times/String#each_line/Array#each/ Hash#each가 각각 yield로 블록에 값을 전달하고 C 레벨에서 rb_yield()를 호출하는 방식, loop가 Kernel#loop로 무한 루프를 구성하고 break/next/redo로 흐름을 제어하는 원리, for-in이 내부적으로 each 이터레이터의 문법 설탕으로 동작하는 과정, Enumerable 모듈이 map/select/reduce 등의 메서드를 each 하나만으로 구현하는 템플릿 메서드 패턴을 다룹니다."


date: 2024-07-22 10:00:00 +0900


category: ruby


tags: [ruby, loops, iterators, each, enumerable, times, while, blocks]


level: basic


---





Ruby의 반복문은 전통적인 while/until과 다양한 이터레이터 메서드를 제공합니다.





> **핵심 정리** · `while`은 YARV의 `jump`/`branchif` 명령어로 컴파일됩니다. `each`와 `times`는 C 레벨에서 `rb_yield()`를 호출하여 블록을 실행합니다. `for-in`은 `each`의 문법 설탕입니다. `Enumerable` 모듈은 `each` 하나만으로 `map`/`select`/`reduce` 등 60여 개 메서드를 구현합니다.





---





## 수업 목표





- while/until의 YARV 컴파일 방식을 이해합니다.


- each/times 이터레이터의 yield 호출을 이해합니다.


- loop/break/next/redo의 흐름 제어를 이해합니다.


- for-in이 each의 문법 설탕인 이유를 이해합니다.


- Enumerable 모듈의 템플릿 메서드 패턴을 이해합니다.





## 기본 루프





```ruby


# while 루프


count = 0


while count < 3


  puts "count: #{count}"


  count += 1


end





# until 루프 (while not)


count = 0


until count == 3


  puts "count: #{count}"


  count += 1


end





# begin-while (최소 한 번 실행)


count = 5


begin


  puts "실행됨: #{count}"


  count += 1


end while count < 3





# for-in (each의 문법 설탕)


for i in [1, 2, 3]


  puts i


end





# loop (무한 루프)


loop do


  puts "계속..."


  break if rand > 0.8


end


```





`while count < 3`는 YARV에서 `putobject 0, setlocal count, jump label_check`로 컴파일되어 조건 검사 → 점프를 반복합니다. `count += 1`은 `getlocal count, putobject 1, opt_plus, setlocal count`로 컴파일됩니다. `for i in [1, 2, 3]`는 내부적으로 `[1, 2, 3].each { |i| ... }`로 변환되어 `send :each` 명령어가 실행됩니다. `loop`는 `Kernel#loop` 메서드로, `while true`와 유사하지만 `StopIteration` 예외를 던져 `each`와 같은 이터레이터에서 탈출할 수 있습니다.





## 이터레이터





```ruby


# times


5.times { |i| puts "Index: #{i}" }





# each (배열)


["a", "b", "c"].each { |char| puts char }





# each (해시)


{ name: "Ruby", age: 30 }.each do |key, value|


  puts "#{key}: #{value}"


end





# each_with_index


["a", "b", "c"].each_with_index { |char, idx| puts "#{idx}: #{char}" }





# String 이터레이터


"Hello


World".each_line { |line| puts line }


"Ruby".each_char { |c| puts c }


"Ruby".each_byte { |b| puts b }





# Range 이터레이터


(1..5).each { |n| puts n }


```





이터레이터 메서드는 C 레벨에서 `rb_yield()` 함수를 호출하여 블록을 실행합니다. `5.times { |i| puts i }`에서 `times`는 C의 `for (i = 0; i < 5; i++)` 루프를 돌며 각 반복에서 `rb_yield(INT2FIX(i))`를 호출합니다. `each`는 컬렉션의 각 요소에 대해 `rb_yield(element)`를 호출합니다. `Hash#each`는 각 키-값 쌍을 `rb_yield_values(2, key, value)`로 전달하여 블록이 두 인자를 받을 수 있게 합니다.





### Enumerable 모듈





```ruby


numbers = [1, 2, 3, 4, 5]





# map (변환)


squares = numbers.map { |n| n ** 2 }


puts squares  # [1, 4, 9, 16, 25]





# select (필터)


evens = numbers.select { |n| n.even? }


puts evens  # [2, 4]





# reduce (누적)


sum = numbers.reduce(0) { |acc, n| acc + n }


puts sum  # 15





# find (검색)


first_even = numbers.find { |n| n.even? }


puts first_even  # 2





# sort (정렬)


sorted = numbers.sort { |a, b| b <=> a }


puts sorted  # [5, 4, 3, 2, 1]





# group_by (그룹화)


grouped = numbers.group_by { |n| n.even? ? "even" : "odd" }


puts grouped  # {"odd"=>[1, 3, 5], "even"=>[2, 4]}


```





`Enumerable` 모듈은 Ruby의 핵심 추상화입니다. `map`, `select`, `reduce`, `find`, `sort`, `group_by` 등 60여 개의 메서드가 포함되어 있습니다. 이 메서드들은 모두 `each` 메서드 하나만을 사용하여 구현됩니다(template method 패턴). 예를 들어 `map`은 `each`로 요소를 순회하며 블록의 반환값을 새 배열에 추가합니다:





```ruby


# Enumerable#map의 내부 구현 (의사 코드)


def map


  result = []


  each { |element| result << yield(element) }


  result


end


```





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: for-in과 each의 차이는 무엇인가요?</strong></summary>





`for i in [1, 2, 3]`은 내부적으로 `[1, 2, 3].each { |i| ... }`로 변환됩니다. 성능 차이는 없지만 스코프에 차이가 있습니다: `each` 블록 내에서 새로 생성된 변수는 블록 내부에서만 유효하고, `for` 루프의 변수는 루프 외부에서도 접근 가능합니다(블록을 생성하지 않음). Ruby 커뮤니티에서는 거의 항상 `each`를 사용하고 `for`는 사용하지 않습니다. 이는 `each`가 블록 스코프를 제공하고 체이닝이 가능하기 때문입니다.


</details>





<details>


<summary><strong>Q: break, next, redo의 차이는 무엇인가요?</strong></summary>





`break`는 루프 전체를 종료하고 루프 바로 다음 코드로 이동합니다. `next`는 현재 반복을 건너뛰고 다음 반복으로 이동합니다(continue와 유사). `redo`는 현재 반복을 처음부터 다시 실행합니다(조건 검사 없이). 예를 들어 `[1, 2, 3].each { |n| redo if n == 2 }`는 `n == 2`일 때 무한 루프에 빠집니다(같은 요소를 계속 재실행). `break`는 값을 받아서 루프의 반환값이 될 수 있습니다: `result = [1, 2, 3].each { |n| break n if n == 2 }`에서 `result`는 `2`입니다.


</details>





<details>


<summary><strong>Q: Enumerable을 커스텀 클래스에서 사용하려면 어떻게 해야 하나요?</strong></summary>





`include Enumerable`을 선언하고 `each` 메서드만 구현하면 `map`, `select`, `reduce` 등 모든 Enumerable 메서드를 사용할 수 있습니다. `each`는 `yield`로 각 요소를 블록에 전달해야 합니다. 또한 `<=>` 연산자(spaceship)를 구현하면 `sort`, `min`, `max`, `sort_by`도 사용할 수 있습니다. `Enumerable`은 `each`를 기반으로 다른 모든 메서드를 구현하는 템플릿 메서드 패턴의 대표적인 예입니다.


</details>





<details>


<summary><strong>Q: times, upto, downto, step의 차이는 무엇인가요?</strong></summary>





`5.times { |i| ... }`는 0부터 4까지 5번 반복합니다. `1.upto(5) { |i| ... }`는 1부터 5까지 증가하며 반복합니다. `5.downto(1) { |i| ... }`는 5부터 1까지 감소하며 반복합니다. `1.step(10, 2) { |i| ... }`는 1부터 10까지 2씩 증가하며 반복합니다(결과: 1, 3, 5, 7, 9). 이 메서드들은 모두 `Integer` 클래스에 정의되어 있으며, C 레벨의 `for` 루프로 구현되어 있어 성능이 우수합니다.


</details>





<details>


<summary><strong>Q: each와 map의 성능 차이는 있나요?</strong></summary>





`each`는 블록의 반환값을 무시하고 자기 자신(컬렉션)을 반환합니다. `map`은 블록의 반환값을 모아 새 배열을 반환합니다. `map`이 새 배열을 할당하고 요소를 추가하는 오버헤드가 있지만, 큰 차이는 아닙니다. 블록의 반환값이 필요 없으면 `each`를, 필요하면 `map`을 사용합니다. `each_with_object`는 누적 객체가 필요할 때 `reduce`(inject)의 대안으로 사용됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **while/until** | 조건 기반 루프 | YARV jump/branchif/branchuntil 명령어 |


| **each/times** | 이터레이터 | C 레벨 rb_yield() 호출 |


| **loop** | 무한 루프 | Kernel#loop → while true + StopIteration 처리 |


| **for-in** | each의 문법 설탕 | 내부적으로 .each { \|i\| ... } 변환 |


| **Enumerable** | 컬렉션 추상화 | each 하나로 60여 개 메서드 구현 |


| **break/next/redo** | 루프 흐름 제어 | break: 종료, next: 건너뜀, redo: 재실행 |





## 다음 수업





다음 글에서는 Ruby의 메서드와 블록 — 메서드 정의, 인자 종류, 블록/Proc/Lambda를 배웁니다.



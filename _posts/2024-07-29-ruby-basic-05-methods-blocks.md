---


layout: post


title: "Ruby 메서드와 블록 — 메서드 정의, 인자 종류, 블록/Proc/Lambda의 차이와 변환 과정"


description: "Ruby의 메서드와 블록 시스템을 시스템 레벨에서 심층 학습합니다. def 키워드가 TOPLEVEL/BODY 태그로 파싱되어 클래스에 메서드를 정의하고 YARV의 iseq에 저장되는 과정, 필수/선택/기본값/키워드/배열/블록 인자의 여섯 가지 종류와 파싱 규칙, 블록(do...end/{ })이 Proc 객체로 변환되지 않고 YARV 스택에서 iseq 포인터로 직접 전달되어 yield로 실행되는 과정, Proc.new가 블록을 Proc 객체로 변환하여 변수에 저장 가능하게 하는 방식, Lambda가 Proc과 달리 인자 개수를 검사하고 return이 람다를 감싼 메서드가 아닌 람다 자체에서만 반환되는 차이, Symbol#to_proc가 &를 통해 블록으로 변환되는 간결한 표현을 다룹니다."


date: 2024-07-29 10:00:00 +0900


category: ruby


tags: [ruby, methods, blocks, proc, lambda, arguments, yield, to_proc]


level: basic


---





Ruby의 메서드와 블록은 언어의 핵심 기능으로, 유연한 인자 처리와 강력한 이터레이션을 제공합니다.





> **핵심 정리** · `def`는 YARV iseq에 메서드를 저장합니다. 여섯 가지 인자 종류(필수/선택/기본값/키워드/스플랫/블록)가 있습니다. 블록은 `yield`로 실행되며 Proc 객체가 아닌 iseq 포인터로 전달됩니다. `Proc.new`는 블록을 객체로 만들고, `Lambda`는 인자 검사와 `return` 동작에서 Proc과 차이가 있습니다. `&`는 `to_proc`을 호출하여 Symbol을 블록으로 변환합니다.





---





## 수업 목표





- def의 YARV isqe 저장 방식을 이해합니다.


- 여섯 가지 인자 종류와 파싱 규칙을 이해합니다.


- 블록의 yield 실행과 iseq 포인터 전달을 이해합니다.


- Proc과 Lambda의 차이를 이해합니다.


- Symbol#to_proc의 변환 과정을 이해합니다.





## 메서드 정의와 인자





```ruby


# 기본 메서드


def greet(name)


  "Hello, #{name}!"


end





# 기본값 인자


def greet_with_default(name = "World")


  "Hello, #{name}!"


end





# 키워드 인자 (Ruby 2.0+)


def create_user(name:, age:, role: "user")


  { name: name, age: age, role: role }


end





# 스플랫 인자 (가변 인자)


def sum(*numbers)


  numbers.reduce(0, :+)


end





# 더블 스플랫 (키워드 스플랫, Ruby 2.0+)


def log_request(method, path, **headers)


  puts "#{method} #{path}"


  puts "Headers: #{headers}"


end





# 블록 인자 (&)


def with_timing(&block)


  start = Time.now


  block.call


  puts "실행 시간: #{Time.now - start}초"


end





# 모든 인자 조합 (Ruby 2.7+)


def complex(a, b = 1, *c, d:, e: 2, **f, &g)


  [a, b, c, d, e, f, g]


end





puts greet("Ruby")                 # "Hello, Ruby!"


puts greet_with_default            # "Hello, World!"


puts create_user(name: "Matz", age: 30)  # { name: "Matz", age: 30, role: "user" }


puts sum(1, 2, 3, 4, 5)           # 15


```





`def` 키워드는 Ruby 파서가 `TOPLEVEL`(최상위), `BODY`(메서드 본문) 태그로 파싱하여 현재 클래스(또는 모듈)의 `method_table`에 `ID`(메서드명) → `rb_method_entry_t`(iseq 포인터, 인자 정보) 매핑을 추가합니다. 인자의 종류는 여섯 가지입니다:





1. **필수 인자** — `name`처럼 호출 시 반드시 전달해야 함


2. **선택 인자** — `b = 1`처럼 기본값이 있어 생략 가능


3. **스플랫 인자** — `*c`처럼 0개 이상의 인자를 배열로 수집


4. **키워드 인자** — `name:`처럼 키워드 형태로 전달


5. **더블 스플랫** — `**f`처럼 키워드 인자를 해시로 수집


6. **블록 인자** — `&g`처럼 블록을 Proc 객체로 수집





### 블록과 yield





```ruby


# yield로 블록 실행


def with_logging


  puts "시작"


  result = yield


  puts "종료 (결과: #{result})"


  result


end





with_logging { "Hello" }


# 출력:


# 시작


# 종료 (결과: Hello)





# yield에 인자 전달


def repeat(n)


  n.times { |i| yield(i) }


end





repeat(3) { |i| puts "Index: #{i}" }


# Index: 0


# Index: 1


# Index: 2





# 블록 존재 여부 확인


def safe_yield


  if block_given?


    yield


  else


    "no block"


  end


end





puts safe_yield { "with block" }  # "with block"


puts safe_yield                   # "no block"


```





`yield`는 C 레벨에서 `rb_yield()` 함수를 호출하여 블록을 실행합니다. 블록은 `Proc` 객체로 변환되지 않고, YARV 스택에서 `block iseq pointer`와 `env`(지역 변수 캡처)가 직접 전달됩니다. 따라서 블록을 변수에 저장하려면 `Proc.new`나 `&`로 Proc 객체로 변환해야 합니다. `block_given?`은 C 레벨의 `rb_block_given_p()` 함수를 호출하여 현재 메서드에 블록이 전달되었는지 확인합니다.





### Proc과 Lambda





```ruby


# Proc.new


square = Proc.new { |x| x ** 2 }


puts square.call(5)   # 25


puts square[5]        # 25 (문법 설탕)





# Kernel#proc (Proc.new와 동일)


double = proc { |x| x * 2 }


puts double.call(5)   # 10





# Lambda


triple = lambda { |x| x * 3 }


puts triple.call(5)   # 15





# Lambda 문법 (stabby lambda)


quadruple = ->(x) { x * 4 }


puts quadruple.call(5)  # 20





# &로 블록 변환


["a", "b", "c"].map(&:upcase)  # ["A", "B", "C"]


[1, 2, 3].map(&:to_s)          # ["1", "2", "3"]


```





`Proc`과 `Lambda`의 세 가지 차이점:





1. **인자 검사**: Proc은 인자 개수가 달라도 유연하게 처리(부족하면 nil, 초과하면 무시), Lambda는 엄격하게 검사(개수가 다르면 ArgumentError)


2. **return**: Proc의 `return`은 Proc을 감싼 **메서드**에서 반환, Lambda의 `return`은 람다 **자체**에서만 반환


3. **break**: Proc에서 `break`는 에러(LocalJumpError), Lambda에서 `break`는 정상 동작





`&:upcase`는 `Symbol#to_proc`을 호출하여 `Proc` 객체를 생성합니다. 내부 구현은 `->(obj, *args) { obj.send(self, *args) }`와 같습니다. `["a", "b", "c"].map(&:upcase)`는 `["a", "b", "c"].map { |s| s.upcase }`와 동일합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: do...end와 { } 블록의 차이는 무엇인가요?</strong></summary>





파서에서 `{ }`는 `do...end`보다 우선순위가 높습니다. `puts [1, 2, 3].map { |n| n * 2 }`는 정상 동작하지만, `puts [1, 2, 3].map do |n| n * 2 end`는 `puts`에 블록이 전달되어 에러가 발생합니다. 일반적으로 **한 줄 블록**은 `{ }`를, **여러 줄 블록**은 `do...end`를 사용하는 것이 관례입니다. `{ }`는 체이닝에서 더 안전합니다.


</details>





<details>


<summary><strong>Q: block_given?과 Proc.new로 블록을 받는 것의 차이는 무엇인가요?</strong></summary>





`block_given?`은 블록이 전달되었는지만 확인하고, `yield`로 실행합니다. `&block` 인자는 블록을 `Proc` 객체로 변환하여 변수에 저장하므로, 메서드 내에서 여러 번 호출하거나 다른 메서드에 전달할 수 있습니다. `yield`가 미세하게 빠르지만(Proc 객체 생성 오버헤드 없음), 대부분의 경우 차이는 무시할 수 있습니다. 블록을 전달해야 한다면 `&block`을, 단순 실행만 필요하면 `yield`를 사용합니다.


</details>





<details>


<summary><strong>Q: Lambda가 Proc보다 인자 검사가 엄격한 이유는 무엇인가요?</strong></summary>





Lambda는 메서드처럼 동작하도록 설계되었습니다. `lambda { |x| x * 2 }.call(1, 2, 3)`는 인자 개수가 달라 `ArgumentError`를 발생시킵니다. Proc은 블록처럼 동작하도록 설계되어 인자 개수에 유연합니다. `Proc.new { |x| x * 2 }.call(1, 2, 3)`는 `x`에 `1`만 할당하고 나머지는 무시합니다. `return`의 차이도 마찬가지입니다: Lambda는 메서드의 `return`처럼 동작하고, Proc은 둘러싼 컨텍스트에서 반환합니다.


</details>





<details>


<summary><strong>Q: Symbol#to_proc은 어떻게 동작하나요?</strong></summary>





`:upcase.to_proc`는 `Proc` 객체를 반환합니다. 내부 구현은 다음과 같습니다: `def to_proc; proc { |obj, *args| obj.send(self, *args) }; end`. `["a", "b"].map(&:upcase)`에서 `&` 연산자는 `:upcase`에 `to_proc` 메시지를 보내 Proc을 얻고, 이를 블록으로 map에 전달합니다. `map`의 각 요소에 대해 Proc이 호출되면 요소가 `obj`로, 인자가 없으면 `args`는 빈 배열이 되어 `obj.send(:upcase)`가 실행됩니다.


</details>





<details>


<summary><strong>Q: Ruby 3.0의 Endless Method와 Forwarding Syntax는 무엇인가요?</strong></summary>





Endless Method(무한 메서드)는 `def square(x) = x * 2`처럼 한 줄 메서드를 간결하게 정의합니다. `def method_name = expression` 형태로, 메서드 본문이 단일 표현식일 때 유용합니다. Forwarding Syntax는 `def delegate(...) = target.method(...)`처럼 인자를 전달합니다. Ruby 3.1+에서는 `def delegate = target.method(...)`로 더 간결해졌습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **def** | 메서드 정의 | iseq + method_table 등록 |


| **인자 종류** | 6가지 인자 패턴 | 필수/선택/스플랫/키워드/더블 스플랫/블록 |


| **yield** | 블록 실행 | C 레벨 rb_yield(), iseq 포인터 전달 |


| **Proc** | 블록 객체 | 블록을 Proc으로 변환하여 저장/전달 |


| **Lambda** | 엄격한 Proc | 인자 검사, return 차이 |


| **&** | 블록 변환 | to_proc 호출 → 블록으로 전달 |





## 다음 수업





다음 글에서는 Ruby의 배열과 해시 — 컬렉션의 내부 구조와 고급 메서드를 배웁니다.



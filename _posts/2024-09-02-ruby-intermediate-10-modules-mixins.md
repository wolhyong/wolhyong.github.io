---


layout: post


title: "Ruby 모듈과 Mixin — include/extend/prepend와 네임스페이스, 상속 체인에서의 메서드 조회"


description: "Ruby의 모듈 시스템과 메서드 조회 체인(Method Lookup Path)을 시스템 레벨에서 심층 학습합니다. module 키워드가 Module.new를 호출하여 Module 객체를 생성하고 include는 Module#include로 모듈을 클래스의 ancestors 체인에 삽입하여 메서드 호출 시 Ruby VM이 클래스 → include된 모듈 → superclass 순서로 선형 탐색하는 과정, extend가 객체의 singleton 클래스에 모듈을 include하여 해당 객체에만 모듈의 메서드를 추가하는 방식, prepend가 ancestors 체인에서 클래스보다 앞에 모듈을 삽입하여 메서드를 오버라이드하는 방식(메서드 래핑 패턴), Module#ancestors로 메서드 조회 체인을 확인하는 방법, module_function으로 모듈 메서드를 인스턴스 메서드와 모듈 함수로 동시에 제공하는 방식을 다룹니다."


date: 2024-09-02 10:00:00 +0900


category: ruby


tags: [ruby, modules, mixins, include, extend, prepend, namespace, ancestors]


level: intermediate


---





Ruby의 모듈은 Mixin과 네임스페이스의 두 가지 목적으로 사용됩니다.





> **핵심 정리** · `include`는 모듈을 클래스의 ancestors 체인에 삽입합니다. `extend`는 객체의 singleton 클래스에 include합니다. `prepend`는 ancestors 체인에서 클래스보다 앞에 모듈을 삽입합니다. Ruby VM은 `rb_call()`에서 ancestors 체인을 따라 선형 탐색으로 메서드를 찾습니다. `module_function`은 메서드를 인스턴스 메서드와 모듈 함수로 중복 정의합니다.





---





## 수업 목표





- include의 ancestors 체인 삽입을 이해합니다.


- extend와 include의 차이를 이해합니다.


- prepend의 메서드 래핑 패턴을 이해합니다.


- Module#ancestors로 메서드 조회 체인을 확인하는 방법을 이해합니다.


- module_function의 이중 정의를 이해합니다.





## 모듈 기본





```ruby


# 네임스페이스 모듈


module TextUtils


  module Encrypt


    def self.encode(text)


      text.reverse


    end


  end


end





puts TextUtils::Encrypt.encode("hello")  # "olleh"





# Mixin 모듈


module Debug


  def who_am_i?


    "#{self.class.name}: ##{self.object_id}"


  end


end





class User


  include Debug


end





user = User.new


puts user.who_am_i?  # "User: #4738490324"


```





`module` 키워드는 `Module.new`를 호출하여 새로운 Module 객체를 생성합니다. `TextUtils::Encrypt.encode`에서 `::`는 상수 조회 연산자입니다. `include Debug`는 `Module#include`를 호출하여 `Debug` 모듈을 `User` 클래스의 ancestors 체인에 삽입합니다.





## include vs extend vs prepend





```ruby


module Greetable


  def greet


    "Hello from #{self.class || self}"


  end


end





# include: 인스턴스 메서드로 추가


class User


  include Greetable


end


puts User.new.greet  # "Hello from User"





# extend: 클래스 메서드(또는 객체 singleton 메서드)로 추가


class Admin


  extend Greetable


end


puts Admin.greet     # "Hello from Admin"





# prepend: 인스턴스 메서드로 추가하지만 더 앞선 위치에


module Timestamp


  def save


    puts "#{Time.now}: 저장 시작"


    super


    puts "#{Time.now}: 저장 완료"


  end


end





class Document


  prepend Timestamp





  def save


    puts "문서 저장 중..."


  end


end





Document.new.save


# 2024-07-01 10:00:00 +0900: 저장 시작


# 문서 저장 중...


# 2024-07-01 10:00:00 +0900: 저장 완료


```





`include`는 모듈을 ancestors 체인의 클래스 바로 위에 삽입합니다. `extend`는 객체의 singleton 클래스에 모듈을 include합니다. `prepend`는 ancestors 체인에서 클래스보다 **앞**에 모듈을 삽입합니다. `prepend`를 사용하면 `super`로 원본 메서드를 호출할 수 있어, Aspect-Oriented Programming(AOP) 패턴(로깅, 인증, 트랜잭션)을 구현할 수 있습니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: include와 extend의 차이는 무엇인가요?</strong></summary>





`include`는 모듈의 메서드를 **인스턴스 메서드**로 추가합니다. `User.include(Greetable)`은 `User.new.greet`을 호출할 수 있게 합니다. `extend`는 모듈의 메서드를 클래스 자체의 **클래스 메서드**(또는 객체의 singleton 메서드)로 추가합니다. `User.extend(Greetable)`은 `User.greet`을 호출할 수 있게 합니다. `extend`는 내부적으로 객체의 singleton 클래스에 `include`를 호출합니다.


</details>





<details>


<summary><strong>Q: ancestors 체인은 어떻게 확인하나요?</strong></summary>





`Module#ancestors` 메서드로 메서드 조회 체인을 확인할 수 있습니다. `Document.ancestors`는 `[Document, Timestamp, Object, Kernel, BasicObject]`를 반환합니다. prepend를 사용하면 `Timestamp`가 `Document`보다 앞에 나타납니다. `include`를 사용하면 `[Document, Greetable, Object, Kernel, BasicObject]` 순서입니다. 메서드 호출 시 Ruby는 ancestors 배열의 첫 번째 요소부터 검색하여 일치하는 메서드를 찾을 때까지 순서대로 탐색합니다.


</details>





<details>


<summary><strong>Q: module_function은 어떤 역할을 하나요?</strong></summary>





`module_function`은 지정된 메서드를 인스턴스 메서드와 모듈 함수(클래스 메서드)로 동시에 제공합니다. `Math` 모듈이 대표적인 예입니다: `Math.sqrt(4)`(모듈 함수)와 `include Math; sqrt(4)`(인스턴스 메서드) 모두 가능합니다. `module_function`은 메서드 정의 앞에 위치하거나, `module_function :method_name` 형식으로 기존 메서드를 지정할 수 있습니다. 이는 `private` 메서드처럼 동작하여 레시버 없이 호출 가능합니다.


</details>





<details>


<summary><strong>Q: include와 prepend 중 어떤 것을 선택해야 하나요?</strong></summary>





일반적인 Mixin에는 `include`를 사용합니다. `prepend`는 원본 메서드를 오버라이드하면서 `super`로 원본을 호출해야 할 때 사용합니다. `prepend`의 대표적인 사용 사례: (1) 로깅 — 메서드 호출 전후에 로그를 추가합니다. (2) 트랜잭션 — 메서드를 DB 트랜잭션으로 래핑합니다. (3) 캐싱 — 메서드 결과를 캐시합니다. `prepend`는 `super`로 원본을 호출할 수 있는 반면, `include`로 동일한 효과를 내려면 `alias_method`나 `method_defined?` 체크가 필요합니다.


</details>





<details>


<summary><strong>Q: 모듈을 중첩해서 사용할 수 있나요?</strong></summary>





네, 모듈은 중첩될 수 있습니다: `module Outer; module Inner; end; end`. 중첩된 모듈은 네임스페이스로 사용됩니다: `Outer::Inner::CONSTANT`. 모듈 내부에서 `include Outer`하면 `Outer`의 메서드를 사용할 수 있습니다. 중첩 모듈은 내부 구현을 캡슐화하고 외부에 공개할 API만 선택적으로 노출하는 데 유용합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **module** | 모듈 정의 | Module.new → 상수 할당 |


| **include** | 인스턴스 메서드로 추가 | ancestors 체인에 모듈 삽입 |


| **extend** | 클래스 메서드로 추가 | singleton 클래스에 include |


| **prepend** | 앞선 위치에 추가 | ancestors 체인 앞에 모듈 삽입 + super 호출 가능 |


| **ancestors** | 메서드 조회 체인 | Ruby VM이 선형 탐색하는 경로 |


| **module_function** | 이중 정의 | 인스턴스 메서드 + 모듈 함수 |





## 다음 수업





다음 글에서는 예외 처리 — begin/rescue/ensure/raise와 커스텀 예외를 배웁니다.



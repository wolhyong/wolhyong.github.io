---


layout: post


title: "Ruby 메타프로그래밍 기초 — method_missing, define_method, send, class_eval, instance_eval"


description: "Ruby의 메타프로그래밍 기본 도구를 시스템 레벨에서 심층 학습합니다. method_missing이 BasicObject#method_missing으로 정의되어 Ruby VM이 ancestors 체인에서 메서드를 찾지 못했을 때 rb_method_missing()으로 호출하는 과정, respond_to_missing?을 함께 재정의하지 않으면 respond_to?가 false를 반환하는 이유, define_method가 Module#define_method를 호출하여 블록을 메서드 본문으로 사용하는 동적 메서드 정의 방식, send가 Object#send로 메서드 이름을 Symbol/String으로 동적으로 호출하고 private 메서드도 호출 가능한 이유(public_send는 불가), class_eval이 Class::Eval로 클래스 컨텍스트에서 eval을 실행하여 인스턴스 메서드를 정의하는 방식과 instance_eval이 singleton 메서드를 정의하는 방식의 차이를 다룹니다."


date: 2024-09-30 10:00:00 +0900


category: ruby


tags: [ruby, metaprogramming, method-missing, define-method, send, eval, dsl]


level: intermediate


---





Ruby의 메타프로그래밍은 런타임에 코드를 동적으로 생성하고 조작합니다.





> **핵심 정리** · `method_missing`은 Ruby VM이 ancestors 체인에서 메서드를 찾지 못했을 때 `rb_method_missing()`으로 호출합니다. `define_method`는 `Module#define_method`로 블록을 메서드로 변환합니다. `send`는 private 메서드도 호출 가능하고, `public_send`는 public만 호출 가능합니다. `class_eval`은 클래스 컨텍스트에서 eval을 실행하고, `instance_eval`은 singleton 컨텍스트에서 실행합니다.





---





## 수업 목표





- method_missing의 호출 시점과 조건을 이해합니다.


- respond_to_missing?의 중요성을 이해합니다.


- define_method의 동적 메서드 정의를 이해합니다.


- send와 public_send의 차이를 이해합니다.


- class_eval과 instance_eval의 차이를 이해합니다.





## method_missing





```ruby


class DynamicMethod


  def method_missing(name, *args, &block)


    method_name = name.to_s





    if method_name.start_with?("find_by_")


      # find_by_name, find_by_email 등 동적 메서드


      field = method_name.sub("find_by_", "")


      puts "Searching by #{field}: #{args.first}"


    elsif method_name.end_with?("=")


      # 동적 setter


      field = method_name.chop


      instance_variable_set("@#{field}", args.first)


    else


      super


    end


  end





  def respond_to_missing?(name, include_private = false)


    name.to_s.start_with?("find_by_") ||


    name.to_s.end_with?("=") ||


    super


  end





  def methods(regular = true)


    super + [:find_by_name, :find_by_email, :custom_field=]


  end


end





obj = DynamicMethod.new


obj.find_by_name("Ruby")          # "Searching by name: Ruby"


obj.custom_field = "value"


puts obj.respond_to?(:find_by_name)    # true (respond_to_missing? 덕분)


```





`method_missing`의 세 가지 인자: `name`(호출된 메서드의 Symbol), `*args`(전달된 인자들), `&block`(전달된 블록). `respond_to_missing?`를 반드시 함께 재정의해야 합니다. 그렇지 않으면 `obj.respond_to?(:find_by_name)`가 `false`를 반환하여 `respond_to?`가 일관성을 잃게 됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: method_missing과 define_method의 차이는 무엇인가요?</strong></summary>





`method_missing`은 호출될 때마다 실행되므로 느리고(메서드가 없음을 확인한 후 호출), `respond_to_missing?`을 함께 구현해야 합니다. `define_method`는 실제 메서드를 생성하므로 한 번 정의되면 일반 메서드와 동일한 속도로 실행됩니다. 성능이 중요하고 메서드 호출이 빈번하다면 `define_method`로 메서드를 생성하는 것이 좋습니다. `method_missing`은 동적 메서드의 경우의 수가 많거나(예: find_by_xxx의 xxx가 임의의 필드명), 미리 알 수 없는 경우에 적합합니다.


</details>





<details>


<summary><strong>Q: send와 public_send의 차이는 무엇인가요?</strong></summary>





`send`는 해당 객체의 **모든** 메서드를 호출할 수 있습니다(private/protected 포함). `public_send`는 **public** 메서드만 호출할 수 있습니다(private 메서드를 호출하려고 하면 NoMethodError). 일반적인 메서드 호출에는 `public_send`를 사용하는 것이 캡슐화를 유지하는 좋은 방법입니다. `send`는 테스트에서 private 메서드를 호출해야 할 때나 동적 디스패치가 필요한 내부 구현에서 사용합니다.


</details>





<details>


<summary><strong>Q: class_eval과 instance_eval 중 어떤 것을 사용해야 하나요?</strong></summary>





인스턴스 **메서드**를 동적으로 정의할 때는 `class_eval`(또는 `module_eval`)을 사용합니다. `self`가 클래스가 되어 `def method_name`으로 인스턴스 메서드를 정의할 수 있습니다. **싱글톤 메서드**(특정 객체에만 추가되는 메서드)를 정의할 때는 `instance_eval`을 사용합니다. `self`가 객체의 singleton 컨텍스트가 되어 메서드를 해당 객체에만 추가합니다.


</details>





<details>


<summary><strong>Q: eval(full_string)과 class_eval/instance_eval의 차이는 무엇인가요?</strong></summary>





`eval(string)`은 **현재 스코프**에서 문자열을 Ruby 코드로 평가합니다. 현재 지역 변수에 접근할 수 있습니다. `class_eval(string)`은 **클래스 컨텍스트**에서 평가합니다. `instance_eval(string)`은 **객체의 singleton 컨텍스트**에서 평가합니다. 보안 관점에서 `class_eval`과 `instance_eval`이 `eval`보다 안전합니다(스코프가 제한적). 가능하면 `define_method`, `send`, `class_eval`을 사용하고, `eval`은 꼭 필요할 때만 사용합니다.


</details>





<details>


<summary><strong>Q: const_get/const_set으로 상수를 동적으로 다룰 수 있나요?</strong></summary>





네, `Module#const_get`, `Module#const_set`으로 상수를 동적으로 조회/설정할 수 있습니다. `MyClass.const_get(:VERSION)`은 `MyClass::VERSION`을 반환합니다. `MyClass.const_set(:NEW_CONST, 42)`는 `MyClass::NEW_CONST = 42`를 설정합니다. `const_defined?`로 상수 존재 여부를 확인할 수 있습니다. `const_missing`도 `method_missing`과 유사하게 정의되지 않은 상수 참조 시 호출됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **method_missing** | 누락 메서드 처리 | rb_method_missing() → 호출 |


| **respond_to_missing?** | 메서드 존재 보고 | respond_to?의 일관성 유지 |


| **define_method** | 동적 메서드 정의 | Module#define_method → 블록 → iseq |


| **send** | 동적 메서드 호출 | Object#send → 모든 가시성 허용 |


| **class_eval** | 클래스 컨텍스트 평가 | Module#class_eval → 인스턴스 메서드 정의 |


| **instance_eval** | 객체 컨텍스트 평가 | Object#instance_eval → singleton 메서드 정의 |





## 다음 수업





다음 글에서는 Enumerable 심층 — Lazy Enumerator와 무한 시퀀스를 배웁니다.



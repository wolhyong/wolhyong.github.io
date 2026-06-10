---


layout: post


title: "Ruby Proc과 Lambda 심층 — 클로저의 변수 캡처, 커링, arity, Binding 객체"


description: "Ruby의 Proc과 Lambda의 고급 기능을 시스템 레벨에서 심층 학습합니다. 클로저(closure)가 생성된 당시의 지역 변수 환경(env)을 Proc 객체의 iseq 포인터와 함께 YARV의 env 구조체에 캡처하여 블록이 정의된 스코프의 변수에 접근하고 수정할 수 있는 원리, Proc#arity와 Proc#parameters가 각각 인자 개수와 인자 이름/종류를 반환하는 방식, Proc#curry가 부분 적용(partial application)을 구현하여 다중 인자 Proc을 단일 인자 Proc 체인으로 변환하는 과정, Binding 객체가 현재 실행 컨텍스트의 지역 변수/self/블록 참조를 캡슐화하여 eval()에 전달함으로써 다른 스코프의 변수에 접근할 수 있게 하는 방식, Proc#source_location이 Proc이 정의된 파일과 라인 번호를 반환하여 디버깅에 활용되는 과정을 다룹니다."


date: 2024-09-23 10:00:00 +0900


category: ruby


tags: [ruby, proc, lambda, closures, curry, binding, arity]


level: intermediate


---





Proc과 Lambda는 Ruby에서 클로저(closure)를 구현하는 핵심 기능입니다.





> **핵심 정리** · 클로저는 YARV의 `env` 구조체에 지역 변수 환경을 캡처합니다. `Proc#curry`는 다중 인자 Proc을 단일 인자 체인으로 변환합니다(커링). `Binding` 객체는 실행 컨텍스트를 캡슐화하여 `eval()`에 전달합니다. `Proc#source_location`은 Proc이 정의된 파일과 라인을 반환합니다.





---





## 수업 목표





- 클로저의 변수 캡처와 env 구조체를 이해합니다.


- Proc#curry의 부분 적용을 이해합니다.


- Binding 객체의 컨텍스트 캡처를 이해합니다.


- Proc#source_location의 디버깅 활용을 이해합니다.





## 클로저 심층





```ruby


def create_multiplier(factor)


  # factor 변수를 캡처하는 클로저


  ->(x) { x * factor }


end





double = create_multiplier(2)


triple = create_multiplier(3)





puts double.call(5)   # 10


puts triple.call(5)   # 15





# 클로저가 변수를 수정하는 예


def create_counter


  count = 0


  -> { count += 1 }


end





counter = create_counter


puts counter.call     # 1


puts counter.call     # 2


puts counter.call     # 3


```





클로저(closure)는 생성될 때의 지역 변수 환경을 **캡처**합니다. YARV에서 Proc 객체는 `env`(environment) 구조체를 포함합니다. 이 env는 블록이 정의된 스코프의 지역 변수에 대한 참조를 저장합니다. `create_multiplier(2)`가 호출되면 `factor = 2`가 로컬 스택에 저장됩니다. 람다 `->(x) { x * factor }`는 `factor` 변수를 env에 캡처하여, 람다가 `create_multiplier`가 종료된 후에도 `factor`에 접근할 수 있습니다.





## 커링 (Currying)





```ruby


# 일반 Proc


def add(a, b, c)


  a + b + c


end





# Proc으로 변환 후 커링


add_proc = method(:add).to_proc.curry





add_1 = add_proc.call(1)   # 1이 고정된 Proc


add_1_2 = add_1.call(2)    # 1과 2가 고정된 Proc


puts add_1_2.call(3)       # 6 (1 + 2 + 3)





# 직접 curry 호출


multiply = ->(a, b, c) { a * b * c }.curry


puts multiply[2][3][4]     # 24 (2 * 3 * 4)





# 실용적 예: 로거 생성


logger = ->(level, message) { "[#{level}] #{message}" }.curry


debug = logger["DEBUG"]


info = logger["INFO"]


error = logger["ERROR"]





puts debug.call("변수 값: #{x}")  # "[DEBUG] 변수 값: 42"


puts info.call("서버 시작됨")      # "[INFO] 서버 시작됨"


puts error.call("연결 실패")       # "[ERROR] 연결 실패"


```





`Proc#curry`는 다중 인자를 받는 Proc을 **커링(currying)**하여 단일 인자를 받는 Proc의 체인으로 변환합니다. `curry`는 Proc의 `arity`(인자 개수)를 확인하고, 첫 번째 인자가 전달되면 새로운 Proc을 반환합니다. 모든 인자가 수집될 때까지 이 과정을 반복합니다. `method(:add).to_proc.curry`는 `add` 메서드를 Proc으로 변환하고 커링합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Proc의 arity는 무엇을 의미하나요?</strong></summary>





`Proc#arity`는 Proc이 받는 인자의 개수를 반환합니다. 필수 인자의 개수와 선택 인자의 유무를 고려합니다: `->(a, b) { }.arity`는 2, `->(a, b, c=1) { }.arity`는 2(선택 인자는 arity에서 제외), `->(*args) { }.arity`는 -1(가변 인자는 음수로 표시), `->(a, *b) { }.arity`는 -2(음수 arity = -(필수 인자 개수 + 1)). `Proc#parameters`는 더 상세한 정보를 배열로 반환합니다: `[[:req, :a], [:opt, :b], [:rest, :c]]`.


</details>





<details>


<summary><strong>Q: Binding 객체는 어떻게 사용하나요?</strong></summary>





`Binding`은 현재 실행 컨텍스트를 캡슐화하는 객체입니다. `binding` 메서드로 현재 스코프의 Binding을 얻고, `eval(code, binding)`로 다른 스코프의 변수에 접근할 수 있습니다. IRB/Pry는 이 Binding 객체를 사용하여 REPL 세션의 컨텍스트를 유지합니다. `TOPLEVEL_BINDING`은 최상위 스코프의 Binding을 반환합니다. Binding은 또한 `local_variables`(지역 변수 목록)와 `local_variable_get/set`(동적 변수 접근) 메서드를 제공합니다.


</details>





<details>


<summary><strong>Q: Proc#source_location은 어떻게 활용하나요?</strong></summary>





`Proc#source_location`은 Proc이 정의된 파일 경로와 라인 번호를 배열로 반환합니다. 디버깅, 로깅, 에러 추적에 유용합니다. 예를 들어 블록이 전달된 위치를 로그에 기록할 수 있습니다: `puts "블록 호출: #{block.source_location.join(':')}"`. RSpec/Minitest는 이 정보를 사용하여 테스트 실패 위치를 정확히 표시합니다. `method(:foo).source_location`으로 메서드의 정의 위치도 확인할 수 있습니다.


</details>





<details>


<summary><strong>Q: 클로저의 변수 캡처와 가비지 컬렉션은 어떻게 동작하나요?</strong></summary>





클로저가 변수를 캡처하면, 해당 변수의 참조가 Proc 객체의 `env` 구조체에 저장됩니다. 이 env 구조체는 Proc 객체가 GC되지 않는 한 캡처된 변수도 GC되지 않도록 합니다. 예를 들어 `-> { big_array }`가 `big_array`를 캡처하면, Proc 객체가 살아있는 한 `big_array`도 메모리에 유지됩니다. 이로 인한 메모리 누수를 방지하려면 불필요한 Proc은 `nil`로 할당 해제해야 합니다.


</details>





<details>


<summary><strong>Q: Proc와 Lambda 중에서 성능 차이는 있나요?</strong></summary>





Lambda가 Proc보다 약간 빠릅니다(약 10~20%). Lambda는 메서드 호출에 최적화된 호출 방식을 사용하고, 인자 검사 로직이 다르기 때문입니다. 하지만 대부분의 애플리케이션에서 이 차이는 무시할 수 있습니다. 가독성과 명확한 인자 검사가 필요하면 Lambda를, 블록의 자연스러운 변환(procs)이 필요하면 Proc을 선택하는 것이 좋습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **클로저** | 변수 환경 캡처 | YARV env 구조체에 지역 변수 저장 |


| **curry** | 부분 적용 | 다중 인자 → 단일 인자 체인 변환 |


| **arity** | 인자 개수 | 필수 인자 수 (+ 음수는 가변) |


| **Binding** | 실행 컨텍스트 | 지역 변수/self/블록 캡슐화 → eval에 전달 |


| **source_location** | 정의 위치 | [파일, 라인] 반환 → 디버깅 활용 |





## 다음 수업





다음 글에서는 메타프로그래밍 기초 — method_missing, define_method, send, eval을 배웁니다.



---


layout: post


title: "Ruby 클래스와 객체 — class 키워드, initialize, attr_accessor, self, 메서드 가시성"


description: "Ruby의 클래스와 객체 시스템을 시스템 레벨에서 심층 학습합니다. class 키워드가 Class.new를 호출하여 새로운 Class 객체를 생성하고 상수에 할당하는 과정, initialize가 new 호출 시 C 레벨에서 rb_class_new_instance()로 allocate 후 initialize를 호출하는 두 단계 객체 생성 방식, attr_accessor/attr_reader/attr_writer가 Module#define_method로 getter/setter 메서드를 동적으로 생성하는 과정, public/protected/private이 Module#public/protected/private 메서드를 호출하여 이후 정의되는 메서드의 가시성을 제어하는 방식, self가 현재 메서드의 레시버를 나타내며 메서드 호출의 기본 레시버가 되는 원리, class << self가 singleton 클래스에 메서드를 정의하여 클래스 메서드와 동일한 효과를 내는 과정을 다룹니다."


date: 2024-08-26 10:00:00 +0900


category: ruby


tags: [ruby, oop, classes, objects, initialize, attr-accessor, self]


level: intermediate


---





Ruby는 진정한 객체지향 언어로, 클래스 자체도 객체입니다.





> **핵심 정리** · `class` 키워드는 `Class.new`로 Class 객체를 생성하고 상수에 할당합니다. `new`는 `allocate`로 메모리를 할당한 후 `initialize`를 호출합니다. `attr_accessor`는 `Module#define_method`로 getter/setter를 동적으로 생성합니다. `self`는 현재 메서드의 레시버를 나타냅니다. `class << self`는 singleton 클래스에 메서드를 정의합니다.





---





## 수업 목표





- class 키워드의 Class.new 호출 과정을 이해합니다.


- allocate → initialize의 두 단계 객체 생성을 이해합니다.


- attr_accessor의 동적 메서드 생성을 이해합니다.


- public/protected/private의 차이를 이해합니다.


- self와 singleton 클래스를 이해합니다.





## 클래스 정의와 객체 생성





```ruby


class User


  # 클래스 변수


  @@count = 0





  # attr_accessor: getter와 setter를 자동 생성


  attr_accessor :name, :email


  attr_reader :id


  attr_writer :password





  def initialize(name, email)


    @id = @@count += 1


    @name = name


    @email = email


    @created_at = Time.now


  end





  def info


    "User##{@id}: #{@name} (#{@email})"


  end





  # self를 레시버로 하는 클래스 메서드


  def self.count


    @@count


  end





  # class << self 블록 (다른 클래스 메서드 정의 방식)


  class << self


    def find_by_name(name)


      # 검색 로직


    end


  end


end





user = User.new("Ruby", "ruby@example.com")


puts user.name          # "Ruby"


user.name = "Ruby 3"


puts user.info           # "User#1: Ruby 3 (ruby@example.com)"


puts User.count          # 1


```





`class User`는 파서가 `Class.new`를 호출하여 새로운 Class 객체를 생성하고 이를 `User` 상수에 할당합니다. `User.new`는 C 레벨에서 `rb_class_new_instance()`를 호출합니다. 이 함수는 먼저 `rb_obj_alloc()`로 메모리를 할당한 후 `initialize` 메서드를 호출합니다. `attr_accessor :name`은 `Module#define_method`를 호출하여 `name`(getter)과 `name=`(setter) 메서드를 동적으로 정의합니다. getter는 `@name`을 반환하고, setter는 `@name = value`를 설정합니다.





### 메서드 가시성





```ruby


class BankAccount


  def initialize(balance)


    @balance = balance


  end





  # public (기본값)


  def display_balance


    "Balance: #{@balance}원"


  end





  # public 메서드에서 protected 메서드 호출


  def compare_to(other)


    if self.balance > other.balance


      "내 잔액이 더 많음"


    else


      "상대방 잔액이 더 많거나 같음"


    end


  end





  # protected: 같은 클래스/서브클래스에서만 접근 가능


  protected


  def balance


    @balance


  end





  # private: 레시버 없이만 호출 가능


  private


  def encrypt(value)


    value.to_s.reverse


  end





  def process_transaction


    encrypt(@balance)  # OK (레시버 없이 호출)


  end


end





account = BankAccount.new(10000)


puts account.display_balance    # OK (public)


# puts account.balance  # NoMethodError (protected)


# puts account.encrypt("test")  # NoMethodError (private)


```





`public`(기본값), `protected`, `private`은 Module의 메서드로, 이후 정의되는 메서드의 가시성을 제어합니다. `private`은 함수 형태(레시버 없이)로만 호출 가능합니다. `protected`는 같은 클래스 또는 서브클래스의 다른 인스턴스의 메서드를 레시버와 함께 호출할 수 있습니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: class와 Class.new의 차이는 무엇인가요?</strong></summary>





`class User; end`와 `User = Class.new`는 동일합니다. `class` 키워드는 문법 설탕으로, 파서가 더 읽기 쉬운 형태로 변환합니다. `Class.new`는 블록을 받을 수 있습니다: `User = Class.new { attr_accessor :name; def initialize(name) @name = name end }`. `Class.new`는 동적으로 클래스를 생성할 때 유용하지만, 일반적인 경우 `class` 키워드를 사용합니다.


</details>





<details>


<summary><strong>Q: attr_accessor, attr_reader, attr_writer의 차이는 무엇인가요?</strong></summary>





`attr_reader :name`은 `name` getter 메서드만 생성합니다(`def name; @name; end`). `attr_writer :name`은 `name=` setter 메서드만 생성합니다(`def name=(value); @name = value; end`). `attr_accessor :name`은 둘 다 생성합니다. `attr`(단일)은 Ruby 1.8까지 사용되었으며, boolean 인자로 getter/setter를 제어했지만 현재는 권장되지 않습니다. 내부적으로는 `Module#define_method`로 메서드를 동적으로 정의합니다.


</details>





<details>


<summary><strong>Q: self는 언제 사용해야 하나요?</strong></summary>





`self`는 항상 현재 메서드의 레시버를 나타냅니다. 인스턴스 메서드에서는 해당 인스턴스를, 클래스 메서드에서는 클래스 자체를 가리킵니다. `self`가 필요한 경우: (1) setter 호출 시 — `self.name = value`는 setter 메서드를 호출하고, `name = value`는 지역 변수에 할당합니다. (2) 메서드 체이닝 시 — `self.method1.method2`처럼 명시적으로 레시버를 지정합니다. (3) 클래스 메서드 정의 시 — `def self.method_name`.


</details>





<details>


<summary><strong>Q: singleton 클래스(eigenclass)는 무엇인가요?</strong></summary>





모든 객체는 자신만의 **singleton 클래스**(eigenclass, `class << self` 블록의 self)를 가집니다. singleton 클래스는 객체의 고유한 메서드를 저장합니다. `class << obj` 블록 내에서 정의된 메서드는 해당 객체에만 추가됩니다. 클래스 메서드는 사실 클래스 객체의 singleton 메서드입니다. `class << self` 블록은 현재 객체의 singleton 클래스를 열어 메서드를 정의합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **class** | 클래스 정의 | Class.new → 상수 할당 |


| **new** | 객체 생성 | allocate + initialize (2단계) |


| **attr_accessor** | getter/setter 자동 생성 | define_method로 동적 메서드 정의 |


| **public/protected/private** | 메서드 가시성 | 접근 제어 플래그 설정 |


| **self** | 현재 레시버 | 인스턴스 메서드 → 객체, 클래스 메서드 → 클래스 |


| **singleton 클래스** | 객체 고유 메서드 | class << self → 개별 메서드 저장 |





## 다음 수업





다음 글에서는 모듈과 Mixin — include/extend/prepend와 네임스페이스를 배웁니다.



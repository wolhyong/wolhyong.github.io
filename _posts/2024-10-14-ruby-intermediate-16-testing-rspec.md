---


layout: post


title: "Ruby 테스팅 — Minitest의 assert/expect, RSpec의 describe/it/expect, TDD, mocking"


description: "Ruby의 테스팅 프레임워크인 Minitest와 RSpec의 내부 동작을 시스템 레벨에서 심층 학습합니다. Minitest의 assert_equal/assert_raises/assert_nil이 TestCase 클래스의 인스턴스 메서드로 정의되어 MiniTest::Assertions 모듈을 include하여 테스트 검증을 수행하는 방식, Minitest::Mock이 expect와 verify로 모의 객체의 메서드 호출을 검증하는 과정(expectation이 충족되지 않으면 MockExpectationError), RSpec의 describe/it/context가 각각 ExampleGroup과 Example 객체를 생성하는 RSpec::Core::ExampleGroup의 클래스 메서드로 동작하는 방식, expect().to eq()가 RSpec::Matchers의 매처 객체를 생성하고 eq 매처가 == 연산자로 값을 비교하는 과정, before/after/let/let!가 각각 ExampleGroup의 실행 순서를 제어하는 훅과 지연 평가/즉시 평가 헬퍼를 제공하는 방식을 다룹니다."


date: 2024-10-14 10:00:00 +0900


category: ruby


tags: [ruby, testing, rspec, minitest, tdd, test-framework, mocking]


level: intermediate


---





Ruby는 Minitest(내장)와 RSpec(외부 Gem)의 두 가지 주요 테스팅 프레임워크를 제공합니다.





> **핵심 정리** · Minitest는 `Minitest::Assertions` 모듈의 assert 메서드로 검증합니다. RSpec은 `describe`/`it`으로 `ExampleGroup`/`Example` 객체를 생성합니다. `expect().to eq()`는 Matcher 객체로 == 연산자를 평가합니다. `let`은 지연 평가되고, `let!`은 즉시 평가됩니다.





---





## 수업 목표





- Minitest의 assert 시스템을 이해합니다.


- RSpec의 ExampleGroup/Example 구조를 이해합니다.


- expect().to eq()의 matcher 파이프라인을 이해합니다.


- let/let!/before/after의 실행 순서를 이해합니다.


- mocking 테스트의 verify 과정을 이해합니다.





## Minitest





```ruby


# test_calculator.rb


require 'minitest/autorun'





class CalculatorTest < Minitest::Test


  def setup


    @calc = Calculator.new


  end





  def test_addition


    assert_equal 4, @calc.add(2, 2)


    assert @calc.add(0, 0).zero?


    assert_nil @calc.add(nil, 1)


  end





  def test_division


    assert_equal 2.5, @calc.divide(5, 2)


    assert_raises(ZeroDivisionError) { @calc.divide(1, 0) }


  end





  def test_with_mock


    mock = Minitest::Mock.new


    mock.expect :calculate, 42, [1, 2, 3]


    assert_equal 42, @calc.run(mock, 1, 2, 3)


    mock.verify


  end





  def teardown


    # 정리 코드


  end


end


```





`Minitest::Test`는 `Minitest::Assertions`를 include합니다. `assert_equal expected, actual`은 내부에서 `expected == actual`을 검사하고, 실패하면 `Minitest::Assertion` 예외를 발생시킵니다. `setup`은 각 테스트 전에, `teardown`은 각 테스트 후에 실행됩니다. `Minitest::Mock`은 `expect(method_name, return_value, args)`로 예상 호출을 등록하고, `verify`로 모든 예상 호출이 실제로 발생했는지 확인합니다.





## RSpec





```ruby


# spec/calculator_spec.rb


require 'rspec'





describe Calculator do


  subject(:calc) { described_class.new }





  describe '#add' do


    context 'with positive numbers' do


      let(:a) { 2 }


      let(:b) { 3 }





      it 'returns the sum' do


        expect(calc.add(a, b)).to eq(5)


      end


    end





    context 'with zero' do


      it 'returns the other number' do


        expect(calc.add(0, 5)).to eq(5)


      end


    end


  end





  describe '#divide' do


    it 'raises error when dividing by zero' do


      expect { calc.divide(1, 0) }.to raise_error(ZeroDivisionError)


    end


  end





  describe '#run' do


    let(:mock_service) { instance_double('ExternalService') }





    before do


      allow(mock_service).to receive(:calculate).with(1, 2, 3).and_return(42)


    end





    it 'runs with mocked service' do


      expect(calc.run(mock_service, 1, 2, 3)).to eq(42)


      expect(mock_service).to have_received(:calculate).with(1, 2, 3)


    end


  end


end


```





RSpec의 `describe`는 `RSpec::Core::ExampleGroup` 서브클래스를 생성합니다. `it`은 `ExampleGroup`에 `Example` 객체를 추가합니다. `let`은 `:calc` 심볼에 대해 지연 평가되는 메서드를 정의하여, 테스트에서 `calc`가 처음 참조될 때 블록이 실행됩니다. `let!`은 테스트 실행 전에 즉시 평가됩니다. `expect(value).to eq(expected)`는 Matcher 객체를 생성하고 `value == expected`를 검사합니다. `expect { block }.to raise_error(ErrorClass)`는 블록 실행 중 발생한 예외를 캐치하여 예외 클래스를 검증합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Minitest와 RSpec 중 어떤 것을 선택해야 하나요?</strong></summary>





Minitest는 Ruby에 내장되어 있어 별도 설치가 필요 없고, 간결하며, 실행 속도가 빠릅니다. Rails의 기본 테스트 프레임워크입니다. RSpec은 더 풍부한 DSL, 더 읽기 쉬운 문법, 다양한 매처, 커뮤니티의 방대한 자료를 제공합니다. Rails 프로젝트가 아니거나 단순한 테스트가 필요하면 Minitest를, 복잡한 비즈니스 로직과 가독성이 중요한 프로젝트에서는 RSpec을 선택합니다. 잘못된 선택은 없습니다.


</details>





<details>


<summary><strong>Q: let과 before(:each)의 차이는 무엇인가요?</strong></summary>





`let`은 **지연 평가(lazy evaluation)**됩니다. 테스트에서 해당 변수가 처음 참조될 때 블록이 실행됩니다. `before(:each)`는 각 테스트 **전에** 항상 실행됩니다. `let!`은 `let`과 달리 테스트 전에 즉시 평가됩니다(변수가 참조되지 않아도 블록이 실행됨). 일반적으로 `let`을 사용하고, 부수 효과가 필요한 경우에만 `before`나 `let!`을 사용합니다.


</details>





<details>


<summary><strong>Q: instance_double, mock, spy의 차이는 무엇인가요?</strong></summary>





`instance_double('ClassName')`은 클래스의 메서드만 mock할 수 있도록 검증합니다(존재하지 않는 메서드를 stub하면 에러). `double('name')`은 모든 메서드를 허용합니다(검증 없음). `spy`는 `allow` 대신 `expect`를 먼저 사용할 수 있습니다: `spy = instance_spy('Class'); obj.call(spy); expect(spy).to have_received(:method)`.


</details>





<details>


<summary><strong>Q: subject(:name) { }는 어떤 역할을 하나요?</strong></summary>





`subject`는 테스트 대상 객체를 명시적으로 정의합니다. `subject(:calc) { described_class.new }`에서 `calc`는 `let(:calc) { ... }`와 동일하게 동작하지만, `is_expected.to` 구문을 사용할 수 있는 추가 기능이 있습니다. `it { is_expected.to be_valid }`는 `subject`에 대해 `expect(subject).to be_valid`를 호출합니다. `described_class`는 가장 가까운 `describe` 블록의 클래스를 자동으로 참조합니다.


</details>





<details>


<summary><strong>Q: 테스트의 AAA(Arrange-Act-Assert) 패턴은 무엇인가요?</strong></summary>





AAA 패턴은 테스트를 세 단계로 구조화합니다: (1) **Arrange** — 테스트 환경을 설정합니다(객체 생성, mock 설정). (2) **Act** — 테스트할 동작을 실행합니다(메서드 호출). (3) **Assert** — 결과를 검증합니다(expect/assert). 각 단계는 빈 줄로 구분하여 가독성을 높입니다. 구조화된 테스트는 실패 원인을 빠르게 파악할 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **Minitest** | 내장 테스트 프레임워크 | TestCase + Assertions + setup/teardown |


| **RSpec** | 외부 DSL 테스트 프레임워크 | ExampleGroup + Example + Matchers |


| **let** | 지연 평가 변수 | 첫 참조 시 블록 실행 |


| **mock** | 가짜 객체 | 예상 호출 등록 → verify 검증 |


| **expect().to** | 값 검증 | Matcher 객체 → ==, raise_error 등 비교 |





## 다음 수업





다음 글에서는 Ruby의 동시성 — 스레드, Fiber, Ractor를 배웁니다.



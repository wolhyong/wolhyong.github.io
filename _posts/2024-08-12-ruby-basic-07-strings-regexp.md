---


layout: post


title: "Ruby 문자열과 정규표현식 — String의 인코딩/메서드 체인, Regexp의 NFA 엔진과 패턴 매칭"


description: "Ruby의 String과 Regexp(정규표현식)의 내부 동작을 시스템 레벨에서 심층 학습합니다. String이 C 레벨에서 RString 구조체로 관리되며 ascii_only/encoding/frozen/taint 플래그와 char* 포인터로 문자열 데이터에 접근하는 방식, UTF-8/Multibyte 인코딩이 Encoding 클래스로 관리되어 문자열 메서드가 각 인코딩에 맞게 바이트 단위 대신 문자 단위로 동작하는 과정, gsub/sub/split/scan 등 String 메서드가 블록/해시와 함께 동작할 때 일치하는 패턴마다 yield 또는 해시 조회를 수행하는 방식, Regexp가 Onigmo(Oniguruma) 정규표현식 엔진으로 컴파일되어 NFA(Nondeterministic Finite Automaton) 기반으로 백트래킹하며 패턴 매칭을 수행하는 과정, String#match와 Regexp#match의 차이, =~ 연산자의 특수 변수($1/$2/$~) 설정 방식을 다룹니다."


date: 2024-08-12 10:00:00 +0900


category: ruby


tags: [ruby, strings, regexp, pattern-matching, regex, encoding]


level: basic


---





Ruby의 String과 Regexp는 텍스트 처리의 핵심입니다.





> **핵심 정리** · String은 RString 구조체로 인코딩/플래그를 관리합니다. Onigmo 정규표현식 엔진은 패턴을 NFA로 컴파일하여 백트래킹 매칭을 수행합니다. `=~` 연산자는 매칭 결과를 `$1`/`$2`/`$~` 특수 변수에 저장합니다. `gsub`는 블록이나 해시를 받아 일치하는 패턴마다 동적으로 치환합니다.





---





## 수업 목표





- String의 RString 구조체와 인코딩 관리를 이해합니다.


- 문자열 메서드(gsub/scan/split)의 내부 동작을 이해합니다.


- Onigmo NFA 엔진의 매칭 과정을 이해합니다.


- =~ 연산자와 특수 변수의 관계를 이해합니다.


- 캡처 그룹과 역참조를 이해합니다.





## 문자열 기본





```ruby


# 문자열 생성과 조작


text = "Hello, Ruby!"


puts text.length        # 12 (문자 길이)


puts text.bytesize      # 12 (바이트 길이, ASCII는 동일)


puts text.upcase        # "HELLO, RUBY!"


puts text.downcase      # "hello, ruby!"


puts text.reverse       # "!ybuR ,olleH"


puts text.capitalize    # "Hello, ruby!"


puts text.sub("Ruby", "World")     # "Hello, World!" (첫 번째만)


puts text.gsub(/[aeiou]/, '*')      # "H*ll*, R*by!" (전부)


puts text.gsub(/[aeiou]/, 'A' => '4', 'e' => '3', 'i' => '1', 'o' => '0', 'u' => '7')


# "H4ll0, R7by!"


```





`gsub`는 `Regexp` 패턴이 문자열 내에서 일치하는 모든 위치를 찾아 치환합니다. 블록 없이 해시를 전달하면, 일치한 문자열을 해시의 키로 조회하여 값을 치환합니다. `gsub(/[aeiou]/, { 'A' => '4', 'e' => '3' })`에서 각 일치에 대해 해시 lookup이 수행됩니다. `sub`는 첫 번째 일치만 치환하고, `gsub`는 전역(global) 치환합니다.





## 정규표현식





```ruby


# 정규표현식 리터럴


pattern = /Ruby/


pattern = %r{Ruby}       # 다른 구분자


pattern = /Ruby/i        # 대소문자 무시


pattern = /^R.*y$/m      # 멀티라인 모드





# 매칭


puts /Ruby/ === "Hello, Ruby!"   # true (=== 연산자)


puts /Ruby/ =~ "Hello, Ruby!"    # 7 (일치 위치, 0-based)


puts /Python/ =~ "Hello, Ruby!"  # nil (불일치)





match = "Hello, Ruby!".match(/Ruby/)


puts match[0]            # "Ruby"


puts match.pre_match     # "Hello, "


puts match.post_match    # "!"





# 캡처 그룹


text = "2024-07-15"


pattern = /(\d{4})-(\d{2})-(\d{2})/


if m = text.match(pattern)


  puts m[1]  # "2024"


  puts m[2]  # "07"


  puts m[3]  # "15"


end





# 특수 변수


if text =~ pattern


  puts $1   # "2024"  (첫 번째 캡처)


  puts $2   # "07"    (두 번째 캡처)


  puts $&   # "2024-07-15" (일치한 전체 문자열)


  puts $`   # ""      (일치 이전)


  puts $'  # ""      (일치 이후)


end


```





`/Ruby/ =~ "Hello, Ruby!"`는 Ruby의 `=~` 연산자가 호출됩니다. 이 연산자는 정규표현식을 컴파일하고 문자열과 매칭을 시도합니다. 일치하면 일치 위치(0부터 시작)를 반환하고, 일치하지 않으면 nil을 반환합니다. `=~`는 부작용으로 `$1`, `$2`, `$&`, `` $` ``, `$'` 등의 특수 전역 변수와 `$~`(MatchData 객체)를 설정합니다. `Regexp#match`는 `MatchData` 객체를 반환하여 더 안전하고 객체 지향적인 방식으로 결과에 접근합니다.





### 고급 패턴





```ruby


# 명명된 캡처 (Ruby 1.9+)


pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/


if m = "2024-07-15".match(pattern)


  puts m[:year]   # "2024"


  puts m[:month]  # "07"


  puts m[:day]    # "15"


end





# scan


text = "apple banana apple cherry"


text.scan(/\w+/) { |word| puts word }


puts text.scan(/\w+/).join(", ")  # "apple, banana, apple, cherry"





# split


puts "a,b,c,d".split(",")       # ["a", "b", "c", "d"]


puts "a,b,c,d".split(",", 3)     # ["a", "b", "c,d"] (3개로 제한)





# 긍정/부정 전방탐색


puts "$10 $20 $30".gsub(/\$(\d+)/) { |m| "#{m} (#{($1.to_i * 1100).to_s}원)" }


# "$10 (11000원) $20 (22000원) $30 (33000원)"


```





`scan`은 패턴과 일치하는 모든 부분을 배열로 반환하거나, 블록과 함께 사용하면 각 일치에 대해 블록을 실행합니다. 캡처 그룹이 있으면 2차원 배열을 반환합니다. `split`의 두 번째 인자는 분할할 최대 개수를 지정합니다. 긍정 전방탐색(`(?=...)`)과 부정 전방탐색(`(?!...)`)은 일치 자체에는 포함되지 않으면서, 뒤따르는 패턴을 확인할 때 사용합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: String의 length와 bytesize의 차이는 무엇인가요?</strong></summary>





`length`는 **문자의 개수**를 반환합니다(UTF-8에서 한글은 1글자). `bytesize`는 문자열이 메모리에서 차지하는 **바이트 수**를 반환합니다(UTF-8에서 한글은 보통 3바이트). `"안녕".length`는 2, `"안녕".bytesize`는 6입니다. ASCII 문자만 있는 경우 두 값이 같습니다. `size`는 `length`의 alias입니다.


</details>





<details>


<summary><strong>Q: Onigmo 정규표현식 엔진은 어떻게 동작하나요?</strong></summary>





Onigmo(Oniguruma - Modern)는 Ruby 2.0부터 사용되는 정규표현식 엔진입니다. 패턴을 NFA(Nondeterministic Finite Automaton)로 컴파일한 후, 입력 문자열을 왼쪽에서 오른쪽으로 스캔하며 백트래킹(backtracking)으로 매칭을 시도합니다. NFA는 DFA(Deterministic Finite Automaton)보다 느릴 수 있지만, 역참조(backreference), 전방탐색(lookahead), 후방탐색(lookbehind) 등 확장 기능을 지원합니다. 성능이 중요한 경우, 복잡한 패턴에서 `Atomic Group(?>...)`을 사용하여 백트래킹을 제한할 수 있습니다.


</details>





<details>


<summary><strong>Q: gsub 블록과 gsub 해시의 성능 차이는 있나요?</strong></summary>





`gsub`에 해시를 전달하면 각 일치에 대해 해시 조회(O(1) 평균)만 수행하므로 매우 빠릅니다. 블록을 전달하면 각 일치마다 Ruby 코드를 실행하므로 상대적으로 느립니다. 1000번 일치하는 경우 해시 버전이 블록 버전보다 5~10배 빠를 수 있습니다. 사전에 정의된 치환 맵이 있으면 해시를, 동적인 치환 로직이 필요하면 블록을 사용합니다.


</details>





<details>


<summary><strong>Q: named captures(명명된 캡처)는 일반 캡처와 어떻게 다른가요?</strong></summary>





명명된 캡처는 `(?<name>...)` 문법으로, 캡처 그룹에 이름을 부여합니다. `m[:name]`으로 접근하여 위치(index) 대신 이름으로 결과를 참조할 수 있습니다. 가독성이 좋고, 그룹 순서가 변경되어도 코드 수정이 필요 없습니다. 명명된 캡처는 해시처럼 동작하므로 `m.names`로 모든 그룹 이름을 배열로 얻을 수 있습니다. 명명된 캡처와 일반(숫자) 캡처는 혼용할 수 있습니다.


</details>





<details>


<summary><strong>Q: 문자열 인터폴레이션(String interpolation)은 어떻게 동작하나요?</strong></summary>





`"Hello, #{name}!"`에서 `#{...}`는 Ruby 파서가 `DSTR`(dynamic string) 노드와 `EVSTR`(embedded value) 노드로 파싱합니다. 실행 시 `name` 변수를 평가하여 `to_s`로 문자열로 변환한 후, 문자열의 해당 위치에 삽입합니다(Java의 StringBuilder와 유사). 내부적으로는 `rb_str_append()`와 `rb_str_cat()`가 호출되어 문자열을 효율적으로 결합합니다. 여러 개의 `#{...}`가 있으면 각각 분할되어 개별적으로 평가됩니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **String** | 문자열 데이터 | RString 구조체 + 인코딩 플래그 |


| **length/bytesize** | 문자/바이트 길이 | Encoding 클래스로 문자 단위 계산 |


| **gsub/sub** | 문자열 치환 | Regexp 매칭 → 일치 위치 치환 (블록/해시 지원) |


| **Regexp** | 정규표현식 | Onigmo NFA 엔진 → 백트래킹 매칭 |


| **=~** | 패턴 매칭 연산자 | 일치 위치 반환 + $1/$~/MatchData 설정 |


| **scan/split** | 문자열 분할 | 패턴 기반 분할/추출 |





## 다음 수업





다음 글에서는 Ruby의 심볼과 범위 — Symbol의 ID 매핑과 Range의 내부 구조를 배웁니다.



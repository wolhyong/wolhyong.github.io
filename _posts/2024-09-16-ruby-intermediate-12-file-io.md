---


layout: post


title: "Ruby 파일 I/O — File/IO/Dir 클래스, 블록 기반 파일 처리, Marshal/YAML/JSON 직렬화"


description: "Ruby의 파일 입출력 시스템을 시스템 레벨에서 심층 학습합니다. File.read/File.write가 C 레벨에서 fopen/fread/fwrite/fclose를 호출하여 파일을 열고 읽고 쓰는 과정, File.open 블록 형식이 ensure로 close를 자동 호출하는 편의 메서드의 내부 구현, IO#gets/IO#read/IO#readline이 파일 포인터를 이동시키며 EOF(End of File)를 검사하는 방식, Dir.glob이 Dir['**/*.rb']로 파일 시스템을 재귀적으로 탐색하는 패턴 매칭 과정, Marshal.dump가 객체 그래프를 순회하며 각 객체의 클래스와 인스턴스 변수를 바이트 스트림으로 직렬화하는 과정(단, Proc/Binding/Singleton은 직렬화 불가), YAML과 JSON 모듈이 각각 Psych/oj 라이브러리를 통해 사람이 읽을 수 있는 형식으로 직렬화하는 방식을 다룹니다."


date: 2024-09-16 10:00:00 +0900


category: ruby


tags: [ruby, file-io, file, dir, io, serialization, marshal, yaml, json]


level: intermediate


---





Ruby의 파일 I/O 시스템과 직렬화 라이브러리는 데이터 영속성의 기초입니다.





> **핵심 정리** · `File.read`는 C 레벨의 `fopen`/`fread`를 호출합니다. `File.open` 블록 형식은 `ensure`로 close를 자동 호출합니다. `Dir.glob`으로 파일 시스템을 패턴 매칭합니다. `Marshal.dump`는 객체 그래프를 바이트 스트림으로 직렬화합니다(단, Proc/Binding/Singleton 제외). `YAML`/`JSON`은 Psych/oj 라이브러리로 사람이 읽을 수 있는 형식으로 직렬화합니다.





---





## 수업 목표





- File.read/write의 C 레벨 입출력을 이해합니다.


- File.open 블록의 자동 close를 이해합니다.


- IO의 파일 포인터와 EOF를 이해합니다.


- Dir.glob의 패턴 매칭을 이해합니다.


- Marshal/YAML/JSON 직렬화의 차이를 이해합니다.





## 파일 읽기와 쓰기





```ruby


# 파일 읽기 (한 번에 전체)


content = File.read('hello.txt')





# 파일 쓰기 (한 번에 전체)


File.write('output.txt', "Hello, Ruby!


")





# 블록을 사용한 파일 처리 (자동 close)


File.open('hello.txt', 'r') do |file|


  file.each_line { |line| puts line }


end





# 쓰기 모드


File.open('output.txt', 'w') do |file|


  file.puts "Line 1"


  file.puts "Line 2"


  file.print "No newline"


  file.write "Also no newline


"


end





# 바이너리 모드


File.open('image.jpg', 'rb') do |file|


  data = file.read


  puts "크기: #{data.bytesize} bytes"


end





# 파일 포인터 이동


File.open('data.txt', 'r') do |file|


  puts file.read(5)   # 처음 5바이트 읽기


  puts file.pos       # 현재 위치: 5


  file.seek(0, IO::SEEK_SET)  # 처음으로 이동


  puts file.read(5)   # 다시 처음 5바이트


end


```





`File.read`는 C 레벨에서 `fopen()`으로 파일을 열고 `fread()`로 전체 내용을 버퍼에 읽은 후 `fclose()`합니다. `File.open` 블록 형식은 `ensure` 블록에서 `close`를 호출하므로, 예외가 발생해도 파일이 안전하게 닫힙니다. `File.open('output.txt', 'w')`에서 모드 문자열은 C의 `fopen` 모드와 동일합니다: `r`(읽기), `w`(쓰기, 기존 파일 덮어쓰기), `a`(추가), `r+`(읽기/쓰기), `b`(바이너리).





## Marshal/YAML/JSON 직렬화





```ruby


require 'json'


require 'yaml'





# Marshal 직렬화 (바이너리, Ruby 전용)


data = { name: "Ruby", version: 3.3, features: [:yjit, :ractor] }


serialized = Marshal.dump(data)


puts serialized.bytesize  # 68 bytes


restored = Marshal.load(serialized)


puts restored[:name]      # "Ruby"





# JSON 직렬화 (텍스트, 언어 중립)


json = data.to_json


puts json  # {"name":"Ruby","version":3.3,"features":["yjit","ractor"]}


parsed = JSON.parse(json)


puts parsed["name"]  # "Ruby" (키가 문자열)





# YAML 직렬화 (텍스트, 가독성)


yaml = data.to_yaml


puts yaml


# ---


# :name: Ruby


# :version: 3.3


# :features:


#   - :yjit


#   - :ractor


restored_yaml = YAML.safe_load(yaml)


puts restored_yaml[:name]  # "Ruby"


```





`Marshal.dump`는 Ruby 객체 그래프를 순회하며 바이트 스트림으로 직렬화합니다. 각 객체의 클래스와 인스턴스 변수를 재귀적으로 기록합니다. 동일한 객체 참조가 여러 번 나타나면 두 번째부터는 참조 ID만 기록합니다(객체 공유 보존). 하지만 `Proc`, `Binding`, `IO`, `Singleton` 객체, `익명 클래스`는 직렬화할 수 없습니다. `JSON`은 키가 문자열로 변환되고(Symbol→String), `YAML`은 심볼을 그대로 유지합니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: Marshal, JSON, YAML 중 어떤 것을 선택해야 하나요?</strong></summary>





Ruby 내부 데이터를 저장/전송할 때는 **Marshal**이 가장 빠르고 효율적입니다(바이너리, Ruby 객체 구조 유지). 다른 언어/시스템과 데이터를 교환할 때는 **JSON**이 표준입니다(언어 중립, 가볍고 빠름). 사람이 읽고 편집해야 하는 설정 파일에는 **YAML**이 좋습니다(가독성, 주석 지원). 단, Marshal.load는 신뢰할 수 없는 데이터를 역직렬화할 때 보안 위험이 있으므로(객체 주입 공격), 외부 데이터에는 YAML.safe_load나 JSON.parse를 사용합니다.


</details>





<details>


<summary><strong>Q: File.open 블록 형식과 직접 open/close의 차이는 무엇인가요?</strong></summary>





블록 형식은 `ensure`로 close를 자동 호출합니다. 직접 `file = File.open(...) ... file.close`는 예외 발생 시 close가 호출되지 않아 파일 디스크립터 누수가 발생할 수 있습니다. 블록 형식은 내부적으로 `begin/rescue/ensure`로 래핑되어 있어, 예외가 발생해도 `file.close`가 항상 호출됩니다. 블록 형식을 사용하는 것이 Ruby의 관용적이고 안전한 방법입니다.


</details>





<details>


<summary><strong>Q: Dir.glob과 Dir['**/*']의 차이는 무엇인가요?</strong></summary>





`Dir.glob`은 파일 시스템에서 패턴과 일치하는 모든 경로를 배열로 반환합니다. `Dir['**/*.rb']`는 `Dir.glob`의 문법 설탕입니다. `*`는 한 디렉토리 내의 모든 파일, `**`는 모든 하위 디렉토리를 재귀적으로 탐색합니다. `Dir.glob('src/**/*.rb')`는 `src/` 아래 모든 `.rb` 파일을 찾습니다. `File.fnmatch`와 `File.fnmatch?`로 개별 파일명 패턴 매칭을 확인할 수 있습니다.


</details>





<details>


<summary><strong>Q: IO 객체의 파일 포인터는 어떻게 동작하나요?</strong></summary>





IO 객체는 내부적으로 C의 `FILE*` 포인터를 래핑합니다. `file.pos`로 현재 위치를 알 수 있고, `file.seek(offset, whence)`로 위치를 이동합니다. `whence`는 `IO::SEEK_SET`(처음), `IO::SEEK_CUR`(현재 위치), `IO::SEEK_END`(끝)의 세 가지가 있습니다. `file.read(n)`은 현재 위치부터 n바이트를 읽고 포인터를 n만큼 이동시킵니다. `file.rewind`는 포인터를 처음으로 되돌립니다.


</details>





<details>


<summary><strong>Q: Marshal.load의 보안 위험은 무엇인가요?</strong></summary>





`Marshal.load`는 역직렬화 시 객체를 생성하고 초기화하는 과정에서 임의의 코드를 실행할 수 있습니다. 공격자가 조작된 Marshal 데이터를 보내면, `CLASS`나 `MODULE` 태그를 통해 예상치 못한 클래스를 인스턴스화하거나 `_load`/`_dump` 후크를 통해 임의 코드를 실행할 수 있습니다. 따라서 **신뢰할 수 없는 출처의 Marshal 데이터는 절대 load하면 안 됩니다**. JSON.parse나 YAML.safe_load를 대신 사용합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **File.read** | 파일 전체 읽기 | fopen → fread → fclose |


| **File.open 블록** | 자동 close | begin/rescue/ensure로 래핑 |


| **IO#seek** | 파일 포인터 이동 | fseek(offset, whence) |


| **Dir.glob** | 파일 패턴 매칭 | fnmatch로 재귀 탐색 |


| **Marshal** | 바이너리 직렬화 | 객체 그래프 순회 → 바이트 스트림 |


| **JSON/YAML** | 텍스트 직렬화 | oj/Psych 라이브러리 변환 |





## 다음 수업





다음 글에서는 Proc과 Lambda의 심층 — 클로저, 커링, Binding을 배웁니다.



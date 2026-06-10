---
layout: post
title: "Java I/O — InputStream/OutputStream, Reader/Writer, 버퍼링, NIO, 직렬화"
description: "Java I/O 시스템을 운영체제 레벨까지 심층 학습합니다. InputStream/OutputStream의 데코레이터 패턴(FilterInputStream 체인), Reader/Writer가 바이트 스트림을 문자로 변환하는 인코딩 과정(CharsetDecoder), BufferedInputStream의 내부 버퍼(기본 8KB)와 read()가 fill()로 OS에 추가 읽기 요청하는 과정, NIO의 Channel과 Buffer 구조(Selector가 epoll/kqueue로 다중 I/O 처리), ObjectOutputStream의 직렬화 과정(writeObject가 그래프를 DFS로 탐색)을 다룹니다."
date: 2023-07-10 10:00:00 +0900
category: java
tags: [java, io, inputstream, outputstream, bufferedreader, nio, serialization]
level: intermediate
---

Java I/O는 다양한 데이터 소스에서 입출력을 처리하는 풍부한 API를 제공합니다. 데코레이터 패턴을 기반으로 유연하게 구성할 수 있습니다.

> **💡 핵심 정리** · Java I/O 스트림은 데코레이터 패턴으로 구성되어 `new BufferedInputStream(new FileInputStream("file"))`처럼 기능을 중첩합니다. `BufferedInputStream`은 내부 8KB 버퍼를 유지하며, `read()`가 버퍼 언더플로 시 `fill()`로 OS에 `read()` 시스템 콜을 호출합니다. NIO의 `Selector`는 단일 스레드로 수천 개의 채널을 감시하며, OS 레벨의 `epoll`(Linux) 또는 `kqueue`(macOS)를 사용하여 I/O 이벤트를 통지합니다.

---

## 📚 수업 목표

- 바이트 스트림과 문자 스트림의 차이를 이해합니다.
- 데코레이터 패턴으로 스트림을 연결하는 방식을 이해합니다.
- 버퍼링의 성능 향상 원리를 이해합니다.
- NIO의 Channel-Buffer-Selector 구조를 이해합니다.
- 객체 직렬화의 동작을 이해합니다.

## 스트림 기본

```java
// 파일 읽기 (데코레이터 패턴)
try (BufferedReader br = new BufferedReader(
        new InputStreamReader(
            new FileInputStream("data.txt"), "UTF-8"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}

// 파일 쓰기
try (BufferedWriter bw = new BufferedWriter(
        new OutputStreamWriter(
            new FileOutputStream("output.txt"), "UTF-8"))) {
    bw.write("Hello, Java I/O!");
    bw.newLine();
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: FileReader/FileWriter 대신 InputStreamReader/OutputStreamWriter를 사용해야 하나요?</strong></summary>

네, **명시적으로 인코딩을 지정**할 수 있는 `InputStreamReader`/`OutputStreamWriter`를 권장합니다. `FileReader`/`FileWriter`는 플랫폼 기본 인코딩을 사용하므로, 다른 환경에서 문제가 발생할 수 있습니다. 크로스 플랫폼 애플리케이션에서는 항상 "UTF-8"을 명시적으로 지정하세요.
</details>

<details>
<summary><strong>Q: NIO와 전통 I/O의 가장 큰 차이는 무엇인가요?</strong></summary>

**블로킹 vs 논블로킹**입니다. 전통 I/O는 스레드가 I/O 작업 완료를 기다리는 동안 블로킹됩니다. NIO는 단일 스레드가 Selector로 여러 채널을 감시하면서 I/O 준비가 된 채널만 처리할 수 있습니다(논블로킹). 대용량 연결이 필요한 서버에서는 NIO가 스레드 수를 크게 줄여줍니다.
</details>

<details>
<summary><strong>Q: BufferedInputStream을 사용하면 항상 성능이 좋아지나요?</strong></summary>

대부분의 경우 **네**. 버퍼링 없이 1바이트씩 읽으면 read() 시스템 콜이 매번 발생하여 성능이 크게 저하됩니다. BufferedInputStream은 내부 8KB 버퍼를 사용하여 시스템 콜 횟수를 1/8192로 줄입니다. 하지만 이미 전체 파일을 읽는 `readAllBytes()`나 `Files.readAllLines()`는 내부적으로 최적화되어 있어 별도 버퍼링이 필요 없습니다.
</details>

<details>
<summary><strong>Q: 직렬화에서 serialVersionUID의 역할은 무엇인가요?</strong></summary>

`serialVersionUID`는 직렬화된 객체의 **클래스 버전을 식별**합니다. 역직렬화 시 저장된 객체의 UID와 현재 클래스의 UID가 일치하지 않으면 `InvalidClassException`이 발생합니다. 명시적으로 선언하지 않으면 컴파일러가 클래스 구조를 기반으로 자동 생성합니다. 클래스 구조가 변경되면 자동 생성된 UID도 변경되므로, **명시적으로 선언하는 것이 좋습니다**.
</details>

<details>
<summary><strong>Q: Files 클래스(Java 7+)를 사용해야 하는 이유는 무엇인가요?</strong></summary>

`java.nio.file.Files`는 **더 간결하고 강력한 I/O API**를 제공합니다. `Files.readAllLines()`, `Files.write()`, `Files.copy()`, `Files.move()`, `Files.walk()` 등 한 줄로 파일 전체를 읽고 쓸 수 있습니다. 또한 심볼릭 링크, 파일 속성, 파일 트리 탐색 등 고급 기능을 지원합니다. Java 8+ 스트림과의 결합이 자연스럽습니다.
</details>

---

## 요약

- **InputStream/OutputStream**: 바이트 단위 입출력, 데코레이터 패턴
- **Reader/Writer**: 문자 단위 입출력, 인코딩 지정 필수
- **버퍼링**: BufferedStream이 시스템 콜 횟수를 1/8192로 감소
- **NIO**: Channel + Buffer + Selector, 논블로킹 I/O
- **직렬화**: ObjectOutputStream/ObjectInputStream, serialVersionUID 관리
- **Files API**: Java 7+ NIO.2, 간결한 파일 조작 메서드

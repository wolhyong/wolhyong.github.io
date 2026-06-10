---
layout: post
title: "Go 파일 입출력 — os.File, io.Reader/Writer 인터페이스, bufio 버퍼링, encoding/csv/json"
description: "Go의 파일 입출력 시스템을 표준 라이브러리 레벨에서 학습합니다. os.OpenFile()이 syscall.Open()을 호출하여 OS의 파일 디스크립터(fd)를 획득하고 os.File 구조체에 래핑하는 과정, io.Reader의 Read(p []byte) (n int, err error) 메서드가 파일 디스크립터를 통해 커널 공간에서 사용자 공간으로 데이터를 복사하는 방식, io.Writer의 Write(p []byte) (n int, err error)가 반대 방향으로 데이터를 쓰는 과정, bufio.Reader/bufio.Writer가 내부 버퍼(기본 4096바이트)를 사용하여 시스템 콜 횟수를 줄이는 버퍼링 기법, io.Copy가 32KB 버퍼로 Reader에서 Writer로 스트리밍 복사하는 sendfile(2) 시스템 콜 활용, encoding/csv와 encoding/json 패키지가 io.Reader/io.Writer 인터페이스를 기반으로 동작하여 스트리밍 읽기/쓰기를 지원하는 방식을 다룹니다."
date: 2025-03-31 10:00:00 +0900
category: go
tags: [go, golang, file-io, reader, writer, bufio, csv, json, streaming]
level: intermediate
---

Go의 입출력은 `io.Reader`와 `io.Writer` 인터페이스를 기반으로 한 통합된 스트리밍 모델을 제공합니다.

> **핵심 정리** · `io.Reader`의 `Read(p []byte)`는 데이터를 읽고, `io.Writer`의 `Write(p []byte)`는 데이터를 씁니다. `os.File`은 이 인터페이스들을 구현합니다. `bufio`는 내부 버퍼(4096바이트)로 시스템 콜을 줄입니다. `io.Copy`는 32KB 버퍼로 스트리밍 복사합니다. `encoding/csv`, `encoding/json`은 Reader/Writer 기반으로 스트리밍을 지원합니다.

## 수업 목표

- os.File을 통한 파일 열기/읽기/쓰기를 이해합니다.
- io.Reader와 io.Writer 인터페이스를 이해합니다.
- bufio 패키지의 버퍼링 원리를 이해합니다.
- io.Copy의 스트리밍 복사를 이해합니다.
- CSV와 JSON의 스트리밍 읽기/쓰기를 이해합니다.

## 파일 입출력 기초

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "os"
)

func main() {
    // 파일 쓰기
    file, err := os.Create("example.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    _, err = file.WriteString("Hello, Go!\n")
    if err != nil {
        panic(err)
    }
    _, err = file.Write([]byte("File I/O example\n"))
    if err != nil {
        panic(err)
    }

    // 파일 읽기 (전체)
    data, err := os.ReadFile("example.txt")
    if err != nil {
        panic(err)
    }
    fmt.Print(string(data))

    // 파일 읽기 (버퍼 단위)
    file2, _ := os.Open("example.txt")
    defer file2.Close()

    buf := make([]byte, 16)
    for {
        n, err := file2.Read(buf)
        if err == io.EOF {
            break
        }
        fmt.Printf("읽음: %q\n", buf[:n])
    }

    // bufio로 읽기
    file3, _ := os.Open("example.txt")
    defer file3.Close()
    scanner := bufio.NewScanner(file3)
    for scanner.Scan() {
        fmt.Println("라인:", scanner.Text())
    }
}
```

`os.Create`와 `os.Open`은 OS 파일 디스크립터를 획득하여 `*os.File`을 반환합니다. `file.WriteString`은 내부적으로 `Write`를 호출하여 파일에 데이터를 씁니다. `file.Read(buf)`는 최대 `len(buf)`만큼 데이터를 읽고 실제 읽은 바이트 수 `n`을 반환합니다. `io.EOF`는 파일의 끝에 도달했음을 알립니다. `bufio.NewScanner`는 줄 단위 읽기를 편리하게 제공합니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: io.Copy는 내부적으로 어떻게 동작하나요?</strong></summary>

`io.Copy(dst Writer, src Reader)`는 32KB 버퍼를 할당하여 `src.Read(buf)` → `dst.Write(buf)`를 반복합니다. Linux에서는 `dst`가 `*os.File`이고 `src`도 `*os.File`이면 `sendfile(2)` 시스템 콜을 사용하여 커널 공간에서 직접 데이터를 복사합니다(user space 복사 생략). macOS는 `copyfile()`, Windows는 `TransmitFile()`을 사용합니다. 따라서 같은 파일 시스템 내의 복사는 매우 효율적입니다. `io.CopyN`은 지정된 바이트 수만 복사하고, `io.CopyBuffer`는 사용자 지정 버퍼를 사용합니다.
</details>

<details>
<summary><strong>Q: bufio의 버퍼 크기는 어떻게 선택하나요?</strong></summary>

`bufio.NewReaderSize(rd, size)`로 버퍼 크기를 지정할 수 있습니다. 기본값은 4096바이트(4KB)입니다. 일반 파일 읽기에는 4KB~64KB가 적절합니다. 네트워크 스트림에는 4KB~16KB가 일반적입니다. 큰 블록을 읽는다면 버퍼 크기를 늘려 시스템 콜을 줄일 수 있습니다. 버퍼가 너무 크면 메모리 낭비이고, 너무 작으면 시스템 콜이 증가합니다. `bufio.NewWriter`의 버퍼는 `Flush()`가 호출될 때까지 데이터를 모아두었다가 한 번에 씁니다. 따라서 자주 `Flush()`를 호출하면 버퍼링의 이점이 사라집니다.
</details>

<details>
<summary><strong>Q: JSON 스트리밍 읽기/쓰기는 어떻게 하나요?</strong></summary>

`encoding/json` 패키지는 `json.NewDecoder(r io.Reader)`와 `json.NewEncoder(w io.Writer)`로 스트리밍 처리를 지원합니다. `decoder.Decode(&v)`는 Reader에서 JSON을 읽고 구조체로 디코딩합니다. `encoder.Encode(v)`는 구조체를 JSON으로 인코딩하여 Writer에 씁니다. 이 방식은 파일 전체를 메모리에 로드하지 않고 처리할 수 있어 대용량 데이터에 적합합니다. 예: `dec := json.NewDecoder(file); for { if err := dec.Decode(&obj); err == io.EOF { break } }`. `json.Marshal`/`json.Unmarshal`은 전체를 메모리에 로드합니다.
</details>

<details>
<summary><strong>Q: os.ReadFile과 bufio.Reader 중 어떤 것을 사용해야 하나요?</strong></summary>

`os.ReadFile`은 **작은 파일**(수 MB 이하)에 적합합니다. 파일 전체를 메모리에 로드하므로 간편하고 빠릅니다. `bufio.Reader`는 **큰 파일**이나 **스트리밍 처리**에 적합합니다. 필요한 만큼만 읽고 처리할 수 있어 메모리 효율적입니다. 선택 기준: (1) 파일 크기가 작고(<10MB) 전체가 필요하면 `os.ReadFile`. (2) 대용량 파일, 라인 단위 처리, 파이프라인 처리에는 `bufio.Scanner` 또는 `bufio.Reader`. (3) 네트워크 스트림은 항상 `bufio.Reader`를 사용합니다.
</details>

<details>
<summary><strong>Q: 파일 잠금(file locking)은 어떻게 구현하나요?</strong></summary>

Go 표준 라이브러리는 크로스 플랫폼 파일 잠금을 직접 제공하지 않습니다. 대신 `golang.org/x/sys`의 `unix.Flock()`(Linux/macOS) 또는 `syscall.LockFileEx()`(Windows)를 사용할 수 있습니다. 더 간단한 방법은 `os.OpenFile`에 플래그를 지정하는 것입니다: `os.O_EXCL`로 파일이 없을 때만 생성하거나, 별도의 잠금 파일(lock file)을 사용하는 패턴입니다. 분산 환경에서는 etcd나 Redis의 분산 잠금을 사용합니다. 파일 잠금이 필요한 경우라면 데이터베이스를 사용하는 것이 더 나은 선택일 수 있습니다.
</details>

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **os.File** | 파일 디스크립터 래퍼 | syscall.Open/Read/Write + fd 관리 |
| **io.Reader/Writer** | 스트리밍 인터페이스 | Read(p []byte) / Write(p []byte) |
| **bufio** | 버퍼링 입출력 | 4096바이트 버퍼, Flush()로 출력 |
| **io.Copy** | 스트리밍 복사 | 32KB 버퍼, sendfile() 활용 |
| **json.Decoder** | JSON 스트리밍 읽기 | Reader → tokenizer → Decode |
| **csv.Reader** | CSV 스트리밍 읽기 | Reader → 필드 파싱 |

## 다음 수업

다음 글에서는 Go 테스팅 — testing 패키지, table-driven tests, coverage, benchmark를 배웁니다.

---
layout: post
title: "C# 파일 I/O — Stream, StreamReader/Writer, File, Directory, 직렬화, JSON 직렬화"
description: "C#의 파일 I/O 시스템을 실무 레벨에서 학습합니다. Stream은 바이트 기반 추상화로 FileStream, MemoryStream, NetworkStream 등을 제공합니다. StreamReader/Writer는 텍스트 기반 I/O를 제공하며 인코딩을 지원합니다. File 클래스는 파일 생성, 복사, 삭제, 이동 등의 정적 메서드를 제공합니다. Directory 클래스는 디렉토리 생성, 삭제, 열거 등의 메서드를 제공합니다. 직렬화는 객체를 바이트로 변환하여 저장하며 BinaryFormatter, JSON 직렬화를 지원합니다. System.Text.Json은 JSON 직렬화/역직렬화를 제공하며 JsonSerializer를 사용합니다. Path 클래스는 파일 경로 조작을 지원하며 Path.Combine, Path.GetFileName 등의 메서드를 제공합니다."
date: 2025-08-22 10:00:00 +0900
category: csharp
tags: [csharp, file-io, stream, streamreader, serialization, json, system-text-json]
level: intermediate
---

C#의 파일 I/O 시스템은 파일과 디렉토리 작업을 위한 풍부한 API를 제공합니다.

> **핵심 정리** · `Stream`은 바이트 기반 추상화입니다. `StreamReader/Writer`는 텍스트 I/O를 제공합니다. `File`/`Directory` 클래스는 파일/디렉토리 작업을 제공합니다. 직렬화로 객체를 저장합니다. `System.Text.Json`으로 JSON 직렬화를 수행합니다.


## 수업 목표

- Stream을 이해하고 사용할 수 있습니다.
- StreamReader/Writer를 사용할 수 있습니다.
- File/Directory 클래스를 이해합니다.
- 직렬화를 이해합니다.
- JSON 직렬화를 사용할 수 있습니다.
- Path 클래스를 이해합니다.

## Stream

```csharp
using System;
using System.IO;
using System.Text;

class Program
{
    static void Main()
    {
        // FileStream - 파일 읽기/쓰기
        string path = "example.txt";
        
        // 쓰기
        using (FileStream fs = new FileStream(path, FileMode.Create))
        {
            byte[] data = Encoding.UTF8.GetBytes("Hello, World!");
            fs.Write(data, 0, data.Length);
        }

        // 읽기
        using (FileStream fs = new FileStream(path, FileMode.Open))
        {
            byte[] buffer = new byte[fs.Length];
            fs.Read(buffer, 0, buffer.Length);
            string content = Encoding.UTF8.GetString(buffer);
            Console.WriteLine(content);
        }

        // MemoryStream - 메모리 스트림
        using (MemoryStream ms = new MemoryStream())
        {
            byte[] data = Encoding.UTF8.GetBytes("Memory Stream");
            ms.Write(data, 0, data.Length);
            ms.Position = 0;  // 위치 초기화
            byte[] buffer = new byte[ms.Length];
            ms.Read(buffer, 0, buffer.Length);
            Console.WriteLine(Encoding.UTF8.GetString(buffer));
        }
    }
}
```

`Stream`은 바이트 기반 추상화입니다. `FileStream`은 파일 I/O, `MemoryStream`은 메모리 I/O, `NetworkStream`은 네트워크 I/O를 제공합니다. `using` 문으로 자동 리소스 해제를 수행합니다.

## StreamReader/Writer

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string path = "example.txt";

        // StreamWriter - 텍스트 쓰기
        using (StreamWriter writer = new StreamWriter(path))
        {
            writer.WriteLine("첫 번째 줄");
            writer.WriteLine("두 번째 줄");
            writer.WriteLine("세 번째 줄");
        }

        // StreamReader - 텍스트 읽기
        using (StreamReader reader = new StreamReader(path))
        {
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                Console.WriteLine(line);
            }
        }

        // 전체 읽기
        using (StreamReader reader = new StreamReader(path))
        {
            string content = reader.ReadToEnd();
            Console.WriteLine($"전체 내용:\n{content}");
        }
    }
}
```

`StreamWriter`는 텍스트 쓰기를 제공합니다. 인코딩을 지정할 수 있으며 자동으로 버퍼링합니다. `StreamReader`는 텍스트 읽기를 제공합니다. `ReadLine`으로 줄 단위로, `ReadToEnd`로 전체를 읽습니다.

## File 클래스

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string source = "source.txt";
        string destination = "destination.txt";

        // 파일 생성 및 쓰기
        File.WriteAllText(source, "Hello, World!");

        // 파일 존재 확인
        bool exists = File.Exists(source);
        Console.WriteLine($"파일 존재: {exists}");

        // 파일 복사
        File.Copy(source, destination, true);

        // 파일 이동
        File.Move(destination, "moved.txt");

        // 파일 삭제
        File.Delete("moved.txt");

        // 파일 읽기
        string content = File.ReadAllText(source);
        Console.WriteLine(content);

        // 파일 정보
        FileInfo info = new FileInfo(source);
        Console.WriteLine($"크기: {info.Length} 바이트");
        Console.WriteLine($"생성일: {info.CreationTime}");
    }
}
```

`File` 클래스는 파일 작업을 위한 정적 메서드를 제공합니다. `Create`, `Delete`, `Copy`, `Move`, `Exists`, `ReadAllText`, `WriteAllText` 등이 있습니다. 간단한 파일 작업에 유용합니다.

## Directory 클래스

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string path = "testdir";

        // 디렉토리 생성
        Directory.CreateDirectory(path);

        // 디렉토리 존재 확인
        bool exists = Directory.Exists(path);
        Console.WriteLine($"디렉토리 존재: {exists}");

        // 하위 디렉토리 생성
        Directory.CreateDirectory(Path.Combine(path, "subdir"));

        // 파일 생성
        File.WriteAllText(Path.Combine(path, "file.txt"), "Hello");

        // 파일 열거
        string[] files = Directory.GetFiles(path);
        Console.WriteLine("파일:");
        foreach (string file in files)
        {
            Console.WriteLine(Path.GetFileName(file));
        }

        // 하위 디렉토리 열거
        string[] dirs = Directory.GetDirectories(path);
        Console.WriteLine("디렉토리:");
        foreach (string dir in dirs)
        {
            Console.WriteLine(Path.GetFileName(dir));
        }

        // 디렉토리 삭제 (재귀)
        Directory.Delete(path, true);
    }
}
```

`Directory` 클래스는 디렉토리 작업을 위한 정적 메서드를 제공합니다. `CreateDirectory`, `Delete`, `Exists`, `GetFiles`, `GetDirectories` 등이 있습니다. `Delete`의 두 번째 인자로 재귀 삭제를 지정할 수 있습니다.

## Path 클래스

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string path = @"C:\Users\Wolhyong\Documents\file.txt";

        // 경로 조합
        string combined = Path.Combine("folder", "subfolder", "file.txt");
        Console.WriteLine($"조합: {combined}");

        // 파일 이름
        string fileName = Path.GetFileName(path);
        Console.WriteLine($"파일 이름: {fileName}");

        // 확장자
        string extension = Path.GetExtension(path);
        Console.WriteLine($"확장자: {extension}");

        // 디렉토리 이름
        string directory = Path.GetDirectoryName(path);
        Console.WriteLine($"디렉토리: {directory}");

        // 파일 이름 (확장자 없음)
        string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(path);
        Console.WriteLine($"파일 이름 (확장자 없음): {fileNameWithoutExtension}");

        // 루트 디렉토리
        string root = Path.GetPathRoot(path);
        Console.WriteLine($"루트: {root}");

        // 임시 파일 경로
        string tempFile = Path.GetTempFileName();
        Console.WriteLine($"임시 파일: {tempFile}");
    }
}
```

`Path` 클래스는 파일 경로 조작을 위한 정적 메서드를 제공합니다. `Combine`, `GetFileName`, `GetExtension`, `GetDirectoryName` 등이 있습니다. 플랫폼 독립적인 경로 조작을 제공합니다.

## 직렬화

```csharp
using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

[Serializable]
class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public override string ToString()
    {
        return $"{Name}, {Age}세";
    }
}

class Program
{
    static void Main()
    {
        Person person = new Person { Name = "Wolhyong", Age = 30 };
        string path = "person.dat";

        // 직렬화
        BinaryFormatter formatter = new BinaryFormatter();
        using (FileStream fs = new FileStream(path, FileMode.Create))
        {
            formatter.Serialize(fs, person);
        }

        // 역직렬화
        using (FileStream fs = new FileStream(path, FileMode.Open))
        {
            Person deserialized = (Person)formatter.Deserialize(fs);
            Console.WriteLine(deserialized);
        }
    }
}
```

직렬화는 객체를 바이트로 변환하여 저장합니다. `[Serializable]` 속성으로 직렬화 가능한 클래스를 표시합니다. `BinaryFormatter`로 바이너리 직렬화를 수행합니다. 하지만 보안 문제로 권장되지 않습니다.

## JSON 직렬화

```csharp
using System;
using System.Text.Json;

class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public override string ToString()
    {
        return $"{Name}, {Age}세";
    }
}

class Program
{
    static void Main()
    {
        Person person = new Person { Name = "Wolhyong", Age = 30 };

        // 직렬화
        string json = JsonSerializer.Serialize(person, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        Console.WriteLine(json);

        // 역직렬화
        Person deserialized = JsonSerializer.Deserialize<Person>(json);
        Console.WriteLine(deserialized);

        // 파일에 저장
        string path = "person.json";
        File.WriteAllText(path, json);

        // 파일에서 읽기
        string fileJson = File.ReadAllText(path);
        Person filePerson = JsonSerializer.Deserialize<Person>(fileJson);
        Console.WriteLine(filePerson);
    }
}
```

`System.Text.Json`은 JSON 직렬화/역직렬화를 제공합니다. `JsonSerializer.Serialize`로 직렬화하고 `JsonSerializer.Deserialize`로 역직렬화합니다. `JsonSerializerOptions`로 포맷과 인코딩을 제어합니다. 권장되는 직렬화 방식입니다.

## 비동기 파일 I/O

```csharp
using System;
using System.IO;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        string path = "example.txt";

        // 비동기 쓰기
        await File.WriteAllTextAsync(path, "Hello, Async World!");

        // 비동기 읽기
        string content = await File.ReadAllTextAsync(path);
        Console.WriteLine(content);

        // 비동기 스트림
        using (StreamWriter writer = new StreamWriter(path))
        {
            await writer.WriteLineAsync("비동기 라인 1");
            await writer.WriteLineAsync("비동기 라인 2");
        }

        using (StreamReader reader = new StreamReader(path))
        {
            string line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                Console.WriteLine(line);
            }
        }
    }
}
```

비동기 파일 I/O는 `File.WriteAllTextAsync`, `File.ReadAllTextAsync` 등의 메서드를 제공합니다. `StreamWriter`와 `StreamReader`도 비동기 메서드를 지원합니다. UI 스레드를 블로킹하지 않고 파일 I/O를 수행할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Stream과 StreamReader 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Stream`은 바이트 기반 I/O에 사용합니다. 이미지, 바이너리 파일 등. `StreamReader`는 텍스트 기반 I/O에 사용합니다. 텍스트 파일, CSV, JSON 등. 인코딩 처리가 필요하면 `StreamReader`를 사용합니다.
</details>

<details>
<summary><strong>Q> File 클래스와 FileStream 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`File` 클래스는 간단한 파일 작업에 사용합니다. 전체 읽기/쓰기, 존재 확인 등. `FileStream`은 더 세밀한 제어가 필요할 때 사용합니다. 버퍼링, 파일 모드, 공유 모드 등. 대부분의 경우 `File` 클래스로 충분합니다.
</details>

<details>
<summary><strong>Q> BinaryFormatter는 왜 권장되지 않나요?</strong></summary>

`BinaryFormatter`는 보안 문제가 있습니다. 역직렬화 시 임의 코드 실행이 가능합니다. .NET Core 이후에서는 기본적으로 제공되지 않습니다. 대신 `System.Text.Json`, `protobuf`, `MessagePack` 등을 사용해야 합니다.
</details>

<details>
<summary><strong>Q> Path.Combine은 왜 사용해야 하나요?</strong></summary>

`Path.Combine`은 플랫폼 독립적인 경로 조작을 제공합니다. Windows와 Linux의 경로 구분자(`\` vs `/`)를 자동으로 처리합니다. 하드코딩된 경로 구분자 대신 사용해야 합니다. 크로스 플랫폼 호환성을 보장합니다.
</details>

<details>
<summary><strong>Q> 비동기 파일 I/O는 언제 사용해야 하나요?</strong></summary>

비동기 파일 I/O는 UI 애플리케이션이나 서버 애플리케이션에서 사용합니다. 스레드를 블로킹하지 않고 파일 I/O를 수행할 수 있습니다. 대용량 파일 처리에 유용합니다. `async`/`await` 패턴과 통합됩니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Stream** | 바이트 기반 추상화 | FileStream, MemoryStream |
| **StreamReader** | 텍스트 읽기 | 인코딩 지원 |
| **StreamWriter** | 텍스트 쓰기 | 자동 버퍼링 |
| **File** | 파일 작업 정적 메서드 | 간단한 작업 |
| **Directory** | 디렉토리 작업 정적 메서드 | 생성, 삭제, 열거 |
| **Path** | 경로 조작 | 플랫폼 독립 |
| **직렬화** | 객체 → 바이트 | 저장/전송 |
| **BinaryFormatter** | 바이너리 직렬화 | 보안 문제 |
| **System.Text.Json** | JSON 직렬화 | 권장 방식 |
| **비동기 I/O** | async 메서드 | 블로킹 없음 |


## 다음 수업

다음 글에서는 C# 중급 — 리플렉션, 특성, 동적 타입, dynamic 키워드를 배웁니다.

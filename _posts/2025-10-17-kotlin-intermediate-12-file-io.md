---
layout: post
title: "Kotlin 파일 I/O — File, Stream, BufferedReader/Writer, 직렬화, JSON 직렬화"
description: "Kotlin의 파일 I/O 시스템을 실무 레벨에서 학습합니다. File 클래스는 파일 생성, 삭제, 복사, 이동 등의 작업을 제공합니다. BufferedReader/Writer는 텍스트 기반 I/O를 제공하며 use 함수로 자동 리소스 해제를 지원합니다. 직렬화는 객체를 바이트로 변환하여 저장하며 Serializable 인터페이스를 사용합니다. JSON 직렬화는 kotlinx.serialization 라이브러리를 사용하며 @Serializable 어노테이션으로 직렬화를 지정합니다. Path 클래스는 파일 경로 조작을 지원하며 Paths.get()로 경로를 생성합니다. Kotlin은 Java의 java.io와 java.nio 패키지를 활용합니다."
date: 2025-10-17 10:00:00 +0900
category: kotlin
tags: [kotlin, file-io, streams, serialization, json, kotlinx-serialization]
level: intermediate
---

Kotlin의 파일 I/O 시스템은 Java의 표준 라이브러리를 활용하며 간결하고 안전한 API를 제공합니다.

> **핵심 정리** · `File` 클래스는 파일 작업을 제공합니다. `BufferedReader`/`Writer`는 텍스트 I/O를 제공합니다. `use` 함수로 자동 리소스 해제를 지원합니다. `Serializable`로 직렬화를 지원합니다. `kotlinx.serialization`으로 JSON 직렬화를 수행합니다. `Path`로 경로 조작을 지원합니다.


## 수업 목표

- File 클래스를 이해합니다.
- BufferedReader/Writer를 사용할 수 있습니다.
- 직렬화를 이해합니다.
- JSON 직렬화를 사용할 수 있습니다.
- Path 클래스를 이해합니다.
- use 함수를 이해합니다.

## File 클래스

```kotlin
import java.io.File

// 파일 생성 및 쓰기
val file = File("example.txt")
file.writeText("Hello, World!")

// 파일 읽기
val content = file.readText()
println(content)  // Hello, World!

// 파일 존재 확인
val exists = file.exists()
println(exists)  // true

// 파일 삭제
file.delete()

// 파일 복사
val source = File("source.txt")
val destination = File("destination.txt")
source.copyTo(destination, overwrite = true)

// 파일 이동
val fileToMove = File("file.txt")
val target = File("target.txt")
fileToMove.renameTo(target)
```

`File` 클래스는 파일 작업을 제공합니다. `writeText`, `readText`로 텍스트를 읽고 씁니다. `exists`, `delete`, `copyTo`, `renameTo` 등의 메서드를 제공합니다.

## BufferedReader/Writer

```kotlin
import java.io.*

// BufferedWriter로 쓰기
val writer = File("example.txt").bufferedWriter()
writer.use {
    it.write("첫 번째 줄")
    it.newLine()
    it.write("두 번째 줄")
}

// BufferedReader로 읽기
val reader = File("example.txt").bufferedReader()
reader.use {
    var line: String?
    while (it.readLine().also { line = it } != null) {
        println(line)
    }
}

// 전체 읽기
val allLines = File("example.txt").readLines()
println(allLines)
```

`BufferedWriter`는 텍스트 쓰기를 제공합니다. `BufferedReader`는 텍스트 읽기를 제공합니다. `use` 함수로 자동 리소스 해제를 수행합니다. `readLines`로 전체 줄을 읽습니다.

## Path 클래스

```kotlin
import java.nio.file.*

// Path 생성
val path = Paths.get("folder", "subfolder", "file.txt")
println(path)  // folder/subfolder/file.txt

// 파일 이름
val fileName = path.fileName
println(fileName)  // file.txt

// 부모 경로
val parent = path.parent
println(parent)  // folder/subfolder

// 루트 디렉토리
val root = path.root
println(root)

// 절대 경로
val absolutePath = path.toAbsolutePath()
println(absolutePath)

// 경로 결합
val combined = Paths.get("folder", "file.txt")
println(combined)  // folder/file.txt
```

`Path` 클래스는 파일 경로 조작을 제공합니다. `Paths.get`로 경로를 생성합니다. `fileName`, `parent`, `root`로 경로 정보를 가져옵니다. `toAbsolutePath`로 절대 경로를 가져옵니다.

## 직렬화

```kotlin
import java.io.*

// Serializable 구현
@Serializable
data class Person(val name: String, val age: Int)

// 직렬화
val person = Person("Wolhyong", 30)
val file = File("person.dat")

ObjectOutputStream(file.outputStream()).use { it.writeObject(person) }

// 역직렬화
val deserialized = ObjectInputStream(file.inputStream()).use { it.readObject() as Person }
println(deserialized)  // Person(name=Wolhyong, age=30)
```

`Serializable` 인터페이스로 직렬화를 지원합니다. `ObjectOutputStream`로 직렬화하고 `ObjectInputStream`으로 역직렬화합니다. `use` 함수로 자동 리소스 해제를 수행합니다.

## JSON 직렬화

```kotlin
import kotlinx.serialization.*
import kotlinx.serialization.json.*

// JSON 직렬화 설정
@Serializable
data class Person(val name: String, val age: Int)

val json = Json { ignoreUnknownKeys = true }

// 직렬화
val person = Person("Wolhyong", 30)
val jsonString = json.encodeToString(person)
println(jsonString)  // {"name":"Wolhyong","age":30}

// 역직렬화
val decodedPerson = json.decodeFromString<Person>(jsonString)
println(decodedPerson)  // Person(name=Wolhyong, age=30)

// 파일에 저장
File("person.json").writeText(jsonString)

// 파일에서 읽기
val fileJson = File("person.json").readText()
val filePerson = json.decodeFromString<Person>(fileJson)
println(filePerson)
```

`kotlinx.serialization` 라이브러리로 JSON 직렬화를 수행합니다. `@Serializable` 어노테이션으로 직렬화를 지정합니다. `Json`로 직렬화/역직렬화를 수행합니다. 파일에 저장하고 읽을 수 있습니다.

## 디렉토리 작업

```kotlin
import java.io.File

// 디렉토리 생성
val dir = File("testdir")
dir.mkdirs()

// 디렉토리 존재 확인
val exists = dir.exists()
println(exists)  // true

// 파일 생성
val file = File(dir, "file.txt")
file.writeText("Hello")

// 디렉토리 내 파일 열거
val files = dir.listFiles()
files?.forEach { println(it.name) }

// 하위 디렉토리 열거
val subdirs = dir.listFiles { it.isDirectory }
subdirs?.forEach { println(it.name) }

// 디렉토리 삭제 (재귀)
dir.deleteRecursively()
```

`mkdirs`로 디렉토리를 생성합니다. `listFiles`로 파일과 하위 디렉토리를 열거합니다. `deleteRecursively`로 재귀 삭제를 수행합니다.

## 비동기 파일 I/O

```kotlin
import kotlinx.coroutines.*
import java.io.File

// 비동기 파일 읽기
suspend fun readFileAsync(path: String): String = withContext(Dispatchers.IO) {
    File(path).readText()
}

// 비동기 파일 쓰기
suspend fun writeFileAsync(path: String, content: String) = withContext(Dispatchers.IO) {
    File(path).writeText(content)
}

fun main() = runBlocking {
    val content = readFileAsync("example.txt")
    println(content)

    writeFileAsync("example.txt", "Hello, Async World!")
}
```

비동기 파일 I/O는 `withContext(Dispatchers.IO)`로 수행합니다. `Dispatchers.IO`는 I/O 작업에 최적화된 스레드 풀입니다. UI 스레드를 블로킹하지 않고 파일 I/O를 수행할 수 있습니다.

## use 함수

```kotlin
import java.io.*

// use 함수로 자동 리소스 해제
File("example.txt").bufferedWriter().use { writer ->
    writer.write("Hello")
    writer.newLine()
    writer.write("World")
}
// writer는 자동으로 close됨
```

`use` 함수는 `AutoCloseable`을 구현한 객체의 자동 리소스 해제를 제공합니다. 범위 종료 시 `close()`가 자동으로 호출됩니다. 파일, 스트림 등에 사용됩니다.

## 파일 속성

```kotlin
import java.io.File

// 파일 속성
val file = File("example.txt")

val size = file.length()
println("크기: $size 바이트")

val lastModified = file.lastModified()
println("수정일: $lastModified")

val isFile = file.isFile
val isDirectory = file.isDirectory
println("파일: $isFile, 디렉토리: $isDirectory")

val isHidden = file.isHidden
println("숨김: $isHidden")

val canRead = file.canRead()
val canWrite = file.canWrite()
val canExecute = file.canExecute()
println("읽기: $canRead, 쓰기: $canWrite, 실행: $canExecute")
```

파일 속성을 확인할 수 있습니다. `length`, `lastModified`, `isFile`, `isDirectory`, `isHidden`, `canRead`, `canWrite`, `canExecute` 등의 메서드를 제공합니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> File과 Path 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`File`은 파일 작업에 사용합니다. `Path`는 경로 조작에 사용합니다. 파일 작업에는 `File`을, 경로 조작에는 `Path`를 사용합니다. 두 가지를 함께 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q> BufferedReader와 FileReader 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`BufferedReader`를 사용해야 합니다. 버퍼링으로 성능이 향상됩니다. `FileReader`는 직접 읽기에 사용됩니다. 대부분의 경우 `BufferedReader`를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> kotlinx.serialization은 언제 사용해야 하나요?</strong></summary>

`kotlinx.serialization`은 JSON 직렬화에 사용합니다. 타입 안전하며 간결합니다. Gson, Jackson 등의 Java 라이브러리도 사용할 수 있습니다. Kotlin 전용 라이브러리를 우선 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> use 함수는 언제 사용해야 하나요?</strong></summary>

`use` 함수는 `AutoCloseable`을 구현한 객체에 사용합니다. 파일, 스트림, 데이터베이스 연결 등. 더 간결하고 자동으로 `close()`를 호출합니다. 대부분의 경우 `use` 함수를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> 비동기 파일 I/O는 언제 사용해야 하나요?</strong></summary>

비동기 파일 I/O는 UI 애플리케이션이나 서버 애플리케이션에서 사용합니다. 스레드를 블로킹하지 않고 파일 I/O를 수행할 수 있습니다. 대용량 파일 처리에 유용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **File** | 파일 작업 | writeText, readText |
| **BufferedReader** | 텍스트 읽기 | 버퍼링 |
| **BufferedWriter** | 텍스트 쓰기 | 버퍼링 |
| **Path** | 경로 조작 | Paths.get |
| **Serializable** | 직렬화 인터페이스 | Java 직렬화 |
| **kotlinx.serialization** | JSON 직렬화 | @Serializable |
| **use** | 자동 리소스 해제 | AutoCloseable |
| **mkdirs** | 디렉토리 생성 | 재귀적 |
| **deleteRecursively** | 재귀 삭제 | 디렉토리 |
| **withContext(Dispatchers.IO)** | 비동기 I/O | 코루틴 |
| **length** | 파일 크기 | 바이트 |
| **lastModified** | 수정일 | 타임스탬프 |


## 다음 수업

다음 글에서는 Kotlin 중급 — 리플렉션, KClass, KProperty, 어노테이션을 배웁니다.

---
layout: post
title: "PHP PDO와 MySQL — prepared statements, 트랜잭션, 연결 풀링"
description: "PHP의 PDO(PHP Data Objects)를 MySQL 프로토콜 레벨에서 심층 학습합니다. PDO가 C 확장(pdo_mysql)으로 MySQL 네이티브 프로토콜(또는 mysqlnd)을 통해 통신하는 과정, prepared statement가 MySQL 서버에서 PREPARE → EXECUTE → DEALLOCATE PREPARE의 세 단계로 실행되는 원리(쿼리 캐싱 + SQL 인젝션 방어), PDO::beginTransaction()이 SET autocommit = 0으로 시작하고 COMMIT/ROLLBACK으로 완료되는 트랜잭션 처리, fetch 스타일(PDO::FETCH_ASSOC/OBJ/CLASS)의 데이터 매핑, PDO의 에러 모드(ERRMODE_EXCEPTION 권장), persistent connection의 연결 풀링 동작을 다룹니다."
date: 2023-11-20 10:00:00 +0900
category: php
tags: [php, pdo, mysql, database, prepared-statement, transaction]
level: intermediate
---

PDO(PHP Data Objects)는 PHP와 데이터베이스 간의 일관된 인터페이스를 제공하는 데이터 접근 추상화 계층입니다.

> **💡 핵심 정리** · PDO prepared statement는 MySQL 프로토콜에서 `COM_STMT_PREPARE`(서버가 SQL 파싱, 최적화, 바이너리 프로토콜 준비) → `COM_STMT_EXECUTE`(파라미터를 바이너리 형식으로 전송, 서버가 실행) → `COM_STMT_CLOSE`(statement handle 해제)로 동작합니다. SQL 인젝션 공격은 파라미터가 SQL 문법이 아닌 데이터로 처리되므로 완전히 차단됩니다. PDO 트랜잭션은 `SET autocommit = 0`으로 시작하여 `COMMIT` 또는 `ROLLBACK`으로 완료됩니다.

---

## 📚 수업 목표

- PDO prepared statement의 네트워크 프로토콜을 이해합니다.
- SQL 인젝션 방어 메커니즘을 이해합니다.
- 트랜잭션 처리와 격리 수준을 이해합니다.
- PDO fetch 모드의 차이를 이해합니다.
- persistent connection을 이해합니다.

## PDO 연결 및 쿼리

```php
<?php
// 연결
$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=blog;charset=utf8mb4';
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,  // 네이티브 prepared statement
    PDO::ATTR_STRINGIFY_FETCHES  => false,
];

$pdo = new PDO($dsn, 'user', 'password', $options);

// Prepared statement
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute([':email' => 'alice@example.com']);
$user = $stmt->fetch();

// 트랜잭션
$pdo->beginTransaction();
try {
    $pdo->exec('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
    $pdo->exec('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
    $pdo->commit();
} catch (\PDOException $e) {
    $pdo->rollBack();
    error_log($e->getMessage());
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: PDO prepared statement가 SQL 인젝션을 방어하는 원리는 무엇인가요?</strong></summary>

prepared statement는 **SQL 문법과 데이터를 분리**합니다. `PREPARE` 단계에서 SQL 템플릿(`SELECT * FROM users WHERE id = ?`)이 서버에서 파싱되고 최적화됩니다. `EXECUTE` 단계에서는 파라미터가 **바이너리 프로토콜**로 전송되어 SQL 문법이 아닌 순수 데이터로 처리됩니다. 따라서 사용자 입력에 `' OR '1'='1` 같은 SQL 문법이 포함되어도, 이는 단순한 문자열 값으로 취급되어 쿼리 구조를 변경할 수 없습니다. 문자열 이스케이프(mysqli_real_escape_string)와 달리 이 방법은 우회가 불가능합니다.
</details>

<details>
<summary><strong>Q: PDO::ATTR_EMULATE_PREPARES의 역할은 무엇인가요?</strong></summary>

`PDO::ATTR_EMULATE_PREPARES = true`(기본값)는 PDO가 MySQL 서버에 보내기 전에 PHP 내부에서 파라미터를 SQL 문자열에 직접 바인딩하여 에뮬레이션합니다. `false`로 설정하면 **네이티브 prepared statement**를 사용하여 MySQL 서버에서 실제 PREPARE/EXECUTE를 수행합니다. 네이티브 모드는 더 안전하고(서버 측 SQL 인젝션 방어), 쿼리 실행 계획을 캐싱하지만(동일한 prepared statement를 여러 번 실행할 때 성능 향상), 한 번만 실행하는 쿼리에는 에뮬레이션이 더 빠를 수 있습니다(왕복 2회 대신 1회).
</details>

<details>
<summary><strong>Q: PDO 트랜잭션의 격리 수준(isolation level)은 어떻게 설정하나요?</strong></summary>

트랜잭션 격리 수준은 `SET TRANSACTION ISOLATION LEVEL` SQL로 설정합니다: `READ UNCOMMITTED`(더티 리드 허용), `READ COMMITTED`(커밋된 데이터만 읽음 — PostgreSQL 기본), `REPEATABLE READ`(트랜잭션 시작 시점의 스냅샷 — MySQL InnoDB 기본), `SERIALIZABLE`(완벽한 격리, 동시성 낮음). PDO에서는 `$pdo->exec('SET TRANSACTION ISOLATION LEVEL READ COMMITTED')`로 설정합니다. MySQL InnoDB는 REPEATABLE READ에서도 갭 락을 사용하여 팬텀 리드를 방지합니다.
</details>

<details>
<summary><strong>Q: PDO::FETCH_CLASS와 FETCH_INTO의 차이는 무엇인가요?</strong></summary>

`PDO::FETCH_CLASS`는 쿼리 결과로 **새 객체 인스턴스**를 생성합니다: `$stmt->fetchAll(PDO::FETCH_CLASS, User::class)`. 생성자가 없으면 프로퍼티가 먼저 설정되고, 있으면 생성자가 먼저 호출됩니다. `PDO::FETCH_INTO`는 **기존 객체 인스턴스**에 결과를 설정합니다. FETCH_CLASS는 `__construct()` 호출 후 프로퍼티 설정이므로 생성자에서 초기화하지 않은 프로퍼티만 설정됩니다. PHP 8.1+의 `fetchObject()`는 타입 안전한 방식으로 객체를 반환합니다.
</details>

<details>
<summary><strong>Q: persistent connection(PDO::ATTR_PERSISTENT)을 사용해야 하나요?</strong></summary>

persistent connection(`$options[PDO::ATTR_PERSISTENT] = true`)은 스크립트 종료 후에도 MySQL 연결을 닫지 않고 재사용합니다. **연결 설정 비용을 줄여주지만** 주의할 점이 있습니다: 1) 트랜잭션이 커밋되지 않은 상태로 연결이 반환될 수 있음, 2) MySQL 임시 테이블/사용자 변수가 연결에 남아있을 수 있음. PHP-FPM 환경에서는 **각 워커 프로세스가 하나의 persistent 연결을 유지**하므로 연결 풀 크기가 제한적입니다. 현대 PHP 애플리케이션에서는 대부분 non-persistent 연결을 사용하고, 연결 풀은 애플리케이션 서버 레벨(예: ProxySQL)에서 관리합니다.
</details>

---

## 요약

- **PDO 프로토콜**: mysqlnd(MySQL Native Driver) → MySQL 서버, 바이너리 프로토콜
- **Prepared statement**: PREPARE(파싱+최적화) → EXECUTE(데이터만 전송) → CLOSE
- **SQL 인젝션 방어**: SQL 문법과 데이터 분리, 바이너리 파라미터 전송
- **트랜잭션**: beginTransaction(autocommit=0) → commit/rollBack
- **fetch 모드**: ASSOC(연관 배열), OBJ(객체), CLASS(특정 클래스)
- **에러 모드**: ERRMODE_EXCEPTION 권장(기본 SILENT)

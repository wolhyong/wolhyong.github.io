---
layout: post
title: "Java JDBC — 데이터베이스 연결, PreparedStatement, 트랜잭션, Connection Pool"
description: "Java JDBC를 드라이버 레벨에서 심층 학습합니다. DriverManager가 Class.forName()으로 드라이버를 로딩하고 URL 기반으로 연결하는 과정, PreparedStatement의 SQL Injection 방지(파라미터 바인딩이 DBMS의 prepare + 바인드 메커니즘), 트랜잭션의 ACID 원칙과 setAutoCommit(false)/commit()/rollback(), Connection Pool(HikariCP)의 ThreadLocal 기반 연결 관리와 유휴 연결 확인을 다룹니다."
date: 2023-07-31 10:00:00 +0900
category: java
tags: [java, jdbc, database, prepared-statement, connection-pool, hikaricp, transaction]
level: advanced
---

JDBC(Java Database Connectivity)는 Java에서 데이터베이스에 접근하기 위한 표준 API입니다. 모든 Java ORM과 데이터베이스 라이브러리의 기초가 됩니다.

> **💡 핵심 정리** · JDBC `Connection`은 TCP 소켓 연결을 래핑하며, `DriverManager`가 URL(jdbc:mysql://host:port/db)을 파싱하여 적합한 드라이버를 찾습니다. `PreparedStatement`는 SQL을 DBMS에 pre-compile하고(데이터베이스 커서/핸들 반환), 파라미터만 별도로 바인딩하여 SQL Injection을 차단합니다. `HikariCP`는 соединения를 `FastList`(인덱스 기반, ArrayList보다 빠름)와 `ConcurrentBag`(lock-free 구조)으로 관리합니다.

---

## 📚 수업 목표

- JDBC 드라이버 로딩과 연결 과정을 이해합니다.
- PreparedStatement로 SQL Injection을 방지할 수 있습니다.
- 트랜잭션을 관리하고 격리 수준을 설정할 수 있습니다.
- Connection Pool의 동작 원리를 이해합니다.
- DAO 패턴으로 데이터 접근을 추상화할 수 있습니다.

## JDBC 기본

```java
import java.sql.*;

public class UserDAO {
    private static final String URL = "jdbc:mysql://localhost:3306/mydb";
    private static final String USER = "root";
    private static final String PASSWORD = "password";

    public User findById(int id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, id);  // 파라미터 바인딩

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new User(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("email")
                    );
                }
            }
        }
        return null;
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Statement와 PreparedStatement 중 어떤 것을 사용해야 하나요?</strong></summary>

**PreparedStatement**를 항상 사용하세요. 1) **SQL Injection 방지**: 바인딩된 파라미터가 SQL로 해석되지 않습니다. 2) **성능**: DBMS가 SQL을 미리 컴파일하고 실행 계획을 캐싱합니다. 3) **가독성**: 문자열 연결보다 파라미터 플레이스홀더(?)가 깔끔합니다. Statement는 동적 SQL이 정말 필요할 때만 사용하세요.
</details>

<details>
<summary><strong>Q: Connection Pool을 사용해야 하는 이유는 무엇인가요?</strong></summary>

데이터베이스 연결(TCP 소켓 + 인증 + 세션)은 생성 비용이 매우 큽니다(일반적으로 20~50ms). 매 요청마다 새 연결을 생성하면 성능이 심각하게 저하됩니다. Connection Pool(HikariCP, Tomcat CP)은 **미리 연결을 생성해두고 재사용**하여 연결 생성 비용을 없앱니다. 동시 요청 수에 맞춰 풀 크기를 조정해야 합니다.
</details>

<details>
<summary><strong>Q: 트랜잭션 격리 수준은 어떻게 선택하나요?</strong></summary>

**READ_COMMITTED**가 대부분의 애플리케이션에 적합한 기본값입니다. **SERIALIZABLE**은 데이터 정합성이 가장 높지만 동시성이 낮습니다. **REPEATABLE_READ**는 MySQL InnoDB의 기본값입니다. **READ_UNCOMMITTED**는 성능이 가장 좋지만 dirty read가 발생합니다. 격리 수준이 높을수록 락 범위가 증가하여 데드락 가능성도 높아집니다.
</details>

<details>
<summary><strong>Q: ResultSet을 닫지 않으면 어떤 문제가 발생하나요?</strong></summary>

ResultSet, Statement, Connection은 **명시적으로 닫지 않으면** 리소스 누수가 발생합니다. 데이터베이스 커서가 닫히지 않아 서버 메모리가 고갈되고, 결국 데이터베이스 연결 한계에 도달합니다. **try-with-resources**를 사용하여 모든 JDBC 리소스를 자동으로 닫으세요. `ResultSet`은 `Statement`가 닫힐 때 함께 닫히지만, 명시적으로 닫는 것이 안전합니다.
</details>

<details>
<summary><strong>Q: Batch Insert를 어떻게 최적화하나요?</strong></summary>

`PreparedStatement.addBatch()`와 `executeBatch()`를 사용하세요. 100~1000개 단위로 배치를 나누어 전송합니다. `rewriteBatchedInserts=true`(MySQL) 옵션을 추가하면 여러 INSERT 문이 하나의 SQL로 최적화됩니다. JDBC URL에 `?rewriteBatchedStatements=true`를 추가하세요. 배치 처리는 개별 INSERT보다 10~50배 빠를 수 있습니다.
</details>

---

## 요약

- **JDBC**: 데이터베이스 연결 표준 API, DriverManager → Connection → Statement → ResultSet
- **PreparedStatement**: SQL pre-compile + 파라미터 바인딩, SQL Injection 방지
- **트랜잭션**: setAutoCommit(false), commit(), rollback(), 격리 수준 설정
- **Connection Pool**: HikariCP, FastList + ConcurrentBag, 연결 재사용
- **DAO 패턴**: 데이터 접근 로직 분리, try-with-resources로 리소스 자동 정리

---
layout: post
title: "Python 데이터베이스 — SQLAlchemy, ORM, 트랜잭션, 마이그레이션"
description: "Python 데이터베이스 프로그래밍을 ORM의 내부 동작까지 심층 학습합니다. SQLAlchemy Core의 SQL 표현식 트리 구조, ORM의 Identity Map과 Unit of Work 패턴(Session의 flush()가 변경 감지하는 과정), 트랜잭션 격리 수준과 N+1 쿼리 문제, Alembic을 사용한 마이그레이션 관리, 연결 풀링과 세션 관리 전략을 다룹니다."
date: 2023-04-24 10:00:00 +0900
category: python
tags: [python, sqlalchemy, database, orm, migration, alembic, transaction]
level: advanced
---

데이터베이스는 대부분의 애플리케이션에서 핵심 구성 요소입니다. SQLAlchemy는 Python에서 가장 강력한 ORM/데이터베이스 도구 키트입니다.

> **💡 핵심 정리** · SQLAlchemy ORM은 `Session`이 `Identity Map`(객체-행 매핑 캐시)을 유지하며, `flush()` 시 `Unit of Work` 패턴으로 변경된 속성만 UPDATE합니다. N+1 문제는 `joinedload()`/`selectinload()`로 즉시 로딩하여 해결합니다.

---

## 📚 수업 목표

- SQLAlchemy ORM과 Core의 차이를 이해합니다.
- 모델을 정의하고 관계를 설정할 수 있습니다.
- 세션과 트랜잭션을 관리할 수 있습니다.
- N+1 쿼리 문제를 진단하고 해결할 수 있습니다.
- Alembic으로 데이터베이스 마이그레이션을 관리할 수 있습니다.

## SQLAlchemy ORM 기본

```python
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, Session

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True)

    posts = relationship("Post", back_populates="author")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User", back_populates="posts")

engine = create_engine("sqlite:///blog.db")
Base.metadata.create_all(engine)
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: ORM과 raw SQL 중 어떤 것을 사용해야 하나요?</strong></summary>

**ORM**은 생산성과 유지보수성에서 유리합니다: 객체 지향 코드, 자동 매핑, 마이그레이션, 관계 로딩. **Raw SQL**은 복잡한 쿼리(다중 조인, 윈도우 함수, 계층적 쿼리)에서 성능과 제어력이 좋습니다. SQLAlchemy Core는 중간 지점으로, ORM 수준의 추상화 없이도 SQL 표현식을 Python으로 작성할 수 있습니다.
</details>

<details>
<summary><strong>Q: N+1 쿼리 문제를 어떻게 방지하나요?</strong></summary>

N+1 문제는 부모 쿼리(1) 후 각 자식에 대한 추가 쿼리(N)가 발생하는 문제입니다. `joinedload()`(JOIN으로 한 번에 로딩)나 `selectinload()`(IN 쿼리로 한 번에 로딩)을 사용하세요. SQLAlchemy의 `echo=True` 옵션으로 실제 실행되는 SQL을 확인하면서 개발하면 N+1을 쉽게 발견할 수 있습니다. FastAPI/Flask에서는 `relationship`의 `lazy="selectin"` 기본값도 고려할 수 있습니다.
</details>

<details>
<summary><strong>Q: 세션은 어떻게 관리해야 하나요?</strong></summary>

세션은 **요청당 하나**를 생성하고, 요청이 완료되면 닫는 것이 표준 패턴입니다. FastAPI에서는 `Depends()`로, Flask에서는 `@app.teardown_appcontext`로 세션을 관리합니다. 세션은 스레드 안전하지 않으므로 여러 스레드에서 공유하면 안 됩니다. `scoped_session`으로 스레드-로컬 세션을 안전하게 사용할 수 있습니다.
</details>

<details>
<summary><strong>Q: Alembic 마이그레이션을 자동화해야 하나요?</strong></summary>

`alembic revision --autogenerate`는 모델과 실제 DB 스키마를 비교하여 마이그레이션을 자동 생성합니다. 하지만 자동 감지가 완벽하지 않으므로, 생성된 마이그레이션을 항상 검토하고 수동으로 수정해야 합니다(특히 컬럼명 변경, 데이터 마이그레이션). 프로덕션에서는 `alembic upgrade head`로 안전하게 적용하되, 먼저 백업을 수행하세요.
</details>

<details>
<summary><strong>Q: SQLAlchemy Core와 ORM을 혼용해도 되나요?</strong></summary>

네, 같은 엔진과 연결에서 Core와 ORM을 혼용할 수 있습니다. 복잡한 리포트 쿼리는 Core로, CRUD 작업은 ORM으로 작성하는 것이 일반적입니다. `session.execute(text("SELECT ..."))`로 raw SQL도 실행할 수 있습니다. Core의 결과를 ORM 객체로 변환할 수도 있고, ORM 객체를 Core 표현식에 사용할 수도 있습니다.
</details>

---

## 요약

- **ORM**: 객체-관계 매핑, Identity Map, Unit of Work
- **관계 설정**: `relationship()`으로 back_populates, lazy= 옵션
- **N+1 문제**: `joinedload()` / `selectinload()`로 즉시 로딩
- **트랜잭션**: Session.begin(), commit(), rollback()
- **마이그레이션**: Alembic, `--autogenerate`로 스키마 비교

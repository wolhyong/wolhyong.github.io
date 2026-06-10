---
layout: post
title: "Python 웹 프레임워크 — Flask와 FastAPI 심층 비교"
description: "Python의 주요 웹 프레임워크인 Flask와 FastAPI를 내부 동작까지 심층 학습합니다. Flask의 WSGI 핸들링(Request/Response 객체의 environ 기반 구조)과 블루프린트 모듈화, FastAPI의 ASGI/Starlette 기반 비동기 처리와 Pydantic을 통한 자동 검증, OpenAPI 자동 문서화, 미들웨어 체인의 동작 방식을 다룹니다."
date: 2023-04-17 10:00:00 +0900
category: python
tags: [python, flask, fastapi, web-framework, rest-api, asgi, wsgi, pydantic]
level: advanced
---

Python 웹 프레임워크는 WSGI(Flask, Django)와 ASGI(FastAPI, Starlette)로 나뉩니다. 각각의 장단점을 이해하고 적절히 선택하는 것이 중요합니다.

> **💡 핵심 정리** · Flask의 WSGI 핸들러는 `environ` dict에서 Request를 파싱하고 WSGI 서버(gunicorn/ uWSGI)와 `start_response` 콜백으로 통신합니다. FastAPI는 Starlette 위에서 Pydantic 모델로 요청 본문을 자동 검증하고, OpenAPI 스키마를 자동 생성합니다. ASGI는 WSGI와 달리 lifespan(startup/shutdown) 이벤트와 WebSocket을 기본 지원하며, 단일 프로세스로 높은 동시성을 처리합니다.

---

## 📚 수업 목표

- Flask와 FastAPI의 차이점을 이해합니다.
- REST API를 설계하고 구현할 수 있습니다.
- 요청 검증과 의존성 주입을 적용할 수 있습니다.
- 미들웨어 체인의 동작 원리를 이해합니다.
- 적합한 프레임워크를 선택할 수 있습니다.

## Flask 기본

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    return jsonify({"id": user_id, "name": "Alice"})

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "name is required"}), 400
    return jsonify({"id": 1, "name": data["name"]}), 201
```

## FastAPI 기본

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="User API")

class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    return UserResponse(id=user_id, name="Alice", email="alice@example.com")

@app.post("/api/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # 자동 검증: name과 email이 없으면 422 에러
    return UserResponse(id=1, name=user.name, email=user.email)
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Flask와 FastAPI 중 어떤 것을 선택해야 하나요?</strong></summary>

**비동기가 필요**하고 **자동 문서화**가 중요하면 FastAPI를 선택하세요. **단순하고 검증된** 프레임워크가 필요하거나 **기존 Flask 생태계**(Flask-SQLAlchemy, Flask-Login)를 활용한다면 Flask를 선택하세요. FastAPI는 성능(Starlette 기반으로 더 빠름)과 현대적인 기능에서 앞서지만, Flask는 더 많은 레거시 코드와 확장이 있습니다.
</details>

<details>
<summary><strong>Q: WSGI와 ASGI의 차이는 무엇인가요?</strong></summary>

**WSGI**는 동기식 요청-응답 모델입니다. 한 요청이 완료될 때까지 다른 요청을 처리할 수 없습니다(멀티스레드/멀티프로세스로 극복). **ASGI**는 비동기 이벤트 루프 기반으로, 단일 프로세스에서 수천 개의 동시 연결을 처리할 수 있습니다. ASGI는 WebSocket, Server-Sent Events, HTTP/2를 기본 지원하고, lifespan 이벤트(startup/shutdown)를 제공합니다.
</details>

<details>
<summary><strong>Q: FastAPI에서 의존성 주입은 어떻게 동작하나요?</strong></summary>

FastAPI의 `Depends()`는 함수의 매개변수로 의존성을 선언합니다. FastAPI 내부에서 의존성 그래프를 분석하고, 각 의존성을 필요한 순서대로 생성/주입합니다. 의존성은 캐시되어 같은 요청 내에서 재사용됩니다. 이를 통해 데이터베이스 세션, 인증, 설정 등을 깔끔하게 분리할 수 있습니다.
</details>

<details>
<summary><strong>Q: Flask에서 비동기를 사용할 수 있나요?</strong></summary>

Flask 2.0+는 `async` 핸들러를 지원하지만, 내부적으로는 여전히 WSGI를 사용하므로 진정한 비동기 이점을 얻기는 어렵습니다. Flask의 async 핸들러는 이벤트 루프를 별도 스레드에서 실행하여 동작합니다. 진정한 비동기가 필요하다면 FastAPI나 Quart(Flask와 유사한 ASGI 프레임워크)를 사용하세요.
</details>

<details>
<summary><strong>Q: Pydantic 모델의 장점은 무엇인가요?</strong></summary>

Pydantic은 **타입 힌트 기반 검증**을 제공합니다. 필드 타입, 기본값, validator, 커스텀 검증 함수를 선언적으로 정의할 수 있습니다. 잘못된 입력이 들어오면 자세한 에러 메시지와 함께 422 응답을 반환합니다. 또한 자동 OpenAPI 문서 생성, 직렬화/역직렬화, JSON Schema 생성을 지원합니다. FastAPI의 핵심 강점입니다.
</details>

---

## 요약

- **Flask**: WSGI, 블루프린트 모듈화, 방대한 확장 생태계
- **FastAPI**: ASGI/Starlette, Pydantic 검증, 자동 OpenAPI 문서
- **성능**: FastAPI(Starlette)가 Flask보다 2~3배 빠름
- **선택 기준**: 비동기/문서화 → FastAPI, 단순/안정성 → Flask

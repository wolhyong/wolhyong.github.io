---
layout: post
title: "Python 배포 — Docker, CI/CD, 클라우드 배포, 모니터링"
description: "Python 애플리케이션 배포를 운영 레벨에서 심층 학습합니다. Docker 멀티스테이지 빌드로 이미지 크기 최적화, GitHub Actions를 사용한 CI/CD 파이프라인 구축, Gunicorn/Uvicorn 프로세스 관리와 워커 설정, 환경 변수와 설정 관리, 로깅과 모니터링(Prometheus + Grafana), 무중단 배포 전략을 다룹니다."
date: 2023-05-01 10:00:00 +0900
category: python
tags: [python, deployment, docker, cicd, gunicorn, uvicorn, monitoring, devops]
level: advanced
---

배포는 개발의 마지막 단계이자 운영의 첫 단계입니다. 안정적인 배포 파이프라인은 프로덕션 품질을 보장합니다.

> **💡 핵심 정리** · Docker 멀티스테이지 빌드는 builder와 runtime 이미지를 분리하여 최종 이미지 크기를 80% 이상 줄입니다. Gunicorn은 pre-fork 워커 모델로, 마스터 프로세스가 워커를 미리 fork하여 요청을 라운드 로빈으로 분배합니다. Uvicorn은 ASGI 서버로 단일 프로세스에서 이벤트 루프로 동시성을 처리합니다.

---

## 📚 수업 목표

- Docker 멀티스테이지 빌드를 구성할 수 있습니다.
- CI/CD 파이프라인을 구축할 수 있습니다.
- 프로덕션 서버(Gunicorn/Uvicorn)를 설정할 수 있습니다.
- 로깅과 모니터링을 적용할 수 있습니다.
- 무중단 배포 전략을 이해합니다.

## Docker

```dockerfile
# 멀티스테이지 빌드
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dirs -r requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000

CMD ["gunicorn", "app:app", "--workers=4", "--bind=0.0.0.0:8000"]
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Gunicorn과 Uvicorn의 차이는 무엇인가요?</strong></summary>

**Gunicorn**은 WSGI 서버로, pre-fork 워커 모델을 사용합니다. 각 워커는 별도 프로세스로 실행되어 GIL의 영향을 받지 않습니다. **Uvicorn**은 ASGI 서버로, 단일 프로세스에서 비동기 이벤트 루프로 동작합니다. FastAPI 배포에는 `uvicorn` 단독보다 `gunicorn -k uvicorn.workers.UvicornWorker` 조합이 더 좋습니다(gunicorn이 프로세스 관리, uvicorn이 ASGI 처리).
</details>

<details>
<summary><strong>Q: CI/CD 파이프라인에 어떤 단계가 필요한가요?</strong></summary>

1) **코드 검증**: 린트(flake8/ruff), 타입 체크(mypy/pyright), 포매팅(black/isort). 2) **테스트**: 단위 테스트(pytest), 통합 테스트, 커버리지 측정. 3) **보안**: 취약점 스캔(safety/bandit). 4) **빌드**: Docker 이미지 빌드, 태깅. 5) **배포**: 스테이징 → 프로덕션, 헬스 체크. 6) **모니터링**: 로그 수집, 에러 트래킹(Sentry). GitHub Actions로 10분 이내에 완료되는 것이 일반적입니다.
</details>

<details>
<summary><strong>Q: 환경 변수는 어떻게 관리해야 하나요?</strong></summary>

`.env` 파일은 개발용으로만 사용하고, 프로덕션에서는 **실제 환경 변수**(Docker/Kubernetes Secrets, AWS Secrets Manager, HashiCorp Vault)를 사용하세요. `pydantic-settings`로 타입 검증과 기본값을 설정할 수 있습니다. 민감한 정보(DB 비밀번호, API 키)는 절대 코드에 하드코딩하지 마세요.
</details>

<details>
<summary><strong>Q: 프로메테우스와 그라파나는 어떤 역할을 하나요?</strong></summary>

**Prometheus**는 메트릭을 수집하고 저장하는 시계열 데이터베이스입니다. Python 애플리케이션은 `prometheus_client` 라이브러리로 메트릭(/metrics 엔드포인트)을 노출합니다. **Grafana**는 프로메테우스의 데이터를 시각화하는 대시보드 도구입니다. 주요 모니터링 항목: 요청 수, 응답 시간(분위값), 에러율, CPU/메모리 사용량, DB 커넥션 수입니다.
</details>

<details>
<summary><strong>Q: 무중단 배포(Zero-downtime deployment)는 어떻게 하나요?</strong></summary>

1) **블루-그린 배포**: 이전 버전(블루)과 새 버전(그린)을 동시에 실행하고 트래픽을 전환. 2) **롤링 업데이트**: Kubernetes가 워커를 하나씩 교체하며 헬스 체크 유지. 3) **카나리 배포**: 트래픽의 10%만 새 버전으로 보내고 문제가 없으면 점진적 확대. 핵심은 로드 밸런서의 헬스 체크와 graceful shutdown입니다.
</details>

---

## 요약

- **Docker**: 멀티스테이지 빌드로 이미지 80% 축소
- **Gunicorn**: pre-fork WSGI, 워커=CPU*2+1
- **Uvicorn**: ASGI 서버, 이벤트 루프 기반
- **CI/CD**: 테스트 → 빌드 → 배포 자동화
- **모니터링**: Prometheus(수집) + Grafana(시각화) + Sentry(에러)

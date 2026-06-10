---
layout: post
title: "Java 빌드 도구와 배포 — Maven, Gradle, CI/CD, Docker, 클라우드 배포"
description: "Java 빌드 도구와 배포 전략을 심층 학습합니다. Maven의 POM(Project Object Model)과 의존성 해결(로컬 저장소 → 중앙 저장소 → 원격 저장소), Gradle의 Incremental Build(변경된 파일만 재컴파일), 빌드 생명주기(compile → test → package → deploy), Docker 멀티스테이지 빌드로 Spring Boot 애플리케이션 최적화, CI/CD 파이프라인(GitHub Actions/Jenkins), 무중단 배포 전략을 다룹니다."
date: 2023-09-04 10:00:00 +0900
category: java
tags: [java, maven, gradle, ci-cd, docker, deployment, devops]
level: advanced
---

Java 애플리케이션의 빌드와 배포를 자동화하는 것은 현대 개발의 핵심입니다.

> **💡 핵심 정리** · Maven은 POM(Project Object Model) XML을 파싱하여 의존성 트리를 구성하고, 로컬(~/.m2) → 중앙(Maven Central) → 원격(회사 저장소) 순서로 아티팩트를 해결합니다. Gradle은 DAG(Directed Acyclic Graph)로 작업 의존성을 표현하고, 변경된 입력만 재실행하는 Incremental Build로 Maven보다 2~10배 빠릅니다. Docker 멀티스테이지 빌드는 JDK(빌드)와 JRE(실행)를 분리하여 이미지 크기를 80% 이상 줄입니다.

---

## 📚 수업 목표

- Maven과 Gradle의 차이와 동작 원리를 이해합니다.
- 빌드 생명주기 단계를 이해합니다.
- Docker로 Java 애플리케이션을 배포할 수 있습니다.
- CI/CD 파이프라인을 구성할 수 있습니다.
- 무중단 배포 전략을 이해합니다.

## Spring Boot Docker 배포

```dockerfile
# 멀티스테이지 빌드
FROM gradle:8-jdk21 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Maven과 Gradle 중 어떤 것을 선택해야 하나요?</strong></summary>

**Gradle**이 더 현대적이고 유연합니다. 1) **성능**: Incremental Build와 Build Cache로 Maven보다 2~10배 빠름. 2) **유연성**: Groovy/Kotlin DSL로 빌드 로직을 코드로 작성. 3) **멀티 모듈**: 멀티 프로젝트 구성이 Maven보다 간결. Maven은 XML 기반의 **표준화**와 **예측 가능성**이 장점입니다. 새 프로젝트는 Gradle, 레거시는 Maven이 일반적입니다.
</details>

<details>
<summary><strong>Q: Gradle이 Maven보다 빠른 이유는 무엇인가요?</strong></summary>

1) **Incremental Build**: 입력(소스)과 출력(class)의 변경 여부를 추적하여 변경된 파일만 재컴파일. 2) **Build Cache**: 빌드 결과물을 캐싱하여 동일한 작업 재실행 방지. 3) **병렬 실행**: 독립적인 작업을 병렬로 실행. 4) **데몬 프로세스**: Gradle Daemon이 상주하며 JVM을 재사용. 5) **회피**: 필요 없는 작업은 아예 실행하지 않음. 이 모든 최적화가 누적되어 대규모 프로젝트에서 큰 차이를 만듭니다.
</details>

<details>
<summary><strong>Q: JVM 애플리케이션의 메모리는 어떻게 설정하나요?</strong></summary>

`-Xms`(초기 힙 크기)와 `-Xmx`(최대 힙 크기)로 설정합니다. Docker 컨테이너에서는 `-XX:+UseContainerSupport`(Java 10+)를 활성화하여 컨테이너의 메모리 제한을 자동 인식하도록 합니다. `-XX:MaxRAMPercentage=75.0`으로 컨테이너 메모리의 75%를 힙에 할당할 수 있습니다. `-Xlog:gc*`로 GC 로그를 활성화하여 힙 크기 튜닝에 활용하세요.
</details>

<details>
<summary><strong>Q: CI/CD 파이프라인에서 Java 빌드는 어떤 단계를 거쳐야 하나요?</strong></summary>

1) **Checkout**: 소스 코드 내려받기. 2) **빌드**: `./gradlew build`(테스트 포함). 3) **정적 분석**: SonarQube, Checkstyle, PMD. 4) **보안 스캔**: OWASP Dependency-Check. 5) **이미지 빌드**: Docker 빌드. 6) **이미지 스캔**: Trivy로 취약점 검사. 7) **배포**: 스테이징 → 프로덕션. 8) **헬스 체크**: `/actuator/health`로 상태 확인. GitHub Actions로 약 5~10분 소요됩니다.
</details>

<details>
<summary><strong>Q: 무중단 배포(Zero-downtime)는 어떻게 구현하나요?</strong></summary>

Spring Boot + Kubernetes 환경에서는: 1) **Readiness Probe**: `/actuator/health/readiness`로 서비스 준비 상태 확인. 2) **Liveness Probe**: `/actuator/health/liveness`로 프로세스 생존 확인. 3) **Graceful Shutdown**: `server.shutdown=graceful`로 처리 중인 요청 완료 후 종료(설정 가능한 타임아웃). 4) **Rolling Update**: Kubernetes가 파드를 하나씩 교체. 5) **PreStop Hook**: SIGTERM 수신 후 일정 시간 대기(drain connections).
</details>

---

## 요약

- **Maven**: POM XML, 생명주기(compile → test → package), 표준화
- **Gradle**: Groovy/Kotlin DSL, Incremental Build, Daemon
- **Docker**: 멀티스테이지(JDK 빌드 → JRE 실행), Alpine 이미지로 경량화
- **CI/CD**: 테스트 → 정적 분석 → 보안 → 이미지 빌드 → 배포
- **무중단 배포**: Readiness/Liveness Probe, Graceful Shutdown, Rolling Update

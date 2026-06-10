---
layout: post
title: "Go 네트워킹 심화 — net/http 서버 심층 분석, HTTP 미들웨어 패턴, TCP 서버, JSON API 설계"
description: "Go의 네트워킹을 서버 구현 레벨에서 학습합니다. net/http.Server가 Accept() → goroutine per connection → conn.serve() → serverHandler.ServeHTTP() → DefaultServeMux/ServeMux.Handler()의 체인으로 HTTP 요청을 처리하는 과정, HTTP/1.1 Keep-Alive가 연결을 재사용하는 방식과 HTTP/2의 multiplexing이 단일 연결로 여러 요청을 동시에 처리하는 구조, ServeMux의 패턴 매칭(Go 1.22+에서 메서드 기반 라우팅 \"/GET /api/users\" 지원)과 http.Handler/http.HandlerFunc/http.Handler 인터페이스의 관계, 미들웨어 패턴이 func(next http.Handler) http.Handler 형태로 각 핸들러를 감싸서 로깅/인증/압축/타임아웃 등 횡단 관심사를 처리하는 방식, text/template과 html/template의 차이점 — html/template이 컨텍스트 인식 이스케이프로 XSS(Cross-Site Scripting)를 방지하는 과정(JS/CSS/HTML/URL 컨텍스트별 이스케이프), encoding/json과 xml의 스트리밍 인코딩/디코딩을 다룹니다."
date: 2025-05-12 10:00:00 +0900
category: go
tags: [go, golang, networking, http-server, middleware, tcp-server, template, rest-api]
level: advanced
---

Go의 net/http 패키지는 강력하고 확장 가능한 HTTP 서버를 제공합니다.

> **핵심 정리** · `http.Server`는 Accept → goroutine → conn.serve() → ServeHTTP 체인으로 요청을 처리합니다. 모든 연결은 별도 고루틴에서 처리됩니다. 미들웨어는 `func(next http.Handler) http.Handler` 패턴으로 핸들러를 감쌉니다. `html/template`은 컨텍스트 인식 이스케이프로 XSS를 방지합니다. Go 1.22+ ServeMux는 메서드 기반 라우팅을 지원합니다.

## 수업 목표

- net/http 서버의 요청 처리 체인을 이해합니다.
- 미들웨어 패턴을 구현할 수 있습니다.
- ServeMux 라우팅을 이해합니다.
- html/template의 컨텍스트 인식 이스케이프를 이해합니다.
- TCP 서버의 기본 구조를 이해합니다.

## HTTP 서버 심층 분석

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
)

// 핸들러
type UserHandler struct {
    users map[int]string
}

func (h *UserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        h.getUser(w, r)
    case http.MethodPost:
        h.createUser(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func (h *UserHandler) getUser(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(h.users)
}

func (h *UserHandler) createUser(w http.ResponseWriter, r *http.Request) {
    var user struct { Name string }
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    id := len(h.users) + 1
    h.users[id] = user.Name
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]int{"id": id})
}

// 미들웨어
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v", err)
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// Go 1.22+ 메서드 기반 라우팅
func setupRouter() http.Handler {
    mux := http.NewServeMux()
    // Go 1.22+: mux.HandleFunc("GET /api/users", listUsers)
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("users endpoint"))
    })

    // 미들웨어 체인
    handler := recoveryMiddleware(loggingMiddleware(mux))
    return handler
}

func main() {
    handler := &UserHandler{users: make(map[int]string)}
    mux := http.NewServeMux()
    mux.Handle("/api/users", handler)

    server := &http.Server{
        Addr:         ":8080",
        Handler:      recoveryMiddleware(loggingMiddleware(mux)),
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    log.Println("Server starting on :8080")
    log.Fatal(server.ListenAndServe())

    // Graceful shutdown
    // go server.ListenAndServe()
    // sigCh := make(chan os.Signal, 1)
    // signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    // <-sigCh
    // ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    // defer cancel()
    // server.Shutdown(ctx)
}
```

`http.ListenAndServe(":8080", handler)`는 내부적으로 `http.Server`를 생성하고 `ListenAndServe()`를 호출합니다. 각 연결은 별도 고루틴에서 처리되며, `conn.serve()`가 요청을 읽고 `serverHandler{c.server}.ServeHTTP(w, r)`을 호출합니다. 미들웨어 패턴(`func(next http.Handler) http.Handler`)은 각 핸들러를 감싸서 공통 기능을 추가합니다. Go 1.22+의 `ServeMux`는 `"GET /api/users"`와 같은 메서드 기반 라우팅을 지원합니다.

## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q: HTTP 서버의 타임아웃 설정은 왜 중요한가요?</strong></summary>

타임아웃 설정은 서버 안정성의 핵심입니다. 설정하지 않으면 악의적인 클라이언트가 연결을 계속 열어두어 고루틴 누수와 리소스 고갈을 유발할 수 있습니다. `ReadTimeout`은 요청 헤더와 바디를 읽는 전체 시간을 제한합니다. `WriteTimeout`은 응답을 쓰는 시간을 제한합니다. `IdleTimeout`은 Keep-Alive 연결에서 다음 요청을 기다리는 최대 시간입니다. `Timeout` 핸들러(`http.TimeoutHandler`)는 각 핸들러의 처리 시간을 제한합니다. 프로덕션 환경에서는 모든 타임아웃을 명시적으로 설정해야 합니다.
</details>

<details>
<summary><strong>Q: html/template은 어떻게 XSS를 방지하나요?</strong></summary>

`html/template`은 컨텍스트를 인식하여 출력을 자동 이스케이프합니다. 템플릿이 렌더링되는 위치(HTML, JS, CSS, URL)에 따라 다른 이스케이프 규칙을 적용합니다: (1) **HTML 컨텍스트** — `{ {.}}`는 `&`, `<`, `>`, `"`, `'`를 이스케이프. (2) **JavaScript 컨텍스트** — `{ {.}}`가 `<script>` 태그 안에 있으면 JS 문자열로 이스케이프. (3) **CSS 컨텍스트** — CSS 값으로 이스케이프. (4) **URL 컨텍스트** — URL 인코딩. 이는 `text/template`과의 핵심 차이점입니다. `text/template`은 이스케이프를 수행하지 않으므로, HTML 출력에는 절대 사용하면 안 됩니다. 특정 값의 이스케이프를 원하지 않으면 `template.HTML` 타입으로 래핑할 수 있지만, 신중하게 사용해야 합니다.
</details>

<details>
<summary><strong>Q: TCP 서버는 어떻게 구현하나요?</strong></summary>

TCP 서버는 `net.Listen("tcp", ":port")`으로 시작합니다. `listener.Accept()`는 클라이언트 연결을 기다리고, 각 연결을 별도 고루틴에서 처리합니다: `go handleConn(conn)`. `conn.Read(buf)`로 데이터를 읽고, `conn.Write(data)`로 응답을 보냅니다. TCP 서버의 특징: (1) 메시지 경계가 없으므로 프로토콜(예: 줄바꿈, 길이 접두사)을 직접 정의해야 합니다. (2) `bufio.Scanner`로 줄 단위 읽기를 구현할 수 있습니다. (3) `net.Conn`에 타임아웃(`SetDeadline`)을 설정해야 합니다. (4) `context`로 고루틴 종료를 제어합니다. HTTP 서버보다 더 많은 제어가 필요할 때 TCP 서버를 사용합니다.
</details>

<details>
<summary><strong>Q: HTTP/2는 Go에서 어떻게 지원되나요?</strong></summary>

Go 1.6+에서 HTTP/2가 기본 지원됩니다. `http.Server`가 TLS를 사용하면 자동으로 HTTP/2를 협상합니다(`h2` ALPN). `http2.Server`로 HTTP/2 설정을 세부 조정할 수 있습니다. HTTP/2의 주요 기능: (1) **Multiplexing** — 단일 TCP 연결로 여러 요청을 동시에 처리. (2) **Server Push** — (Go 1.20+에서 제거됨) (3) **헤더 압축** — HPACK으로 헤더 크기 감소. (4) **스트림 우선순위** — 중요한 요청을 먼저 처리. Go의 HTTP/2 구현은 h2c(cleartext HTTP/2)도 지원하지만, 대부분의 브라우저는 TLS를 통한 HTTP/2만 지원합니다.
</details>

<details>
<summary><strong>Q: JSON API 응답의 표준 형식은 무엇인가요?</strong></summary>

Go에서 JSON API 응답은 보통 다음과 같은 구조를 따릅니다: (1) **성공**: `{"data": ..., "meta": {...}}`. (2) **에러**: `{"error": {"code": "NOT_FOUND", "message": "User not found"}}`. (3) **리스트**: `{"data": [...], "total": 100, "page": 1}`. `json.Encoder`로 스트리밍 출력하거나 `json.Marshal`로 버퍼링 후 출력할 수 있습니다. 대규모 JSON은 `json.RawMessage`로 부분 파싱하여 메모리를 절약합니다. `encoding/json`의 성능이 중요하면 `github.com/json-iterator/go`나 Go 1.22+의 `encoding/json` 개선을 활용합니다. RESTful API 설계에서는 HTTP 상태 코드와 JSON 본문을 일관되게 유지하는 것이 중요합니다.
</details>

## 요약

| 개념 | 설명 | 내부 동작 |
|------|------|----------|
| **http.Server** | HTTP 서버 | Accept → goroutine → conn.serve → ServeHTTP |
| **ServeMux** | 라우터 | Go 1.22+: 메서드 + 패턴 매칭 |
| **미들웨어** | 횡단 관심사 처리 | func(next Handler) Handler 체인 |
| **html/template** | 컨텍스트 인식 이스케이프 | HTML/JS/CSS/URL별 이스케이프 |
| **Graceful Shutdown** | 안전한 종료 | Shutdown(ctx) + signal 처리 |
| **TCP 서버** | 저수준 네트워크 | Listen → Accept → goroutine per conn |

## 다음 수업

다음 글에서는 Go 데이터베이스 프로그래밍 — database/sql, ORM, 마이그레이션을 배웁니다.

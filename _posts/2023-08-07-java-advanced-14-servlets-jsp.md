---
layout: post
title: "Java 서블릿과 JSP — HttpServlet, 요청/응답 처리, 세션, MVC 패턴"
description: "Java 웹 애플리케이션의 기초인 서블릿과 JSP를 컨테이너 레벨에서 심층 학습합니다. Servlet Container(Tomcat)가 HttpServletRequest/ServletResponse 객체를 생성하고 서블릿 스레드를 할당하는 과정, doGet()/doPost()의 service() 메서드 디스패치, 세션 관리(HttpSession의 JSESSIONID 쿠키 기반 추적), JSP가 서블릿으로 변환되어 컴파일되는 과정(Jasper 엔진), 필터 체인의 동작과 MVC 패턴(서블릿이 컨트롤러, JSP가 뷰)을 다룹니다."
date: 2023-08-07 10:00:00 +0900
category: java
tags: [java, servlet, jsp, tomcat, session, mvc, filter]
level: advanced
---

서블릿과 JSP는 Java 웹 애플리케이션의 핵심 기술입니다. Spring MVC도 내부적으로 서블릿을 기반으로 동작합니다.

> **💡 핵심 정리** · Servlet Container(Tomcat)는 요청마다 HttpServletRequest/ServletResponse 객체를 생성하고, 스레드 풀에서 스레드를 할당하여 서블릿의 `service()`를 호출합니다. JSP는 Jasper 엔진이 `.java` 서블릿 소스로 변환한 후 javac으로 컴파일하여, 결과적으로 서블릿처럼 실행됩니다. 세션은 JSESSIONID 쿠키로 식별되며, 서버 메모리나 DB에 저장됩니다(기본 30분 타임아웃).

---

## 📚 수업 목표

- 서블릿의 생명주기와 동작 과정을 이해합니다.
- 요청/응답 처리와 세션 관리를 이해합니다.
- JSP가 서블릿으로 변환되는 과정을 이해합니다.
- 필터와 리스너를 활용할 수 있습니다.
- MVC 패턴을 서블릿/JSP로 구현할 수 있습니다.

## 서블릿 기본

```java
@WebServlet("/user/*")
public class UserServlet extends HttpServlet {

    @Override
    public void init() {
        System.out.println("서블릿 초기화 (최초 요청 시 1번)");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String pathInfo = req.getPathInfo();  // /{id}
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        out.println("{\"id\": " + pathInfo + ", \"name\": \"Alice\"}");
    }

    @Override
    public void destroy() {
        System.out.println("서블릿 종료");
    }
}
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: 서블릿은 스레드 안전한가요?</strong></summary>

서블릿은 **싱글턴**(하나의 인스턴스)이지만 **멀티스레드**로 실행됩니다. 여러 요청이 동시에 같은 서블릿 인스턴스의 `doGet()`/`doPost()`를 호출합니다. 따라서 인스턴스 변수는 스레드 안전하지 않습니다. 지역 변수만 사용하거나, 필요한 경우 동기화를 해야 합니다. Spring의 Controller도 기본적으로 싱글턴이므로 같은 주의가 필요합니다.
</details>

<details>
<summary><strong>Q: JSP와 서블릿 중 어떤 것을 사용해야 하나요?</strong></summary>

**서블릿**은 Java 코드 위주(컨트롤러, API), **JSP**는 HTML 표현 위주(뷰)에 적합합니다. 현대 개발에서는 **JSP 대신** Thymeleaf, JSTL, FreeMarker 같은 템플릿 엔진을 사용하고, 서블릿은 Spring MVC가 대체하는 추세입니다. 하지만 서블릿은 여전히 Spring MVC의 내부 엔진으로 동작하므로, 서블릿 개념을 이해하는 것이 중요합니다.
</details>

<details>
<summary><strong>Q: 세션은 어떻게 관리되고 저장되나요?</strong></summary>

세션은 클라이언트의 JSESSIONID 쿠키를 기반으로 식별됩니다. 서버는 세션 데이터를 **메모리**(기본), **파일**, **데이터베이스**, **Redis**에 저장할 수 있습니다. 분산 환경에서는 Redis 같은 외부 저장소가 필요합니다. 세션 타임아웃은 `web.xml`에서 설정하고(기본 30분), `HttpSession.invalidate()`로 강제 종료할 수 있습니다.
</details>

<details>
<summary><strong>Q: 필터와 인터셉터의 차이는 무엇인가요?</strong></summary>

**서블릿 필터**(javax.servlet.Filter)는 서블릿 컨테이너 레벨에서 동작하며, 모든 요청/응답을 가로챕니다. 문자 인코딩 설정, 인증, 로깅에 사용됩니다. **인터셉터**(Spring HandlerInterceptor)는 Spring MVC 레벨에서 동작하며, 특정 컨트롤러 전후에 실행됩니다. 필터가 더 범용적이고, 인터셉터는 Spring의 의존성 주입을 활용할 수 있습니다.
</details>

<details>
<summary><strong>Q: @WebServlet 애너테이션 없이 서블릿을 등록하는 방법은 무엇인가요?</strong></summary>

1) **web.xml**에 `<servlet>`/`<servlet-mapping>`으로 등록. 2) **Java Config**로 `ServletContainerInitializer` 구현. 3) Spring Boot에서는 `@ServletComponentScan`으로 자동 등록. `web.xml`은 레거시 방식이지만, 필터 순서 등 세밀한 제어가 필요할 때 여전히 유용합니다. Spring Boot에서는 `@Bean`으로 `ServletRegistrationBean`을 직접 등록할 수도 있습니다.
</details>

---

## 요약

- **서블릿**: init() → service()(doGet/doPost) → destroy(), 싱글턴 멀티스레드
- **JSP**: Jasper가 서블릿(.java)으로 변환 → 컴파일 → 실행
- **세션**: JSESSIONID 쿠키, 기본 30분 타임아웃, Redis로 분산 저장
- **필터**: FilterChain(요청 전처리-Action-응답 후처리), 인코딩/인증
- **MVC**: 서블릿(Controller) + JSP(View) + JavaBean(Model)

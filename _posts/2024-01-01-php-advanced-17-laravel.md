---
layout: post
title: "PHP Laravel — 아키텍처, Eloquent ORM, 서비스 컨테이너, 이벤트 시스템"
description: "Laravel 프레임워크의 내부 아키텍처를 핵심 컴포넌트 레벨에서 심층 학습합니다. Laravel의 서비스 컨테이너(Illuminate Container)가 ReflectionClass로 생성자 파라미터를 분석하고 타입 힌트에 해당하는 바인딩을 해결하는 의존성 주입 과정, Eloquent ORM의 Active Record 패턴이 Model 클래스의 __call() 매직 메서드로 쿼리 빌더 메서드를 동적으로 호출하는 방식(매크로와 __callStatic), Eloquent 관계(Relationship)의 lazy loading과 eager loading(JOIN vs WHERE IN 쿼리), 이벤트 시스템이 Illuminate Events Dispatcher 구현으로 리스너를 등록하고 dispatch()하는 과정(파이프라인), 미들웨어 파이프라인(Pipe-and-Filter 패턴)의 요청/응답 처리 흐름을 다룹니다."
date: 2024-01-01 10:00:00 +0900
category: php
tags: [php, laravel, eloquent, service-container, events, middleware]
level: advanced
---

Laravel은 PHP의 가장 인기 있는 풀스택 프레임워크로, 표현력 풍부한 문법과 강력한 서비스 컨테이너를 핵심으로 합니다.

> **💡 핵심 정리** · Laravel의 서비스 컨테이너는 `Container::make($abstract)`가 `ReflectionClass::getConstructor()`로 생성자 타입 힌트를 분석하고, 각 파라미터의 클래스에 대해 재귀적으로 `make()`를 호출하여 의존성 트리를 해결합니다. Eloquent의 `__callStatic()`은 정적 메서드 호출(예: `User::where()`)을 `(new Model)->newQuery()->where()`로 동적 디스패치합니다. N+1 문제는 `User::with('posts')`로 eager loading 시 `WHERE IN (user_ids)`로 변환됩니다.

---

## 📚 수업 목표

- Laravel 서비스 컨테이너의 DI 메커니즘을 이해합니다.
- Eloquent ORM의 Active Record 구현을 이해합니다.
- Eager loading과 N+1 문제를 이해합니다.
- 이벤트 시스템의 동작을 이해합니다.
- 미들웨어 파이프라인을 이해합니다.

## Eloquent 모델

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = ['title', 'content', 'user_id'];

    // 관계 정의
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // 로컬 스코프
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }
}

// 사용
$posts = Post::with('author', 'comments')
    ->published()
    ->orderByDesc('created_at')
    ->paginate(20);

foreach ($posts as $post) {
    echo $post->author->name;  // eager loaded, NO 추가 쿼리
}
?>
```

---

## 사람들이 자주 묻는 질문 (People Also Ask)

<details>
<summary><strong>Q: Eloquent의 N+1 문제는 무엇인가요?</strong></summary>

N+1 문제는 관계 데이터를 lazy loading으로 조회할 때 발생합니다. 예: `$posts = Post::all()`(1번 쿼리) → `foreach ($posts as $post) { echo $post->author->name; }`(각 Post마다 1번씩, N번 쿼리) = **총 N+1번 쿼리**. 해결법: `$posts = Post::with('author')->get()`(eager loading) → `SELECT * FROM posts`(1번) + `SELECT * FROM users WHERE id IN (1, 2, 3, ...)`(1번) = **총 2번 쿼리**. `with()`는 내부적으로 `WHERE IN` 절을 생성하여 관계 데이터를 한 번에 로드합니다. `lazy()`, `cursor()`로 청크 단위로도 해결 가능합니다.
</details>

<details>
<summary><strong>Q: 서비스 컨테이너의 bind, singleton, instance의 차이는 무엇인가요?</strong></summary>

`$app->bind(Interface::class, Concrete::class)` — 요청할 때마다 **새 인스턴스**를 생성합니다(의존성 해결마다 `new Concrete()`). `$app->singleton(Service::class)` — **한 번만 생성**되고 이후에는 동일 인스턴스를 반환합니다(애플리케이션 전체에서 공유). `$app->instance('foo', $existingObject)` — **이미 존재하는 객체**를 컨테이너에 등록합니다(테스트에서 mock 주입에 유용). 또한 `$app->scoped()`(PHP 8.0+의 scoped singleton, 요청 단위 싱글톤)도 있습니다. 대부분의 서비스는 `singleton`으로 등록하는 것이 성능상 유리합니다.
</details>

<details>
<summary><strong>Q: Laravel의 서비스 프로바이더는 무엇을 하나요?</strong></summary>

서비스 프로바이더는 **Laravel 부트스트래핑의 핵심**입니다. `register()` 메서드에서 서비스 컨테이너에 바인딩을 등록하고(인터페이스-구현체 매핑), `boot()` 메서드에서 이벤트 리스너, 라우트, 블레이드 지시어, 미들웨어 별칭을 등록합니다. `register()`는 **모든 프로바이더가 등록된 후**에 실행(user/app/Providers/config/app.php의 providers 배열 순서). 주요 내장 프로바이더: `EventServiceProvider`(이벤트/리스너 매핑), `RouteServiceProvider`(라우트 로딩), `AuthServiceProvider`(인증 가드). 사용자 정의 프로바이더는 `php artisan make:provider`로 생성합니다.
</details>

<details>
<summary><strong>Q: Laravel의 이벤트 시스템은 어떻게 동작하나요?</strong></summary>

Laravel 이벤트 시스템은 옵저버 패턴을 구현합니다: 1) `EventServiceProvider`의 `$listen` 배열에 `'App\Events\UserRegistered' => [App\Listeners\SendWelcomeEmail::class]`로 매핑합니다. 2) `event(new UserRegistered($user))`가 호출되면 `Illuminate\Events\Dispatcher`가 `dispatch()` 메서드에서 이벤트에 등록된 모든 리스너를 찾습니다. 3) 각 리스너의 `handle($event)` 메서드가 호출됩니다. 4) 리스너가 `ShouldQueue` 인터페이스를 구현하면 큐(Queue)에 푸시되어 비동기로 실행됩니다(내부적으로 `Illuminate\Bus\Queueable` trait 사용). 이벤트는 애플리케이션의 결합도를 낮추는 핵심 패턴입니다.
</details>

<details>
<summary><strong>Q: Facade와 helper 함수의 차이는 무엇인가요?</strong></summary>

**Facade**는 서비스 컨테이너의 서비스에 정적 인터페이스를 제공합니다: `Cache::get('key')`는 실제로 `app('cache')->get('key')`를 호출합니다(Facade::__callStatic()). **Helper 함수**는 전역 함수로 더 간결합니다: `cache('key')`는 `app('cache')->get('key')`와 동일합니다. Facade는 IDE 자동완성이 좋지만(`@method` 어노테이션), helper 함수는 더 짧고 타입 힌트에 의존하지 않습니다. Laravel은 `config()`, `view()`, `redirect()`, `response()`, `event()`, `dispatch()` 등 많은 helper 함수를 제공합니다. 두 방식 모두 서비스 컨테이너를 통해 동일한 서비스 인스턴스에 접근합니다.
</details>

---

## 요약

- **서비스 컨테이너**: ReflectionClass 기반 DI, bind/singleton/instance 바인딩
- **Eloquent ORM**: Active Record 패턴, __callStatic() 동적 디스패치
- **Eager loading**: `with()` → WHERE IN, N+1 문제 해결
- **이벤트 시스템**: 옵저버 패턴, ShouldQueue로 비동기 처리
- **미들웨어**: Pipe-and-Filter 패턴, 요청 전/후 처리
- **Facade**: 서비스 컨테이너의 정적 프록시, __callStatic() 구현

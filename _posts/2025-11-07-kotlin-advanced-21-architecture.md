---
layout: post
title: "Kotlin 아키텍처와 디자인 패턴 — 클린 아키텍처, MVVM, MVI, 디자인 패턴"
description: "Kotlin의 아키텍처와 디자인 패턴을 실무 레벨에서 학습합니다. 클린 아키텍처는 도메인 중심 설계로 계층을 분리하고 의존성을 역전합니다. MVVM은 Model-View-ViewModel 패턴으로 UI 로직을 분리하고 데이터 바인딩을 사용합니다. MVI는 Model-View-Intent 패턴으로 단방향 데이터 흐름을 제공합니다. 디자인 패턴은 Singleton, Factory, Strategy, Observer, Repository 등을 제공합니다. SOLID 원칙을 따르며 테스트 가능하고 유지보수 가능한 코드를 작성합니다."
date: 2025-11-07 10:00:00 +0900
category: kotlin
tags: [kotlin, architecture, design-patterns, clean-architecture, mvvm, mvi, solid]
level: advanced
---

Kotlin의 아키텍처와 디자인 패턴은 테스트 가능하고 유지보수 가능한 코드를 작성하는 데 필수적입니다.

> **핵심 정리** · 클린 아키텍처는 도메인 중심 설계입니다. `MVVM`은 UI 로직을 분리합니다. `MVI`는 단방향 데이터 흐름을 제공합니다. `Singleton`, `Factory`, `Strategy` 등의 디자인 패턴을 사용합니다. `SOLID` 원칙을 따릅니다. 의존성 역전을 적용합니다.


## 수업 목표

- 클린 아키텍처를 이해합니다.
- MVVM을 이해합니다.
- MVI를 이해합니다.
- 디자인 패턴을 이해합니다.
- SOLID 원칙을 이해합니다.
- 아키텍처 패턴을 이해합니다.

## 클린 아키텍처

```kotlin
// 도메인 계층
data class User(val id: Int, val name: String)

interface UserRepository {
    fun getById(id: Int): User?
    fun save(user: User)
}

class GetUserByIdUseCase(private val repository: UserRepository) {
    operator fun invoke(id: Int): User? {
        return repository.getById(id)
    }
}

// 데이터 계층
class UserRepositoryImpl(private val dataSource: UserDataSource) : UserRepository {
    override fun getById(id: Int): User? {
        return dataSource.getById(id)
    }

    override fun save(user: User) {
        dataSource.save(user)
    }
}

// 프레젠테이션 계층
class UserViewModel(private val getUserByIdUseCase: GetUserByIdUseCase) : ViewModel() {
    private val _user = MutableLiveData<User?>()
    val user: LiveData<User?> = _user

    fun loadUser(id: Int) {
        _user.value = getUserByIdUseCase(id)
    }
}
```

클린 아키텍처는 도메인 중심 설계입니다. 계층을 분리하여 의존성을 제어합니다. 도메인 계층은 비즈니스 로직을 포함합니다. 데이터 계층은 데이터 접근을 담당합니다. 프레젠테이션 계층은 UI를 담당합니다.

## MVVM

```kotlin
// Model
data class User(val id: Int, val name: String)

// ViewModel
class UserViewModel : ViewModel() {
    private val _users = MutableLiveData<List<User>>()
    val users: LiveData<List<User>> = _users

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    fun loadUsers() {
        _loading.value = true
        viewModelScope.launch {
            val users = userRepository.getAll()
            _users.value = users
            _loading.value = false
        }
    }
}

// View (Activity/Fragment)
class UserActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        viewModel.users.observe(this) { users ->
            // UI 업데이트
        }

        viewModel.loading.observe(this) { loading ->
            // 로딩 표시
        }

        viewModel.loadUsers()
    }
}
```

`MVVM`은 Model-View-ViewModel 패턴입니다. `Model`은 데이터를 나타냅니다. `ViewModel`은 UI 로직을 담당합니다. `View`는 UI를 담당합니다. 데이터 바인딩으로 결합도를 줄입니다.

## MVI

```kotlin
// Model
data class UserState(
    val users: List<User> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null
)

// Intent
sealed class UserIntent {
    object LoadUsers : UserIntent()
    data class DeleteUser(val id: Int) : UserIntent()
}

// ViewModel
class UserViewModel : ViewModel() {
    private val _state = MutableLiveData<UserState>()
    val state: LiveData<UserState> = _state

    fun handleIntent(intent: UserIntent) {
        when (intent) {
            is UserIntent.LoadUsers -> loadUsers()
            is UserIntent.DeleteUser -> deleteUser(intent.id)
        }
    }

    private fun loadUsers() {
        _state.value = UserState(loading = true)
        viewModelScope.launch {
            val users = userRepository.getAll()
            _state.value = UserState(users = users, loading = false)
        }
    }
}

// View
class UserActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user)

        viewModel.state.observe(this) { state ->
            when {
                state.loading -> showLoading()
                state.error != null -> showError(state.error)
                else -> showUsers(state.users)
            }
        }

        viewModel.handleIntent(UserIntent.LoadUsers)
    }
}
```

`MVI`는 Model-View-Intent 패턴입니다. 단방향 데이터 흐름을 제공합니다. `Intent`로 사용자 의도를 표현합니다. `State`로 UI 상태를 표현합니다. 예측 가능한 상태 변화를 제공합니다.

## Singleton 패턴

```kotlin
// object 키워드로 Singleton
object Database {
    private val users = mutableListOf<User>()

    fun addUser(user: User) {
        users.add(user)
    }

    fun getUsers(): List<User> {
        return users.toList()
    }
}

// 사용
Database.addUser(User(1, "Wolhyong"))
val users = Database.getUsers()
```

`object` 키워드로 싱글톤을 생성합니다. 전역 인스턴스를 제공합니다. 데이터베이스 연결, 설정 등에 사용됩니다. 스레드 안전성을 고려해야 합니다.

## Factory 패턴

```kotlin
// Factory 인터페이스
interface UserFactory {
    fun createUser(id: Int, name: String): User
}

// 구체적 Factory
class RegularUserFactory : UserFactory {
    override fun createUser(id: Int, name: String): User {
        return User(id, name, role = "USER")
    }
}

class AdminUserFactory : UserFactory {
    override fun createUser(id: Int, name: String): User {
        return User(id, name, role = "ADMIN")
    }
}

// 사용
val regularFactory = RegularUserFactory()
val adminFactory = AdminUserFactory()

val regularUser = regularFactory.createUser(1, "Wolhyong")
val adminUser = adminFactory.createUser(2, "Admin")
```

`Factory` 패턴은 객체 생성을 캡슐화합니다. 인터페이스로 팩토리를 정의합니다. 구체적 팩토리로 다양한 객체를 생성합니다. 객체 생성 로직을 분리합니다.

## Strategy 패턴

```kotlin
// Strategy 인터페이스
interface PaymentStrategy {
    fun pay(amount: Double): Boolean
}

// 구체적 Strategy
class CreditCardPayment : PaymentStrategy {
    override fun pay(amount: Double): Boolean {
        println("신용카드로 $amount 결제")
        return true
    }
}

class PayPalPayment : PaymentStrategy {
    override fun pay(amount: Double): Boolean {
        println("PayPal로 $amount 결제")
        return true
    }
}

// Context
class PaymentContext(private val strategy: PaymentStrategy) {
    fun executePayment(amount: Double): Boolean {
        return strategy.pay(amount)
    }
}

// 사용
val creditCardPayment = PaymentContext(CreditCardPayment())
creditCardPayment.executePayment(100.0)

val payPalPayment = PaymentContext(PayPalPayment())
payPalPayment.executePayment(50.0)
```

`Strategy` 패턴은 알고리즘을 캡슐화합니다. 인터페이스로 전략을 정의합니다. 구체적 전략으로 다양한 알고리즘을 구현합니다. 런타임에 전략을 변경할 수 있습니다.

## Observer 패턴

```kotlin
// Observer 인터페이스
interface Observer {
    fun update(data: String)
}

// Subject
class Subject {
    private val observers = mutableListOf<Observer>()

    fun addObserver(observer: Observer) {
        observers.add(observer)
    }

    fun removeObserver(observer: Observer) {
        observers.remove(observer)
    }

    fun notifyObservers(data: String) {
        observers.forEach { it.update(data) }
    }
}

// 구체적 Observer
class ConcreteObserver : Observer {
    override fun update(data: String) {
        println("업데이트: $data")
    }
}

// 사용
val subject = Subject()
val observer = ConcreteObserver()

subject.addObserver(observer)
subject.notifyObservers("Hello, World!")
```

`Observer` 패턴은 상태 변경을 알립니다. `Observer` 인터페이스로 관찰자를 정의합니다. `Subject`로 상태를 관리합니다. 상태 변경 시 모든 관찰자에게 알립니다.

## Repository 패턴

```kotlin
// Repository 인터페이스
interface UserRepository {
    fun getById(id: Int): User?
    fun getAll(): List<User>
    fun save(user: User)
    fun delete(id: Int)
}

// 구체적 Repository
class UserRepositoryImpl(
    private val localDataSource: UserLocalDataSource,
    private val remoteDataSource: UserRemoteDataSource
) : UserRepository {

    override fun getById(id: Int): User? {
        return localDataSource.getById(id) ?: remoteDataSource.getById(id)
    }

    override fun getAll(): List<User> {
        return localDataSource.getAll().ifEmpty { remoteDataSource.getAll() }
    }

    override fun save(user: User) {
        localDataSource.save(user)
        remoteDataSource.save(user)
    }

    override fun delete(id: Int) {
        localDataSource.delete(id)
        remoteDataSource.delete(id)
    }
}
```

`Repository` 패턴은 데이터 접근을 추상화합니다. 인터페이스로 리포지토리를 정의합니다. 여러 데이터 소스를 통합합니다. 캐싱, 동기화 등을 처리합니다.

## SOLID 원칙

```kotlin
// S - Single Responsibility Principle (단일 책임 원칙)
class UserRepository {
    fun save(user: User) { /* 저장 로직 */ }
}

class UserValidator {
    fun validate(user: User): Boolean { /* 검증 로직 */ }
}

// O - Open/Closed Principle (개방-폐쇄 원칙)
interface PaymentStrategy {
    fun pay(amount: Double): Boolean
}

class CreditCardPayment : PaymentStrategy {
    override fun pay(amount: Double): Boolean { /* ... */ }
}

// L - Liskov Substitution Principle (리스코프 치환 원칙)
open class Bird {
    open fun fly() { /* ... */ }
}

class Sparrow : Bird() {
    override fun fly() { /* ... */ }
}

// I - Interface Segregation Principle (인터페이스 분리 원칙)
interface Readable {
    fun read()
}

interface Writable {
    fun write()
}

// D - Dependency Inversion Principle (의존성 역전 원칙)
interface UserRepository {
    fun getById(id: Int): User?
}

class UserService(private val repository: UserRepository) {
    fun getUser(id: Int): User? {
        return repository.getById(id)
    }
}
```

`SOLID` 원칙은 좋은 소프트웨어 설계의 지침입니다. `S`는 단일 책임 원칙입니다. `O`는 개방-폐쇄 원칙입니다. `L`은 리스코프 치환 원칙입니다. `I`는 인터페이스 분리 원칙입니다. `D`는 의존성 역전 원칙입니다.

## 의존성 주입

```kotlin
// Hilt 사용
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideUserRepository(
        localDataSource: UserLocalDataSource,
        remoteDataSource: UserRemoteDataSource
    ): UserRepository {
        return UserRepositoryImpl(localDataSource, remoteDataSource)
    }

    @Provides
    @Singleton
    fun provideUserService(repository: UserRepository): UserService {
        return UserService(repository)
    }
}

@HiltViewModel
class UserViewModel @Inject constructor(
    private val userService: UserService
) : ViewModel() {
    // ...
}
```

의존성 주입은 의존성을 외부에서 주입합니다. `Hilt`는 안드로이드용 DI 컨테이너입니다. `@Module`, `@Provides`로 의존성을 제공합니다. `@Inject`로 의존성을 주입받습니다. 테스트 가능성을 높입니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> MVVM과 MVI 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`MVVM`을 우선 사용해야 합니다. 간단하고 널리 사용됩니다. `MVI`는 복잡한 상태 관리가 필요할 때 사용합니다. 단방향 데이터 흐름이 필요할 때 유용합니다. 프로젝트 요구사항에 따라 선택합니다.
</details>

<details>
<summary><strong>Q> 클린 아키텍처는 언제 사용해야 하나요?</strong></summary>

클린 아키텍처는 대형 프로젝트에 사용합니다. 도메인 중심 설계가 필요할 때 유용합니다. 테스트 가능성과 유지보수성을 높입니다. 소규모 프로젝트에는 과도할 수 있습니다.
</details>

<details>
<summary><strong>Q> Singleton 패턴은 언제 사용해야 하나요?</strong></summary>

`Singleton` 패턴은 전역 인스턴스가 필요할 때 사용합니다. 데이터베이스 연결, 설정 등에 사용됩니다. 스레드 안전성을 고려해야 합니다. 과도한 사용은 테스트를 어렵게 만듭니다.
</details>

<details>
<summary><strong>Q> Repository 패턴은 언제 사용해야 하나요?</strong></summary>

`Repository` 패턴은 데이터 접근이 필요할 때 사용합니다. 여러 데이터 소스를 통합할 때 유용합니다. 캐싱, 동기화 등을 처리합니다. 데이터 계층을 추상화합니다.
</details>

<details>
<summary><strong>Q> SOLID 원칙은 왜 중요한가요?</strong></summary>

`SOLID` 원칙은 유지보수 가능한 코드를 작성하는 데 필수적입니다. 결합도를 줄이고 응집도를 높입니다. 테스트 가능성을 높입니다. 리팩토링을 쉽게 만듭니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **클린 아키텍처** | 도메인 중심 설계 | 계층 분리 |
| **MVVM** | Model-View-ViewModel | UI 로직 분리 |
| **MVI** | Model-View-Intent | 단방향 데이터 흐름 |
| **Singleton** | object 키워드 | 전역 인스턴스 |
| **Factory** | 객체 생성 캡슐화 | 인터페이스 |
| **Strategy** | 알고리즘 캡슐화 | 런타임 변경 |
| **Observer** | 상태 변경 알림 | Subject-Observer |
| **Repository** | 데이터 접근 추상화 | 여러 소스 |
| **SOLID** | 설계 원칙 | 5가지 원칙 |
| **SRP** | 단일 책임 원칙 | 하나의 책임 |
| **OCP** | 개방-폐쇄 원칙 | 확장 가능 |
| **LSP** | 리스코프 치환 원칙 | 하위 타입 호환 |
| **ISP** | 인터페이스 분리 원칙 | 작은 인터페이스 |
| **DIP** | 의존성 역전 원칙 | 추상화 의존 |
| **의존성 주입** | 외부 주입 | Hilt |


## 다음 수업

Kotlin 수업이 모두 완료되었습니다. 다음은 카테고리 페이지를 생성하겠습니다.

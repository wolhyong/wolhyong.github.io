---
layout: post
title: "Kotlin 안드로이드 개발 — Activity, Fragment, ViewModel, LiveData, Jetpack Compose"
description: "Kotlin의 안드로이드 개발 프레임워크를 실무 레벨에서 학습합니다. 안드로이드는 Kotlin을 공식 언어로 사용하며 Jetpack 라이브러리를 제공합니다. Activity는 애플리케이션의 단일 화면을 나타내며 onCreate, onStart, onResume 등의 생명주기를 가집니다. Fragment는 재사용 가능한 UI 컴포넌트로 Activity 내에서 동적으로 추가/제거됩니다. ViewModel은 UI 관련 데이터를 보관하며 생명주기 변경에서 살아남습니다. LiveData는 관찰 가능한 데이터 홀더로 데이터 변경을 UI에 자동으로 반영합니다. Jetpack Compose는 선언형 UI 프레임워크로 XML 없이 코드로 UI를 작성합니다."
date: 2025-10-27 10:00:00 +0900
category: kotlin
tags: [kotlin, android, jetpack, activity, fragment, viewmodel, livedata, jetpack-compose]
level: advanced
---

Kotlin은 안드로이드 개발의 공식 언어이며 Jetpack 라이브러리와 함께 현대적인 앱을 구축할 수 있습니다.

> **핵심 정리** · `Activity`는 단일 화면을 나타냅니다. `Fragment`는 재사용 가능한 UI 컴포넌트입니다. `ViewModel`은 UI 데이터를 보관합니다. `LiveData`는 관찰 가능한 데이터 홀더입니다. `Jetpack Compose`는 선언형 UI 프레임워크입니다. 생명주기 인식 컴포넌트를 제공합니다.


## 수업 목표

- Activity를 이해하고 사용할 수 있습니다.
- Fragment를 이해하고 사용할 수 있습니다.
- ViewModel을 이해하고 사용할 수 있습니다.
- LiveData를 이해하고 사용할 수 있습니다.
- Jetpack Compose를 이해합니다.
- 안드로이드 생명주기를 이해합니다.

## Activity

```kotlin
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val textView = findViewById<TextView>(R.id.textView)
        textView.text = "Hello, Android!"
    }
}
```

`Activity`는 애플리케이션의 단일 화면을 나타냅니다. `onCreate`, `onStart`, `onResume`, `onPause`, `onStop`, `onDestroy` 등의 생명주기 메서드를 가집니다. `setContentView`로 레이아웃을 설정합니다.

## Fragment

```kotlin
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment

class MyFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_my, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // 뷰 초기화
    }
}
```

`Fragment`는 재사용 가능한 UI 컴포넌트입니다. Activity 내에서 동적으로 추가/제거됩니다. `onCreateView`, `onViewCreated` 등의 생명주기 메서드를 가집니다. 모듈화된 UI를 구축할 수 있습니다.

## ViewModel

```kotlin
import androidx.lifecycle.ViewModel

class MyViewModel : ViewModel() {
    private val _count = MutableLiveData(0)
    val count: LiveData<Int> = _count

    fun increment() {
        _count.value = _count.value?.plus(1) ?: 1
    }
}
```

`ViewModel`은 UI 관련 데이터를 보관합니다. 생명주기 변경에서 살아남으며 화면 회전 시 데이터를 유지합니다. `LiveData`와 함께 사용하여 데이터를 관찰합니다. 비즈니스 로직을 분리합니다.

## LiveData

```kotlin
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class MyViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    fun updateData(newData: String) {
        _data.value = newData
    }
}

// Activity에서 관찰
viewModel.data.observe(this) { data ->
    textView.text = data
}
```

`LiveData`는 관찰 가능한 데이터 홀더입니다. 데이터 변경을 UI에 자동으로 반영합니다. `MutableLiveData`로 변경 가능한 데이터를 정의합니다. `observe`로 데이터 변경을 관찰합니다.

## Jetpack Compose

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun Greeting(name: String) {
    Text(
        text = "Hello, $name!",
        modifier = Modifier.padding(16.dp)
    )
}

@Composable
fun MyApp() {
    Greeting("Android")
}
```

`Jetpack Compose`는 선언형 UI 프레임워크입니다. XML 없이 코드로 UI를 작성할 수 있습니다. `@Composable` 어노테이션으로 컴포넌트를 정의합니다. 상태 기반 UI를 쉽게 구현할 수 있습니다.

## Compose 상태

```kotlin
import androidx.compose.runtime.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text

@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }

    Column {
        Text("Count: $count")
        Button(onClick = { count++ }) {
            Text("Increment")
        }
    }
}
```

`remember`로 상태를 기억합니다. `mutableStateOf`로 변경 가능한 상태를 정의합니다. 상태 변경 시 UI가 자동으로 재구성됩니다. 간단한 상태 관리를 제공합니다.

## Compose 리스트

```kotlin
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text

@Composable
fun ItemList(items: List<String>) {
    LazyColumn {
        items(items) { item ->
            Text(item)
        }
    }
}
```

`LazyColumn`으로 리스트를 표현합니다. `items`로 항목을 순회합니다. 효율적인 스크롤을 제공합니다. 대용량 데이터에 적합합니다.

## Navigation Compose

```kotlin
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

@Composable
fun MyApp() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen()
        }
        composable("detail") {
            DetailScreen()
        }
    }
}
```

`NavHost`로 네비게이션을 설정합니다. `composable`로 화면을 정의합니다. `rememberNavController`로 컨트롤러를 기억합니다. 화면 간 이동을 간단하게 구현할 수 있습니다.

## Room 데이터베이스

```kotlin
import androidx.room.Entity
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.Query

@Entity
data class User(
    @PrimaryKey val id: Int,
    val name: String
)

@Dao
interface UserDao {
    @Query("SELECT * FROM user")
    fun getAll(): List<User>

    @Insert
    fun insert(user: User)

    @Delete
    fun delete(user: User)
}

@Database(entities = [User::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

`Room`은 안드로이드용 ORM입니다. `@Entity`로 엔티티를 정의합니다. `@Dao`로 데이터 접근 객체를 정의합니다. `@Database`로 데이터베이스를 정의합니다. SQLite를 추상화하여 사용하기 쉽게 만듭니다.

## Hilt 의존성 주입

```kotlin
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideRepository(): Repository {
        return Repository()
    }
}

class MyViewModel @Inject constructor(
    private val repository: Repository
) : ViewModel()
```

`Hilt`는 안드로이드용 DI 컨테이너입니다. `@Module`로 모듈을 정의합니다. `@Provides`로 의존성을 제공합니다. `@Inject`로 의존성을 주입받습니다. 의존성 주입을 간단하게 구현할 수 있습니다.


## 사람들이 자주 묻는 질문

<details>
<summary><strong>Q> Activity와 Fragment 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Activity`는 단일 화면에 사용합니다. `Fragment`는 재사용 가능한 UI 컴포넌트에 사용합니다. 모듈화된 UI를 구축할 때 `Fragment`를 사용합니다. 대형 애플리케이션에서는 `Fragment`를 우선 사용합니다.
</details>

<details>
<summary><strong>Q> ViewModel은 언제 사용해야 하나요?</strong></summary>

`ViewModel`은 UI 관련 데이터에 사용합니다. 화면 회전 시 데이터를 유지해야 할 때 사용합니다. 비즈니스 로직을 분리할 때 사용합니다. 모든 UI 데이터는 `ViewModel`에 저장해야 합니다.
</details>

<details>
<summary><strong>Q> LiveData와 State 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`LiveData`는 XML 기반 UI에 사용합니다. `State`는 Compose에 사용합니다. `LiveData`는 관찰 가능한 데이터 홀더입니다. `State`는 Compose의 상태 관리에 최적화되어 있습니다.
</details>

<details>
<summary><strong>Q> Jetpack Compose와 XML 중 언제 어떤 것을 사용해야 하나요?</strong></summary>

`Jetpack Compose`를 우선 사용해야 합니다. 선언형 UI로 코드로 UI를 작성할 수 있습니다. XML은 기존 프로젝트에 사용합니다. 새 프로젝트는 `Compose`를 사용하는 것이 좋습니다.
</details>

<details>
<summary><strong>Q> Room은 언제 사용해야 하나요?</strong></summary>

`Room`은 로컬 데이터베이스에 사용합니다. 오프라인 데이터 저장에 적합합니다. SQLite를 직접 사용하는 것보다 간단합니다. 캐시, 사용자 설정 등에 사용합니다.
</details>


## 요약

| 개념 | 설명 | 특징 |
|------|------|------|
| **Activity** | 단일 화면 | 생명주기 |
| **Fragment** | 재사용 가능 UI | 동적 추가/제거 |
| **ViewModel** | UI 데이터 보관 | 생명주기 인식 |
| **LiveData** | 관찰 가능 데이터 | observe |
| **Jetpack Compose** | 선언형 UI | @Composable |
| **remember** | 상태 기억 | 상태 유지 |
| **mutableStateOf** | 변경 가능 상태 | 상태 변경 |
| **LazyColumn** | 리스트 | 효율적 스크롤 |
| **Navigation** | 화면 이동 | NavHost |
| **Room** | ORM | SQLite 추상화 |
| **Hilt** | DI 컨테이너 | 의존성 주입 |
| **onCreate** | 생명주기 시작 | 초기화 |
| **onDestroy** | 생명주기 종료 | 정리 |


## 다음 수업

다음 글에서는 Kotlin 고급 — Ktor 웹 프레임워크, HTTP 서버, 라우팅, 플러그인을 배웁니다.

---


layout: post


title: "Nuxt.js 폼과 유효성 검사 — HTML5 폼, VeeValidate, Zod 스키마가 서버/클라이언트에서 이중 검증하는 과정"


description: "Nuxt.js에서 폼 입력과 유효성 검사를 처리하는 모든 방법을 시스템 레벨에서 심층 학습합니다. HTML5 기본 폼의 input/select/textarea 요소가 브라우저의 ValidationMessage API로 required/minlength/pattern 등의 제약 조건을 실시간 검증하는 과정, VeeValidate의 useForm과 useField가 Vue의 provide/inject로 폼 상태를 관리하고 Field 컴포넌트가 v-model을 가로채어 유효성 검사를 수행하는 방식, Zod 스키마가 z.object().parse()로 런타임에 데이터 타입을 검증하고 TypeScript 타입으로 자동 추론되는 과정, 서버에서 Zod로 검증된 데이터를 받아 DB에 저장하고 유효성 검사 실패 시 createError()로 400 에러를 응답하는 이중 검증 구조를 다룹니다."


date: 2024-04-15 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, forms, validation, vee-validate, zod, schema, form-validation]


level: intermediate


---





Nuxt.js에서 폼 유효성 검사는 클라이언트와 서버에서 이중으로 수행되어야 합니다.





> **핵심 정리** · VeeValidate의 `useForm()`과 `useField()`는 Vue의 provide/inject로 폼 상태를 관리합니다. Zod 스키마는 `z.object().parse()`로 런타임 데이터를 검증하고 TypeScript 타입을 추론합니다. 서버에서는 Zod로 검증 후 DB에 저장하고, 실패 시 `createError()`로 400 에러를 응답하여 클라이언트와 서버가 동일한 검증 규칙을 공유합니다.





---





## 수업 목표





- HTML5 기본 폼 검증의 동작을 이해합니다.


- VeeValidate의 provide/inject 기반 상태 관리를 이해합니다.


- Zod 스키마의 런타임 검증과 타입 추론을 이해합니다.


- 클라이언트/서버 이중 검증 구조를 이해합니다.





## VeeValidate + Zod 폼{% raw %}```vue

<script setup lang="ts">

import { z } from 'zod'



const schema = z.object({

  title: z.string().min(2, '제목은 2자 이상').max(100, '제목은 100자 이하'),

  content: z.string().min(10, '내용은 10자 이상').max(10000),

  email: z.string().email('올바른 이메일을 입력하세요'),

  category: z.enum(['tech', 'life', 'review'], { message: '카테고리를 선택하세요' }),

  tags: z.array(z.string()).min(1, '태그를 하나 이상 입력하세요').max(5)

})



type FormData = z.infer<typeof schema>



const { handleSubmit, errors, isSubmitting } = useForm<FormData>({

  validationSchema: toTypedSchema(schema)

})



const { value: title } = useField<string>('title')

const { value: content } = useField<string>('content')



const submit = handleSubmit(async (values) => {

  const { data, error } = await useFetch('/api/posts', {

    method: 'POST',

    body: values

  })

  if (error.value) {

    // 서버 검증 에러 처리

  }

})

</script>



<template>

  <form @submit="submit" class="space-y-4" novalidate>

    <div>

      <label for="title">제목</label>

      <input id="title" v-model="title" type="text" class="input" />

      <span v-if="errors.title" class="error">{{ errors.title }}</span>

    </div>

    <button type="submit" :disabled="isSubmitting">

      {{ isSubmitting ? '저장 중...' : '저장' }}

    </button>

  </form>

</template>

```{% endraw %}





VeeValidate의 `useForm()`은 Vue의 `provide/inject`로 폼 상태를 관리합니다. `validationSchema`에 Zod 스키마를 `toTypedSchema()`로 변환하여 전달합니다. `useField('title')`은 `provide`된 폼 인스턴스에서 `title` 필드의 상태를 가져옵니다. 필드 값이 변경될 때마다 Zod 스키마에 대해 유효성 검사가 실행됩니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: VeeValidate와 HTML5 기본 검증의 차이는 무엇인가요?</strong></summary>





HTML5 기본 검증(`required`, `minlength`, `pattern` 등)은 브라우저 내장 ValidationMessage API를 사용합니다. 간단한 검증에는 충분하지만, 커스텀 에러 메시지, 비동기 검증, 복잡한 조건부 검증이 어렵습니다. VeeValidate는 Vue의 반응형 시스템과 통합되어 조건부 검증, 크로스 필드 검증(비밀번호 확인), 비동기 검증(이메일 중복 확인)을 지원합니다. 또한 Zod나 Yup 같은 스키마 라이브러리와 결합하여 타입 안전한 검증이 가능합니다.


</details>





<details>


<summary><strong>Q: Zod 스키마는 서버에서도 동일하게 사용할 수 있나요?</strong></summary>





네, Zod 스키마를 공유 패키지로 분리하면 클라이언트와 서버에서 동일한 검증 규칙을 사용할 수 있습니다. 예를 들어 `shared/schemas/post.ts`에 스키마를 정의하고, 클라이언트에서는 VeeValidate의 `validationSchema`로, 서버 API 핸들러에서는 `schema.parse(body)`로 검증합니다. 이렇게 하면 검증 규칙이 한 곳에서 관리되므로, 규칙이 변경되어도 클라이언트와 서버가 자동으로 동기화됩니다.


</details>





<details>


<summary><strong>Q: 서버 검증 실패 시 클라이언트에 에러를 어떻게 전달하나요?</strong></summary>





서버에서 `createError()`로 400 에러를 응답할 때, `data` 속성에 Zod 검증 에러를 포함시킵니다: `throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: zodError.errors })`. 클라이언트의 `useFetch()`는 `error.value.data`로 이 에러에 접근할 수 있습니다. `error.value.statusCode`가 400이면 서버 검증 에러로 간주하여 폼 필드에 매핑할 수 있습니다. 각 필드 이름과 일치하는 에러 메시지를 찾아 `setFieldError()`로 설정합니다.


</details>





<details>


<summary><strong>Q: useForm의 handleSubmit에서 await useFetch를 사용하면 어떤 이점이 있나요?</strong></summary>





`handleSubmit`은 폼 검증이 통과된 후에만 콜백을 실행합니다. `await useFetch()`는 SSR-safe한 HTTP 요청으로, 서버에 폼 데이터를 제출합니다. `handleSubmit`이 반환하는 Promise는 폼 검증이 완료된 후에만 resolve되므로, `isSubmitting`이 올바르게 제어됩니다. 에러가 발생하면 `error.value`에 저장되어 템플릿에서 표시할 수 있습니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **HTML5 폼** | 브라우저 기본 검증 | ValidationMessage API |


| **VeeValidate** | Vue 폼 검증 라이브러리 | provide/inject → useForm/useField 상태 관리 |


| **Zod** | 스키마 기반 검증 | z.object().parse() → 런타임 타입 검증 |


| **이중 검증** | 클라이언트 + 서버 | Zod 스키마 공유 → 동일 규칙 |


| **서버 에러** | 검증 실패 응답 | createError(400) → data에 에러 상세 포함 |





## 다음 수업





다음 글에서는 파일 업로드와 에셋 관리 — multer/busboy로 파일을 처리하는 과정을 배웁니다.



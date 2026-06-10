---


layout: post


title: "Nuxt.js 파일 업로드와 에셋 관리 — busboy로 multipart/form-data를 파싱하고 sharp로 이미지를 처리하는 과정"


description: "Nuxt.js에서 파일 업로드를 처리하는 과정을 시스템 레벨에서 심층 학습합니다. h3의 readMultipartFormData()가 내부적으로 busboy 라이브러리를 사용하여 multipart/form-data 요청의 boundary를 기준으로 각 파트를 분리하고, 파일 파트를 Buffer로 수집하는 과정, sharp 라이브러리로 업로드된 이미지의 크기를 리사이징(resize)하고 WebP/AVIF 형식으로 변환하여 디스크나 S3에 저장하는 과정, readBody()의 multipart 지원과 readMultipartFormData()의 차이점, FormData 객체와 Blob이 fetch API에서 multipart 요청으로 직렬화되는 과정, 용량 제한과 파일 형식 검증을 서버에서 수행하는 보안 고려사항을 다룹니다."


date: 2024-04-22 10:00:00 +0900


category: nuxtjs


tags: [nuxtjs, file-upload, multipart, busboy, sharp, image-processing, assets]


level: intermediate


---





Nuxt.js에서 파일 업로드는 h3의 readMultipartFormData()로 처리합니다.





> **핵심 정리** · `readMultipartFormData(event)`는 내부적으로 busboy 라이브러리를 사용하여 multipart/form-data 요청의 각 파트를 Buffer로 수집합니다. sharp로 업로드된 이미지를 리사이징하고 WebP로 변환합니다. `readBody()`는 multipart를 지원하지 않으므로, 파일 업로드에는 `readMultipartFormData()`를 사용해야 합니다.





---





## 수업 목표





- readMultipartFormData의 busboy 기반 파싱을 이해합니다.


- sharp로 이미지 처리하는 과정을 이해합니다.


- 파일 업로드 보안 고려사항을 이해합니다.





## 파일 업로드 API





```typescript


// server/api/upload.ts


export default defineEventHandler(async (event) => {


  const files = await readMultipartFormData(event)


  if (!files || files.length === 0) {


    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })


  }





  const uploadDir = './uploads'


  const uploaded = []





  for (const file of files) {


    if (!file.filename) continue





    // 확장자 검증


    const ext = file.filename.split('.').pop()?.toLowerCase()


    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {


      throw createError({ statusCode: 400, statusMessage: `Invalid file type: ${ext}` })


    }





    // 용량 검증 (5MB)


    if (file.data.length > 5 * 1024 * 1024) {


      throw createError({ statusCode: 400, statusMessage: 'File too large' })


    }





    // sharp로 이미지 최적화


    let processedBuffer = file.data


    if (['jpg', 'jpeg', 'png'].includes(ext)) {


      processedBuffer = await sharp(file.data)


        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })


        .webp({ quality: 80 })


        .toBuffer()


    }





    const filename = `${Date.now()}-${crypto.randomUUID()}.webp`


    const filepath = join(uploadDir, filename)


    await writeFile(filepath, processedBuffer)





    uploaded.push({ filename, originalName: file.filename, size: processedBuffer.length })


  }





  return { uploaded }


})


```





`readMultipartFormData(event)`는 h3가 내부적으로 `busboy`(또는 최신 버전에서는 `h3-multipart`)를 사용하여 요청 바디를 파싱합니다. 각 파트는 `{ data: Buffer, filename?: string, name: string, type?: string }` 형식의 객체로 반환됩니다. `data`는 파일의 바이너리 데이터를 Buffer로 저장합니다. 버퍼가 메모리에 로드되므로, 대용량 파일은 스트림 처리가 필요할 수 있습니다.





---





## 사람들이 자주 묻는 질문





<details>


<summary><strong>Q: readBody와 readMultipartFormData의 차이는 무엇인가요?</strong></summary>





`readBody()`는 `application/json`, `application/x-www-form-urlencoded`만 지원합니다. `multipart/form-data` 요청(파일 업로드)은 파싱할 수 없습니다. `readMultipartFormData()`는 multipart 요청을 파싱하여 각 파트(`data: Buffer, filename, name, type`) 배열을 반환합니다. 일반 필드와 파일이 혼합된 폼 데이터는 `readMultipartFormData()`로 모든 파트를 읽은 후, `file.filename`이 있는 파트는 파일, 없는 파트는 일반 필드로 구분합니다.


</details>





<details>


<summary><strong>Q: sharp로 이미지를 WebP로 변환하면 용량이 얼마나 줄어드나요?</strong></summary>





일반적으로 JPEG 대비 WebP는 **25~35% 추가 압축**됩니다. PNG 대비는 **50~70%**까지 압축률이 향상됩니다. `sharp(fileData).webp({ quality: 80 })`로 변환하면 품질 손실이 거의 눈에 띄지 않으면서 용량을 크게 줄일 수 있습니다. AVIF는 WebP보다 추가로 20% 더 압축하지만, 브라우저 지원 범위가 WebP보다 좁습니다(2024년 기준 Safari 16.4+ 지원).


</details>





<details>


<summary><strong>Q: 업로드된 파일을 S3에 저장하려면 어떻게 하나요?</strong></summary>





로컬 파일시스템 대신 AWS SDK v3의 `@aws-sdk/client-s3`를 사용합니다. `putObject` 명령으로 Buffer를 직접 업로드할 수 있습니다. `sharp`로 처리한 Buffer를 `PutObjectCommand`의 `Body`에 전달합니다. URL은 `CloudFront` 또는 S3의 정적 호스팅으로 생성합니다. `runtimeConfig`에 AWS 자격 증명을 저장하고 서버에서만 접근하도록 설정합니다. 파일 업로드 시 고유 ID를 생성하여 S3 키로 사용하고, 생성된 URL을 DB에 저장합니다.


</details>





<details>


<summary><strong>Q: 파일 업로드 시 용량 제한은 어떻게 하나요?</strong></summary>





`readMultipartFormData()`는 기본적으로 요청 바디 전체를 메모리에 로드합니다. Nitro 설정에서 `request.body.sizeLimit`으로 제한할 수 있습니다: `nitro: { experimental: { asyncContext: true } }`. 개별 파일의 용량 제한은 위 코드처럼 `file.data.length`로 직접 검증합니다. `busboy`의 `limits` 옵션을 설정하려면 h3의 이벤트 핸들러에서 직접 busboy를 초기화해야 합니다. 대용량 파일 업로드가 필요한 경우, 스트리밍 방식으로 청크 단위로 S3에 직접 업로드하는 presigned URL 방식을 고려합니다.


</details>





---





## 요약





| 개념 | 설명 | 내부 동작 |


|------|------|----------|


| **readMultipartFormData** | multipart 파싱 | busboy 라이브러리 → 각 파트 Buffer로 수집 |


| **sharp** | 이미지 처리 | resize/format/quality 변환 → Buffer 출력 |


| **파일 검증** | 형식/용량 제한 | 확장자 화이트리스트 + buffer.length 검사 |


| **S3 업로드** | 클라우드 스토리지 | AWS SDK PutObjectCommand → Buffer 직접 업로드 |





## 다음 수업





다음 글에서는 에러 핸들링과 로깅 — Vue 에러 바운더리와 서버 로깅 전략을 배웁니다.



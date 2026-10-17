import { ApiRequestError } from './client'

// 개발 서버에서만 S3 업로드를 vite 프록시(/__s3)로 돌린다 — vite.config.ts와 같이 고친다.
// 이 버킷이 아닌 주소는 바꾸지 않는다(프록시 목적지가 이 버킷 하나라 다른 버킷으로
// 보내면 서명이 맞지 않는다). 운영 빌드에서는 import.meta.env.DEV가 false라 이 분기가
// 빠지고 브라우저가 S3로 직접 올린다.
const DEV_S3_ORIGIN =
  'https://nova-prod-upload-316708313927.s3.ap-northeast-2.amazonaws.com'
const DEV_S3_PROXY = '/__s3'

const toUploadTarget = (uploadUrl: string) =>
  import.meta.env.DEV && uploadUrl.startsWith(DEV_S3_ORIGIN)
    ? DEV_S3_PROXY + uploadUrl.slice(DEV_S3_ORIGIN.length)
    : uploadUrl

// 10MB 사진도 느린 회선에서 끝나도록 API(10초)보다 넉넉히 둔다.
const UPLOAD_TIMEOUT_MS = 60_000

const uploadFailed = (status: number, message: string) =>
  new ApiRequestError({ code: 'UPLOAD_FAILED', message, details: null }, status)

/**
 * 서버가 발급한 서명 주소(presigned URL)로 파일을 그대로 올린다.
 *
 * apiClient를 쓰지 않는다 — 응답이 이 서비스의 봉투({ success, data })가 아니라 상태
 * 코드만 보면 되고, 인증 헤더·쿠키를 실으면 안 된다(서명이 곧 권한이다). 받은 headers는
 * 서명에 포함돼 있어 그대로 붙인다. 실패는 다른 API처럼 ApiRequestError로 던진다.
 */
export async function uploadToPresignedUrl({
  uploadUrl,
  headers,
  file,
}: {
  uploadUrl: string
  headers: Record<string, string>
  file: Blob
}): Promise<void> {
  let response: Response
  try {
    response = await fetch(toUploadTarget(uploadUrl), {
      method: 'PUT',
      headers,
      body: file,
      credentials: 'omit',
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
  } catch {
    throw uploadFailed(
      0,
      '사진을 올리지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.',
    )
  }
  if (!response.ok) {
    // 403은 주소가 만료됐거나(5분) 발급 때와 다른 파일을 보낸 경우다 — 새로 발급받으면 된다.
    throw uploadFailed(
      response.status,
      '사진을 올리지 못했습니다. 다시 시도해 주세요.',
    )
  }
}

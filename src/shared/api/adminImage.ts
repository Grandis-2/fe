import { delay } from '@shared/lib/delay'

import { ApiRequestError, apiClient } from './client'

import type { AdminImagePurpose, AdminImageUpload } from './types'

// 운영에서는 Vercel rewrite를 거치지 않고 API 도메인으로 직접 보낸다(명세) — rewrite는 본문
// 크기·시간 제한이 있다. 개발 서버는 vite 프록시가 Origin을 운영 프런트로 바꿔 줘야 CORS를
// 통과해서 상대 경로로 둔다.
const IMAGE_API = `${import.meta.env.DEV ? '' : 'https://api.grandis-nova.link'}/api/v1/admin/images`

// 전송 시간 + 서버 검사·재인코딩 시간이라 일반 API(10초)보다 길게 둔다.
const UPLOAD_TIMEOUT_MS = 60_000

// 503은 동시에 올리는 사진이 많거나 사진 저장소가 잠깐 실패한 경우다 — 둘 다 잠시 뒤 같은
// 파일로 다시 보내면 된다. ponytail: Retry-After는 명세상 2초 고정이라 헤더를 읽지 않고 2초를
// 기다린다. 서버가 값을 바꾸기 시작하면 requestWithHeaders로 받아 쓴다.
const RETRY_DELAY_MS = 2000
const MAX_ATTEMPTS = 3

// 여러 장을 한꺼번에 골라도 서버에는 2장씩만 보낸다(명세) — 나머지는 차례를 기다린다.
const MAX_CONCURRENT = 2
let running = 0
const waiting: (() => void)[] = []

async function inTurn<T>(task: () => Promise<T>): Promise<T> {
  // 끝난 요청이 자리를 바로 넘겨준다 — 줄였다 늘리면 그 사이에 새 요청이 끼어든다.
  if (running < MAX_CONCURRENT) running++
  else await new Promise<void>((resolve) => waiting.push(resolve))
  try {
    return await task()
  } finally {
    const next = waiting.shift()
    if (next) next()
    else running--
  }
}

const tooLarge = (traceId: string | null) =>
  new ApiRequestError(
    {
      code: 'VALIDATION_FAILED',
      message: '파일이 너무 큽니다. 10MB 이하의 사진만 올릴 수 있습니다.',
      details: null,
    },
    413,
    traceId,
  )

/**
 * 사진 한 장을 올리고 CDN 주소를 돌려준다. 실패는 ApiRequestError로 던진다 — 400은 서버
 * 문구(형식·CMYK·픽셀 상한 등)를 그대로, 413은 "파일이 너무 큽니다"로 바꿔서.
 */
export const uploadAdminImage = (file: File, purpose: AdminImagePurpose) =>
  inTurn(() => send(file, purpose))

async function send(file: File, purpose: AdminImagePurpose): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  for (let attempt = 1; ; attempt++) {
    try {
      const { imageUrl } = await apiClient.request<AdminImageUpload>(
        `${IMAGE_API}?purpose=${purpose}`,
        {
          method: 'POST',
          body,
          timeout: UPLOAD_TIMEOUT_MS,
          withCredentials: false,
        },
      )
      return imageUrl
    } catch (caught) {
      if (!(caught instanceof ApiRequestError)) throw caught
      // 413은 게이트웨이가 JSON이 아닌 페이지로 줄 수 있어 코드가 아니라 상태로 본다.
      if (caught.status === 413) throw tooLarge(caught.traceId)
      if (caught.status !== 503 || attempt >= MAX_ATTEMPTS) throw caught
      await delay(RETRY_DELAY_MS)
    }
  }
}

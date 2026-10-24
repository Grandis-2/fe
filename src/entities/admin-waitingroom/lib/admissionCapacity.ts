import { ApiRequestError } from '@shared/api/client'
import type { CapacityGuide } from '@shared/api/types'

/**
 * 바꿀 전역 속도가 서버 용량의 어느 구간인지 — 권장 상한 안이면 바로 반영(ok), 권장~위험선이면
 * 확인 뒤 서버가 늘어나면 반영(confirm), 위험선 위면 서버가 받지 않는다(unreachable).
 */
export type AdmissionZone = 'ok' | 'confirm' | 'unreachable'

/**
 * 서버와 같은 기준으로 미리 가른다. 줄이기는 언제나 받으므로 ok, 권장 상한을 모르면 서버도
 * 구간을 나누지 않아 null이다.
 */
export function admissionZone(
  value: number,
  current: number | null,
  capacity: CapacityGuide | null | undefined,
): AdmissionZone | null {
  if (current !== null && value <= current) return 'ok'
  const recommendedMax = capacity?.recommendedMax ?? null
  if (recommendedMax === null) return null
  const dangerLine = capacity?.dangerLine ?? null
  if (dangerLine !== null && value > dangerLine) return 'unreachable'
  return value > recommendedMax ? 'confirm' : 'ok'
}

/** 전역 속도 변경을 서버가 용량 때문에 거절한 경우와, 그때 알려 준 기준 */
export type AdmissionRateRefusal = {
  kind: Exclude<AdmissionZone, 'ok'>
  recommendedMax: number | null
  dangerLine: number | null
}

const REFUSAL_KIND: Record<string, AdmissionRateRefusal['kind']> = {
  ADMISSION_RATE_NEEDS_CONFIRM: 'confirm',
  ADMISSION_RATE_UNREACHABLE: 'unreachable',
}

/**
 * 409 ADMISSION_RATE_NEEDS_CONFIRM · 400 ADMISSION_RATE_UNREACHABLE을 꺼낸다. 화면이 미리
 * 가른 뒤에도 그사이 용량이 바뀌면 서버가 이걸로 답한다. 다른 실패면 null.
 */
export function admissionRateRefusal(
  caught: unknown,
): AdmissionRateRefusal | null {
  if (!(caught instanceof ApiRequestError)) return null
  const kind = REFUSAL_KIND[caught.error.code]
  if (!kind) return null
  return {
    kind,
    recommendedMax: caught.error.details?.recommendedMax ?? null,
    dangerLine: caught.error.details?.dangerLine ?? null,
  }
}

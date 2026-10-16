import type { ApiViolation, CreateDrawRequest } from '@shared/api/types'

/**
 * 회차 만들기 폼. 숫자 칸은 입력 중인 글자 그대로 들고 있다가 보낼 때 바꾼다 — 숫자로
 * 들면 지운 칸(빈 값)과 0을 구분할 수 없다. 기간은 datetime-local 값('YYYY-MM-DDTHH:mm')이다.
 */
export type AdminDrawFormValue = {
  title: string
  productId: string
  optionId: string
  entryFee: string
  winnerCount: string
  opensAt: string
  closesAt: string
}

/** 오류를 붙일 폼 칸. 증정품은 상품·옵션을 한 칸으로 본다 */
export type DrawFormField =
  'title' | 'gift' | 'entryFee' | 'winnerCount' | 'opensAt' | 'closesAt'

export type DrawFormIssue = Omit<ApiViolation, 'field'> & {
  field: DrawFormField
}

// 서버 검증과 같은 범위.
export const DRAW_TITLE_MAX = 100
export const DRAW_ENTRY_FEE_MIN = 100
const ENTRY_FEE_MAX_DIGITS = 12

export const createEmptyDrawFormValue = (): AdminDrawFormValue => ({
  title: '',
  productId: '',
  optionId: '',
  entryFee: '',
  winnerCount: '',
  opensAt: '',
  closesAt: '',
})

const toInteger = (text: string) =>
  /^\d+$/.test(text.trim()) ? Number(text.trim()) : null

/**
 * 보내기 전에 막을 수 있는 것을 본다. 증정품 가용 재고(available)를 알면 당첨 인원이
 * 넘는지도 본다 — 넘으면 서버가 409로 거절해 회차가 안 생긴다.
 */
export function validateDrawForm(
  value: AdminDrawFormValue,
  { available, now }: { available?: number; now: number },
): DrawFormIssue[] {
  const issues: DrawFormIssue[] = []
  const add = (field: DrawFormField, message: string) =>
    issues.push({ field, message })

  const title = value.title.trim()
  if (title === '') add('title', '회차 제목을 입력해 주세요.')
  else if (title.length > DRAW_TITLE_MAX)
    add('title', `회차 제목은 ${DRAW_TITLE_MAX}자 이하로 입력해 주세요.`)

  if (value.productId === '' || value.optionId === '')
    add('gift', '증정품 상품과 옵션을 골라 주세요.')

  const fee = toInteger(value.entryFee)
  if (fee === null) add('entryFee', '응모비를 숫자로 입력해 주세요.')
  else if (fee < DRAW_ENTRY_FEE_MIN)
    add('entryFee', `응모비는 ${DRAW_ENTRY_FEE_MIN}원 이상이어야 합니다.`)
  else if (String(fee).length > ENTRY_FEE_MAX_DIGITS)
    add('entryFee', `응모비는 ${ENTRY_FEE_MAX_DIGITS}자리 이하여야 합니다.`)

  const winners = toInteger(value.winnerCount)
  if (winners === null || winners < 1)
    add('winnerCount', '당첨 인원은 1명 이상이어야 합니다.')
  else if (available !== undefined && winners > available)
    add(
      'winnerCount',
      `증정품 가용 재고(${available}개)보다 많습니다. 재고를 늘리거나 인원을 줄여 주세요.`,
    )

  const opensAt = Date.parse(value.opensAt)
  const closesAt = Date.parse(value.closesAt)
  if (Number.isNaN(opensAt)) add('opensAt', '응모 시작 일시를 골라 주세요.')
  if (Number.isNaN(closesAt)) add('closesAt', '응모 마감 일시를 골라 주세요.')
  else if (closesAt <= now) add('closesAt', '마감은 지금보다 뒤여야 합니다.')
  else if (!Number.isNaN(opensAt) && closesAt <= opensAt)
    add('closesAt', '마감은 시작보다 뒤여야 합니다.')

  return issues
}

// 서버 칸 이름 → 폼 칸. 증정품 두 칸은 한 칸으로 모은다.
const SERVER_FIELD: Record<string, DrawFormField> = {
  title: 'title',
  productId: 'gift',
  optionId: 'gift',
  entryFee: 'entryFee',
  winnerCount: 'winnerCount',
  opensAt: 'opensAt',
  closesAt: 'closesAt',
}

/**
 * 서버가 준 칸별 오류(violations)를 폼 칸에 붙인다. 짝이 없는 것은 rest로 돌려준다 —
 * 화면은 그것만 요약으로 보여준다.
 */
export function drawServerIssuesOf(violations: ApiViolation[]) {
  const issues: DrawFormIssue[] = []
  const rest: string[] = []
  for (const { field, message } of violations) {
    const mapped = SERVER_FIELD[field]
    if (mapped) issues.push({ field: mapped, message })
    else rest.push(message)
  }
  return { issues, rest }
}

/** 폼 값을 요청으로 — 시각은 브라우저 시간대 기준 입력을 ISO(UTC)로 바꾼다 */
export const toCreateDrawRequest = (
  value: AdminDrawFormValue,
): CreateDrawRequest => ({
  productId: value.productId,
  optionId: value.optionId,
  title: value.title.trim(),
  entryFee: Number(value.entryFee.trim()),
  winnerCount: Number(value.winnerCount.trim()),
  opensAt: new Date(value.opensAt).toISOString(),
  closesAt: new Date(value.closesAt).toISOString(),
})

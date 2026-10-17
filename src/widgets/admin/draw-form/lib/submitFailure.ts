import {
  drawServerIssuesOf,
  DrawUnconfirmedError,
  type DrawFormIssue,
} from '@entities/admin-draw'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'

export type SubmitFailure = {
  /** 칸 아래에 붙일 오류 */
  issues: DrawFormIssue[]
  /** 칸에 못 붙인 안내 — 폼 위에 한 번 보여준다 */
  message: string | null
  /** 이전 요청의 결과를 모른다 — 목록 확인 뒤 새로 보낼지 관리자가 정한다 */
  unconfirmed: boolean
}

/**
 * 만들기 실패를 화면에 붙일 모양으로 바꾼다. 400·404·409는 회차가 안 생긴 게 확실해
 * 고쳐서 다시 내면 되고, 그 밖(500·503·네트워크)은 같은 키로 다시 보내면 둘이 되지 않는다.
 */
export function toSubmitFailure(caught: unknown): SubmitFailure {
  const none = { issues: [], message: null, unconfirmed: false }
  if (caught instanceof DrawUnconfirmedError)
    return { ...none, message: caught.message, unconfirmed: true }
  if (!(caught instanceof ApiRequestError))
    return {
      ...none,
      message:
        '회차를 만들지 못했습니다. 같은 내용으로 다시 누르면 회차가 둘이 되지 않습니다.',
    }

  switch (caught.error.code) {
    case 'VALIDATION_FAILED': {
      const { issues, rest } = drawServerIssuesOf(
        caught.error.details?.violations ?? [],
      )
      return { ...none, issues, message: rest.join(' ') || null }
    }
    case 'INSUFFICIENT_STOCK':
      return {
        ...none,
        issues: [
          {
            field: 'winnerCount',
            message:
              '증정품 가용 재고가 당첨 인원보다 적습니다. 재고를 늘리거나 인원을 줄여 주세요.',
          },
        ],
      }
    case 'PRODUCT_NOT_FOUND':
      return {
        ...none,
        issues: [
          {
            field: 'gift',
            message:
              '증정품 옵션을 찾을 수 없습니다. 판매 중이고 재고를 등록한 옵션인지 확인해 주세요.',
          },
        ],
      }
    default: {
      const retry =
        caught.status === 0 || caught.status >= 500
          ? ' 같은 내용으로 다시 누르면 회차가 둘이 되지 않습니다.'
          : ''
      return {
        ...none,
        message: `${getErrorMessage(caught, '회차를 만들지 못했습니다.')}${retry}`,
      }
    }
  }
}

import type { ApiViolation } from '@shared/api/types'

import { brandCodeOf, MODEL_NAME_MAX } from './types'

import type { AdminProductFormValue } from './form'

/** 오류를 붙일 폼 칸. 화면은 이 이름으로 칸을 찾아 그 아래에 문구를 띄우고 스크롤한다 */
export type FormField =
  | 'name'
  | 'modelName'
  | 'brand'
  | 'category'
  | 'schedule'
  | 'firstDelivery'
  | 'options'
  | 'variants'
  | 'tags'
  | 'images'

export type FormIssue = Omit<ApiViolation, 'field'> & { field: FormField }

const TITLE_MAX = 100
const TAGS_MAX = 500

/**
 * 등록·수정이 같이 보는 필수 칸 — 상품명, 모델명, 브랜드. 서버가 셋 다 필수로 받는다
 * (등록은 빠지면 400, 수정은 비우면 400).
 */
export function validateProductBasics(
  value: AdminProductFormValue,
): FormIssue[] {
  const issues: FormIssue[] = []
  const title = value.name.trim()
  if (!title) {
    issues.push({ field: 'name', message: '상품명을 적어 주세요.' })
  } else if (title.length > TITLE_MAX) {
    issues.push({
      field: 'name',
      message: `상품명은 ${TITLE_MAX}자까지입니다.`,
    })
  }

  const modelName = value.modelName.trim()
  if (!modelName) {
    issues.push({ field: 'modelName', message: '모델명을 적어 주세요.' })
  } else if (modelName.length > MODEL_NAME_MAX) {
    issues.push({
      field: 'modelName',
      message: `모델명은 ${MODEL_NAME_MAX}자까지입니다.`,
    })
  }

  if (!brandCodeOf(value.brand)) {
    issues.push({ field: 'brand', message: '브랜드를 골라 주세요.' })
  }

  if (value.tags.join(',').length > TAGS_MAX) {
    issues.push({
      field: 'tags',
      message: `태그는 모두 합쳐 ${TAGS_MAX}자까지입니다.`,
    })
  }
  return issues
}

// 서버 400의 필드 이름을 폼 칸으로 옮긴다. 앞부분만 보고 고른다(optionAxes[0].values …).
const SERVER_FIELD: [prefix: string, field: FormField][] = [
  ['title', 'name'],
  ['modelName', 'modelName'],
  ['brand', 'brand'],
  ['categoryId', 'category'],
  ['tags', 'tags'],
  ['campaign', 'schedule'],
  ['shipmentBatches', 'firstDelivery'],
  ['optionAxes', 'options'],
  ['combinations', 'variants'],
  ['images', 'images'],
]

/**
 * 서버가 준 칸별 오류(violations)를 폼 칸에 붙인다. 짝이 없는 것은 rest로 돌려준다 —
 * 화면은 그것만 요약으로 보여준다.
 */
export function serverIssuesOf(violations: ApiViolation[]) {
  const issues: FormIssue[] = []
  const rest: string[] = []
  for (const { field, message } of violations) {
    const hit = SERVER_FIELD.find(([prefix]) => field.startsWith(prefix))
    if (hit) issues.push({ field: hit[1], message })
    else rest.push(message)
  }
  return { issues, rest }
}

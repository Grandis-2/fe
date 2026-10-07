import { http } from 'msw'

import { fail, ok } from '../response'
import { url } from '../url'
import { codePointLength } from '../validate'

import type {
  ApiViolation,
  DefaultAddress,
  DefaultAddressResponse,
  PutDefaultAddressRequest,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 로그인 목업과 마찬가지로 메모리 저장 — 세션과 묶여 있지 않고
// 전역 하나뿐이다. 실제로는 세션별로 갈린다.
let defaultAddress: DefaultAddress | null = null

const LIMITS: Record<keyof DefaultAddress, number> = {
  name: 50,
  phone: 20,
  postalCode: 10,
  line1: 200,
  line2: 200,
  label: 50,
}

function validate(body: Partial<PutDefaultAddressRequest> | null) {
  const violations: ApiViolation[] = []
  const required = ['name', 'phone', 'postalCode', 'line1'] as const

  for (const field of required) {
    const value = body?.[field]
    if (!value || codePointLength(value) > LIMITS[field]) {
      violations.push({
        field,
        message: !value
          ? '필수 값입니다.'
          : `${LIMITS[field]}자 이하로 입력해 주세요.`,
      })
    }
  }
  if (body?.line2 && codePointLength(body.line2) > LIMITS.line2) {
    violations.push({ field: 'line2', message: '200자 이하로 입력해 주세요.' })
  }
  if (body?.label && codePointLength(body.label) > LIMITS.label) {
    violations.push({ field: 'label', message: '50자 이하로 입력해 주세요.' })
  }
  return violations
}

export const addressHandlers: RequestHandler[] = [
  http.get(url('/api/v1/me/default-address'), () =>
    ok<DefaultAddressResponse>({ shippingAddress: defaultAddress }),
  ),

  http.put(url('/api/v1/me/default-address'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<PutDefaultAddressRequest> | null

    const violations = validate(body)
    if (violations.length > 0) {
      return fail(400, {
        code: 'VALIDATION_FAILED',
        message: '요청 값이 올바르지 않습니다.',
        violations,
      })
    }

    // line2만 비울 수 있다 — 빈 문자열은 null로 저장한다.
    defaultAddress = {
      name: body!.name!,
      phone: body!.phone!,
      postalCode: body!.postalCode!,
      line1: body!.line1!,
      line2: body!.line2 || null,
      label: body!.label || null,
    }
    return ok<DefaultAddressResponse>({ shippingAddress: defaultAddress })
  }),
]

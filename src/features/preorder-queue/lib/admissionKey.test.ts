import { describe, expect, it } from 'vitest'

import { admissionKey } from './admissionKey'

describe('admissionKey', () => {
  it('같은 입장권이면 언제 계산해도 같은 키다', async () => {
    expect(await admissionKey('et_abc')).toBe(await admissionKey('et_abc'))
  })

  it('입장권이 다르면 키도 다르다', async () => {
    expect(await admissionKey('et_abc')).not.toBe(await admissionKey('et_abd'))
  })

  it('서버 규칙(8~64자) 안의 64자 16진수다', async () => {
    expect(await admissionKey('et_abc')).toMatch(/^[0-9a-f]{64}$/)
  })
})

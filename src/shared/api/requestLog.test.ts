import { beforeEach, describe, expect, it } from 'vitest'

import { logRequest, requestLog } from './requestLog'

const last = () => requestLog.getSnapshot().at(-1)

describe('requestLog', () => {
  beforeEach(() => requestLog.clear())

  it('실패한 같은 요청을 다시 보내면 repeat로 남긴다', () => {
    const confirm = { method: 'POST', path: '/confirm', body: { amount: 1 } }
    logRequest(confirm)({ status: 503 })
    expect(last()).toMatchObject({ outcome: 'fail', repeat: false })

    logRequest(confirm)({ status: 200 })
    expect(last()).toMatchObject({ outcome: 'ok', repeat: true })
  })

  it('성공 뒤 같은 요청(평소 폴링)이나 본문이 다른 요청은 repeat가 아니다', () => {
    const poll = { method: 'GET', path: '/queue' }
    logRequest(poll)({ status: 200 })
    logRequest(poll)({ status: 200 })
    expect(last()).toMatchObject({ repeat: false })

    logRequest({ ...poll, method: 'POST', body: 1 })({ status: 503 })
    logRequest({ ...poll, method: 'POST', body: 2 })({ status: 200 })
    expect(last()).toMatchObject({ repeat: false })
  })

  it('응답이 없으면 실패, 취소면 실패로 세지 않는다', () => {
    logRequest({ method: 'GET', path: '/a' })({ status: 0 })
    expect(last()).toMatchObject({ outcome: 'fail' })
    logRequest({ method: 'GET', path: '/b' })({ status: null })
    expect(last()).toMatchObject({ outcome: 'canceled' })
  })
})

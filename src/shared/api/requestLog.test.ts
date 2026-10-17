import { beforeEach, describe, expect, it } from 'vitest'

import {
  logRequest,
  logWait,
  paymentCheckSignal,
  requestLog,
} from './requestLog'

const last = () => requestLog.getSnapshot().at(-1)
const QUEUE = '/api/v1/preorders/queue?productId=1'
const wait = {
  waitMs: 3000,
  baseMs: 2000,
  failureCount: 0,
  retryAfterMs: 0,
  minMs: 2000,
  maxMs: 3000,
}

describe('requestLog', () => {
  beforeEach(() => requestLog.clear())

  it('대기열·사전예약·결제·알림 요청만 흐름을 붙여 남긴다', () => {
    logRequest({ method: 'GET', path: '/api/v1/products' })({ status: 200 })
    logRequest({ method: 'GET', path: '/api/v1/admin/preorders' })({
      status: 200,
    })
    logRequest({ method: 'GET', path: '/api/v1/orders/1' })({ status: 200 })
    expect(requestLog.getSnapshot()).toHaveLength(0)

    const topics = [
      { method: 'GET', path: QUEUE },
      { method: 'POST', path: '/api/v1/preorders?productId=1' },
      { method: 'POST', path: '/api/v1/orders/1/payment-attempts/t/confirm' },
      {
        method: 'GET',
        path: '/api/v1/orders/1',
        signal: paymentCheckSignal(new AbortController().signal),
      },
      { method: 'GET', path: '/api/v1/notifications/stream', sse: true },
    ].map((request) => {
      logRequest(request)({ status: 200 })
      return last()?.topic
    })
    expect(topics).toEqual(['대기열', '사전예약', '결제', '결제', '알림'])
  })

  it('실패한 같은 요청을 다시 보내면 repeat로 남긴다', () => {
    const confirm = {
      method: 'POST',
      path: '/api/v1/orders/1/payment-attempts/t/confirm',
      body: { amount: 1 },
    }
    logRequest(confirm)({ status: 503 })
    expect(last()).toMatchObject({ outcome: 'fail', repeat: false })

    logRequest(confirm)({ status: 200 })
    expect(last()).toMatchObject({ outcome: 'ok', repeat: true })
  })

  it('성공 뒤 같은 요청(평소 폴링)이나 본문이 다른 요청은 repeat가 아니다', () => {
    const poll = { method: 'GET', path: QUEUE }
    logRequest(poll)({ status: 200 })
    logRequest(poll)({ status: 200 })
    expect(last()).toMatchObject({ repeat: false })

    logRequest({ ...poll, method: 'POST', body: 1 })({ status: 503 })
    logRequest({ ...poll, method: 'POST', body: 2 })({ status: 200 })
    expect(last()).toMatchObject({ repeat: false })
  })

  it('응답이 없으면 실패, 취소면 실패로 세지 않는다', () => {
    logRequest({ method: 'GET', path: QUEUE })({ status: 0 })
    expect(last()).toMatchObject({ outcome: 'fail' })
    logRequest({ method: 'GET', path: QUEUE })({ status: null })
    expect(last()).toMatchObject({ outcome: 'canceled' })
  })

  it('대기는 방금 실패한 요청의 흐름을 따르고, 남긴 실패가 없으면 버린다', () => {
    logRequest({ method: 'GET', path: QUEUE })({ status: 200 })
    logWait(wait)
    expect(last()).toMatchObject({ kind: 'request' })

    logRequest({ method: 'GET', path: QUEUE })({ status: 503 })
    logWait(wait)
    expect(last()).toMatchObject({ kind: 'wait', topic: '대기열' })

    logWait({ ...wait, sse: true })
    expect(last()).toMatchObject({ kind: 'wait', topic: '알림', sse: true })
  })
})

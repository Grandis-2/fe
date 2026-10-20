import { beforeEach, describe, expect, it } from 'vitest'

import { joinPreorderQueue, usePreorderQueueStore } from './preorderQueueStore'

const ticket = (productId: string) => ({
  productId,
  productName: productId,
  to: `/products/${productId}`,
})

describe('joinPreorderQueue', () => {
  beforeEach(() => usePreorderQueueStore.getState().clear())

  it('이미 서 있는 줄이 있으면 다른 상품으로 바꾸지 않는다', () => {
    joinPreorderQueue(ticket('a'))
    joinPreorderQueue(ticket('b'))
    expect(usePreorderQueueStore.getState().ticket?.productId).toBe('a')
  })

  it('줄을 비우면(나가기·실패·입장) 다른 상품에 설 수 있다', () => {
    joinPreorderQueue(ticket('a'))
    usePreorderQueueStore.getState().clear()
    joinPreorderQueue(ticket('b'))
    expect(usePreorderQueueStore.getState().ticket?.productId).toBe('b')
  })
})

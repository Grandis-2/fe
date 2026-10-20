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

  it('같은 상품을 다시 누르면 줄은 그대로 두고 창만 다시 연다', () => {
    joinPreorderQueue(ticket('a'))
    const { joinedAt } = usePreorderQueueStore.getState().ticket!
    joinPreorderQueue(ticket('a'))
    const state = usePreorderQueueStore.getState()
    expect(state.ticket?.joinedAt).toBe(joinedAt)
    expect(state.reopenedAt).not.toBeNull()
  })

  it('줄을 비우면(나가기·실패·입장) 다른 상품에 설 수 있다', () => {
    joinPreorderQueue(ticket('a'))
    usePreorderQueueStore.getState().clear()
    joinPreorderQueue(ticket('b'))
    expect(usePreorderQueueStore.getState().ticket?.productId).toBe('b')
  })
})

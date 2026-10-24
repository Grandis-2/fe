import { describe, expect, it } from 'vitest'

import { fetchAllPages } from './fetchAllPages'

// 최신순(새 항목이 앞) 목록을 흉내 낸다. afterPage 쪽을 돌려준 뒤 앞에 새 항목을 끼운다.
const growingList = (count: number, inserted: number, afterPage: number) => {
  const items = Array.from({ length: count }, (_, i) => `old-${count - i}`)
  return (page: number) => {
    const result = {
      items: items.slice(page * 10, (page + 1) * 10),
      total: items.length,
    }
    if (page === afterPage)
      items.unshift(...Array.from({ length: inserted }, (_, i) => `new-${i}`))
    return Promise.resolve(result)
  }
}

describe('fetchAllPages', () => {
  it('받는 동안 새 항목이 끼어도 keyOf로 중복을 걸러 처음 있던 항목을 하나도 빠뜨리지 않는다', async () => {
    const items = await fetchAllPages(growingList(35, 4, 0), (id) => id)

    const old = items.filter((id) => id.startsWith('old-'))
    expect(new Set(old).size).toBe(35)
    expect(items.length).toBe(new Set(items).size)
  })

  it('keyOf가 없으면 늘어나지 않는 목록을 total만큼 받고 멈춘다', async () => {
    let calls = 0
    const fetchPage = growingList(25, 0, -1)
    const items = await fetchAllPages((page) => {
      calls += 1
      return fetchPage(page)
    })

    expect(items.length).toBe(25)
    expect(calls).toBe(3)
  })
})

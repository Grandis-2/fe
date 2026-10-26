import { describe, expect, it } from 'vitest'

import { fetchAllPages, fetchConcatPage } from './fetchAllPages'

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

  it('쪽마다 새 항목이 쪽 크기 넘게 끼어 끝나지 않으면 빠진 목록 대신 실패한다', async () => {
    let total = 10
    const flooded = () => {
      total += 20
      return Promise.resolve({ items: ['same'], total })
    }

    await expect(fetchAllPages(flooded, (id) => id)).rejects.toThrow()
  })
})

const source =
  (prefix: string, total: number) => async (page: number, size: number) => ({
    items: Array.from({ length: total }, (_, i) => `${prefix}${i}`).slice(
      page * size,
      page * size + size,
    ),
    total,
  })

describe('fetchConcatPage', () => {
  const sources = [source('a', 7), source('b', 5)]

  it('앞 목록이 다 나온 뒤 다음 목록을 이어 붙여 쪽을 나눈다', async () => {
    const pages = await Promise.all(
      [0, 1, 2].map((page) => fetchConcatPage(sources, page, 5)),
    )
    expect(pages.map((page) => page.items)).toEqual([
      ['a0', 'a1', 'a2', 'a3', 'a4'],
      ['a5', 'a6', 'b0', 'b1', 'b2'],
      ['b3', 'b4'],
    ])
    expect(pages.every((page) => page.total === 12)).toBe(true)
  })

  it('서버 쪽 경계와 어긋나면 다음 쪽까지 받아 채운다', async () => {
    const page = await fetchConcatPage([source('a', 2), source('b', 10)], 1, 4)
    expect(page.items).toEqual(['b2', 'b3', 'b4', 'b5'])
  })

  it('넘어간 쪽은 비고 건수는 그대로다', async () => {
    expect(await fetchConcatPage(sources, 9, 5)).toEqual({
      items: [],
      page: 9,
      size: 5,
      total: 12,
    })
  })

  it('어느 쪽 크기·쪽 번호든 이어 붙인 목록을 그대로 자른 것과 같다', async () => {
    const parts = [
      source('a', 3),
      source('b', 0),
      source('c', 8),
      source('d', 2),
    ]
    const all = (
      await Promise.all(parts.map((fetchPage) => fetchPage(0, 100)))
    ).flatMap((page) => page.items)
    for (const size of [1, 2, 3, 4, 5, 7, 13]) {
      for (let page = 0; page * size <= all.length; page += 1) {
        const { items } = await fetchConcatPage(parts, page, size)
        expect(items).toEqual(all.slice(page * size, page * size + size))
      }
    }
  })
})

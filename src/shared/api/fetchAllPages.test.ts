import { describe, expect, it } from 'vitest'

import { fetchConcatPage } from './fetchAllPages'

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

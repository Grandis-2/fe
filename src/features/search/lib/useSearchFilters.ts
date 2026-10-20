import { useMemo } from 'react'

import { useSearchParams } from 'react-router'

import {
  productBrandNames,
  type ProductBrand,
  type ProductListParams,
  type ProductSort,
} from '@entities/product'

import { SORT_OPTIONS } from '../model/searchFilters'

export type SearchFilterKey = 'brand' | 'storage'

const brandCodes = Object.keys(productBrandNames) as ProductBrand[]

// 검색 필터는 URL에 둔다 — 새로고침·공유해도 유지되고, 헤더 메뉴의 브랜드 링크(?brand=Apple)도 그대로 받는다.
// 같은 키를 반복해 여러 값을 담는다(?storage=256GB&storage=512GB). 브랜드는 URL엔 이름, API엔 코드로 보낸다.
export function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selected = useMemo(
    () => ({
      brand: searchParams.getAll('brand'),
      storage: searchParams.getAll('storage'),
    }),
    [searchParams],
  )
  const sortParam = searchParams.get('sort')
  const sort =
    SORT_OPTIONS.find(({ value }) => value === sortParam)?.value ?? 'NEWEST'

  // 모르는 브랜드 이름은 버린다 — 그대로 보내면 400이다. 고르지 않은 조건·기본 정렬은 빼서
  // 쿼리 키·요청 주소를 필터 없을 때와 같게 둔다.
  const params = useMemo<
    Pick<ProductListParams, 'brand' | 'storage' | 'sort'>
  >(() => {
    const brand = brandCodes.filter((code) =>
      selected.brand.includes(productBrandNames[code]),
    )
    const orUndefined = <T>(values: T[]) =>
      values.length > 0 ? values : undefined
    return {
      brand: orUndefined(brand),
      storage: orUndefined(selected.storage),
      sort: sort === 'NEWEST' ? undefined : sort,
    }
  }, [selected, sort])

  // 조건이 바뀌면 결과가 달라지므로 1페이지로 돌아간다.
  const update = (change: (params: URLSearchParams) => void) =>
    setSearchParams((prev) => {
      change(prev)
      prev.delete('page')
      return prev
    })

  const toggle = (key: SearchFilterKey, value: string) =>
    update((prev) => {
      const values = prev.getAll(key)
      prev.delete(key)
      const next = values.includes(value)
        ? values.filter((it) => it !== value)
        : [...values, value]
      for (const it of next) prev.append(key, it)
    })

  const setSort = (next: ProductSort) =>
    update((prev) => {
      if (next === 'NEWEST') prev.delete('sort')
      else prev.set('sort', next)
    })

  const reset = () =>
    update((prev) => {
      for (const key of ['brand', 'storage']) prev.delete(key)
    })

  const activeCount = selected.brand.length + selected.storage.length

  return { selected, sort, params, activeCount, toggle, setSort, reset }
}

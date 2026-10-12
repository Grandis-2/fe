import { useCategories } from '../api/useCategories'
import { brandMenus, type BrandMenu } from '../model/categoryMenu'

// 메뉴의 대분류·브랜드는 카테고리 API 응답(상위 → 하위)을 따른다. API에 없는 것(하위 카테고리 타일, "더 알아보기")은
// 같은 이름의 brandMenus 항목에서 가져온다. 응답이 없거나(로딩·실패) 비어 있으면 brandMenus 그대로 — 메뉴가 사라지지 않게.
// ponytail: 하위 카테고리 타일은 API에 대응하는 단계가 없어 상수에 남겼다. 백엔드가 단계를 확정하면 같이 교체한다.
export function useBrandMenus(): Record<string, BrandMenu> {
  const { data } = useCategories()
  if (!data?.length) return brandMenus

  return Object.fromEntries(
    data.map(({ name, children }) => [
      name,
      {
        categories: brandMenus[name]?.categories ?? [],
        brands: children.map((child) => child.name),
        more: brandMenus[name]?.more ?? [],
      },
    ]),
  )
}

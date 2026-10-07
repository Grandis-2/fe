import type { Category } from '../model/product'

// 메뉴(brandMenus)·URL은 카테고리를 이름으로 가리키고 목록 API는 categoryId를 받는다 —
// 상위 이름(과 그 아래 하위 이름)으로 id를 찾는다. 트리에 없으면 undefined.
export const findCategoryId = (
  tree: Category[],
  name: string,
  childName?: string,
) => {
  const parent = tree.find((node) => node.name === name)
  return childName
    ? parent?.children.find((child) => child.name === childName)?.categoryId
    : parent?.categoryId
}

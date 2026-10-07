import { createOptionGroup } from './form'

import type { ProductOptionGroup } from './form'

export type ProductOptionPreset = {
  /** 대분류 — 고르는 쪽에서 묶어 보여줄 때 쓴다 */
  category: string
  /** 제품 종류. 11종이 서로 겹치지 않아 이 이름이 곧 식별자다 */
  name: string
  /** 색상을 뺀 옵션 이름. 색상은 폼에서 별도 축이라 프리셋이 손대지 않는다 */
  optionNames: string[]
}

/**
 * 제품 종류별로 흔히 쓰는 옵션 묶음. 등록·수정 폼에서 종류를 고르면 미리 깔아 준다.
 *
 * 저장되는 값이 아니라 입력을 돕는 장치다 — 깔린 옵션을 지워도 되고, 프리셋 없이
 * 직접 적어도 된다. 그래서 서버의 categoryId와도 묶지 않았다(지금 폼은 categoryId를
 * 보내지 않는다).
 */
export const OPTION_PRESETS: ProductOptionPreset[] = [
  { category: '모바일', name: '스마트폰', optionNames: ['용량'] },
  { category: '모바일', name: '태블릿', optionNames: ['용량'] },
  { category: '모바일', name: '폴더블', optionNames: ['용량'] },

  {
    category: 'PC/주변기기',
    name: '노트북',
    optionNames: ['크기', 'RAM', '용량', '칩'],
  },
  { category: 'PC/주변기기', name: '데스크탑', optionNames: [] },
  { category: 'PC/주변기기', name: '모니터', optionNames: ['사이즈'] },
  { category: 'PC/주변기기', name: '키보드', optionNames: [] },
  { category: 'PC/주변기기', name: '마우스', optionNames: [] },

  { category: '웨어러블', name: '스마트워치', optionNames: ['크기', '구분'] },
  { category: '웨어러블', name: '무선이어폰', optionNames: [] },
  { category: '웨어러블', name: '스마트밴드', optionNames: [] },
]

/** 값을 하나라도 적었으면 쓰는 중인 옵션이다 — 이름만 있는 건 아직 빈 자리다. */
const isFilled = (group: ProductOptionGroup) =>
  group.values.some((value) => value.label.trim() !== '')

/**
 * 종류를 고르면 그 종류의 옵션으로 갈아 끼운다.
 *
 * 값을 적은 옵션은 남긴다 — 수정 폼에는 서버에서 온 옵션이 값까지 차 있는데, 종류를
 * 잘못 골랐다고 그게 날아가면 안 된다. 반대로 값이 비어 있으면 아직 아무것도 안 쓴
 * 자리라 치워도 잃을 게 없다. 그래서 노트북(크기·RAM·용량·칩)을 고른 뒤 스마트폰으로
 * 바꾸면 쓰지 않은 세 개가 사라지고 용량만 남는다.
 */
export function withPresetOptionGroups(
  groups: ProductOptionGroup[],
  preset: ProductOptionPreset,
): ProductOptionGroup[] {
  const kept = groups.filter(isFilled)
  const existing = new Set(kept.map((group) => group.name.trim()))
  const added = preset.optionNames
    .filter((name) => !existing.has(name))
    .map((name) => ({ ...createOptionGroup(), name }))

  return [...kept, ...added]
}

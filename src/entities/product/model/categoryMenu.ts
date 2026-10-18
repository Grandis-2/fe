export type BrandMenu = {
  categories: string[]
  // 제조사 필터(텍스트 타일). 메가 메뉴에선 카테고리 아래 "브랜드" 묶음으로 따로 보인다.
  brands?: string[]
}

// 상품 대분류(모바일·PC/주변기기·웨어러블)별 하위 카테고리·브랜드. 헤더 메가 메뉴,
// 모바일 카테고리 시트, 검색창 카테고리 칩이 같이 쓴다.
// 카테고리 API가 붙으면 이 상수 대신 응답을 쓴다(썸네일도 그때 같이 붙인다).
export const brandMenus: Record<string, BrandMenu> = {
  모바일: {
    categories: ['스마트폰', '태블릿', '폴더블'],
    brands: ['Apple', 'Samsung'],
  },
  'PC/주변기기': {
    categories: ['노트북', '데스크탑', '모니터', '키보드', '마우스'],
    brands: ['Apple', 'Samsung', 'LG'],
  },
  웨어러블: {
    categories: ['스마트워치', '무선이어폰', '스마트밴드'],
    brands: ['Apple', 'Samsung'],
  },
} satisfies Record<string, BrandMenu>

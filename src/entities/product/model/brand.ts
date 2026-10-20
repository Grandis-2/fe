import type { ProductBrand } from './product'

// 서버는 브랜드를 대문자 코드로 주고받고, 화면·URL은 이 이름을 쓴다(헤더 메뉴 brandMenus와 같은 이름).
export const productBrandNames: Record<ProductBrand, string> = {
  SAMSUNG: 'Samsung',
  APPLE: 'Apple',
  LG: 'LG',
}

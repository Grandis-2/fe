import { EVENTS_PATH, PREORDER_PATH } from '@shared/config/routes'

export type CategoryNavLink = '이벤트' | '사전예약'

// 메가 메뉴·모바일 바텀시트 카테고리 타일에 쓰는 썸네일. public/images/menu에 있는 이미지만 쓴다
// (이미지가 없는 카테고리는 기존 텍스트 타일 그대로 둔다).
export const categoryThumbnails: Record<string, string> = {
  스마트폰: '/images/menu/mobile_smartphone.png',
  태블릿: '/images/menu/mobile_tablet.png',
  폴더블: '/images/menu/mobile_foldable.png',
  노트북: '/images/menu/pc_notebook.png',
  데스크탑: '/images/menu/pc_desktop.png',
  모니터: '/images/menu/pc_monitor.png',
  키보드: '/images/menu/pc_keyboard.png',
  마우스: '/images/menu/pc_mouse.png',
  스마트워치: '/images/menu/wearable_smartwatch.png',
  무선이어폰: '/images/menu/wearable_earphone.png',
  스마트밴드: '/images/menu/wearable_smartband.png',
}

export const links: CategoryNavLink[] = ['이벤트', '사전예약']
export const linkPaths: Record<CategoryNavLink, string> = {
  이벤트: EVENTS_PATH,
  사전예약: PREORDER_PATH,
}

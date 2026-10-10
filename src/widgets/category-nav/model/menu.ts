import { EVENTS_PATH, PREORDER_PATH, preorderPath } from '@shared/config/routes'

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

export type MenuEvent = {
  tag: '사전예약' | '할인' | '이벤트'
  title: string
  period: string
  to: string
  image: string
}

// 모바일 메뉴의 이벤트 탭.
// ponytail: 이벤트 API·페이지가 없어 상수로 둔다(배너 이미지는 메인 배너 것을 빌려 씀) — 생기면 응답으로 교체.
export const menuEvents: MenuEvent[] = [
  {
    tag: '사전예약',
    title: '아이폰 18 Pro, Pro Max 사전예약 오픈',
    period: '10.10 (토) ~ 10.16 (금)',
    to: preorderPath('1'),
    image: '/images/banner1.png',
  },
  {
    tag: '할인',
    title: '맥북 사전예약 고객 액세서리 최대 20% 할인',
    period: '10.01 (목) ~ 10.31 (토)',
    to: EVENTS_PATH,
    image: '/images/macbook_neo_citrus1.png',
  },
  {
    tag: '이벤트',
    title: '쓰던 기기 보상 판매, 최대 30만 원 추가 보상',
    period: '10.08 (목) ~ 11.09 (월)',
    to: EVENTS_PATH,
    image: '/images/banner2.png',
  },
]

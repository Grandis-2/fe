import { http } from 'msw'

import { mockUuid } from '../fixtures/product'
import { invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdminBannerRequest,
  AdminBannerView,
  BannerListResponse,
} from '../../types'
import type { RequestHandler } from 'msw'

const SEEDED_AT = '2026-10-01T00:00:00Z'
const seeded = {
  visible: true,
  targetLive: true,
  createdAt: SEEDED_AT,
  updatedAt: SEEDED_AT,
} as const

// 메모리에만 있어 새로고침하면 시드 3장으로 돌아간다. 관리자가 만든 배너도 고객 메인(GET /banners)에 같이 보인다.
// 대상 id는 홍보·상품 목업의 것이다(홍보 5번 = 아이폰 18 Pro, 1번 = 맥북 프로 14 · NOVA 폴더블 1, 상품 18번 = NOVA 노트북 1).
const banners: AdminBannerView[] = [
  {
    ...seeded,
    bannerId: '70000000-0000-4000-8000-000000000001',
    position: 0,
    badge: '사전예약',
    title: '아이폰 18 Pro, Pro Max\n사전예약',
    description:
      '실패 없는 사전예약부터 순차 배송까지!\n노바에서 한 번에 끝내세요.',
    tabLabel: '아이폰 18 Pro,\nPro Max 사전예약',
    icon: 'Smartphone',
    imageUrl: '/images/banner1.png',
    imageAlt: '아이폰 18 Pro, Pro Max',
    target: { type: 'PROMOTION', id: mockUuid(6, 5) },
  },
  {
    ...seeded,
    bannerId: '70000000-0000-4000-8000-000000000002',
    position: 1,
    badge: '사전예약',
    title: '맥북 프로 14\n지금 사전예약 중',
    description: '대기열만 지나면 순번이 바로 정해져요.',
    tabLabel: '맥북 프로 14\n사전예약',
    icon: 'Laptop',
    imageUrl: '/images/macbook_neo_indigo1.png',
    imageAlt: '인디고 컬러 맥북 프로 14',
    target: { type: 'PROMOTION', id: mockUuid(6, 1) },
  },
  {
    ...seeded,
    bannerId: '70000000-0000-4000-8000-000000000003',
    position: 2,
    badge: '할인',
    title: 'NOVA 노트북 1\n15% 할인',
    description: '가볍게 들고 다니는\n새 노트북을 만나 보세요.',
    tabLabel: 'NOVA 노트북 1\n할인',
    icon: 'Percent',
    imageUrl: '/images/macbook_neo_citrus1.png',
    imageAlt: '시트러스 컬러 노트북',
    target: { type: 'PRODUCT', id: mockUuid(2, 18) },
  },
]

const ICONS = new Set([
  'Smartphone',
  'Tablet',
  'Laptop',
  'Watch',
  'Headphones',
  'Camera',
  'Gamepad2',
  'BookOpen',
  'MessageSquareText',
  'Gift',
  'Sparkles',
  'Star',
  'Tag',
  'Percent',
  'Truck',
  'Zap',
  'Bell',
  'CalendarDays',
  'ShoppingBag',
  'Heart',
])

// 명세의 글자 수 상한 — 비었거나 공백만 있어도 그 칸으로 400이다.
const MAX_LENGTH = {
  badge: 20,
  title: 100,
  description: 200,
  tabLabel: 60,
  imageAlt: 100,
} as const

export const adminBannerHandlers: RequestHandler[] = [
  http.post(url('/api/v1/admin/banners'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<AdminBannerRequest> | null

    const violations = [
      ...Object.entries(MAX_LENGTH)
        .filter(([field, max]) => {
          const value = body?.[field as keyof typeof MAX_LENGTH]?.trim() ?? ''
          return !value || value.length > max
        })
        .map(([field, max]) => ({ field, message: `1~${max}자여야 합니다.` })),
      !ICONS.has(body?.icon ?? '')
        ? { field: 'icon', message: '정해진 아이콘이 아닙니다.' }
        : null,
      !body?.imageUrl?.includes('/banners/')
        ? { field: 'imageUrl', message: '배너용으로 올린 사진이 아닙니다.' }
        : null,
      !body?.target?.id
        ? { field: 'target.id', message: '연결 대상이 필요합니다.' }
        : null,
    ].filter((violation) => violation !== null)
    if (!body || violations.length > 0) return invalid(violations)

    const now = new Date().toISOString()
    const banner: AdminBannerView = {
      ...(body as AdminBannerRequest),
      bannerId: crypto.randomUUID(),
      position: banners.length,
      targetLive: true,
      createdAt: now,
      updatedAt: now,
    }
    banners.push(banner)
    return ok(banner, 201)
  }),
]

// 고객 메인 배너 — 관리자가 켰고(visible) 대상이 지금 보이는(targetLive) 것만, 정한 순서대로.
export const bannerHandlers: RequestHandler[] = [
  http.get(url('/api/v1/banners'), () =>
    ok<BannerListResponse>({
      items: banners
        .filter((banner) => banner.visible && banner.targetLive)
        .sort((a, b) => a.position - b.position)
        .map(
          ({
            position: _position,
            visible: _visible,
            targetLive: _targetLive,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            ...shown
          }) => shown,
        ),
    }),
  ),
]

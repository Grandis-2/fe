import { http } from 'msw'

import { invalid, ok } from '../response'
import { url } from '../url'

import type { AdminBannerRequest, AdminBannerView } from '../../types'
import type { RequestHandler } from 'msw'

// 메모리에만 있어 새로고침하면 사라진다.
const banners: AdminBannerView[] = []

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

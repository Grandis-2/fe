import {
  BookOpen,
  Bell,
  CalendarDays,
  Camera,
  Gamepad2,
  Gift,
  Headphones,
  Heart,
  Laptop,
  MessageSquareText,
  Percent,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Tag,
  Truck,
  Watch,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { BannerIcon, BannerView } from '@shared/api/types'

// 응답 모양 그대로 쓴다 — 아이콘 이름은 그릴 때 BANNER_ICONS로 바꾼다.
export type Banner = BannerView

/** 서버가 받는 아이콘 20개와 그릴 컴포넌트 — Record라 하나라도 빠지면 타입 오류다. 관리자 배너 폼도 쓴다 */
export const BANNER_ICONS: Record<BannerIcon, LucideIcon> = {
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Headphones,
  Camera,
  Gamepad2,
  BookOpen,
  MessageSquareText,
  Gift,
  Sparkles,
  Star,
  Tag,
  Percent,
  Truck,
  Zap,
  Bell,
  CalendarDays,
  ShoppingBag,
  Heart,
}

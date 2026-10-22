import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Banner as BannerItem } from '@entities/banner'

import { Banner } from './Banner'

import type { Meta, StoryObj } from '@storybook/react-vite'

const banners: BannerItem[] = [
  {
    bannerId: '1',
    badge: '사전예약',
    title: '아이폰 18 Pro, Pro Max\n사전예약',
    description:
      '실패 없는 사전예약부터 순차 배송까지!\n노바에서 한 번에 끝내세요.',
    tabLabel: '아이폰 18 Pro,\nPro Max 사전예약',
    icon: 'Smartphone',
    imageUrl: '/images/banner1.png',
    imageAlt: '아이폰 18 Pro, Pro Max',
    target: { type: 'PROMOTION', id: '1' },
  },
  {
    bannerId: '2',
    badge: '사전예약',
    title: '맥북 프로 14\n지금 사전예약 중',
    description: '대기열만 지나면 순번이 바로 정해져요.',
    tabLabel: '맥북 프로 14\n사전예약',
    icon: 'Laptop',
    imageUrl: '/images/macbook_neo_indigo1.png',
    imageAlt: '인디고 컬러 맥북 프로 14',
    target: { type: 'PROMOTION', id: '2' },
  },
  {
    bannerId: '3',
    badge: '할인',
    title: 'NOVA 노트북 1\n15% 할인',
    description: '가볍게 들고 다니는\n새 노트북을 만나 보세요.',
    tabLabel: 'NOVA 노트북 1\n할인',
    icon: 'Percent',
    imageUrl: '/images/macbook_neo_citrus1.png',
    imageAlt: '시트러스 컬러 노트북',
    target: { type: 'PRODUCT', id: '3' },
  },
]

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다. 안 채우면 받는 중에 머문다.
const withBanners = (data?: BannerItem[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { enabled: false } },
  })
  if (data) queryClient.setQueryData(['banners'], data)
  return (Story: () => React.ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: Banner,
  tags: ['ai-generated'],
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [withBanners(banners)],
}

// 탭은 배너 수만큼 폭을 나눈다 — 한 장이면 탭 없이, 많으면 탭 줄을 옆으로 넘긴다.
export const Single: Story = {
  decorators: [withBanners(banners.slice(0, 1))],
}

export const Two: Story = {
  decorators: [withBanners(banners.slice(0, 2))],
}

export const Many: Story = {
  decorators: [
    withBanners(
      [...banners, ...banners].map((banner, i) => ({
        ...banner,
        bannerId: String(i + 1),
      })),
    ),
  ],
}

export const Loading: Story = {
  decorators: [withBanners()],
}

// 보일 배너가 없으면 배너를 숨기고 헤더 높이만큼만 비운다(명세).
export const Empty: Story = {
  decorators: [withBanners([])],
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[aria-roledescription="carousel"]'),
    ).toBeNull()
  },
}

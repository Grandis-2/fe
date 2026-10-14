import { expect, fn, userEvent, waitFor } from 'storybook/test'

import { AdminProductActions } from './AdminProductActions'

import type { AdminProductActionsProps } from './AdminProductActions'
import type { Meta, StoryObj } from '@storybook/react-vite'

type Product = AdminProductActionsProps['product']

const inStock: Product = {
  productId: 'SM-FOLD8',
  name: '갤럭시 Z 폴드8',
  displayStatus: 'PUBLISHED',
  saleMode: 'IN_STOCK',
  status: 'ACTIVE',
  campaign: null,
}

const DAY = 24 * 60 * 60 * 1000
const preorder = (
  status: 'BEFORE_OPEN' | 'OPEN' | 'CLOSED',
  opensInMs: number,
): Product => ({
  ...inStock,
  saleMode: 'PREORDER',
  displayStatus: status === 'BEFORE_OPEN' ? 'SCHEDULED' : 'PUBLISHED',
  campaign: {
    status,
    opensAt: new Date(Date.now() + opensInMs).toISOString(),
    closesAt: new Date(Date.now() + opensInMs + DAY).toISOString(),
  },
})

const meta = {
  component: AdminProductActions,
  tags: ['ai-generated'],
  args: {
    product: inStock,
    onPublish: fn(),
    onHide: fn(),
    onPause: fn(),
    onResume: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof AdminProductActions>

export default meta
type Story = StoryObj<typeof meta>

const openMenu = async (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
) => {
  await userEvent.click(
    canvas.getByRole('button', { name: '갤럭시 Z 폴드8 관리 메뉴' }),
  )
  return canvas.getAllByRole('menuitem')
}

/** 게시중 일반 상품 — 숨기기와 판매 중지가 있다 */
export const Published: Story = {
  play: async ({ canvas, args }) => {
    const items = await openMenu(canvas)
    await expect(items.map((item) => item.textContent)).toEqual([
      '숨김으로 전환하기',
      '판매 중지하기',
    ])
    await userEvent.click(items[0])
    await expect(args.onHide).toHaveBeenCalled()
  },
}

/** 숨김이면 다시 올리는 길을 준다 */
export const Hidden: Story = {
  args: { product: { ...inStock, displayStatus: 'HIDDEN' } },
  play: async ({ canvas, args }) => {
    const [visibility] = await openMenu(canvas)
    await userEvent.click(visibility)
    await expect(args.onPublish).toHaveBeenCalled()
  },
}

/** 공개 예정(오픈 전 사전예약)도 공개 설정은 켜져 있어 숨기기를 준다 */
export const Scheduled: Story = {
  args: { product: preorder('BEFORE_OPEN', 7 * DAY) },
  play: async ({ canvas }) => {
    const [visibility] = await openMenu(canvas)
    await expect(visibility).toHaveTextContent('숨김으로 전환하기')
  },
}

export const Ended: Story = {
  args: {
    product: { ...preorder('CLOSED', -2 * DAY), displayStatus: 'ENDED' },
  },
  play: async ({ canvas }) => {
    const [visibility] = await openMenu(canvas)
    await expect(visibility).toHaveTextContent('숨김으로 전환하기')
  },
}

/** 판매 중지한 일반 상품 — 다시 판매할 수 있다 */
export const Paused: Story = {
  args: { product: { ...inStock, status: 'PAUSED' } },
  play: async ({ canvas, args }) => {
    const [, sale] = await openMenu(canvas)
    await expect(sale).toHaveTextContent('판매 재개하기')
    await userEvent.click(sale)
    await expect(args.onResume).toHaveBeenCalled()
  },
}

/** 오픈 전 사전예약은 일반 상품처럼 중지한다(되돌릴 수 있다) */
export const PreorderBeforeOpen: Story = {
  args: { product: preorder('BEFORE_OPEN', 7 * DAY) },
  play: async ({ canvas, args }) => {
    const [, sale] = await openMenu(canvas)
    await userEvent.click(sale)
    await expect(args.onPause).toHaveBeenCalled()
  },
}

/** 오픈 3분 전부터는 서버가 막는다 — 항목을 막고 이유를 보여준다 */
export const PreorderLocked: Story = {
  args: { product: preorder('BEFORE_OPEN', 60 * 1000) },
  play: async ({ canvas, args }) => {
    const [, sale] = await openMenu(canvas)
    await expect(sale).toHaveAttribute('aria-disabled', 'true')
    await waitFor(() =>
      expect(canvas.getByText(/오픈 3분 전부터 오픈까지는/)).toBeVisible(),
    )
    await userEvent.click(sale)
    await expect(args.onPause).not.toHaveBeenCalled()
  },
}

/** 오픈 뒤 판매 중지는 회차 취소다 — 위험 색으로 두고 사유 받는 쪽으로 보낸다 */
export const PreorderOpenCancels: Story = {
  args: { product: preorder('OPEN', -60 * 60 * 1000) },
  play: async ({ canvas, args }) => {
    const [, sale] = await openMenu(canvas)
    await expect(sale).toHaveTextContent('판매 중지하기')
    await userEvent.click(sale)
    await expect(args.onCancel).toHaveBeenCalled()
    await expect(args.onPause).not.toHaveBeenCalled()
  },
}

/** 오픈 뒤 이미 중지했으면 다시 판매할 수 없다 — 판매 항목이 없다 */
export const PreorderOpenPaused: Story = {
  args: {
    product: { ...preorder('OPEN', -60 * 60 * 1000), status: 'PAUSED' },
  },
  play: async ({ canvas }) => {
    const items = await openMenu(canvas)
    await expect(items).toHaveLength(1)
  },
}

/** 전환 요청 중엔 메뉴를 막는다 */
export const Pending: Story = {
  args: { pending: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '갤럭시 Z 폴드8 관리 메뉴' }),
    ).toBeDisabled()
  },
}

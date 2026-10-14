import { expect, fn } from 'storybook/test'

import { useSessionStore } from '@entities/auth/model/sessionStore'

import { Header } from './Header'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Header,
  tags: ['ai-generated'],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

// 헤더가 세션 스토어를 직접 읽으므로 회원 스토리는 스토어에 세션을 넣고, 끝나면 지운다.
const signIn = () => {
  useSessionStore.setState({ sessionToken: 'story-session' })
  return () => useSessionStore.getState().clearSession()
}

export const Guest: Story = {
  args: { onSearchClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '검색' }))
    await expect(args.onSearchClick).toHaveBeenCalledOnce()

    // 비회원은 검색·로그인만 — 알림·장바구니·마이페이지는 회원 전용이다.
    await expect(canvas.getByRole('button', { name: '로그인' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /알림/ })).toBeNull()
    await expect(canvas.queryByRole('link', { name: /장바구니/ })).toBeNull()
    await expect(canvas.queryByRole('link', { name: '마이페이지' })).toBeNull()
  },
}

export const Member: Story = {
  beforeEach: signIn,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /알림/ })).toBeVisible()
    await expect(canvas.getByRole('link', { name: /장바구니/ })).toBeVisible()
    await expect(canvas.getByRole('link', { name: '마이페이지' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '로그인' })).toBeNull()
  },
}

// 회원으로 들어가도 어드민 헤더는 알림 하나만 남는다.
export const Admin: Story = {
  beforeEach: signIn,
  parameters: { initialEntries: ['/admin/products'] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'NOVA ADMIN' }),
    ).toHaveAttribute('href', '/admin')
    await expect(canvas.queryByRole('link', { name: '모바일' })).toBeNull()

    const buttons = canvas.getAllByRole('button')
    await expect(buttons).toHaveLength(1)
    await expect(buttons[0]).toHaveAccessibleName('알림')
  },
}

import { expect, fn, userEvent, waitFor } from 'storybook/test'

import { createEmptyProductFormValue } from '@entities/admin-product'

import { AdminProductForm } from './AdminProductForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminProductForm,
  tags: ['ai-generated'],
  args: { onSubmit: fn(), onCancel: fn(), onPreview: fn() },
} satisfies Meta<typeof AdminProductForm>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  args: { mode: 'create' },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: '등록하기' })).toBeVisible()

    await userEvent.type(canvas.getByLabelText(/상품명/), '아이폰 18 Pro')
    await userEvent.type(canvas.getByLabelText(/모델명/), 'A23948')
    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: '아이폰 18 Pro', modelName: 'A23948' }),
    )
  },
}

/** edit은 제출 버튼 문구만 다르고 나머지는 동일하다. */
export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValue: {
      ...createEmptyProductFormValue(),
      name: '아이폰 18 Pro',
      modelName: 'A23948',
      isPreorder: true,
      openAt: '2026-09-20T09:00',
      closeAt: '2026-09-24T23:59',
    },
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: '수정하기' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '등록하기' })).toBeNull()
    // 사전 예약이 켜져 있으면 오픈/마감 요약이 보인다.
    await expect(
      canvas.getByText(
        '2026년 9월 20일 (일) 09:00 ~ 2026년 9월 20일 (일) 23:59',
      ),
    ).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}

/** 사전 예약을 끄면 오픈/마감 일시 입력이 사라진다. */
export const PreorderToggle: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('오픈 / 마감 일시')).toBeNull()
    await userEvent.click(canvas.getByText('사전 예약으로 판매'))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '달력 열기' })).toBeVisible(),
    )
  },
}

/**
 * 색상 × 옵션값 조합이 자동으로 만들어지고, 옵션을 더 추가해도
 * 이미 입력한 수량이 살아남는지 확인한다 (조합을 상태로 저장하지 않는 이유).
 */
export const VariantCombination: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    // 색상 칸은 기본으로 하나 열려 있으므로 이름만 채운다.
    await userEvent.type(canvas.getByLabelText('색상 입력'), '딥 블루')

    await userEvent.click(canvas.getByRole('button', { name: '옵션 추가' }))
    await userEvent.type(canvas.getByLabelText('옵션 이름'), '용량')
    await userEvent.type(canvas.getByLabelText('용량 값'), '256GB')

    // 색상 1 × 용량 1 = 1개 조합 (헤더 1 + 본문 1)
    await waitFor(async () =>
      expect(canvas.getAllByRole('row')).toHaveLength(2),
    )
    await expect(canvas.getByText('딥 블루')).toBeVisible()

    // 이 조합에 수량을 입력해둔다
    const quantityField = canvas.getByLabelText('수량')
    await userEvent.clear(quantityField)
    await userEvent.type(quantityField, '1500')

    // 옵션값을 하나 더 추가하면 조합이 2개로 늘어난다
    await userEvent.click(
      canvas.getByRole('button', { name: '옵션 타입 추가' }),
    )
    await userEvent.type(canvas.getAllByLabelText('용량 값')[1], '128GB')
    await waitFor(async () =>
      expect(canvas.getAllByRole('row')).toHaveLength(3),
    )
    await expect(
      canvas.getByText(
        '색상 1개 X 용량 2개 = 2개 조합이 자동으로 만들어졌습니다.',
      ),
    ).toBeVisible()

    // 먼저 입력한 수량은 그대로 남아 있어야 한다
    await expect(canvas.getAllByLabelText('수량')[0]).toHaveValue('1500')
  },
}

/**
 * 오픈 일시만 고르면 마감은 같은 날 23:59로 자동 계산된다.
 * 달력은 네이티브 피커가 아니라 직접 만든 Calendar를 띄운다.
 */
export const PreorderPeriod: Story = {
  args: { mode: 'create' },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText(/상품명/), '아이폰 18 Pro')
    await userEvent.type(canvas.getByLabelText(/모델명/), 'A23948')
    await userEvent.click(canvas.getByText('사전 예약으로 판매'))

    await userEvent.click(canvas.getByRole('button', { name: '달력 열기' }))
    const [, year, month] = canvas
      .getByText(/년 \d+월/)
      .textContent!.match(/(\d+)년 (\d+)월/)!

    await userEvent.click(
      canvas.getByRole('button', { name: `${year}년 ${month}월 20일` }),
    )
    // 시/분 목록은 열자마자 펼쳐져 있어 바로 고를 수 있다.
    await userEvent.click(
      canvas.getByRole('listbox', { name: '시' }).children[9],
    )

    // 오픈 09:00, 마감은 같은 날 23:59
    await waitFor(async () =>
      expect(canvas.getByText(/09:00 ~ .*23:59/)).toBeVisible(),
    )

    // 달력 바깥을 누르면 닫힌다
    await userEvent.click(canvas.getByLabelText(/상품명/))
    await waitFor(async () =>
      expect(canvas.queryByRole('listbox', { name: '시' })).toBeNull(),
    )

    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        openAt: `${year}-${String(month).padStart(2, '0')}-20T09:00`,
        closeAt: `${year}-${String(month).padStart(2, '0')}-20T23:59`,
      }),
    )
  },
}

/**
 * 제품 종류를 고르면 그 종류의 옵션으로 갈아 끼운다.
 * 값을 적어 둔 옵션은 종류를 바꿔도 남는다 — 쓰는 중인 걸 지우면 안 된다.
 */
export const OptionPreset: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    // 한 번 고르고 나면 트리거 문구가 고른 값으로 바뀐다 — 열 때 쓸 이름을 같이 받는다.
    const pickType = async (trigger: string, option: string) => {
      await userEvent.click(canvas.getByRole('button', { name: trigger }))
      await userEvent.click(canvas.getByRole('button', { name: option }))
    }

    await pickType('제품 종류 선택', 'PC/주변기기 · 노트북')
    await waitFor(async () =>
      expect(canvas.getAllByLabelText('옵션 이름')).toHaveLength(4),
    )

    // RAM에만 값을 적어 둔다 — 이건 종류를 바꿔도 남아야 한다.
    await userEvent.type(canvas.getByLabelText('RAM 값'), '16GB')

    await pickType('PC/주변기기 · 노트북', '모바일 · 스마트폰')
    await waitFor(async () => {
      const names = canvas
        .getAllByLabelText('옵션 이름')
        .map((field) => (field as HTMLInputElement).value)
      // 쓰지 않은 크기·용량·칩은 사라지고, 값을 적은 RAM과 스마트폰의 용량만 남는다.
      expect(names).toEqual(['RAM', '용량'])
    })
  },
}

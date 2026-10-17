import { expect, fn, userEvent } from 'storybook/test'

import { OPTION_PRESETS } from '@entities/admin-product'

import { TagField } from './TagField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const smartphone = OPTION_PRESETS.find((preset) => preset.name === '스마트폰')

const meta = {
  component: TagField,
  tags: ['ai-generated'],
  args: { value: [], onChange: fn(), preset: smartphone },
} satisfies Meta<typeof TagField>

export default meta
type Story = StoryObj<typeof meta>

/** 고른 종류의 말과 유의어가 추천으로 깔린다 — 접힌 상태에서 바로 보인다 */
export const Recommended: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('스마트폰 추천 태그')).toBeVisible()
    for (const tag of ['스마트폰', '핸드폰', '휴대폰', '신제품']) {
      await expect(canvas.getByRole('button', { name: tag })).toBeVisible()
    }
    // 다른 묶음의 말은 추천에 없다 — 접힌 목록에 있다.
    await expect(canvas.queryByRole('button', { name: '노트북' })).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: '핸드폰' }))
    await expect(args.onChange).toHaveBeenCalledWith(['핸드폰'])
  },
}

/** 전체 보기를 누르면 추천에 없는 후보가 펼쳐진다 */
export const ExpandsRest: Story = {
  play: async ({ canvas, args }) => {
    const more = canvas.getByRole('button', { name: /전체 보기/ })
    await expect(more).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(more)
    await expect(more).toHaveAttribute('aria-expanded', 'true')

    // 추천에 있는 말은 전체 목록에서 빠진다 — 위에 이미 있으니 두 번 나오면 안 된다.
    await expect(
      canvas.getAllByRole('button', { name: '스마트폰' }),
    ).toHaveLength(1)

    await userEvent.click(canvas.getByRole('button', { name: '노트북' }))
    await expect(args.onChange).toHaveBeenCalledWith(['노트북'])
  },
}

/** 전체 목록에서 고른 태그는 제자리에 남는다 — 추천 쪽으로 올라가지 않는다 */
export const ChosenStaysInPlace: Story = {
  args: { value: ['게이밍'] },
  play: async ({ canvas }) => {
    // 접힌 동안은 위쪽에 안 보인다. 대신 몇 개 골랐는지가 버튼에 적힌다.
    await expect(canvas.queryByRole('button', { name: '게이밍' })).toBeNull()
    const more = canvas.getByRole('button', { name: /1개 선택/ })

    await userEvent.click(more)
    const tags = canvas.getAllByRole('button', { pressed: true })
    // 펼친 목록 안 제자리에 있고, 눌린 상태로 보인다.
    await expect(tags).toHaveLength(1)
    await expect(tags[0]).toHaveTextContent('게이밍')
  },
}

/** 종류를 고르기 전(수정 폼 포함)에는 추천이 없고 왜 없는지 알려준다 */
export const WithoutPreset: Story = {
  args: { preset: undefined },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('제품 카테고리를 고르면 추천 태그가 나옵니다'),
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '스마트폰' })).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: /전체 보기/ }))
    await expect(canvas.getByRole('button', { name: '스마트폰' })).toBeVisible()
  },
}

/** 후보에 없는 말은 직접 적어 Enter로 넣는다 */
export const TypesTag: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText(/태그 직접 입력/), '방수{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith(['방수'])
  },
}

/** 추가 버튼으로도 넣을 수 있다 — 빈 칸이면 눌리지 않는다 */
export const AddButton: Story = {
  play: async ({ canvas, args }) => {
    const add = canvas.getByRole('button', { name: '추가' })
    await expect(add).toBeDisabled()

    await userEvent.type(
      canvas.getByLabelText(/태그 직접 입력/),
      '  무선충전  ',
    )
    await userEvent.click(add)
    // 앞뒤 공백은 떼고 넣는다 — 검색어가 공백으로 어긋나면 안 걸린다.
    await expect(args.onChange).toHaveBeenCalledWith(['무선충전'])
  },
}

/** 같은 태그는 두 번 들어가지 않는다 */
export const IgnoresDuplicate: Story = {
  args: { value: ['방수'] },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText(/태그 직접 입력/), '방수{Enter}')
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

/**
 * 서버에서 온 긴 태그도 줄을 넘기지 않고 다음 줄로 내려간다.
 * 직접 입력은 20자에서 막히지만 들어온 값에는 제한이 없다.
 */
export const LongTag: Story = {
  args: { value: ['한정판스페셜에디션사은품증정행사'] },
  play: async ({ canvas }) => {
    // 후보에 없는 말이라 추천 줄에 선다 — 접힌 목록을 펼치지 않아도 보인다.
    const chip = canvas.getByRole('button', {
      name: '한정판스페셜에디션사은품증정행사',
    })
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  },
}

/** 이미 고른 추천 태그를 다시 누르면 꺼진다 */
export const UnpicksTag: Story = {
  args: { value: ['스마트폰', '핸드폰'] },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '스마트폰' }))
    await expect(args.onChange).toHaveBeenCalledWith(['핸드폰'])
  },
}

/**
 * 수정 폼은 추천 기준(제품 종류)이 없어 고른 태그가 '그 외'에 접혀 안 보인다 —
 * 선택된 태그를 맨 위에 따로 모은다. 누르면 빠진다.
 */
export const ShowsSelected: Story = {
  args: { showSelected: true, value: ['갤럭시', '직접 쓴 태그'] },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('선택된 태그 (2)')).toBeVisible()
    const picked = canvas.getByRole('button', { name: '직접 쓴 태그' })
    await expect(picked).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(picked)
    await expect(args.onChange).toHaveBeenCalledWith(['갤럭시'])
  },
}

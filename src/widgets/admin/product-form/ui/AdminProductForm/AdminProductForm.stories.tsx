import { expect, fn, userEvent, waitFor } from 'storybook/test'

import { createEmptyProductFormValue } from '@entities/admin-product'

import { AdminProductForm } from './AdminProductForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminProductForm,
  tags: ['ai-generated'],
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    onPreview: fn(),
    onEditDispatchWindow: fn(),
  },
} satisfies Meta<typeof AdminProductForm>

export default meta
type Story = StoryObj<typeof meta>

export const Create: Story = {
  args: { mode: 'create' },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: '등록하기' })).toBeVisible()

    await userEvent.type(canvas.getByLabelText(/상품명/), '아이폰 18 Pro')
    await userEvent.type(canvas.getByLabelText(/모델명/), 'A23948')

    await userEvent.click(canvas.getByRole('button', { name: '브랜드 선택' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Apple' }))

    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '아이폰 18 Pro',
        modelName: 'A23948',
        brand: 'Apple',
      }),
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

    // 1차 배송 기간은 등록 때만 받는다 — 여기서는 어디서 고치는지 알려주고 보내준다.
    await expect(canvas.getByText('1차 배송 기간')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /미정/ })).toBeNull()
    await expect(canvas.getByText(/배송 차수 수정이/)).toBeVisible()

    await userEvent.click(
      canvas.getByRole('button', { name: '배송 구간 설정으로 이동' }),
    )
    await expect(args.onEditDispatchWindow).toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}

/**
 * 사전 예약을 켜면 오픈/마감 일시와 1차 배송 기간을 받는다. 수량 칸은 사라진다 —
 * 서버가 사전예약 재고를 받지 않고, 등록 때 1차 차수는 끝이 열린 채로만 만들어진다.
 */
export const PreorderToggle: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('오픈 / 마감 일시')).toBeNull()

    // 조합이 하나는 있어야 수량 칸이 그려진다.
    await userEvent.type(canvas.getByLabelText('색상 입력'), '딥 블루')
    await waitFor(async () =>
      expect(canvas.getByLabelText('수량')).toBeVisible(),
    )

    await userEvent.click(canvas.getByText('사전 예약으로 판매'))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '달력 열기' })).toBeVisible(),
    )
    await expect(canvas.queryByLabelText('수량')).toBeNull()
    await expect(canvas.queryByLabelText('1차 배송 수량')).toBeNull()

    // 1차 배송 기간은 등록할 때만 고를 수 있다 — 이 기간으로 1차 차수가 만들어진다.
    await expect(
      canvas.getByRole('button', { name: /1차 배송 기간/ }),
    ).toBeVisible()
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

    await pickType('제품 카테고리 선택', 'PC/주변기기 · 노트북')
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

/**
 * '색상 없음'은 칸 하나가 아니라 상품 전체의 성격이다 — 하나를 켜면 이미 만들어 둔
 * 색상 칸까지 모두 켜지고, 입력이 막힌다.
 */
export const NoColorAppliesToEveryBlock: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('색상 입력'), '딥 블루')
    await userEvent.click(canvas.getByRole('button', { name: '색상 추가' }))
    await waitFor(async () =>
      expect(canvas.getAllByLabelText('색상 입력')).toHaveLength(2),
    )

    // 두 번째 칸에서 켜도 첫 번째까지 같이 켜진다.
    await userEvent.click(canvas.getAllByLabelText('색상 없음')[1])

    await waitFor(async () => {
      const boxes = canvas.getAllByLabelText('색상 없음')
      expect(boxes[0]).toBeChecked()
      expect(boxes[1]).toBeChecked()
    })
    for (const field of canvas.getAllByLabelText('색상 입력')) {
      await expect(field).toBeDisabled()
    }

    // 흐리게만 두면(opacity·pointerEvents) Tab으로 닿아 키보드로는 그대로 조작된다.
    // 색 선택과 이미지 업로드까지 실제로 disabled여야 한다.
    for (const swatch of canvas.getAllByLabelText('색상 선택')) {
      await expect(swatch).toBeDisabled()
    }
    // '이미지' 라벨이 붙은 건 색상 블록의 업로더뿐이다 — 상세·사양·유의사항
    // 업로더는 라벨이 없고 색상과 무관해서 잠기지 않아야 한다.
    const colorUploads = canvas.getAllByLabelText('이미지')
    await expect(colorUploads).toHaveLength(2)
    for (const upload of colorUploads) {
      await expect(upload).toBeDisabled()
    }

    // 풀면 적어 둔 값이 그대로 돌아온다 — 지우지 않고 가려만 뒀기 때문이다.
    await userEvent.click(canvas.getAllByLabelText('색상 없음')[0])
    await waitFor(async () =>
      expect(canvas.getAllByLabelText('색상 입력')[0]).toHaveValue('딥 블루'),
    )
  },
}

// 수정 화면 공통 — 서버에 이미 있는 색상 두 개, 용량 두 개.
const savedProduct = {
  ...createEmptyProductFormValue(),
  name: '갤럭시 G999',
  // 수정 화면은 서버 값으로 채워진다 — 모델명·브랜드는 늘 있다(필수 칸).
  modelName: 'SM-G999',
  brand: 'Samsung',
  basePrice: 1_200_000,
  colors: [
    { id: 'c-bk', name: '딥 블루', hex: '#3F4891', noColor: false, images: [] },
    { id: 'c-sv', name: '실버', hex: '#C7C9D1', noColor: false, images: [] },
  ],
  optionGroups: [
    {
      id: 'storage',
      name: '용량',
      values: [
        { id: 's-256', label: '256GB', extraPrice: 0 },
        { id: 's-512', label: '512GB', extraPrice: 250_000 },
      ],
    },
  ],
}
const savedIds = new Set(['color', 'c-bk', 'c-sv', 'storage', 's-256', 's-512'])

/**
 * 등록 뒤에는 서버에 옵션을 지우는 API도, 축을 만드는 API도 없다. 있던 색상·값은
 * 지울 수 없고 옵션 종류(축)는 손댈 수 없다. 새로 더한 값은 저장 전이라 지울 수 있다.
 */
export const EditKeepsSavedOptions: Story = {
  args: { mode: 'edit', defaultValue: savedProduct, existingIds: savedIds },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('button', { name: /색상 \d+ 삭제/ }),
    ).toBeNull()
    await expect(
      canvas.queryByRole('button', { name: /용량 값 \d+ 삭제/ }),
    ).toBeNull()
    await expect(
      canvas.queryByRole('button', { name: '옵션 1 삭제' }),
    ).toBeNull()
    await expect(canvas.getByLabelText('옵션 이름')).toBeDisabled()
    await expect(canvas.queryByRole('button', { name: '옵션 추가' })).toBeNull()
    // '색상 없음'은 색상 축 자체를 만들거나 없애는 일이라 잠근다.
    for (const box of canvas.getAllByLabelText('색상 없음')) {
      await expect(box).toBeDisabled()
    }
    // 프리셋은 축을 새로 깔아서 등록 뒤에는 보여주지 않는다.
    await expect(canvas.queryByText('제품 카테고리 선택')).toBeNull()

    // 값은 더할 수 있고, 더한 값은 저장 전이라 지울 수 있다.
    await userEvent.click(
      canvas.getByRole('button', { name: /옵션 타입 추가/ }),
    )
    await expect(
      canvas.getByRole('button', { name: '용량 값 3 삭제' }),
    ).toBeVisible()
  },
}

/** 그만 팔 조합은 지우지 않고 판매를 끈다 — 끈 조합이 저장 값에 실린다 */
export const EditPausesVariant: Story = {
  args: { mode: 'edit', defaultValue: savedProduct, existingIds: savedIds },
  play: async ({ canvas, args }) => {
    const toggle = canvas.getByRole('switch', { name: '딥 블루 256GB 판매' })
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()

    await userEvent.click(canvas.getByRole('button', { name: '수정하기' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ pausedKeys: ['딥 블루|256GB'] }),
    )
  },
}

/**
 * 등록에서도 조합마다 판매 스위치가 있다 — 끈 조합은 만들지 않는다(서버 excluded).
 * 일반 상품이면 끈 조합의 수량 칸도 막는다(만들지 않으니 재고가 없다).
 */
export const CreateExcludesVariant: Story = {
  args: { mode: 'create', defaultValue: savedProduct },
  play: async ({ canvas, args }) => {
    const toggle = canvas.getByRole('switch', { name: '딥 블루 256GB 판매' })
    await expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).not.toBeChecked()

    const row = toggle.closest('tr')
    await expect(row?.querySelector('input')).toBeDisabled()

    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ pausedKeys: ['딥 블루|256GB'] }),
    )
  },
}

/**
 * 사전예약 오픈 3분 전부터는 공개 여부 말고는 서버가 409로 거절한다 — 폼 전체를 읽기
 * 전용으로 두고 이유를 알린다. 취소·미리보기는 눌려야 한다.
 */
export const EditLocked: Story = {
  args: {
    mode: 'edit',
    defaultValue: { ...savedProduct, isPreorder: true },
    existingIds: savedIds,
    lockReason:
      '사전예약은 오픈 3분 전부터 상품 내용을 바꿀 수 없습니다. 공개 전환과 판매 중지는 오른쪽 위 ⋮ 메뉴에서 합니다.',
  },
  play: async ({ canvas, args }) => {
    await expect(
      canvas.getByText(/오픈 3분 전부터 상품 내용을 바꿀 수 없습니다/),
    ).toBeVisible()
    await expect(canvas.getByLabelText(/상품명/)).toBeDisabled()
    await expect(
      canvas.getByRole('button', { name: '수정하기' }),
    ).toBeDisabled()

    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}

/** 사전예약 수정 화면은 수량 칸이 없다 — 재고를 세지 않고 1차 물량은 배송 탭에서 고친다 */
export const EditPreorderHidesQuantity: Story = {
  args: {
    mode: 'edit',
    defaultValue: { ...savedProduct, isPreorder: true },
    existingIds: savedIds,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('columnheader', { name: '1차 배송 수량' }),
    ).toBeNull()
    await expect(canvas.getAllByRole('switch').length).toBeGreaterThan(0)
  },
}

/** 일반 상품은 등록 때 공개 여부를 고른다 — 기본은 숨김이다 */
export const CreateChoosesPublish: Story = {
  args: { mode: 'create' },
  play: async ({ canvas, args }) => {
    const publish = canvas.getByRole('checkbox', { name: /등록하자마자 공개/ })
    await expect(publish).not.toBeChecked()

    await userEvent.click(publish)
    // 상품명·모델명은 필수라 비우면 브라우저가 제출을 막는다.
    await userEvent.type(canvas.getByLabelText(/상품명/), '갤럭시 S30')
    await userEvent.type(canvas.getByLabelText(/모델명/), 'SM-S30')
    await userEvent.click(canvas.getByRole('button', { name: '등록하기' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ publishOnCreate: true }),
    )
  },
}

/** 사전예약은 고를 게 없다 — 접수 기간에만 자동으로 보인다는 안내만 둔다 */
export const CreatePreorderPublishHint: Story = {
  args: { mode: 'create' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('사전 예약으로 판매'))
    await expect(
      canvas.queryByRole('checkbox', { name: /등록하자마자 공개/ }),
    ).toBeNull()
    await expect(canvas.getByText(/접수 기간\(오픈 ~ 마감\)에만/)).toBeVisible()
  },
}

/** 수정 화면엔 공개 설정이 없다 — 상세의 공개 전환 버튼으로 바꾼다 */
export const EditHasNoPublishOption: Story = {
  args: { mode: 'edit', defaultValue: createEmptyProductFormValue() },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('공개 설정')).toBeNull()
  },
}

/** 수정에서도 등록 때 넣은 모델명·브랜드가 채워져 나오고, 고칠 수 있다 */
export const EditBrandAndModelName: Story = {
  args: {
    mode: 'edit',
    defaultValue: {
      ...createEmptyProductFormValue(),
      name: '갤럭시 S30',
      modelName: 'SM-S30',
      brand: 'Samsung',
    },
  },
  play: async ({ canvas, args }) => {
    const modelName = canvas.getByLabelText(/모델명/)
    await expect(modelName).toHaveValue('SM-S30')
    await expect(modelName).toBeEnabled()
    await expect(canvas.getByRole('button', { name: /Samsung/ })).toBeEnabled()

    await userEvent.clear(modelName)
    await userEvent.type(modelName, 'SM-S30U')
    await userEvent.click(canvas.getByRole('button', { name: /Samsung/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Apple' }))
    await userEvent.click(canvas.getByRole('button', { name: '수정하기' }))

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ modelName: 'SM-S30U', brand: 'Apple' }),
    )
  },
}

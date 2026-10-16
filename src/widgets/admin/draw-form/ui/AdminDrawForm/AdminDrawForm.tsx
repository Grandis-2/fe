import { useState, type FormEvent } from 'react'

import {
  createEmptyDrawFormValue,
  DRAW_ENTRY_FEE_MIN,
  DRAW_TITLE_MAX,
  validateDrawForm,
  type AdminDrawFormValue,
  type DrawFormField,
  type DrawFormIssue,
} from '@entities/admin-draw'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { Button, FormSection, InlineAlert, Input } from '@shared/ui'

import { toSubmitFailure } from '../../lib/submitFailure'
import { useGiftOptions, useGiftProducts } from '../../lib/useGiftOptions'
import { GiftPicker } from '../GiftPicker'

import * as styles from './AdminDrawForm.css'

export type AdminDrawFormProps = {
  /** 만드는 중 — 제출을 막는다 */
  submitting?: boolean
  /** 마지막 만들기 실패. 칸 오류·안내로 바꿔 보여준다 */
  submitError?: unknown
  onSubmit: (value: AdminDrawFormValue) => void
  onCancel: () => void
  /** '증정품 상품 등록하기' — 상품 등록 화면으로 보낸다 */
  onAddProduct: () => void
  /** 이전 요청 결과를 확인했다 — 다음 제출을 새 요청으로 보낸다 */
  onStartOver: () => void
}

/**
 * 럭키 드로우 회차 만들기. 만든 뒤엔 고치거나 지울 수 없고 당첨 인원만큼 증정품 재고를
 * 바로 확보해서, 보내기 전에 한 번 더 확인받는다.
 */
export function AdminDrawForm({
  submitting = false,
  submitError,
  onSubmit,
  onCancel,
  onAddProduct,
  onStartOver,
}: AdminDrawFormProps) {
  const [value, setValue] = useState(createEmptyDrawFormValue)
  const [issues, setIssues] = useState<DrawFormIssue[]>(() =>
    submitError ? toSubmitFailure(submitError).issues : [],
  )
  const gifts = useGiftProducts()
  const giftOptions = useGiftOptions(value.productId)
  const gift = giftOptions.options?.find(
    (option) => option.optionId === value.optionId,
  )

  // 새 실패가 오면 그 칸 오류로 바꿔 넣는다(렌더 중 갱신 — 같은 실패면 건너뛴다).
  const [seenError, setSeenError] = useState<unknown>(submitError)
  const failure = submitError ? toSubmitFailure(submitError) : null
  if (submitError !== seenError) {
    setSeenError(submitError)
    if (failure) setIssues(failure.issues)
  }

  const issueOf = (field: DrawFormField) =>
    issues.find((issue) => issue.field === field)?.message

  // 고친 칸의 오류는 바로 지운다 — 다시 낼 때 전체를 또 본다.
  const patch = (
    partial: Partial<AdminDrawFormValue>,
    field: DrawFormField,
  ) => {
    setValue((prev) => ({ ...prev, ...partial }))
    setIssues((prev) => prev.filter((issue) => issue.field !== field))
  }

  const confirmCreate = () =>
    openModal({
      theme: 'light',
      title: '회차를 만들까요?',
      description: `만든 뒤에는 고치거나 지울 수 없습니다.\n증정품 재고 ${formatNumber(Number(value.winnerCount))}개를 바로 확보합니다.`,
      confirmLabel: '만들기',
      onConfirm: () => {
        closeModal()
        onSubmit(value)
      },
    })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const found = validateDrawForm(value, {
      available: gift?.available,
      now: Date.now(),
    })
    setIssues(found)
    if (found.length === 0) confirmCreate()
  }

  const fee = Number(value.entryFee)

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      {failure?.message && (
        <InlineAlert status="error">
          {failure.message}
          {failure.unconfirmed && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              className={styles.alertAction}
              onClick={onStartOver}
            >
              확인했어요, 새로 보내기
            </Button>
          )}
        </InlineAlert>
      )}

      <FormSection title="회차 제목" description="결제창 이름으로도 쓰입니다.">
        <Input
          label="회차 제목"
          required
          maxLength={DRAW_TITLE_MAX}
          value={value.title}
          error={issueOf('title')}
          onChange={(event) => patch({ title: event.target.value }, 'title')}
        />
      </FormSection>

      <FormSection
        title="증정품"
        description="일반 판매 상품의 옵션 하나입니다. 이름·사진은 만든 때 값으로 고정됩니다."
      >
        <GiftPicker
          products={gifts.products}
          options={giftOptions.options}
          optionsLoading={giftOptions.isPending}
          productId={value.productId}
          optionId={value.optionId}
          onChange={(next) => patch(next, 'gift')}
          onAddProduct={onAddProduct}
          error={issueOf('gift')}
          loadError={
            gifts.error || giftOptions.error
              ? '증정품 후보를 불러오지 못했습니다. 새로고침해 주세요.'
              : undefined
          }
        />
      </FormSection>

      <FormSection title="응모 조건">
        <div className={styles.pair}>
          <Input
            label="응모비(원)"
            required
            inputMode="numeric"
            value={value.entryFee}
            error={issueOf('entryFee')}
            onChange={(event) =>
              patch({ entryFee: event.target.value }, 'entryFee')
            }
          />
          <Input
            label="당첨 인원(명)"
            required
            inputMode="numeric"
            value={value.winnerCount}
            error={issueOf('winnerCount')}
            onChange={(event) =>
              patch({ winnerCount: event.target.value }, 'winnerCount')
            }
          />
        </div>
        <div className={styles.hint}>
          응모비는 {formatWon(DRAW_ENTRY_FEE_MIN)} 이상입니다.
          {Number.isInteger(fee) && fee >= DRAW_ENTRY_FEE_MIN
            ? ` 입력한 응모비: ${formatWon(fee)}`
            : ''}
        </div>
      </FormSection>

      <FormSection
        title="응모 기간"
        description="시작이 지난 시각이면 만들자마자 응모를 받습니다. 마감 30초 뒤부터 서버가 자동으로 추첨합니다."
      >
        <div className={styles.pair}>
          <Input
            label="응모 시작"
            variant="stacked"
            type="datetime-local"
            required
            value={value.opensAt}
            error={issueOf('opensAt')}
            onChange={(event) =>
              patch({ opensAt: event.target.value }, 'opensAt')
            }
          />
          <Input
            label="응모 마감"
            variant="stacked"
            type="datetime-local"
            required
            value={value.closesAt}
            error={issueOf('closesAt')}
            onChange={(event) =>
              patch({ closesAt: event.target.value }, 'closesAt')
            }
          />
        </div>
      </FormSection>

      <div className={styles.actions}>
        <Button variant="outline" color="cancel" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '만드는 중…' : '만들기'}
        </Button>
      </div>
    </form>
  )
}

import { Fragment, useState, type FormEvent } from 'react'

import {
  createEmptyDrawFormValue,
  DRAW_ENTRY_FEE_MIN,
  DRAW_TITLE_MAX,
  validateDrawForm,
  type AdminDrawFormValue,
  type DrawFormField,
  type DrawFormIssue,
} from '@entities/admin-draw'
import {
  formatDotDateTime,
  formatShortDateTime,
} from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { Button, Chip, InlineAlert, Input } from '@shared/ui'

import { periodLength, quickPeriod } from '../../lib/period'
import { toSubmitFailure } from '../../lib/submitFailure'
import { useGiftOptions } from '../../lib/useGiftOptions'
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

// 서버는 마감 30초 뒤부터(결제 확인 중인 응모가 끝나면) 자동으로 추첨한다.
const DRAW_DELAY_MS = 30_000

// 제출할 때 한 번 읽는 시각 — 렌더 중이 아니라 이벤트에서만 부른다.
const currentTime = () => Date.now()

const QUICK_PERIODS = [
  { label: '하루', days: 1 },
  { label: '3일', days: 3 },
  { label: '일주일', days: 7 },
]

/**
 * 럭키 드로우 회차 만들기. 만든 뒤엔 고치거나 지울 수 없고 당첨 인원만큼 증정품 재고를
 * 바로 확보해서, 오른쪽에 보낼 내용을 모아 보여주고 보내기 전에 한 번 더 확인받는다.
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
  const giftOptions = useGiftOptions(value.productId)
  const gift = giftOptions.options?.find(
    (option) => option.optionId === value.optionId,
  )
  const giftProduct = giftOptions.products?.find(
    (product) => product.productId === value.productId,
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
    ...fields: DrawFormField[]
  ) => {
    setValue((prev) => ({ ...prev, ...partial }))
    setIssues((prev) => prev.filter((issue) => !fields.includes(issue.field)))
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
      now: currentTime(),
    })
    setIssues(found)
    if (found.length === 0) confirmCreate()
  }

  const fee = Number(value.entryFee)
  const winners = Number(value.winnerCount)
  const validWinners = Number.isInteger(winners) && winners > 0
  const length = periodLength(value.opensAt, value.closesAt)
  const closesAt = Date.parse(value.closesAt)

  // 오른쪽 "만들기 전에 확인" — 아직 안 채운 칸은 '—'.
  const summary: { label: string; value: string; note?: string }[] = [
    { label: '회차', value: value.title.trim() || '—' },
    {
      label: '증정품',
      value: gift && giftProduct ? `${giftProduct.name} · ${gift.label}` : '—',
    },
    {
      label: '응모비',
      value:
        Number.isInteger(fee) && fee >= DRAW_ENTRY_FEE_MIN
          ? formatWon(fee)
          : '—',
    },
    {
      label: '당첨',
      value: validWinners
        ? `${formatNumber(winners)}명 · 재고 ${formatNumber(winners)}개 확보`
        : '—',
      note: validWinners
        ? `당첨이 ${formatNumber(winners)}명보다 적으면 남은 재고는 돌려놔요`
        : undefined,
    },
    {
      label: '응모 기간',
      value: length
        ? `${formatShortDateTime(value.opensAt)} ~ ${formatShortDateTime(value.closesAt)}`
        : '—',
      note: length ?? undefined,
    },
    {
      label: '자동 추첨',
      value: Number.isFinite(closesAt)
        ? `${formatDotDateTime(new Date(closesAt + DRAW_DELAY_MS).toISOString())}부터`
        : '—',
      note: '결제 확인 중인 응모가 다 끝나면 서버가 추첨해요. 결제 완료가 당첨 인원 이하면 추첨 없이 모두 당첨이에요.',
    },
  ]

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <div className={styles.fields}>
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

        <section className={styles.panel} aria-labelledby="draw-form-title">
          <h2 id="draw-form-title" className={styles.panelTitle}>
            <span className={styles.stepNo} aria-hidden="true">
              1
            </span>
            회차 제목
          </h2>
          <div className={styles.description}>결제창 이름으로도 쓰여요.</div>
          <div className={styles.field}>
            <Input
              label="회차 제목"
              required
              maxLength={DRAW_TITLE_MAX}
              value={value.title}
              error={issueOf('title')}
              onChange={(event) =>
                patch({ title: event.target.value }, 'title')
              }
            />
            <span className={styles.counter}>
              {value.title.length}/{DRAW_TITLE_MAX}
            </span>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="draw-form-gift">
          <h2 id="draw-form-gift" className={styles.panelTitle}>
            <span className={styles.stepNo} aria-hidden="true">
              2
            </span>
            증정품
          </h2>
          <div className={styles.description}>
            일반 판매 상품의 옵션 하나예요. 이름·사진은 만든 때 값으로 고정돼요.
          </div>
          <GiftPicker
            products={giftOptions.products}
            options={giftOptions.options}
            productId={value.productId}
            optionId={value.optionId}
            onChange={(next) => patch(next, 'gift')}
            onAddProduct={onAddProduct}
            winnerCount={validWinners ? winners : undefined}
            error={issueOf('gift')}
            loadError={
              giftOptions.error
                ? '증정품 후보를 불러오지 못했습니다. 새로고침해 주세요.'
                : undefined
            }
          />
        </section>

        <section className={styles.panel} aria-labelledby="draw-form-terms">
          <h2 id="draw-form-terms" className={styles.panelTitle}>
            <span className={styles.stepNo} aria-hidden="true">
              3
            </span>
            응모 조건
          </h2>
          <div className={styles.pair}>
            <div className={styles.field}>
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
              <span className={styles.hint}>
                {formatWon(DRAW_ENTRY_FEE_MIN)} 이상 · 원 단위 정수
              </span>
            </div>
            <div className={styles.field}>
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
              <span className={styles.hint}>
                {gift
                  ? `가용 재고 ${formatNumber(gift.available)}개까지`
                  : '고른 증정품의 가용 재고까지'}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="draw-form-period">
          <h2 id="draw-form-period" className={styles.panelTitle}>
            <span className={styles.stepNo} aria-hidden="true">
              4
            </span>
            응모 기간
          </h2>
          <div className={styles.description}>
            시작이 지난 시각이면 만들자마자 응모를 받아요. 마감은 지금보다
            뒤여야 해요.
          </div>
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
          {/* 지금부터 그만큼 — 시작·마감 두 칸을 한 번에 채운다. */}
          <div
            className={styles.quick}
            role="group"
            aria-label="응모 기간 빨리 정하기"
          >
            <span className={styles.hint}>기간 빨리 정하기</span>
            {QUICK_PERIODS.map(({ label, days }) => (
              <Chip
                key={label}
                type="button"
                onClick={() => patch(quickPeriod(days), 'opensAt', 'closesAt')}
              >
                {label}
              </Chip>
            ))}
          </div>
        </section>
      </div>

      <aside className={styles.aside} aria-labelledby="draw-form-summary">
        <section className={styles.summaryPanel}>
          <h2 id="draw-form-summary" className={styles.panelTitle}>
            만들기 전에 확인
          </h2>
          <dl className={styles.list}>
            {summary.map(({ label, value: text, note }) => (
              <Fragment key={label}>
                <dt className={styles.term}>{label}</dt>
                <dd className={styles.value}>
                  {text}
                  {note && text !== '—' && (
                    <span className={styles.valueNote}>{note}</span>
                  )}
                </dd>
              </Fragment>
            ))}
          </dl>
          <InlineAlert status="warning">
            만든 뒤에는 고치거나 지울 수 없어요.
          </InlineAlert>
          <div className={styles.actions}>
            <Button type="submit" disabled={submitting}>
              {submitting ? '만드는 중…' : '회차 만들기'}
            </Button>
            <Button variant="outline" color="cancel" onClick={onCancel}>
              취소
            </Button>
          </div>
        </section>
      </aside>
    </form>
  )
}

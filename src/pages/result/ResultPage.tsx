import { useLocation, useNavigate, useSearchParams } from 'react-router'

import {
  PREORDER_BENEFIT_RATE,
  type PurchaseDraft,
} from '@features/product-purchase'
import {
  HOME_PATH,
  mypagePath,
  PAYMENT_PATH,
  PREORDER_PATH,
  RESULT_STATUSES,
  type ResultStatus,
} from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { ActionButton } from '@shared/ui'
import {
  OrderReceipt,
  OrderStatusMark,
  PurchaseDeadline,
  type OrderReceiptRow,
  type OrderStatusTone,
} from '@widgets/order-result'

import * as styles from './ResultPage.css'

// 예약 접수 / 사전예약 구매 완료 / 일반 구매 완료 / 결제 실패 — 상태 표시·영수증·버튼 뼈대를
// 공유해서 한 페이지로 둔다. 진입할 때 ?status=로 고른다(RESULT_STATUSES).
const isResultStatus = (value: string | null): value is ResultStatus =>
  RESULT_STATUSES.includes(value as ResultStatus)

type Action = { label: string; to: string }

const content: Record<
  ResultStatus,
  {
    tone: OrderStatusTone
    badge: string
    heading: string
    description: string
    primary: Action
    secondary: Action
    note?: string
  }
> = {
  preorder: {
    tone: 'pending',
    badge: '구매 확정 대기',
    heading: '예약이 접수되었어요',
    description:
      '주문이 몰려 결제까지 완료되지 못했어요. 예약 순서는 확보되었으니, 24시간 안에 직접 구매를 확정해 주세요.',
    primary: { label: '지금 구매 확정하기', to: PAYMENT_PATH },
    secondary: { label: '예약 내역 보기', to: mypagePath('preorder-check') },
    note: '24시간 안에 구매를 확정하지 않으면 예약은 자동으로 취소돼요. 예약 내역에서도 구매를 확정할 수 있어요.',
  },
  'preorder-paid': {
    tone: 'success',
    badge: '사전예약 구매 완료',
    heading: '사전예약 구매가 완료되었어요',
    description:
      '출시일에 맞춰 순서대로 발송해 드려요. 배송이 시작되면 알림으로 알려드릴게요.',
    primary: { label: '주문 내역 보기', to: mypagePath('history') },
    secondary: { label: '쇼핑 계속하기', to: PREORDER_PATH },
  },
  paid: {
    tone: 'success',
    badge: '구매 완료',
    heading: '주문이 완료되었어요',
    description:
      '결제가 정상적으로 처리되었어요. 배송이 시작되면 알림으로 알려드릴게요.',
    primary: { label: '주문 내역 보기', to: mypagePath('history') },
    secondary: { label: '쇼핑 계속하기', to: HOME_PATH },
  },
  failed: {
    tone: 'failure',
    badge: '구매 실패',
    heading: '결제에 실패했어요',
    description:
      '결제가 완료되지 않아 주문이 접수되지 않았어요. 결제 수단을 확인한 뒤 다시 시도해 주세요.',
    primary: { label: '다시 결제하기', to: PAYMENT_PATH },
    secondary: { label: '장바구니로', to: mypagePath('cart') },
  },
}

// 토스 결제창을 거쳐 오면(paid·failed) history state가 끊겨 주문 상품을 넘겨받지 못한다.
// ponytail: 주문 조회 API가 아직 없어서 시안 값을 그대로 둔 목업 — 붙는 대로 주문번호·결제 수단·
// 배송지·마감 시각까지 응답 값으로 교체한다.
const fallbackDrafts: PurchaseDraft[] = [
  {
    variantId: '101',
    productName: '맥북 프로 14',
    optionSummary: '스페이스 블랙 · 14인치 · 16GB · 512GB · M5',
    quantity: 1,
    unitPrice: 2390000,
  },
]
const mockOrder = {
  number: '26100712',
  payMethod: '신용·체크카드 (일시불)',
  address: '서울특별시 강남구 테헤란로 123',
  deliveryEta: '10월 9일 (금) 도착 예정',
}
// 모듈 스코프라 렌더마다 새 Date가 생기지 않는다(useCountdown 타이머가 다시 걸리지 않게).
const mockPurchaseDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

export function ResultPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const statusParam = searchParams.get('status')
  const status: ResultStatus = isResultStatus(statusParam)
    ? statusParam
    : 'paid'
  const { tone, badge, heading, description, primary, secondary, note } =
    content[status]
  const isPaid = tone === 'success'
  const isPreorder = status === 'preorder' || status === 'preorder-paid'

  // 상품 상세(사전예약)는 고른 상품 목록을, 결제 콜백(실패)은 { failReason }을 state로 넘긴다.
  const state: unknown = location.state
  const drafts =
    Array.isArray(state) && state.length > 0
      ? (state as PurchaseDraft[])
      : fallbackDrafts
  const failReason =
    typeof (state as { failReason?: unknown } | null)?.failReason === 'string'
      ? (state as { failReason: string }).failReason
      : undefined

  // 사전예약만 혜택이 붙는다 — 결제 화면의 "결제 예정 금액"과 같은 계산.
  const orderAmount = drafts.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )
  const benefit = isPreorder
    ? Math.round(orderAmount * PREORDER_BENEFIT_RATE)
    : 0

  const rows: OrderReceiptRow[] = [
    ...(benefit
      ? [
          {
            label: `사전예약 혜택 (${PREORDER_BENEFIT_RATE * 100}%)`,
            value: `-${formatWon(benefit)}`,
            tone: 'brand' as const,
          },
        ]
      : []),
    { label: '결제 수단', value: mockOrder.payMethod },
    { label: '배송지', value: mockOrder.address },
    isPaid
      ? {
          label: '예상 배송일',
          value: isPreorder ? '출시일 이후 순차 발송' : mockOrder.deliveryEta,
        }
      : {
          label: '결제 상태',
          value: tone === 'pending' ? '미결제 · 구매 확정 필요' : '미결제',
          tone: tone === 'pending' ? 'warning' : 'danger',
        },
  ]

  // 결제 화면으로 갈 땐 같은 주문을 이어서 보여 주도록 상품을 같이 넘긴다.
  const go = ({ to }: Action) =>
    void navigate(to, to === PAYMENT_PATH ? { state: drafts } : undefined)

  return (
    <div
      className={[styles.root, styles.glow[tone]].join(' ')}
      data-theme="dark"
      data-header-theme="dark"
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <OrderStatusMark tone={tone} />
          <span className={styles.badge[tone]}>{badge}</span>
          <h1 className={styles.heading}>{heading}</h1>
          <div className={styles.description}>{description}</div>
        </div>

        {status === 'preorder' && (
          <PurchaseDeadline dueAt={mockPurchaseDueAt} />
        )}

        {status === 'failed' && (
          <div className={styles.failure}>
            {failReason && (
              <>
                <span className={styles.failureTitle}>실패 사유</span>
                <span className={styles.failureReason}>{failReason}</span>
              </>
            )}
            <span className={styles.failureNote}>
              결제 금액은 청구되지 않았어요.
            </span>
          </div>
        )}

        <OrderReceipt
          number={
            status === 'failed'
              ? undefined
              : {
                  label: status === 'preorder' ? '예약번호' : '주문번호',
                  value: `${status === 'preorder' ? 'RV' : 'NV'}${mockOrder.number}`,
                }
          }
          items={drafts}
          rows={rows}
          amountLabel={isPaid ? '총 결제 금액' : '결제 예정 금액'}
          amount={orderAmount - benefit}
          amountPending={!isPaid}
        />

        <div className={styles.actions}>
          <ActionButton variant="neutral" onClick={() => go(secondary)}>
            {secondary.label}
          </ActionButton>
          <ActionButton onClick={() => go(primary)}>
            {primary.label}
          </ActionButton>
        </div>

        {note && <div className={styles.note}>{note}</div>}
      </div>
    </div>
  )
}

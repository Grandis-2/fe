import { useState } from 'react'

import { Settings } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { useDefaultAddress, type DefaultAddress } from '@entities/address'
import {
  OrderSummary,
  useCreatePaymentAttempt,
  usePlaceOrder,
} from '@entities/order'
import { useReservation, type ReservationDetail } from '@entities/preorder'
import { useProfile } from '@entities/profile'
import {
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@features/address-search'
import { requestTossPayment } from '@features/payment'
import { OrderItemList, reservationToDraft } from '@features/product-purchase'
import { terms, TermsAgreement } from '@features/terms-agreement'
import { getErrorMessage } from '@shared/api/client'
import { mypagePath, resultPath } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { useFormFields } from '@shared/lib/useFormFields'
import { ActionButton, Container, Input, InlineAlert } from '@shared/ui'

import * as styles from './PaymentPage.css'

const GENERIC_PAYMENT_ERROR =
  '결제 요청 중 문제가 발생했습니다. 다시 시도해 주세요.'

// 결제할 수 있는 예약 단계. 결제 진행 중(주문만 만들고 결제창을 닫음)이면 같은 주문으로 다시 결제한다.
const PAYABLE: ReservationDetail['displayStatus'][] = [
  'PAYABLE',
  'PAYMENT_IN_PROGRESS',
]

// 결제할 수 없는 예약일 때 안내 문구.
const UNPAYABLE_MESSAGE: Partial<
  Record<ReservationDetail['displayStatus'], string>
> = {
  RECEIVED: '예약을 등록하고 있어요. 결제는 등록이 끝난 뒤에 할 수 있어요.',
  PROCESSING: '예약을 등록하고 있어요. 결제는 등록이 끝난 뒤에 할 수 있어요.',
  PAYMENT_EXPIRED: '결제 기한이 지나 결제할 수 없어요.',
  RESERVED: '이미 결제가 끝난 예약이에요.',
  CANCELING: '취소 중인 예약이라 결제할 수 없어요.',
  CANCELED: '취소된 예약이라 결제할 수 없어요.',
}

const formatDueAt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// 저장된 기본 배송지가 없을 때의 처리(배송지 등록 유도 등)가 정해지기 전까지는 배송지가
// 있다고 가정하고 이 값으로 채운다.
// ponytail: 목업 — 배송지 없음 처리가 정해지면 지우고 그쪽 흐름으로 바꾼다.
const fallbackAddress: DefaultAddress = {
  name: '홍길동',
  phone: '01012345678',
  postalCode: '06234',
  line1: '서울특별시 강남구 테헤란로 123',
  line2: null,
}

// email을 제외한 나머지가 결제를 막는 필수 입력이다. 우편번호는 칸이 없고 기본 주소와
// 같이 채워지므로(저장된 배송지·주소 찾기) 따로 검사하지 않는다.
const REQUIRED_KEYS = [
  'name',
  'phone',
  'addressLabel',
  'address',
  'addressDetail',
] as const

// 사전예약 하나를 결제한다(order 명세: 결제 가능해진 예약 → 주문 생성 → 결제 준비 → 토스 결제창 → 승인).
// 일반 구매·장바구니 결제는 아직 주문 API가 없어 예약 id 없이 들어오면 안내만 보인다.
export function PaymentPage() {
  const [searchParams] = useSearchParams()
  const preorderId = searchParams.get('preorderId') ?? ''
  const navigate = useNavigate()
  const reservation = useReservation(preorderId)
  const placeOrder = usePlaceOrder()
  const createAttempt = useCreatePaymentAttempt()
  const { data: profile } = useProfile()
  const { data: savedAddress } = useDefaultAddress()
  const [agreedIds, setAgreedIds] = useState<Set<string>>(new Set())
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)

  // 회원 프로필과 기본 배송지를 기본값으로 깐다(SignupPage의 프로필 프리필과 같은
  // 패턴). 사용자가 고친 칸이 항상 우선하므로 응답이 늦게 와도 입력 중인 값을
  // 덮어쓰지 않는다(useFormFields). 기본 주소는 직접 입력하지 않고 주소 찾기로만 바꾼다.
  const address = savedAddress ?? fallbackAddress
  const form = useFormFields(
    {
      name: profile?.name || address.name,
      phone: profile?.phoneNumber ?? '',
      email: profile?.email ?? '',
      addressLabel: address.label || '기본 배송지',
      postcode: address.postalCode,
      address: address.line1,
      addressDetail: address.line2 ?? '',
    },
    REQUIRED_KEYS,
  )
  const { field } = form
  // 읽기 전용 칸에 우편번호를 붙여 "기본 주소 (우편번호)"로 한 칸에 보여 준다 — 폼 값은
  // 주소와 우편번호가 따로다.
  const addressDisplay = [
    form.values.address,
    form.values.postcode && `(${form.values.postcode})`,
  ]
    .filter(Boolean)
    .join(' ')

  const detail = reservation.data
  const payable = detail ? PAYABLE.includes(detail.displayStatus) : false
  // 결제 금액은 서버가 정한다 — 예약 접수 당시 단가 그대로(수량 1).
  const totalAmount = detail?.unitPrice ?? 0
  const isPaying = placeOrder.isPending || createAttempt.isPending

  const requiredAgreed = terms.every(
    (term) => !term.required || agreedIds.has(term.id),
  )
  // 검색 없이 닫으면 onComplete가 안 불려서 폼은 그대로다. 상세 주소는 이전 주소
  // 기준 값이라 새로 찾은 주소와 안 맞을 수 있어 같이 비운다.
  const handleAddressComplete = ({
    postcode,
    address,
  }: DaumPostcodeAddress) => {
    form.setValues({ postcode, address, addressDetail: '' })
    setAddressSearchOpen(false)
  }

  const toggleAgree = (id: string, checked: boolean) =>
    setAgreedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const toggleAllAgree = (checked: boolean) =>
    setAgreedIds(checked ? new Set(terms.map((term) => term.id)) : new Set())

  // ① 주문 생성(같은 예약이면 기존 주문) → ② 결제 준비(tossOrderId·금액·주문명) → ③ 토스 결제창(카드).
  // 정상 진행되면 브라우저가 successUrl/failUrl로 이동하므로, catch는 결제창이 뜨기 전 오류만 잡는다.
  const handlePayment = async () => {
    form.markSubmitted()
    setPaymentError(null)
    if (!form.requiredFilled || !payable) return

    try {
      const order = await placeOrder.mutateAsync({
        source: 'PREORDER',
        preorderId,
        shipTo: {
          name: form.values.name,
          phone: form.values.phone,
          postalCode: form.values.postcode,
          line1: form.values.address,
          line2: form.values.addressDetail || null,
        },
      })
      // 기존 주문이 이미 결제됐으면 결제 단계로 가지 않고 결과를 보여 준다.
      if (order.status === 'AUTHORIZING') {
        setPaymentError(
          '결제를 확인하고 있어요. 잠시 뒤 주문 내역에서 결과를 확인해 주세요.',
        )
        return
      }
      if (order.status !== 'AWAITING_PAYMENT') {
        navigate(resultPath('preorder-paid'), {
          replace: true,
          state: { orderId: order.orderId },
        })
        return
      }
      const attempt = await createAttempt.mutateAsync(order.orderId)
      await requestTossPayment({
        tossOrderId: attempt.tossOrderId,
        amount: attempt.amount,
        orderName: attempt.orderName,
        orderToken: order.orderId,
        preorderId,
        customerName: form.values.name,
        customerEmail: form.values.email || undefined,
      })
    } catch (caught) {
      setPaymentError(getErrorMessage(caught, GENERIC_PAYMENT_ERROR))
    }
  }

  // 예약 id 없이 들어왔거나(일반 구매·장바구니) 예약을 아직 못 받았으면 안내만 보인다.
  if (!detail) {
    return (
      <div className={styles.root} data-theme="dark" data-header-theme="dark">
        <Container>
          <div className={styles.title}>주문 / 결제</div>
          {!preorderId ? (
            <InlineAlert status="info">
              지금은 사전예약 결제만 할 수 있어요. 일반 구매·장바구니 결제는
              준비 중이에요.{' '}
              <Link to={mypagePath('preorder-check')}>예약 내역으로 가기</Link>
            </InlineAlert>
          ) : (
            <InlineAlert status={reservation.isError ? 'error' : 'info'}>
              {reservation.isError
                ? getErrorMessage(
                    reservation.error,
                    '예약을 불러오지 못했어요.',
                  )
                : '예약을 불러오는 중이에요.'}
            </InlineAlert>
          )}
        </Container>
      </div>
    )
  }

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <Container>
        <div className={styles.title}>주문 / 결제</div>

        {paymentError && (
          <InlineAlert status="error">{paymentError}</InlineAlert>
        )}
        {!payable && (
          <InlineAlert status="info">
            {UNPAYABLE_MESSAGE[detail.displayStatus] ??
              '결제할 수 있는 예약이 아니에요.'}
          </InlineAlert>
        )}

        <div className={styles.layout}>
          <div className={styles.form}>
            <section className={styles.section}>
              <OrderItemList items={[reservationToDraft(detail)]} />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>수령인</div>
              <div className={styles.fieldRow}>
                <Input
                  {...field('name', '이름')}
                  variant="stacked"
                  placeholder="이름"
                />
                <Input
                  {...field('phone', "휴대폰 ('-'을 제외한 숫자만)")}
                  variant="stacked"
                  placeholder="01012345678"
                  inputMode="numeric"
                />
              </div>
              <Input
                {...field('email', '이메일')}
                variant="stacked"
                placeholder="email@example.com"
                inputMode="email"
              />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionIntro}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>배송지</div>
                  <Link
                    to={mypagePath('address-manage')}
                    className={styles.addressManageLink}
                  >
                    <Settings size={16} aria-hidden="true" />
                    배송지 관리
                  </Link>
                </div>
                <div className={styles.note}>
                  ※ 기본 배송지로 자동 설정되었습니다. 주문 전 주소를 확인해
                  주세요.
                </div>
              </div>

              <Input {...field('addressLabel', '배송지명')} variant="stacked" />
              <div className={styles.addressRow}>
                <Input
                  {...field('address', '기본 주소')}
                  variant="stacked"
                  value={addressDisplay}
                  readOnly
                />
                <ActionButton
                  variant="neutral"
                  className={styles.addressAction}
                  onClick={() => setAddressSearchOpen(true)}
                >
                  주소 찾기
                </ActionButton>
              </div>
              <Input
                {...field('addressDetail', '상세 주소')}
                variant="stacked"
                placeholder="동, 호수"
              />
            </section>
          </div>

          <OrderSummary
            className={styles.summary}
            rows={[
              { label: '상품 수', value: '1개' },
              { label: '주문 금액', value: formatWon(totalAmount) },
              ...(detail.paymentDueAt
                ? [
                    {
                      label: '결제 기한',
                      value: `${formatDueAt(detail.paymentDueAt)}까지`,
                      highlight: true,
                    },
                  ]
                : []),
            ]}
            totalLabel="결제 예정 금액"
            totalValue={formatWon(totalAmount)}
            actionLabel={`${formatWon(totalAmount)} 결제하기`}
            actionDisabled={!requiredAgreed || !payable || isPaying}
            darkAction
            onAction={() => void handlePayment()}
          >
            <TermsAgreement
              agreedIds={agreedIds}
              onToggle={toggleAgree}
              onToggleAll={toggleAllAgree}
            />
          </OrderSummary>
        </div>

        <DaumPostcodeSearch
          open={addressSearchOpen}
          onOpenChange={setAddressSearchOpen}
          onComplete={handleAddressComplete}
        />
      </Container>
    </div>
  )
}

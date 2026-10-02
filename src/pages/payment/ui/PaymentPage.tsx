import { useState } from 'react'

import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useDefaultAddress, type DefaultAddress } from '@entities/address'
import { OrderSummary } from '@entities/order'
import { preparePayment } from '@entities/payment'
import { ProductPaymentCard } from '@entities/product'
import { useProfile } from '@entities/profile'
import {
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@features/daum-postcode'
import {
  PREORDER_BENEFIT_RATE,
  type PurchaseDraft,
} from '@features/product-purchase'
import { requestTossPayment } from '@features/toss-payment'
import { getErrorMessage } from '@shared/api/client'
import { mypagePath } from '@shared/config/routes'
import { formatWon } from '@shared/lib/formatNumber'
import { useFormFields } from '@shared/lib/useFormFields'
import { Button, Container, Input, InlineAlert } from '@shared/ui'

import { terms } from '../model/terms'

import * as styles from './PaymentPage.css'
import { TermsAgreement } from './TermsAgreement'

const GENERIC_PAYMENT_ERROR =
  '결제 요청 중 문제가 발생했습니다. 다시 시도해 주세요.'

// 직접 /payment로 들어오면(딥링크 등) 상품 상세가 넘기는 주문 초안이 없어 아래 목업으로 대체한다.
// ponytail: 아직 주문서 API가 없어서 목업 데이터로 대체.
const fallbackDraft: PurchaseDraft = {
  productName: '맥북 프로 14',
  colorLabel: '실버',
  optionLabel: '512GB',
  quantity: 1,
  unitPrice: 2390000,
}

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

export function PaymentPage() {
  const location = useLocation()
  const draft = (location.state as PurchaseDraft | null) ?? fallbackDraft
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
      addressLabel: '기본 배송지',
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

  const orderAmount = draft.unitPrice * draft.quantity
  const preorderBenefit = Math.round(orderAmount * PREORDER_BENEFIT_RATE)
  const totalAmount = orderAmount - preorderBenefit
  const orderProduct = {
    name: draft.productName,
    modelNumber: 'A3112',
    optionSummary: `${draft.colorLabel} · ${draft.optionLabel} · Apple care+`,
    quantityLabel: `${draft.quantity}개`,
    priceLabel: formatWon(orderAmount),
  }

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

  // ① 결제 준비(주문ID·금액 확정) → ② 토스 결제창(카드) 요청. 정상 진행되면
  // 브라우저가 결제창 오버레이를 띄운 뒤 successUrl/failUrl로 이동하므로, catch는
  // 오버레이가 뜨기 전 오류(파라미터 오류, 네트워크 실패 등)만 잡는다.
  const handlePayment = async () => {
    form.markSubmitted()
    setPaymentError(null)
    if (!form.requiredFilled) return

    try {
      const { orderId, amount } = await preparePayment({
        orderName: draft.productName,
        amount: totalAmount,
      })
      await requestTossPayment({
        orderId,
        amount,
        orderName: draft.productName,
        customerName: form.values.name,
        customerEmail: form.values.email || undefined,
      })
    } catch (caught) {
      setPaymentError(getErrorMessage(caught, GENERIC_PAYMENT_ERROR))
    }
  }

  return (
    <Container>
      <div className={styles.title}>주문 / 결제</div>

      {paymentError && <InlineAlert status="error">{paymentError}</InlineAlert>}

      <div className={styles.layout}>
        <div className={styles.form}>
          <section className={styles.section}>
            <div className={styles.sectionTitle}>주문 상품</div>
            <ProductPaymentCard product={orderProduct} />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>수령인</div>
            <div className={styles.fieldRow}>
              <Input {...field('name', '이름')} />
              <Input
                {...field('phone', "휴대폰 ('-'을 제외한 숫자만)")}
                inputMode="numeric"
              />
            </div>
            <Input {...field('email', '이메일')} inputMode="email" />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionIntro}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>배송지</div>
                <Link
                  to={mypagePath('address-manage')}
                  className={styles.addressManageLink}
                >
                  <Settings size={20} />
                  배송지 관리
                </Link>
              </div>
              <div className={styles.note}>
                ※ 기본 배송지로 자동 설정되었습니다. 주문 전 주소를 확인해
                주세요.
              </div>
            </div>

            <Input {...field('addressLabel', '배송지명')} />
            <div className={styles.addressRow}>
              <Input
                {...field('address', '기본 주소')}
                value={addressDisplay}
                readOnly
              />
              <Button
                className={styles.addressAction}
                onClick={() => setAddressSearchOpen(true)}
              >
                주소 찾기
              </Button>
            </div>
            <Input {...field('addressDetail', '상세 주소')} />
          </section>
        </div>

        <OrderSummary
          rows={[
            { label: '상품 수', value: `${draft.quantity}개` },
            { label: '주문 금액', value: formatWon(orderAmount) },
            {
              label: '사전예약 혜택',
              value: `-${formatWon(preorderBenefit)}`,
              highlight: true,
            },
          ]}
          totalLabel="결제 예정 금액"
          totalValue={formatWon(totalAmount)}
          actionLabel={`${formatWon(totalAmount)} 결제하기`}
          actionDisabled={!requiredAgreed}
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
  )
}

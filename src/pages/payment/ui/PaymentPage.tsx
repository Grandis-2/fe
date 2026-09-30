import { useState, type ChangeEvent } from 'react'

import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useDefaultAddress } from '@/entities/address'
import { OrderSummary } from '@/entities/order'
import { preparePayment } from '@/entities/payment'
import { ProductPaymentCard } from '@/entities/product'
import { useProfile } from '@/entities/profile'
import {
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@/features/daum-postcode'
import { requestTossPayment } from '@/features/toss-payment'
import { getErrorMessage } from '@/shared/api/client'
import { mypagePath } from '@/shared/config/routes'
import { Button, Container, Input, InlineAlert } from '@/shared/ui'

import { terms } from '../model/terms'

import * as styles from './PaymentPage.css'
import { TermsAgreement } from './TermsAgreement'

const GENERIC_PAYMENT_ERROR =
  '결제 요청 중 문제가 발생했습니다. 다시 시도해 주세요.'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

// 상품 상세의 handleCheckout이 navigate(path, { state })로 넘기는 모양 —
// 직접 /payment로 들어오면(딥링크 등) 없을 수 있어 아래 목업으로 대체한다.
type PurchaseDraft = {
  productName: string
  colorLabel: string
  optionLabel: string
  quantity: number
  unitPrice: number
}

// ponytail: 아직 주문서 API가 없어서 목업 데이터로 대체.
const fallbackDraft: PurchaseDraft = {
  productName: '아이폰 18 Pro',
  colorLabel: '실버',
  optionLabel: '512GB',
  quantity: 1,
  unitPrice: 2278100,
}

// 원래 고정 금액(278,100원)이었는데, orderAmount가 선택한 수량에 따라 달라지게
// 되면서 소액 주문에서 총액이 음수로 떨어졌다 — 금액이 아니라 비율로 할인한다.
const PREORDER_BENEFIT_RATE = 0.1

const initialForm = {
  name: '',
  phone: '',
  email: '',
  addressLabel: '',
  postcode: '',
  address: '',
  addressDetail: '',
}

type FormKey = keyof typeof initialForm

// email을 제외한 나머지가 결제를 막는 필수 입력이다(각 field() 호출의 required와 맞춘다).
const requiredFieldKeys: FormKey[] = [
  'name',
  'phone',
  'addressLabel',
  'postcode',
  'address',
  'addressDetail',
]

export function PaymentPage() {
  const location = useLocation()
  const draft = (location.state as PurchaseDraft | null) ?? fallbackDraft
  const { data: profile } = useProfile()
  const { data: savedAddress } = useDefaultAddress()
  const [edits, setEdits] = useState<Partial<typeof initialForm>>({})
  const [agreedIds, setAgreedIds] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)

  // 회원 프로필과 기본 배송지를 기본값으로 깐다 — 비로그인/미설정이면 그냥 빈 폼이다
  // (SignupPage의 프로필 프리필과 같은 패턴). 사용자가 고친 칸(edits)이 항상 우선하므로
  // 응답이 늦게 와도 입력 중인 값을 덮어쓰지 않는다.
  const prefill: Partial<typeof initialForm> = {
    name: profile?.name || savedAddress?.name || '',
    phone: profile?.phoneNumber ?? '',
    email: profile?.email ?? '',
    ...(savedAddress && {
      addressLabel: '기본 배송지',
      postcode: savedAddress.postalCode,
      address: savedAddress.line1,
      addressDetail: savedAddress.line2 ?? '',
    }),
  }
  const form = { ...initialForm, ...prefill, ...edits }

  const orderAmount = draft.unitPrice * draft.quantity
  const preorderBenefit = Math.round(orderAmount * PREORDER_BENEFIT_RATE)
  const totalAmount = orderAmount - preorderBenefit
  const orderProduct = {
    name: draft.productName,
    modelNumber: 'A3714',
    optionSummary: `${draft.colorLabel} · ${draft.optionLabel} · Apple care+`,
    quantityLabel: `${draft.quantity}개`,
    priceLabel: won(orderAmount),
  }

  const requiredAgreed = terms.every(
    (term) => !term.required || agreedIds.has(term.id),
  )
  const requiredFieldsFilled = requiredFieldKeys.every((key) =>
    form[key].trim(),
  )

  // 필수 입력은 결제를 한 번 눌러 본 뒤에만 빨갛게 표시한다 — 처음부터 빨간 화면을 보여주지 않는다.
  // 라벨 뒤 별표와 에러 문구는 Input이 required/invalid를 보고 스스로 만든다.
  const field = (key: FormKey, label: string, required?: boolean) => ({
    label,
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setEdits((prev) => ({ ...prev, [key]: event.target.value })),
    required,
    invalid: submitted && !form[key].trim(),
  })

  // 검색 없이 닫으면 onComplete가 안 불려서 폼은 그대로다. 상세 주소는 이전 주소
  // 기준 값이라 새로 찾은 주소와 안 맞을 수 있어 같이 비운다.
  const handleAddressComplete = ({
    postcode,
    address,
  }: DaumPostcodeAddress) => {
    setEdits((prev) => ({ ...prev, postcode, address, addressDetail: '' }))
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
    setSubmitted(true)
    setPaymentError(null)
    if (!requiredFieldsFilled) return

    try {
      const { orderId, amount } = await preparePayment({
        orderName: draft.productName,
        amount: totalAmount,
      })
      await requestTossPayment({
        orderId,
        amount,
        orderName: draft.productName,
        customerName: form.name,
        customerEmail: form.email || undefined,
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
              <Input {...field('name', '이름', true)} />
              <Input
                {...field('phone', "휴대폰 ('-'을 제외한 숫자만)", true)}
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

            <Input {...field('addressLabel', '배송지명', true)} />
            <div className={styles.postcodeRow}>
              <Input
                {...field('postcode', '우편 번호', true)}
                inputMode="numeric"
              />
              <Button
                className={styles.postcodeAction}
                onClick={() => setAddressSearchOpen(true)}
              >
                주소 찾기
              </Button>
            </div>
            <Input {...field('address', '기본 주소', true)} />
            <Input {...field('addressDetail', '상세 주소', true)} />
          </section>
        </div>

        <OrderSummary
          rows={[
            { label: '상품 수', value: `${draft.quantity}개` },
            { label: '주문 금액', value: won(orderAmount) },
            {
              label: '사전예약 혜택',
              value: `-${won(preorderBenefit)}`,
              highlight: true,
            },
          ]}
          totalLabel="결제 예정 금액"
          totalValue={won(totalAmount)}
          actionLabel={`${won(totalAmount)} 결제하기`}
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

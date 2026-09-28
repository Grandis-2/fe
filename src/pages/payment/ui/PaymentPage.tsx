import { useState, type ChangeEvent } from 'react'

import { ChevronDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import { OrderSummary } from '@/entities/order'
import { ProductPaymentCard } from '@/entities/product'
import { Button, Checkbox, Container, Input } from '@/shared/ui'

import * as styles from './PaymentPage.css'

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

type TermDetail = { heading: string; body: string }

type Term = {
  id: string
  label: string
  /** 체크하지 않으면 결제를 막는 항목 */
  required: boolean
  detail?: TermDetail[]
}

const terms: Term[] = [
  {
    id: 'finance',
    label: '전자금융거래 이용약관에 동의 (필수)',
    required: true,
    detail: [
      {
        heading: '전자금융거래 이용약관 (제1조 목적)',
        body: '이 약관은 회사가 제공하는 전자금융거래 서비스를 이용함에 있어 회사와 이용자 사이의 권리·의무 및 책임 사항을 정함을 목적으로 합니다.',
      },
      {
        heading: '제2조 용어의 정의',
        body: '"전자금융거래"란 회사가 전자적 장치를 통하여 서비스를 제공하고, 이용자가 회사의 종사자와 직접 대면하지 아니하고 자동화된 방식으로 이를 이용하는 거래를 말합니다.',
      },
    ],
  },
  {
    id: 'third-party',
    label: '주문 배송을 위한 개인정보 제3자 제공 동의 (필수)',
    required: true,
    detail: [
      {
        heading: '개인정보 제3자 제공 동의 (주문 및 배송 목적)',
        body: '회사는 고객님의 주문 상품 배송 및 원활한 고객 서비스를 위해 개인정보 보호법 제17조 및 제22조에 따라 아래와 같이 개인정보를 제3자에게 제공하고자 합니다.',
      },
      {
        heading: '제공하는 개인정보 항목',
        body: '수령인 성명, 수령인 연락처(휴대전화번호), 배송지 주소',
      },
      {
        heading: '제공받는 자',
        body: 'CJ대한통운, 한진택배, 우체국택배 등',
      },
      {
        heading: '제공 목적',
        body: '주문 상품의 배송 및 배송 관련 고객 응대',
      },
    ],
  },
  {
    id: 'delay',
    label:
      '예약 상품의 특성상 상품 준비 및 제작 상황에 따라 안내된 예상 배송일보다 배송이 늦어질 수 있습니다. 예상 배송일은 확정된 일정이 아니며, 배송이 지연될 수 있음을 확인하고 이에 동의합니다.',
    required: true,
  },
]

type TermsAgreementProps = {
  agreedIds: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}

// 약관보기 펼침 상태는 바깥에서 쓸 일이 없어서 여기서만 들고 있는다.
function TermsAgreement({
  agreedIds,
  onToggle,
  onToggleAll,
}: TermsAgreementProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggleDetail = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.terms}>
      <div className={styles.termsTitle}>약관 동의</div>

      <label className={styles.agreeAll}>
        <Checkbox
          className={styles.checkbox}
          checked={agreedIds.size === terms.length}
          onChange={(event) => onToggleAll(event.target.checked)}
        />
        아래 내용에 모두 동의합니다.
      </label>

      <div className={styles.termList}>
        {terms.map((term) => {
          const open = openIds.has(term.id)

          return (
            <div key={term.id}>
              <div className={styles.termRow}>
                <label className={styles.termMain}>
                  <Checkbox
                    className={styles.checkbox}
                    checked={agreedIds.has(term.id)}
                    onChange={(event) =>
                      onToggle(term.id, event.target.checked)
                    }
                  />
                  <span className={styles.termLabel}>{term.label}</span>
                </label>
                {term.detail && (
                  <button
                    type="button"
                    className={styles.detailToggle}
                    aria-expanded={open}
                    onClick={() => toggleDetail(term.id)}
                  >
                    약관보기
                    <ChevronDown
                      aria-hidden="true"
                      className={[
                        styles.detailIcon,
                        open && styles.detailIconOpen,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </button>
                )}
              </div>

              {term.detail && open && (
                <div className={styles.detailPanel}>
                  {term.detail.map((section) => (
                    <div key={section.heading} className={styles.detailGroup}>
                      <div className={styles.detailHeading}>
                        {section.heading}
                      </div>
                      <div className={styles.detailBody}>{section.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ponytail: 로그인 API가 없어서 수령인 이름만 목업 유저로 미리 채워 둔다.
const initialForm = {
  name: '기매진',
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
  const navigate = useNavigate()
  const location = useLocation()
  const draft = (location.state as PurchaseDraft | null) ?? fallbackDraft
  const [form, setForm] = useState(initialForm)
  const [agreedIds, setAgreedIds] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

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
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
    required,
    invalid: submitted && !form[key].trim(),
  })

  const toggleAgree = (id: string, checked: boolean) =>
    setAgreedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const toggleAllAgree = (checked: boolean) =>
    setAgreedIds(checked ? new Set(terms.map((term) => term.id)) : new Set())

  return (
    <Container>
      <div className={styles.title}>주문 / 결제</div>

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
                <Button size="small">주소록 보기</Button>
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
              <Button className={styles.postcodeAction}>주소 찾기</Button>
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
          onAction={() => {
            setSubmitted(true)
            if (!requiredFieldsFilled) return
            navigate('/result?status=paid')
          }}
        >
          <TermsAgreement
            agreedIds={agreedIds}
            onToggle={toggleAgree}
            onToggleAll={toggleAllAgree}
          />
        </OrderSummary>
      </div>
    </Container>
  )
}

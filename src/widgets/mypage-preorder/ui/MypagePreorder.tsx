import { useState } from 'react'

import { useNavigate } from 'react-router'

import { HistoryCard, MOCK_ORDERS } from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { PAYMENT_PATH } from '@shared/config/routes'
import { ActionButton, Button, SelectButton, Tag } from '@shared/ui'

import * as styles from './MypagePreorder.css'

type MockReservation = {
  orderDate: string
  orderNumber: string
  items: ProductPaymentCardItem[]
}

// 구매 확정을 기다리는 예약 — 주문 내역·헤더 배지와 같은 목업을 본다.
const pendingReservations = MOCK_ORDERS.filter(
  (order) => order.status === 'confirm',
)

// ponytail: 아직 사전예약 API가 없어서 목업 데이터로 대체.
const confirmedReservations: (MockReservation & {
  facts: { label: string; value: string }[]
})[] = [
  {
    orderDate: '2026.10.05',
    orderNumber: 'NV26100531',
    facts: [
      { label: '예약 순번', value: '312번째' },
      { label: '출시일', value: '10.24 (금)' },
      { label: '발송 시작', value: '10.24부터' },
    ],
    items: [
      {
        name: '맥북 프로 14',
        modelNumber: 'A3112',
        optionSummary: '스페이스 블랙 · 16GB · 512GB · M5',
        quantityLabel: '수량 1개',
        priceLabel: '2,390,000원',
      },
      {
        name: '에어팟 프로 3',
        modelNumber: 'A3184',
        optionSummary: '화이트',
        quantityLabel: '수량 1개',
        priceLabel: '369,000원',
      },
    ],
  },
]

// 예약은 끝났고 출시·발송을 기다리는 중이다.
const steps = [
  { label: '예약 완료', done: true },
  { label: '출시', done: false },
  { label: '발송', done: false },
]

const openAlerts = [
  {
    id: 1,
    title: '아이폰 18 Pro, Pro Max',
    opensAt: '10.10 (금) 오전 10:00',
    dDay: 'D-3',
  },
  {
    id: 2,
    title: '아이폰 Duo',
    opensAt: '10.21 (화) 오전 10:00',
    dDay: 'D-14',
  },
  {
    id: 3,
    title: '애플 비전 프로 2',
    opensAt: '11.04 (화) 오전 10:00',
    dDay: 'D-28',
  },
]

// D-day 태그 폭을 가장 긴 값에 맞춰 제목 줄이 세로로 가지런하다.
const alertDDays = openAlerts.map((alert) => alert.dDay)

const renderItem = (product: ProductPaymentCardItem) => (
  <ProductPaymentCard product={product} />
)

export function MypagePreorder() {
  const navigate = useNavigate()
  // ponytail: 알림 신청 API가 없어 화면 안에서만 켜고 끈다.
  const [alertOffIds, setAlertOffIds] = useState<Set<number>>(new Set())

  const toggleAlert = (id: number) =>
    setAlertOffIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>예약 내역</h1>

      {pendingReservations.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>구매 확정이 필요해요</h2>
          {pendingReservations.map((reservation) => (
            <HistoryCard
              key={reservation.orderNumber}
              status="confirm"
              preorder
              orderDate={reservation.orderDate.replaceAll('-', '.')}
              orderNumber={reservation.orderNumber}
              numberLabel="예약번호"
              purchaseDueAt={reservation.purchaseDueAt}
              items={reservation.items}
              renderItem={renderItem}
              footer={
                <div className={styles.actions}>
                  {/* ponytail: 예약 취소 API가 아직 없어 버튼만 둔다. */}
                  <Button variant="subtle" color="cancel">
                    예약 취소
                  </Button>
                  <ActionButton
                    size="md"
                    onClick={() => navigate(PAYMENT_PATH)}
                  >
                    구매 확정하기
                  </ActionButton>
                </div>
              }
            />
          ))}
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          진행 중인 예약{' '}
          <span className={styles.count}>{confirmedReservations.length}</span>
        </h2>
        {confirmedReservations.map((reservation) => (
          <HistoryCard
            key={reservation.orderNumber}
            status="preship"
            preorder
            orderDate={reservation.orderDate}
            orderNumber={reservation.orderNumber}
            numberLabel="예약번호"
            items={reservation.items}
            renderItem={renderItem}
            footer={
              <Button variant="subtle" color="cancel">
                예약 취소
              </Button>
            }
          >
            <dl className={styles.facts}>
              {reservation.facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step.label} className={styles.step}>
                  <div className={styles.bar[step.done ? 'done' : 'todo']} />
                  <span
                    className={styles.stepLabel[step.done ? 'done' : 'todo']}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </HistoryCard>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>알림 신청한 사전예약</h2>
        <ul className={styles.alerts}>
          {openAlerts.map((alert) => {
            const on = !alertOffIds.has(alert.id)
            return (
              <li key={alert.id} className={styles.alert}>
                <Tag
                  color="primary"
                  variant="subtle"
                  size="medium"
                  rounded={false}
                  widthOptions={alertDDays}
                >
                  {alert.dDay}
                </Tag>
                <div className={styles.alertTexts}>
                  <span className={styles.alertTitle}>{alert.title}</span>
                  <span className={styles.alertDate}>{alert.opensAt} 오픈</span>
                </div>
                <SelectButton
                  className={styles.alertToggle}
                  selected={on}
                  onClick={() => toggleAlert(alert.id)}
                >
                  {on ? '알림 받는 중' : '알림 받기'}
                </SelectButton>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

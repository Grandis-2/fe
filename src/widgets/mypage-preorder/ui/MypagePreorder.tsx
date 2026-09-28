import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router'

import { ProductPaymentCard } from '@/entities/product'
import { useCountdown } from '@/shared/lib/useCountdown'
import { Button } from '@/shared/ui'

import * as styles from './MypagePreorder.css'

const HOUR = 60 * 60 * 1000

// ponytail: 아직 사전예약 API가 없어서 목업 데이터로 대체. 결제 마감 시각도 응답에 없어
// 지금 기준으로 만든다. 모듈 스코프라 렌더마다 새 Date가 생기지 않는다 —
// 매번 새 Date를 넘기면 useCountdown의 타이머가 계속 새로 걸린다.
const preorderItems = [
  {
    id: '1',
    name: '아이폰 18 Pro',
    modelNumber: 'A3714',
    optionSummary: '스타라이트 · 256GB · AppleCare+ 포함',
    quantityLabel: '수량 1개',
    priceLabel: '2,278,100원',
    paymentDueAt: new Date(Date.now() + 24 * HOUR),
  },
  {
    id: '2',
    name: '아이패드 오로라',
    modelNumber: 'A2696',
    optionSummary: '스타라이트 · 128GB',
    quantityLabel: '수량 1개',
    priceLabel: '990,000원',
    paymentDueAt: new Date(Date.now() + 11 * HOUR),
  },
]

type PreorderItem = (typeof preorderItems)[number]

const pad = (value: number) => String(value).padStart(2, '0')

// 예약 건마다 마감이 달라 카운트다운도 건별로 돌아야 한다.
// 훅은 반복문 안에서 못 쓰므로 한 건을 담당하는 컴포넌트로 분리한다.
function PreorderCard({ item }: { item: PreorderItem }) {
  const navigate = useNavigate()
  const { days, hours, minutes, seconds, isOver } = useCountdown(
    item.paymentDueAt,
  )
  // 마감이 정확히 24시간이면 훅이 days=1, hours=0으로 쪼개므로 시간 단위로 합친다.
  const totalHours = days * 24 + hours

  return (
    <div className={styles.card}>
      <div
        className={[
          styles.header,
          styles.headerTone[isOver ? 'over' : 'active'],
        ].join(' ')}
      >
        <div className={styles.deadline}>
          <Clock size={16} aria-hidden="true" />
          {isOver ? (
            '결제 기한이 지났습니다.'
          ) : (
            <span>
              결제 마감까지{' '}
              <span className={styles.countdown}>
                {pad(totalHours)}시간 {minutes}분 {seconds}초
              </span>{' '}
              남았습니다.
            </span>
          )}
        </div>
        <Button
          size="small"
          className={styles.headerAction}
          disabled={isOver}
          onClick={() => navigate('/payment')}
        >
          결제하기
        </Button>
      </div>
      <ProductPaymentCard product={item} />
    </div>
  )
}

export function MypagePreorder() {
  return (
    <div className={styles.root}>
      {preorderItems.map((item) => (
        <PreorderCard key={item.id} item={item} />
      ))}
    </div>
  )
}

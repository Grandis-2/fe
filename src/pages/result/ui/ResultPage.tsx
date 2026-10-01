import { useNavigate, useSearchParams } from 'react-router'

import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@/entities/product'
import {
  mypagePath,
  RESULT_STATUSES,
  type ResultStatus,
} from '@/shared/config/routes'
import {
  Button,
  Container,
  InlineAlert,
  PlanetIcon,
  PriceText,
} from '@/shared/ui'

import { ResultHero, type ResultHeroProps } from './ResultHero'
import * as styles from './ResultPage.css'

// 예약 완료 / 결제 완료 / 결제 실패 — 배너와 본문 유무만 갈리고 뼈대를 공유해서 한 페이지로 둔다.
// 진입할 때 ?status=preorder|paid|failed로 고른다.
const isResultStatus = (value: string | null): value is ResultStatus =>
  RESULT_STATUSES.includes(value as ResultStatus)

const hero = {
  preorder: {
    tone: 'success',
    icon: 'box_planet',
    title: '예약이 완료되었습니다.',
    description: '구매 내역은 마이페이지에서 확인하실 수 있습니다.',
  },
  paid: {
    tone: 'success',
    icon: 'sparkles',
    title: '구매가 완료되었습니다.',
    description: '구매 내역은 마이페이지에서 확인하실 수 있습니다.',
  },
  failed: {
    tone: 'failure',
    icon: 'info',
    title: '구매에 실패했습니다',
    description: '결제를 다시 시도해주세요.',
  },
} satisfies Record<ResultStatus, ResultHeroProps>

// ponytail: 주문 조회 API가 아직 없어서 시안 값을 그대로 둔 목업 — 붙는 대로 교체한다.
const order = {
  orderNumber: 'NV-20260913-0742',
  payMethod: '네이버페이',
  address: '서울특별시 강남구 양재대로 145 위워크빌딩 402호',
  deliveryEta: '2026년 10월 12일부터 순차 배송',
  totalLabel: '2,000,000원',
  items: [
    {
      name: '아이폰 18 Pro',
      modelNumber: 'A3714',
      optionSummary: '실버 · 512GB · Apple care+',
      quantityLabel: '1 개',
      priceLabel: '2,000,000원',
    },
  ] satisfies ProductPaymentCardItem[],
}

export function ResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const statusParam = searchParams.get('status')
  const status: ResultStatus = isResultStatus(statusParam)
    ? statusParam
    : 'paid'
  const isPreorder = status === 'preorder'

  const goHome = () => void navigate('/')
  const goHistory = () =>
    void navigate(mypagePath(isPreorder ? 'preorder-check' : 'history'))

  const infos = [
    { label: '주문 번호', value: order.orderNumber },
    // 사전예약은 아직 결제 전이라 결제 수단이 없다.
    ...(isPreorder ? [] : [{ label: '결제 수단', value: order.payMethod }]),
    { label: '배송지', value: order.address },
    { label: '배송 예정일', value: order.deliveryEta },
  ]

  if (status === 'failed') {
    return (
      <Container>
        <div className={styles.root}>
          <ResultHero {...hero.failed} />
          <div className={styles.failure}>
            {/* ponytail: 시안의 일러스트 에셋이 아직 저장소에 없어 브랜드 아이콘으로 대신한다. */}
            <PlanetIcon size={200} className={styles.failureIllustration} />
            <div className={styles.failureMessage}>Something went wrong.</div>
            <div className={styles.actions}>
              <Button variant="subtle" icon="globe" onClick={goHome}>
                홈으로
              </Button>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className={styles.root}>
        <ResultHero {...hero[status]} />

        {isPreorder && (
          <InlineAlert status="brand" icon="alarm-clock">
            9월 20일 13시 02분 이내 미결제 시 사전예약이 자동 취소됩니다.
          </InlineAlert>
        )}

        <div className={styles.infoList}>
          {infos.map((info) => (
            <div key={info.label} className={styles.infoItem}>
              <div className={styles.infoLabel}>{info.label}</div>
              <div className={styles.infoValue}>{info.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.items}>
          {order.items.map((orderItem) => (
            <ProductPaymentCard
              key={orderItem.modelNumber}
              className={styles.item}
              product={orderItem}
            />
          ))}
        </div>

        <div className={styles.total}>
          <div className={styles.totalLabel}>총액</div>
          <div className={styles.totalValue}>
            <PriceText value={order.totalLabel} />
          </div>
        </div>

        <div className={styles.actions}>
          <Button icon="rocket" onClick={goHistory}>
            {isPreorder ? '예약 내역 보러 가기' : '구매 내역 보러 가기'}
          </Button>
          <Button variant="subtle" icon="globe" onClick={goHome}>
            홈으로
          </Button>
        </div>
      </div>
    </Container>
  )
}

import { PreorderCard, type PreorderCardData } from '@/entities/preorder'
import placeholderImage from '@/shared/assets/react.svg'
import { Container } from '@/shared/ui'

import * as styles from './PreorderPage.css'

// ponytail: 아직 사전예약 목록 API가 없어서 목업 데이터로 대체
const PREORDERS: PreorderCardData[] = [
  {
    id: '1',
    imageSrc: placeholderImage,
    imageAlt: 'Image description',
    title:
      '아이폰 18프로, 18프로맥스, 울트라 사전예약 프로모션 아이폰 18프로, 18프로맥스, 울트라 사전예약 프로모션 아이폰 18프로, 18프로맥스, 울트라 사전예약 프로모션',
    opensAt: '2026.09.01',
    closesAt: '2026.09.17',
  },
  {
    id: '2',
    imageSrc: placeholderImage,
    imageAlt: 'Image description',
    title: 'Preorder Title',
    opensAt: '2026.09.01',
    closesAt: '2026.09.17',
  },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: String(i + 3),
    imageSrc: placeholderImage,
    imageAlt: 'Image description',
    title: 'Preorder Title',
    opensAt: 'Preorder Opens At',
    closesAt: 'Preorder Closes At',
  })),
]

export function PreorderPage() {
  return (
    <Container>
      <div className={styles.title}>사전예약</div>
      <div className={styles.cardGrid}>
        {PREORDERS.map((data) => (
          <PreorderCard key={data.id} data={data} />
        ))}
      </div>
    </Container>
  )
}

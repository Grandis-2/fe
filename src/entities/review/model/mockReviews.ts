import macbook1 from '@/shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@/shared/assets/macbook_neo_sliver2.png'

import type { Review } from './review'

// ponytail: 아직 리뷰 API가 없어서 목업 후기로 대체 — API가 붙으면 entities/review/api로 교체.
// 상품 상세 구매후기 탭과 /reviews 페이지가 같이 쓴다.
export const mockReviews: Review[] = [
  {
    id: 'r1',
    rating: 5,
    reviewText: '배송도 빠르고 색상이 사진이랑 똑같아서 만족합니다.',
    productName: '아이폰 18 Pro 256GB · 미드나이트',
    maskedAuthorName: '김**',
    date: '2026.07.02',
  },
  {
    id: 'r2',
    rating: 4,
    reviewText: '화면이 정말 선명해요. 배터리도 하루는 거뜬합니다.',
    productName: '아이폰 18 Pro 512GB · 스타라이트',
    maskedAuthorName: '이**',
    date: '2026.06.28',
  },
  {
    id: 'r3',
    rating: 5,
    reviewText: '좋아요',
    productName: '아이폰 18 Pro 256GB · 코즈믹 오렌지',
    maskedAuthorName: '박**',
    date: '2026.06.21',
  },
  {
    id: 'r4',
    rating: 3,
    reviewText:
      '제품은 좋은데 생각보다 무게가 좀 있네요. 케이스까지 끼우면 손목이 조금 아파요. 그래도 카메라는 확실히 좋아졌습니다.',
    productName: '아이폰 18 Pro 256GB · 미드나이트',
    maskedAuthorName: '최**',
    date: '2026.06.15',
  },
  {
    id: 'r5',
    thumbnailSrc: macbook1,
    rating: 5,
    reviewText: '가볍고 발열이 거의 없어서 카페에서 작업하기 딱 좋아요.',
    productName: '맥북 네오 256GB · 실버',
    maskedAuthorName: '정**',
    date: '2026.06.10',
  },
  {
    id: 'r6',
    thumbnailSrc: macbook2,
    rating: 4,
    reviewText: '키보드 타건감이 좋아요. 색상도 예쁩니다.',
    productName: '맥북 네오 512GB · 블러시',
    maskedAuthorName: '강**',
    date: '2026.06.03',
  },
  {
    id: 'r7',
    rating: 5,
    reviewText: '운동할 때 심박수 측정이 정확해서 만족하고 있어요.',
    productName: '갤럭시 워치 8 · 그라파이트',
    maskedAuthorName: '윤**',
    date: '2026.05.27',
  },
  {
    id: 'r8',
    rating: 2,
    reviewText: '노이즈 캔슬링은 좋은데 귀가 좀 아파요.',
    productName: '에어팟 프로 3',
    maskedAuthorName: '한**',
    date: '2026.05.20',
  },
]

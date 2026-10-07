import { createStore } from '@shared/lib/createStore'

// 내가 쓴 리뷰 한 건. 상품 상세에 보이는 남의 후기(Review)와 달리 작성자·상품명을 따로 들고 있지
// 않는다 — 어느 주문 상품의 리뷰인지는 키(`주문번호-상품순번`)로 찾는다.
export type MyReview = {
  rating: number
  text: string
  /** YYYY.MM.DD */
  writtenAt: string
}

type MyReviewStore = {
  reviews: Record<string, MyReview>
  save: (key: string, review: Pick<MyReview, 'rating' | 'text'>) => void
  remove: (key: string) => void
}

const today = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
}

// 주문 상품 하나를 가리키는 리뷰 키.
export const myReviewKey = (orderNumber: string, itemIndex: number) =>
  `${orderNumber}-${itemIndex}`

// ponytail: 아직 리뷰 API가 없어서 메모리에만 저장한다(새로고침하면 처음 두 건으로 돌아간다).
// 키는 entities/order의 MOCK_ORDERS 배송 완료 주문을 가리킨다. API가 붙으면 entities/review/api로 교체.
export const useMyReviewStore = createStore<MyReviewStore>((set) => ({
  reviews: {
    'NV26091277-0': {
      rating: 4,
      text: '가볍고 화면이 충분히 커서 강의 필기용으로 딱이에요. 스피커 음량이 조금 아쉬워요.',
      writtenAt: '2026.09.16',
    },
    'NV26083019-0': {
      rating: 5,
      text: '화면이 정말 밝고 선명해요. 배송도 예정일보다 하루 빨리 받았어요. 펜슬 반응 속도도 만족스러워요.',
      writtenAt: '2026.09.03',
    },
  },
  // 고쳐 써도 처음 쓴 날짜는 그대로 둔다.
  save: (key, review) =>
    set((state) => ({
      reviews: {
        ...state.reviews,
        [key]: {
          ...review,
          writtenAt: state.reviews[key]?.writtenAt ?? today(),
        },
      },
    })),
  remove: (key) =>
    set((state) => {
      const { [key]: _removed, ...rest } = state.reviews
      return { reviews: rest }
    }),
}))

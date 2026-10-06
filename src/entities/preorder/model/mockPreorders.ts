import type { Preorder, PreorderModel } from './preorder'

// ponytail: 아직 사전예약 API가 없어 목록·상세가 이 목업을 같이 쓴다 — API가 생기면 조회 훅으로 교체.
// 이미지는 public에 있는 것을 돌려 쓰고, 모델의 상품 상세는 목업이 있는 맥북 네오(MB-NEO)로 보낸다.
const IMAGES = [
  '/images/banner1.png',
  '/images/banner2.png',
  '/images/banner3.png',
  '/images/macbook_neo_indigo1.png',
]

const monthDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number)
  return `${month}월 ${day}일`
}

const model = (id: string, name: string, price: number): PreorderModel => ({
  id,
  name,
  price,
  productId: 'MB-NEO',
})

type Row = [
  id: string,
  title: string,
  benefit: string,
  dates: [
    opensAt: string,
    closesAt: string,
    paymentEndsAt: string,
    releaseAt: string,
  ],
  models: PreorderModel[],
]

const ROWS: Row[] = [
  [
    'ip18p',
    '아이폰 18 Pro · Pro Max',
    '사전예약 시 맥세이프 케이스 증정',
    ['2026-09-26', '2026-10-10', '2026-10-14', '2026-10-17'],
    [
      model('ip18p', '아이폰 18 Pro', 2278100),
      model('ip18pm', '아이폰 18 Pro Max', 2590000),
    ],
  ],
  [
    'fold8',
    '갤럭시 Z 폴드8',
    '저장용량 무료 업그레이드',
    ['2026-09-29', '2026-10-12', '2026-10-16', '2026-10-20'],
    [model('fold8', '갤럭시 Z 폴드8', 2398000)],
  ],
  [
    'watch',
    '갤럭시 워치',
    '스트랩 1종 추가 증정',
    ['2026-10-01', '2026-10-15', '2026-10-19', '2026-10-22'],
    [
      model('watch40', '갤럭시 워치 40mm', 399000),
      model('watch44', '갤럭시 워치 44mm', 429000),
    ],
  ],
  [
    'mbneo',
    '맥북 네오',
    '카드 결제 시 10만 원 할인',
    ['2026-10-02', '2026-10-20', '2026-10-24', '2026-10-28'],
    [model('mbneo', '맥북 네오', 1690000)],
  ],
  [
    'ipduo',
    '아이폰 Duo',
    '알림 신청자 대상 쿠폰 지급',
    ['2026-10-20', '2026-11-02', '2026-11-06', '2026-11-09'],
    [
      model('ipduo', '아이폰 Duo', 1890000),
      model('ipduop', '아이폰 Duo Plus', 2090000),
    ],
  ],
  [
    's26u',
    '갤럭시 S26 울트라',
    '버즈4 프로 50% 할인 구매',
    ['2026-11-03', '2026-11-16', '2026-11-20', '2026-11-24'],
    [model('s26u', '갤럭시 S26 울트라', 1798000)],
  ],
  [
    'ipdpro',
    '아이패드 프로',
    '펜슬 프로 할인 구매',
    ['2026-11-10', '2026-11-23', '2026-11-27', '2026-12-01'],
    [
      model('ipdpro11', '아이패드 프로 11', 1299000),
      model('ipdpro13', '아이패드 프로 13', 1699000),
    ],
  ],
  [
    'ap3',
    '에어팟 프로 3',
    '각인 서비스 무료',
    ['2026-09-01', '2026-09-14', '2026-09-17', '2026-09-19'],
    [
      model('ap3', '에어팟 프로 3', 369000),
      model('ap3usb', '에어팟 프로 3 (USB-C 케이스)', 389000),
    ],
  ],
  [
    'bz4p',
    '갤럭시 버즈4 프로',
    '무선 충전 패드 증정',
    ['2026-08-18', '2026-08-31', '2026-09-03', '2026-09-05'],
    [model('bz4p', '갤럭시 버즈4 프로', 299000)],
  ],
  [
    'aws11',
    '애플워치 시리즈 11',
    '밴드 1종 추가 증정',
    ['2026-09-01', '2026-09-14', '2026-09-17', '2026-09-19'],
    [model('aws11', '애플워치 시리즈 11', 599000)],
  ],
]

export const MOCK_PREORDERS: Preorder[] = ROWS.map(
  (
    [id, title, benefit, [opensAt, closesAt, paymentEndsAt, releaseAt], models],
    index,
  ) => ({
    id,
    imageSrc: IMAGES[index % IMAGES.length],
    title,
    benefit,
    opensAt,
    openTime: '10:00',
    closesAt,
    paymentEndsAt,
    releaseAt,
    benefits: [
      { title: benefit, description: '사전예약 고객 전원에게 드려요.' },
      {
        title: '제휴 카드 최대 10만 원 할인',
        description: '제휴 카드로 일시불 또는 할부 결제 시 적용돼요.',
      },
      {
        title: '출시일 당일 배송',
        description: `${monthDay(releaseAt)} 오전 도착 보장 (서울·수도권)`,
      },
    ],
    // 모델 사진이 따로 없어 프로모션 사진을 같이 쓴다.
    models: models.map((item) => ({
      ...item,
      imageSrc: IMAGES[index % IMAGES.length],
    })),
  }),
)

export const findMockPreorder = (id: string | undefined) =>
  MOCK_PREORDERS.find((preorder) => preorder.id === id)

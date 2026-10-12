import type { Draw, DrawEntry, ShipTo } from '../../types'

// 럭키 드로우 목업의 메모리 DB. 회차의 시작·마감은 지금 기준 상대 시각이라 불러올 때마다 단계가 맞게 나온다
// (phase는 핸들러가 응답할 때 시각으로 계산한다) — 그래서 회차는 저장하지 않는다. 응모·결제창은 토스 결제창을
// 다녀와도 남도록 localStorage에 싣는다(saveDrawDb). 모양이 바뀌면 DB_KEY의 버전을 올려 예전 기록을 버린다.
// 로그인한 사람은 모두 같은 "나"다.

export type DrawRecord = Omit<Draw, 'phase'>

export type DrawEntryRecord = Omit<DrawEntry, 'draw'>

export type DrawAttemptRecord = {
  drawId: string
  amount: number
  openedAt: number
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

// 회차 id는 서버처럼 소문자 UUID 모양이다.
export const drawUuid = (n: number) =>
  `6${String(n).padStart(7, '0')}-0000-4000-8000-000000000000`

type Seed = {
  title: string
  gift: string
  option: string
  image: string
  fee: number
  winners: number
  opensInMs: number
  closesInMs: number
}

// 응모 중 4개, 오픈 예정 3개, 마감 3개(당첨·낙첨·결제 안 함 확인용).
const SEEDS: Seed[] = [
  {
    title: '아이폰 18 Pro Max 1TB 한정판',
    gift: '아이폰 18 Pro Max 1TB 한정판',
    option: '코스믹 오렌지',
    image: '/images/banner1.png',
    fee: 100,
    winners: 300,
    opensInMs: -2 * DAY,
    closesInMs: 3 * DAY,
  },
  {
    title: '갤럭시 Z 폴드8 크래프티드 블랙',
    gift: '갤럭시 Z 폴드8',
    option: '크래프티드 블랙',
    image: '/images/banner2.png',
    fee: 100,
    winners: 200,
    opensInMs: -1 * DAY,
    closesInMs: 4 * DAY,
  },
  {
    title: '갤럭시 워치 클래식 티타늄',
    gift: '갤럭시 워치 클래식',
    option: '티타늄 실버',
    image: '/images/banner3.png',
    fee: 100,
    winners: 500,
    opensInMs: -12 * HOUR,
    closesInMs: 6 * DAY,
  },
  {
    title: '매직 키보드 블랙 에디션',
    gift: '매직 키보드',
    option: '블랙',
    image: '/images/macbook_neo_indigo1.png',
    fee: 100,
    winners: 1000,
    opensInMs: -3 * DAY,
    closesInMs: 20 * HOUR,
  },
  {
    title: '맥북 프로 16 스페이스 블랙',
    gift: '맥북 프로 16',
    option: '스페이스 블랙',
    image: '/images/macbook_neo_sliver1.png',
    fee: 1000,
    winners: 100,
    opensInMs: 8 * DAY,
    closesInMs: 12 * DAY,
  },
  {
    title: '에어팟 맥스 2 리미티드',
    gift: '에어팟 맥스 2',
    option: '리미티드',
    image: '/images/macbook_neo_blush1.png',
    fee: 1000,
    winners: 300,
    opensInMs: 15 * DAY,
    closesInMs: 19 * DAY,
  },
  {
    title: '갤럭시 링 2 골드',
    gift: '갤럭시 링 2',
    option: '골드',
    image: '/images/macbook_neo_citrus1.png',
    fee: 1000,
    winners: 400,
    opensInMs: 22 * DAY,
    closesInMs: 26 * DAY,
  },
  {
    title: '비전 프로 2',
    gift: '비전 프로 2',
    option: '256GB',
    image: '/images/macbook_neo_indigo2.png',
    fee: 100,
    winners: 50,
    opensInMs: -12 * DAY,
    closesInMs: -9 * DAY,
  },
  {
    title: '갤럭시 S26 울트라 아티스트 에디션',
    gift: '갤럭시 S26 울트라',
    option: '512GB',
    image: '/images/macbook_neo_blush2.png',
    fee: 100,
    winners: 100,
    opensInMs: -22 * DAY,
    closesInMs: -19 * DAY,
  },
  {
    title: '에어팟 프로 3 리미티드',
    gift: '에어팟 프로 3',
    option: '화이트',
    image: '/images/macbook_neo_citrus2.png',
    fee: 100,
    winners: 300,
    opensInMs: -50 * DAY,
    closesInMs: -45 * DAY,
  },
]

// 목록은 최신순이라 마지막 회차가 맨 위다 — 만든 때를 시작 시각 3일 전으로 둔다.
const seedDraws: DrawRecord[] = SEEDS.map((seed, i) => ({
  drawId: drawUuid(i + 1),
  title: seed.title,
  gift: {
    productId: `2${String(i + 1).padStart(7, '0')}-0000-4000-8000-000000000000`,
    variantId: `3${String(i + 1).padStart(7, '0')}-0000-4000-8000-000000000000`,
    productTitle: seed.gift,
    optionTitle: seed.option,
    imageUrl: seed.image,
  },
  entryFee: seed.fee,
  winnerCount: seed.winners,
  opensAt: iso(seed.opensInMs),
  closesAt: iso(seed.closesInMs),
  createdAt: iso(seed.opensInMs - 3 * DAY),
}))

const seedShipTo: ShipTo = {
  name: '홍길동',
  phone: '01012345678',
  postalCode: '06234',
  line1: '서울특별시 강남구 테헤란로 123',
  line2: null,
}

// 응모 중 하나는 결과 발표 전(PAID), 마감 둘은 당첨·낙첨.
const SEED_ENTRIES: {
  drawIndex: number
  result: DrawEntryRecord['result']
  agoMs: number
}[] = [
  { drawIndex: 0, result: null, agoMs: 1 * DAY },
  { drawIndex: 7, result: 'WON', agoMs: 11 * DAY },
  { drawIndex: 8, result: 'LOST', agoMs: 21 * DAY },
]

const seedEntries: DrawEntryRecord[] = SEED_ENTRIES.map(
  ({ drawIndex, result, agoMs }, i) => ({
    entryId: `e${String(i + 1).padStart(7, '0')}-0000-4000-8000-000000000000`,
    drawId: seedDraws[drawIndex].drawId,
    status: 'PAID',
    result,
    shipTo: seedShipTo,
    createdAt: iso(-agoMs),
  }),
)

type DrawDb = {
  entries: DrawEntryRecord[]
  attempts: [string, DrawAttemptRecord][]
}

const DB_KEY = 'nova-draw-mock-db-v1'

function loadDrawDb(): DrawDb | null {
  try {
    const raw = localStorage.getItem(DB_KEY)
    return raw ? (JSON.parse(raw) as DrawDb) : null
  } catch {
    return null
  }
}

const saved = loadDrawDb()

export const draws: DrawRecord[] = seedDraws
export const drawEntries: DrawEntryRecord[] = saved?.entries ?? seedEntries
export const drawAttempts = new Map<string, DrawAttemptRecord>(
  saved?.attempts ?? [],
)

// 응모·결제창을 바꾼 핸들러가 부른다.
export function saveDrawDb() {
  try {
    localStorage.setItem(
      DB_KEY,
      JSON.stringify({
        entries: drawEntries,
        attempts: [...drawAttempts],
      }),
    )
  } catch {
    // 저장 공간이 막혀 있으면 메모리로만 동작한다.
  }
}

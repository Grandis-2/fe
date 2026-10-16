import type { Product, ShipmentBatch } from '@entities/product'

// 서버는 대소문자·공백만 다른 이름을 같은 값으로 본다. 관리자 미리보기는 저장 전 사진을
// 색상 이름 그대로 묶어 넘기므로, 정규화값과 이 규칙으로 맞춘다.
const comparable = (value: string) => value.replace(/\s+/g, '').toLowerCase()

// 고른 색상의 사진 묶음 — 색상 묶음이 없으면 기본 묶음(''), 그것도 없으면 첫 묶음.
export function galleryImages(
  product: Pick<Product, 'images'>,
  colorValue: string | undefined,
) {
  const { gallery } = product.images
  const bundle =
    gallery.find(
      ({ bundleKey }) =>
        colorValue !== undefined &&
        comparable(bundleKey) === comparable(colorValue),
    ) ??
    gallery.find(({ bundleKey }) => bundleKey === '') ??
    gallery[0]
  return [...(bundle?.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ url }) => url)
}

/**
 * 상품 상세 아래 영역들. 관리자가 영역 이름(구매 혜택·모델 정보·유의 사항)으로 사진을 올리고
 * 서버가 그 이름을 bundleKey로 돌려준다 — 관리자 폼의 DETAIL_SECTIONS와 같은 이름이어야 한다.
 */
export const DETAIL_SECTIONS = ['구매 혜택', '모델 정보', '유의 사항'] as const
export type DetailSection = (typeof DETAIL_SECTIONS)[number]

// 영역 하나의 사진을 순서대로. 없으면 빈 배열.
export function detailImages(
  product: Pick<Product, 'images'>,
  section: DetailSection,
) {
  const bundle = product.images.detail.find(
    ({ bundleKey }) => comparable(bundleKey) === comparable(section),
  )
  return [...(bundle?.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ url }) => url)
}

// 구매자는 자기 순번(몇 번째 차수인지)을 접수 전엔 모르므로, 차수별 안내 대신 가장 빠른 출고 시작일만 보여 준다.
export function shipmentStartLabel(batches: ShipmentBatch[] | undefined) {
  const first = batches
    ?.map(({ estimatedShipStart }) => estimatedShipStart)
    .sort()[0]
  if (!first) return undefined
  // 'YYYY-MM-DD'를 Date로 바꾸면 시간대에 따라 하루가 밀릴 수 있어 글자로 자른다.
  const [, month, day] = first.split('-').map(Number)
  return `${month}월 ${day}일 출고시작`
}

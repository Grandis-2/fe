import type {
  ProductDetailView,
  ProductImageAddRequest,
  ProductImageBundle,
  RegistrationImages,
} from '@shared/api/types'
import type { UploadedImage } from '@shared/ui'

import {
  COLOR_GROUP_CODE,
  comparableValue,
  DETAIL_SECTIONS,
  type AdminProductDetailModel,
  type DetailImageField,
} from './types'

import type { AdminProductFormValue } from './form'
import type { FormIssue } from './validation'

/* ------------------------------------------------------------------ *
 * 업로드 규칙 — 서버가 400을 줄 파일은 발급 전에 막는다
 * ------------------------------------------------------------------ */

export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** 파일 선택 창에서 고를 수 있는 형식 — 위와 같게 둔다 */
export const PRODUCT_IMAGE_ACCEPT = PRODUCT_IMAGE_TYPES.join(',')
const MAX_BYTES = 10 * 1024 * 1024
/** 갤러리는 묶음(색상)마다 5장까지 받는다 — 서버 상한(10장)보다 좁게 둔다 */
export const GALLERY_MAX = 5
/** 상세 이미지(구매 혜택·모델 정보·유의 사항)는 묶음마다 3장까지다 */
export const DETAIL_IMAGE_MAX = 3

/** 올릴 수 없는 파일이면 그 이유. 올릴 수 있으면 null */
export function productImageFileProblem(file: File): string | null {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return 'JPG, PNG, WEBP만 올릴 수 있습니다.'
  }
  if (file.size < 1 || file.size > MAX_BYTES) {
    return '10MB 이하의 사진만 올릴 수 있습니다.'
  }
  return null
}

/* ------------------------------------------------------------------ *
 * 폼 안의 사진 모음
 * ------------------------------------------------------------------ */

const DETAIL_FIELDS = Object.keys(DETAIL_SECTIONS) as DetailImageField[]

/** '색상 없음'이면 색상 축이 없어서 갤러리는 색상 없는 묶음 하나다 */
const hasNoColor = (value: Pick<AdminProductFormValue, 'colors'>) =>
  value.colors.some((color) => color.noColor)

/** 보낼 사진만 — '색상 없음'을 끄면 그 묶음은 화면에서 사라지고 보내지도 않는다 */
const sentImages = (value: AdminProductFormValue) => [
  ...(hasNoColor(value)
    ? value.noColorImages
    : value.colors.flatMap((color) => color.images)),
  ...DETAIL_FIELDS.flatMap((field) => value[field]),
]

/** 다 올라간 사진만 — 올리는 중이거나 실패한 칸은 서버에 보낼 주소가 없다 */
const uploaded = (images: UploadedImage[]) =>
  images.filter((image) => !image.status)

/**
 * 아직 다 올라가지 않은 사진이 있으면 보내지 않는다. 그대로 보내면 그 사진은 미리보기
 * 주소(blob:)뿐이라 빠진 채로 저장된다 — 관리자는 넣었다고 생각한다.
 */
export function imageUploadIssues(value: AdminProductFormValue): FormIssue[] {
  const images = sentImages(value)
  if (images.some((image) => image.status === 'uploading')) {
    return [
      {
        field: 'images',
        message: '사진을 올리는 중입니다. 다 올라간 뒤에 다시 눌러 주세요.',
      },
    ]
  }
  if (images.some((image) => image.status === 'error')) {
    return [
      {
        field: 'images',
        message: '올리지 못한 사진이 있습니다. 다시 시도하거나 지워 주세요.',
      },
    ]
  }
  return []
}

/* ------------------------------------------------------------------ *
 * 등록 — 한 번에 보낸다
 * ------------------------------------------------------------------ */

/**
 * 등록 본문의 images. 갤러리는 색상 축이 있으면 색상별 묶음만, 없으면 색상 없는 묶음
 * 하나만 받는다. 빈 묶음은 보내지 않는다(서버가 1장 이상을 요구한다). 대표 사진은
 * 지정하지 않는다 — 서버가 첫 장을 대표로 둔다.
 */
export function toRegistrationImages(
  value: AdminProductFormValue,
): RegistrationImages | undefined {
  const toItems = (images: UploadedImage[]) =>
    uploaded(images).map((image) => ({ url: image.url }))

  const gallery = hasNoColor(value)
    ? [{ items: toItems(value.noColorImages) }]
    : value.colors
        .filter((color) => color.name.trim() !== '')
        .map((color) => ({
          // 색상 축에 보낸 값과 같은 글자여야 한다(registration.ts가 trim해서 보낸다).
          color: color.name.trim(),
          items: toItems(color.images),
        }))
  const detail = DETAIL_FIELDS.map((field) => ({
    section: DETAIL_SECTIONS[field],
    items: toItems(value[field]),
  }))

  const images = {
    gallery: gallery.filter((bundle) => bundle.items.length > 0),
    detail: detail.filter((bundle) => bundle.items.length > 0),
  }
  if (images.gallery.length === 0 && images.detail.length === 0) {
    return undefined
  }
  return images
}

/**
 * 미리보기에 그릴 사진 — 폼에 지금 있는 사진을 상세 응답의 images 모양으로 바꾼다. 저장 전이어도,
 * 아직 올라가는 중이어도 화면용 주소(previewUrl)로 보인다. 올리지 못한 사진만 뺀다.
 * 갤러리 묶음 키는 색상 이름이다 — 화면이 색상의 정규화값과 공백·대소문자를 무시하고 맞춘다.
 */
export function toPreviewImages(
  value: AdminProductFormValue,
): ProductDetailView['images'] {
  const toBundle = (bundleKey: string, images: UploadedImage[]) => ({
    bundleKey,
    items: images
      .filter((image) => image.status !== 'error')
      .map((image, position) => ({
        url: image.previewUrl ?? image.url,
        position,
        primary: position === 0,
      })),
  })
  const gallery = hasNoColor(value)
    ? [toBundle('', value.noColorImages)]
    : value.colors.map((color) => toBundle(color.name.trim(), color.images))
  return {
    gallery: gallery.filter((bundle) => bundle.items.length > 0),
    detail: DETAIL_FIELDS.map((field) =>
      toBundle(DETAIL_SECTIONS[field], value[field]),
    ).filter((bundle) => bundle.items.length > 0),
  }
}

/* ------------------------------------------------------------------ *
 * 수정 — 등록 뒤에는 한 장씩 넣고 뺀다
 * ------------------------------------------------------------------ */

export type ImagesPlan = {
  /** 뺄 사진 주소 */
  removes: string[]
  adds: ProductImageAddRequest[]
}

const urlsOf = (bundle: ProductImageBundle | undefined) =>
  (bundle?.items ?? []).map((item) => item.url)

/**
 * 폼과 서버 상세의 사진을 묶음마다 비교해 뺄 것·넣을 것을 만든다. 사진은 주소로
 * 구분한다(서버 규칙). 순서 바꾸기는 다루지 않는다 — 폼에 순서를 바꾸는 UI가 없다.
 *
 * 새로 더한 색상은 서버에 묶음이 없다 — 넣기만 생긴다. 옵션 섹션이 먼저 색상 값을
 * 만들어 둬야 해서, 저장은 옵션 뒤에 이걸 보낸다(useSaveAdminProductEdits).
 */
export function planImages(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
): ImagesPlan {
  const plan: ImagesPlan = { removes: [], adds: [] }
  const compare = (
    desired: UploadedImage[],
    current: string[],
    kind: ProductImageAddRequest['kind'],
    bundle: string | undefined,
  ) => {
    const want = uploaded(desired).map((image) => image.url)
    plan.removes.push(...current.filter((url) => !want.includes(url)))
    plan.adds.push(
      ...want
        .filter((url) => !current.includes(url))
        .map((url) => ({ kind, url, ...(bundle && { bundle }) })),
    )
  }

  const colorAxis = server.optionAxes.find(
    (axis) => axis.key === COLOR_GROUP_CODE,
  )
  if (hasNoColor(value)) {
    compare(
      value.noColorImages,
      urlsOf(server.images.gallery.find((bundle) => bundle.bundleKey === '')),
      'GALLERY',
      undefined,
    )
  } else {
    for (const color of value.colors) {
      const name = color.name.trim()
      if (!name) continue
      // 갤러리는 색상 정규화값으로 묶여 온다. 이번에 더한 색상은 서버에 아직 없다.
      const existing = colorAxis?.values.find(
        (axisValue) => axisValue.valueId === color.id,
      )
      const current = existing
        ? urlsOf(
            server.images.gallery.find(
              (bundle) => bundle.bundleKey === existing.normalizedValue,
            ),
          )
        : []
      compare(color.images, current, 'GALLERY', name)
    }
  }

  for (const field of DETAIL_FIELDS) {
    const section = DETAIL_SECTIONS[field]
    // 서버는 대소문자·공백만 다른 영역 이름을 같은 영역으로 본다.
    const current = urlsOf(
      server.images.detail.find(
        (bundle) =>
          comparableValue(bundle.bundleKey) === comparableValue(section),
      ),
    )
    compare(value[field], current, 'DETAIL', section)
  }
  return plan
}

export const hasImageChanges = (plan: ImagesPlan) =>
  plan.removes.length > 0 || plan.adds.length > 0

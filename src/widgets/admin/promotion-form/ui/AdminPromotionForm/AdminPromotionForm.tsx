import { useState, type FormEvent, type ReactNode } from 'react'

import {
  createEmptyPromotionFormValue,
  formatMonthDay,
  PROMOTION_DETAIL_IMAGES_MAX,
  PROMOTION_NAME_MAX,
  promotionFormProblem,
  uploadPromotionImage,
  type AdminPromotionFormValue,
  type PromotionLinkableProduct,
} from '@entities/admin-promotion'
import { parseDateOnly } from '@shared/lib/parseDateOnly'
import { useNow } from '@shared/lib/useNow'
import {
  Button,
  DateRangeField,
  FieldError,
  ImageUploader,
  Input,
} from '@shared/ui'

import { PromotionProductLinker } from '../PromotionProductLinker'
import { PromotionThumbnailField } from '../PromotionThumbnailField'

import * as styles from './AdminPromotionForm.css'

export type AdminPromotionFormMode = 'create' | 'edit'

export type AdminPromotionFormProps = {
  mode: AdminPromotionFormMode
  products: PromotionLinkableProduct[]
  /** 연결할 상품을 받는 중 */
  productsLoading?: boolean
  /** 수정 화면의 저장된 값 — 이것과 달라진 곳을 표시하고 되돌린다 */
  defaultValue?: AdminPromotionFormValue
  /** 저장 중 — 제출을 막는다(연타하면 같은 프로모션이 여러 개 생긴다) */
  submitting?: boolean
  onSubmit: (value: AdminPromotionFormValue) => void
  /** 등록 화면의 '취소' */
  onCancel: () => void
  /** '새 상품 등록' — 상품 등록 화면으로 보낸다 */
  onAddProduct: () => void
}

type SectionKey = 'basic' | 'images' | 'products'

const sections: { key: SectionKey; title: string }[] = [
  { key: 'basic', title: '기본 정보' },
  { key: 'images', title: '이미지' },
  { key: 'products', title: '연결 상품' },
]

const sectionId = (key: SectionKey) => `promotion-${key}`

const imageUrls = (value: AdminPromotionFormValue) =>
  [value.thumbnail?.url, ...value.detailImages.map((image) => image.url)].join(
    '\n',
  )

/** 저장된 값과 비교해 바뀐 섹션과 저장 줄에 보일 요약을 만든다 */
function diff(saved: AdminPromotionFormValue, value: AdminPromotionFormValue) {
  const notes: string[] = []
  if (saved.name !== value.name) notes.push('사전예약명')
  if (saved.startDate !== value.startDate)
    notes.push(
      `노출 시작 ${formatMonthDay(saved.startDate)} → ${formatMonthDay(value.startDate)}`,
    )
  if (saved.endDate !== value.endDate)
    notes.push(
      `노출 끝 ${formatMonthDay(saved.endDate)} → ${formatMonthDay(value.endDate)}`,
    )
  const images = imageUrls(saved) !== imageUrls(value)
  if (images) notes.push('이미지')
  const added = value.linkedProductIds.filter(
    (id) => !saved.linkedProductIds.includes(id),
  ).length
  const removed = saved.linkedProductIds.filter(
    (id) => !value.linkedProductIds.includes(id),
  ).length
  const products =
    saved.linkedProductIds.join() !== value.linkedProductIds.join()
  if (added || removed)
    notes.push(
      `연결 상품 ${[added && `+${added}`, removed && `−${removed}`].filter(Boolean).join(' ')}`,
    )
  else if (products) notes.push('연결 상품 순서')

  const changed: Record<SectionKey, boolean> = {
    basic:
      saved.name !== value.name ||
      saved.startDate !== value.startDate ||
      saved.endDate !== value.endDate,
    images,
    products,
  }
  return { changed, notes }
}

const DAY = 86_400_000

/** 노출이 끝난 뒤에 오픈하는 연결 상품 — 고객이 이 페이지에서 오픈을 맞지 못한다 */
const opensAfterEnd = (
  value: AdminPromotionFormValue,
  products: PromotionLinkableProduct[],
) => {
  const end = parseDateOnly(value.endDate)
  if (!end) return undefined
  // 끝 날도 보이므로 그 다음 날 자정부터가 '끝난 뒤'다.
  const hidden = end.getTime() + DAY
  return products.find(
    (product) =>
      value.linkedProductIds.includes(product.productId) &&
      product.saleMode === 'PREORDER' &&
      product.opensAt &&
      new Date(product.opensAt).getTime() >= hidden,
  )
}

function Section({
  sectionKey,
  title,
  changed,
  description,
  children,
}: {
  sectionKey: SectionKey
  title: string
  changed: boolean
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      id={sectionId(sectionKey)}
      className={styles.section}
      aria-labelledby={`${sectionId(sectionKey)}-title`}
    >
      <h2 id={`${sectionId(sectionKey)}-title`} className={styles.sectionTitle}>
        {title}
        {changed && <span className={styles.changed}>바뀜</span>}
      </h2>
      {description && <div className={styles.description}>{description}</div>}
      {children}
    </section>
  )
}

/**
 * 사전예약 등록·수정 폼. 위에서 섹션 목차로 건너뛰고, 수정이면 저장된 값과 달라진 섹션에
 * '바뀜'을 붙이고 아래 고정 줄에 바뀐 내용을 요약한다.
 */
export function AdminPromotionForm({
  mode,
  products,
  productsLoading = false,
  defaultValue,
  submitting = false,
  onSubmit,
  onCancel,
  onAddProduct,
}: AdminPromotionFormProps) {
  const [value, setValue] = useState(
    defaultValue ?? createEmptyPromotionFormValue(),
  )
  const [problem, setProblem] = useState<string | null>(null)
  // 연결 상품의 오픈 전·후는 분 단위면 충분하다.
  const now = useNow(60_000).getTime()

  const patch = (partial: Partial<AdminPromotionFormValue>) => {
    setValue((prev) => ({ ...prev, ...partial }))
    // 고치기 시작하면 지난 제출의 문구는 맞지 않을 수 있다.
    setProblem(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const found = promotionFormProblem(value)
    setProblem(found)
    if (!found) onSubmit(value)
  }

  const editing = mode === 'edit' && defaultValue !== undefined
  const { changed, notes } = editing
    ? diff(defaultValue, value)
    : {
        changed: { basic: false, images: false, products: false },
        notes: [],
      }
  const lateOpen = opensAfterEnd(value, products)

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <nav className={styles.toc} aria-label="섹션">
        {sections.map(({ key, title }) => (
          <a key={key} className={styles.tocLink} href={`#${sectionId(key)}`}>
            {title}
            {changed[key] && (
              <span className={styles.tocDot} aria-label="바뀜" />
            )}
          </a>
        ))}
      </nav>

      <Section sectionKey="basic" title="기본 정보" changed={changed.basic}>
        <div className={styles.field}>
          <Input
            label="사전예약명"
            required
            maxLength={PROMOTION_NAME_MAX}
            value={value.name}
            onChange={(event) => patch({ name: event.target.value })}
          />
          <span className={styles.counter}>
            {value.name.length} / {PROMOTION_NAME_MAX}
          </span>
        </div>
        <DateRangeField
          value={{ start: value.startDate, end: value.endDate }}
          onChange={(range) =>
            patch({ startDate: range.start, endDate: range.end })
          }
        />
        <span className={styles.hint}>
          고객에게 이 페이지가 보이는 기간이에요(끝 날 포함). 기간 밖에는 고객
          링크가 열리지 않아요. 접수 오픈·마감은 연결한 상품마다 따로 정해요.
        </span>
        {lateOpen && (
          <span className={styles.warn}>
            &quot;{lateOpen.name}&quot;는 노출이 끝난 뒤(
            {formatMonthDay(lateOpen.opensAt ?? '')})에 오픈해요 — 고객이 이
            페이지에서 오픈을 맞지 못해요.
          </span>
        )}
      </Section>

      <Section
        sectionKey="images"
        title="이미지"
        changed={changed.images}
        description="썸네일은 사전예약 목록에, 상세 이미지는 페이지에 위에서부터 이어 붙어요. 끌거나 ←/→로 순서를 바꿔요."
      >
        <PromotionThumbnailField
          upload={uploadPromotionImage}
          value={value.thumbnail}
          onChange={(thumbnail) => patch({ thumbnail })}
        />
        <div className={styles.tileFrame}>
          <ImageUploader
            label="상세 이미지"
            ratio="portrait"
            max={PROMOTION_DETAIL_IMAGES_MAX}
            accept="image/jpeg,image/png"
            upload={uploadPromotionImage}
            value={value.detailImages}
            onChange={(detailImages) => patch({ detailImages })}
          />
        </div>
        <span className={styles.hint}>
          JPG·PNG · 한 장 10MB, 가로·세로 8,000px 이하 · 올린 이미지는 저장해야
          남아요
        </span>
      </Section>

      <Section
        sectionKey="products"
        title="연결 상품"
        changed={changed.products}
        description="고객 페이지에 이 순서대로 보여요. 마감 일정은 상품에서 확인해요."
      >
        <PromotionProductLinker
          products={products}
          loading={productsLoading}
          value={value.linkedProductIds}
          saved={defaultValue?.linkedProductIds}
          onChange={(linkedProductIds) => patch({ linkedProductIds })}
          onAddProduct={onAddProduct}
          now={now}
        />
      </Section>

      <div className={styles.saveBar} role="region" aria-label="저장">
        {editing && (
          <span className={styles.saveSummary}>
            {notes.length === 0 ? (
              '바뀐 곳 없음'
            ) : (
              <>
                바뀐 곳{' '}
                <b className={styles.saveCount}>
                  {Object.values(changed).filter(Boolean).length}곳
                </b>{' '}
                · {notes.join(' · ')}
              </>
            )}
          </span>
        )}
        <span className={styles.saveActions}>
          <FieldError message={problem ?? undefined} />
          {editing ? (
            <Button
              variant="outline"
              color="cancel"
              disabled={notes.length === 0 || submitting}
              onClick={() => {
                setValue(defaultValue)
                setProblem(null)
              }}
            >
              되돌리기
            </Button>
          ) : (
            <Button variant="outline" color="cancel" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting || (editing && notes.length === 0)}
          >
            {editing ? '저장' : '등록하기'}
          </Button>
        </span>
      </div>
    </form>
  )
}

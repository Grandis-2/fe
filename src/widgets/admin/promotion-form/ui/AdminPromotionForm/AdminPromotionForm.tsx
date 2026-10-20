import { useState, type FormEvent } from 'react'

import {
  createEmptyPromotionFormValue,
  promotionFormProblem,
  uploadPromotionImage,
  type AdminPromotionFormValue,
  type PromotionLinkableProduct,
} from '@entities/admin-promotion'
import {
  Button,
  DateRangeField,
  FieldError,
  FormSection,
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
  defaultValue?: AdminPromotionFormValue
  /** 저장 중 — 제출을 막는다(연타하면 같은 프로모션이 여러 개 생긴다) */
  submitting?: boolean
  onSubmit: (value: AdminPromotionFormValue) => void
  onCancel: () => void
  /** '추가 상품 등록하기' — 상품 등록 화면으로 보낸다 */
  onAddProduct: () => void
}

// 라벨을 페이지가 넘기면 화면마다 문구가 어긋나기 쉬워 여기 한 곳에 둔다.
const submitLabel: Record<AdminPromotionFormMode, string> = {
  create: '등록하기',
  edit: '수정하기',
}

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

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <FormSection title="사전예약명">
        <Input
          label="사전예약명"
          required
          value={value.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </FormSection>

      <FormSection
        title="진행 기간"
        description="사전예약 페이지가 보이는 기간입니다. 접수 오픈, 마감은 각 상품에서 정합니다."
      >
        <DateRangeField
          value={{ start: value.startDate, end: value.endDate }}
          onChange={(range) =>
            patch({ startDate: range.start, endDate: range.end })
          }
        />
      </FormSection>

      <FormSection
        title="사전예약 썸네일 이미지"
        description="사전예약 목록에 표시할 대표 이미지 한 장을 등록합니다."
      >
        <PromotionThumbnailField
          upload={uploadPromotionImage}
          value={value.thumbnail}
          onChange={(thumbnail) => patch({ thumbnail })}
        />
      </FormSection>

      <FormSection
        title="사전예약 상세 이미지"
        description="혜택 / 기간 안내입니다. 세로로 긴 이미지가 위에서부터 이어 붙습니다."
      >
        <div className={styles.tileFrame}>
          <ImageUploader
            ratio="portrait"
            showCount={false}
            accept="image/jpeg,image/png"
            upload={uploadPromotionImage}
            value={value.detailImages}
            onChange={(detailImages) => patch({ detailImages })}
          />
        </div>
      </FormSection>

      <FormSection
        title="상품 연결"
        description="사전예약으로 등록된 상품이 표시됩니다."
      >
        <PromotionProductLinker
          products={products}
          loading={productsLoading}
          value={value.linkedProductIds}
          onChange={(linkedProductIds) => patch({ linkedProductIds })}
          onAddProduct={onAddProduct}
        />
      </FormSection>

      <div className={styles.actions}>
        <FieldError message={problem ?? undefined} />
        <Button variant="outline" color="cancel" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitLabel[mode]}
        </Button>
      </div>
    </form>
  )
}

import { useState, type FormEvent } from 'react'

import {
  createEmptyPromotionFormValue,
  type AdminPromotionFormValue,
  type PromotionLinkableProduct,
} from '@entities/admin-promotion'
import {
  Button,
  DateRangeField,
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
  defaultValue?: AdminPromotionFormValue
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
  defaultValue,
  onSubmit,
  onCancel,
  onAddProduct,
}: AdminPromotionFormProps) {
  const [value, setValue] = useState(
    defaultValue ?? createEmptyPromotionFormValue(),
  )

  const patch = (partial: Partial<AdminPromotionFormValue>) =>
    setValue((prev) => ({ ...prev, ...partial }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(value)
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <FormSection title="프로모션 명">
        <Input
          label="프로모션 명"
          required
          value={value.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </FormSection>

      <FormSection
        title="진행 기간"
        description="프로모션 페이지가 보이는 기간입니다. 사전 예약 접수 오픈, 마감은 각 상품에서 정합니다."
      >
        <DateRangeField
          value={{ start: value.startAt, end: value.endAt }}
          onChange={(range) =>
            patch({ startAt: range.start, endAt: range.end })
          }
        />
      </FormSection>

      <FormSection
        title="프로모션 썸네일 이미지"
        description="프로모션 목록에 표시할 대표 이미지 한 장을 등록합니다."
      >
        <PromotionThumbnailField
          value={value.thumbnail}
          onChange={(thumbnail) => patch({ thumbnail })}
        />
      </FormSection>

      <FormSection
        title="프로모션 상세 이미지"
        description="혜택 / 기간 안내입니다. 세로로 긴 이미지가 위에서부터 이어 붙습니다."
      >
        <div className={styles.tileFrame}>
          <ImageUploader
            ratio="portrait"
            showCount={false}
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
          value={value.linkedProductIds}
          onChange={(linkedProductIds) => patch({ linkedProductIds })}
          onAddProduct={onAddProduct}
        />
      </FormSection>

      <div className={styles.actions}>
        <Button variant="outline" color="cancel" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">{submitLabel[mode]}</Button>
      </div>
    </form>
  )
}

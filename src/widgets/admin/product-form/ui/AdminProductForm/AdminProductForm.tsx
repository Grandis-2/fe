import { useState, type FormEvent } from 'react'

import {
  createEmptyProductFormValue,
  getProductVariants,
  withPresetOptionGroups,
  type AdminProductFormValue,
} from '@entities/admin-product'
import { Button, Checkbox, FormSection, ImageUploader, Input } from '@shared/ui'

import { ColorOptionEditor } from '../ColorOptionEditor'
import { NumberField } from '../NumberField'
import { OptionGroupEditor } from '../OptionGroupEditor'
import { OptionPresetField } from '../OptionPresetField'
import { PreorderPeriodField } from '../PreorderPeriodField'
import { VariantTable } from '../VariantTable'

import * as styles from './AdminProductForm.css'

export type AdminProductFormMode = 'create' | 'edit'

export type AdminProductFormProps = {
  mode: AdminProductFormMode
  defaultValue?: AdminProductFormValue
  onSubmit: (value: AdminProductFormValue) => void
  onCancel: () => void
  onPreview: (value: AdminProductFormValue) => void
  /** 저장 요청이 진행 중이면 제출 버튼을 막는다 — 연타하면 같은 저장이 여러 번 나간다 */
  submitting?: boolean
}

// 라벨을 페이지가 넘기면 화면마다 문구가 어긋나기 쉬워 여기 한 곳에 둔다.
const submitLabel: Record<AdminProductFormMode, string> = {
  create: '등록하기',
  edit: '수정하기',
}

export function AdminProductForm({
  mode,
  defaultValue,
  onSubmit,
  onCancel,
  onPreview,
  submitting = false,
}: AdminProductFormProps) {
  const [value, setValue] = useState(
    defaultValue ?? createEmptyProductFormValue(),
  )

  const patch = (partial: Partial<AdminProductFormValue>) =>
    setValue((prev) => ({ ...prev, ...partial }))

  // 조합은 상태로 두지 않고 매번 파생시킨다 — 옵션을 바꿔도 quantities는 그대로 남는다.
  const variants = getProductVariants(value)
  const comboSummary = [
    `색상 ${value.colors.length}개`,
    ...value.optionGroups.map(
      (group) => `${group.name || '옵션'} ${group.values.length}개`,
    ),
  ].join(' X ')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    onSubmit(value)
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <FormSection title="기본 정보">
        <Input
          label="상품명"
          required
          value={value.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
        <Input
          label="모델명"
          required
          value={value.modelName}
          onChange={(event) => patch({ modelName: event.target.value })}
        />
      </FormSection>

      <FormSection title="판매 방식">
        <div className={styles.card}>
          <label className={styles.checkboxRow}>
            <Checkbox
              checked={value.isPreorder}
              onChange={(event) => patch({ isPreorder: event.target.checked })}
            />
            <span className={styles.checkboxTexts}>
              <span className={styles.checkboxLabel}>사전 예약으로 판매</span>
              <span className={styles.checkboxHint}>
                접수 순번과 배송 차수가 적용됩니다.
              </span>
            </span>
          </label>

          {value.isPreorder && (
            <div className={styles.period}>
              <div className={styles.periodTitle}>오픈 / 마감 일시</div>
              <PreorderPeriodField
                openAt={value.openAt}
                onChange={(openAt, closeAt) => patch({ openAt, closeAt })}
              />
            </div>
          )}
        </div>
      </FormSection>

      <FormSection
        title="옵션"
        description={`고객이 옵션을 고르면 해당 이미지가 표시됩니다.
옵션당 최대 10장, 첫 장이 대표 이미지입니다.`}
      >
        {/* 색상은 별도 축이라 프리셋이 손대지 않는다 — 이미 올린 이미지가 날아간다. */}
        <OptionPresetField
          onSelect={(preset) =>
            patch({
              optionGroups: withPresetOptionGroups(value.optionGroups, preset),
            })
          }
        />
        <div className={styles.card}>
          <ColorOptionEditor
            colors={value.colors}
            onChange={(colors) => patch({ colors })}
          />
        </div>
        <OptionGroupEditor
          groups={value.optionGroups}
          onChange={(optionGroups) => patch({ optionGroups })}
        />
      </FormSection>

      <FormSection
        title="옵션별 가격 / 재고"
        description={
          variants.length > 0
            ? `${comboSummary} = ${variants.length}개 조합이 자동으로 만들어졌습니다.`
            : undefined
        }
      >
        <NumberField
          label="기본 가격"
          value={value.basePrice}
          onChange={(basePrice) => patch({ basePrice })}
        />

        <VariantTable
          variants={variants}
          colors={value.colors}
          optionGroups={value.optionGroups}
          quantities={value.quantities}
          onQuantityChange={(key, quantity) =>
            patch({ quantities: { ...value.quantities, [key]: quantity } })
          }
        />
      </FormSection>

      <FormSection
        title="상세 이미지"
        description="색상과 무관하게 상품 하단에 세로로 이어 붙습니다. 권장 가로 폭 1000px."
      >
        <div className={styles.card}>
          <ImageUploader
            ratio="portrait"
            showCount={false}
            value={value.detailImages}
            onChange={(detailImages) => patch({ detailImages })}
          />
        </div>
      </FormSection>

      <FormSection
        title="제품 사양"
        description="색상과 무관하게 상품 하단에 세로로 이어 붙습니다. 권장 가로 폭 1000px."
      >
        <div className={styles.card}>
          <ImageUploader
            ratio="portrait"
            showCount={false}
            value={value.specImages}
            onChange={(specImages) => patch({ specImages })}
          />
        </div>
      </FormSection>

      <FormSection
        title="유의 사항"
        description="색상과 무관하게 상품 하단에 세로로 이어 붙습니다. 권장 가로 폭 1000px."
      >
        <div className={styles.card}>
          <ImageUploader
            ratio="portrait"
            showCount={false}
            value={value.noticeImages}
            onChange={(noticeImages) => patch({ noticeImages })}
          />
        </div>
      </FormSection>

      <div className={styles.footer}>
        <Button
          type="button"
          variant="outline"
          color="primary"
          icon="eye"
          onClick={() => onPreview(value)}
        >
          미리보기
        </Button>
        <div className={styles.footerRight}>
          <Button
            type="button"
            variant="outline"
            color="cancel"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '저장 중…' : submitLabel[mode]}
          </Button>
        </div>
      </div>
    </form>
  )
}

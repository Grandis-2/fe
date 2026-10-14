import { useState, type FormEvent } from 'react'

import { Eye } from 'lucide-react'

import {
  createEmptyProductFormValue,
  getProductVariants,
  PRODUCT_BRANDS,
  withPresetOptionGroups,
  type AdminProductFormValue,
  type ProductOptionPreset,
} from '@entities/admin-product'
import {
  Button,
  Checkbox,
  Dropdown,
  FormSection,
  ImageUploader,
  InlineAlert,
  Input,
} from '@shared/ui'
import type { DropdownOption } from '@shared/ui'

import { ColorOptionEditor } from '../ColorOptionEditor'
import { FirstDeliveryField } from '../FirstDeliveryField'
import { NumberField } from '../NumberField'
import { OptionGroupEditor } from '../OptionGroupEditor'
import { OptionPresetField } from '../OptionPresetField'
import { PreorderPeriodField } from '../PreorderPeriodField'
import { TagField } from '../TagField'
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
  /**
   * 배송 구간 설정으로 보낸다. 수정 화면에서만 주며, 주지 않으면 버튼이 안 나온다 —
   * 같은 페이지의 탭 전환이라 어디로 갈지는 페이지가 정한다.
   */
  onEditDispatchWindow?: () => void
  /**
   * 수정 화면에서 서버에 이미 있는 옵션 종류(축 키)·값 id. 등록 뒤에는 축을 만들거나
   * 지울 수 없고 있던 값도 지울 수 없어서(지우는 API가 없다) 그 칸들의 삭제를 막는다.
   */
  existingIds?: ReadonlySet<string>
  /**
   * 지금 고칠 수 없는 이유. 있으면 폼 전체를 읽기 전용으로 두고 이 문구를 보여준다 —
   * 사전예약은 오픈 3분 전부터 공개 여부 말고는 서버가 409로 거절한다.
   */
  lockReason?: string | null
}

// 라벨을 페이지가 넘기면 화면마다 문구가 어긋나기 쉬워 여기 한 곳에 둔다.
const submitLabel: Record<AdminProductFormMode, string> = {
  create: '등록하기',
  edit: '수정하기',
}

const brandOptions: DropdownOption<string>[] = PRODUCT_BRANDS.map((brand) => ({
  label: brand,
  value: brand,
}))

/**
 * 상품 등록·수정 폼. 등록과 수정이 같은 본문을 쓰므로 제출 문구만 mode로 가른다.
 * 조합(색상 × 옵션)은 상태로 두지 않고 매번 파생시켜, 옵션을 고쳐도 입력한
 * 수량이 살아남는다.
 */
export function AdminProductForm({
  mode,
  defaultValue,
  onSubmit,
  onCancel,
  onPreview,
  submitting = false,
  onEditDispatchWindow,
  existingIds,
  lockReason,
}: AdminProductFormProps) {
  const editing = mode === 'edit'
  // 등록 뒤에는 사진을 바꾸는 API가 없다.
  const imageNote = editing
    ? '등록 뒤에는 사진을 바꿀 수 없습니다.'
    : '색상과 무관하게 상품 하단에 세로로 이어 붙습니다. 권장 가로 폭 1000px.'
  const [value, setValue] = useState(
    defaultValue ?? createEmptyProductFormValue(),
  )
  // 서버로 가지 않는 값이라 폼 값(AdminProductFormValue)에 넣지 않는다 — 옵션을 깔고
  // 태그 추천을 고르는 데만 쓴다. 수정 폼에는 종류가 저장돼 있지 않아 비어 있다.
  const [preset, setPreset] = useState<ProductOptionPreset>()

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
    if (submitting || lockReason) return
    onSubmit(value)
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      {lockReason && <InlineAlert status="info">{lockReason}</InlineAlert>}

      {/* 잠기면 안의 입력·버튼을 브라우저가 한꺼번에 막는다 — 칸마다 disabled를 넘기지
          않는다. 아래 버튼(미리보기·취소)은 잠겨도 눌려야 해서 밖에 둔다. */}
      <fieldset className={styles.sections} disabled={!!lockReason}>
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
            // 아직 서버에 모델명 필드가 없어 수정에서는 저장할 곳이 없다.
            disabled={editing}
            value={value.modelName}
            onChange={(event) => patch({ modelName: event.target.value })}
          />
        </FormSection>

        <FormSection title="브랜드 정보">
          {/* 브랜드도 아직 서버 필드가 없다. Dropdown은 disabled를 받지 않아 감싸서 막는다. */}
          <fieldset className={styles.plainFieldset} disabled={editing}>
            <Dropdown
              label="브랜드 선택"
              size="medium"
              width="220px"
              options={brandOptions}
              value={value.brand || undefined}
              onSelect={(brand) => patch({ brand })}
            />
          </fieldset>
        </FormSection>

        <FormSection title="판매 방식">
          <div className={styles.card}>
            <label className={styles.checkboxRow}>
              <Checkbox
                checked={value.isPreorder}
                // 판매 방식은 등록 뒤 바꿀 수 없다.
                disabled={editing}
                onChange={(event) =>
                  patch({ isPreorder: event.target.checked })
                }
              />
              <span className={styles.checkboxTexts}>
                <span className={styles.checkboxLabel}>사전 예약으로 판매</span>
                <span className={styles.hint}>
                  접수 순번과 배송 차수가 적용됩니다.
                </span>
              </span>
            </label>

            {value.isPreorder && (
              <>
                <div className={styles.period}>
                  <div className={styles.periodTitle}>오픈 / 마감 일시</div>
                  <PreorderPeriodField
                    openAt={value.openAt}
                    onChange={(openAt, closeAt) => patch({ openAt, closeAt })}
                  />
                </div>

                <FirstDeliveryField
                  editable={mode === 'create'}
                  value={value.firstDeliveryDate}
                  onChange={(firstDeliveryDate) => patch({ firstDeliveryDate })}
                  onEditDispatchWindow={onEditDispatchWindow}
                />
              </>
            )}
          </div>
        </FormSection>

        <FormSection
          title="옵션"
          description={`고객이 옵션을 고르면 해당 이미지가 표시됩니다.
옵션당 최대 10장, 첫 장이 대표 이미지입니다.`}
        >
          {/* 프리셋은 옵션 종류(축)를 새로 까는데, 등록 뒤에는 축을 만들 수 없다. */}
          {editing ? (
            <span className={styles.hint}>
              등록 뒤에는 옵션 종류와 사진을 바꿀 수 없습니다. 값은
              이름·추가금을 고치거나 새로 더할 수 있고, 그만 팔 조합은 아래
              표에서 판매를 끕니다.
            </span>
          ) : (
            // 색상은 별도 축이라 프리셋이 손대지 않는다 — 이미 올린 이미지가 날아간다.
            <OptionPresetField
              value={preset}
              onSelect={(picked) => {
                setPreset(picked)
                patch({
                  optionGroups: withPresetOptionGroups(
                    value.optionGroups,
                    picked,
                  ),
                })
              }}
            />
          )}
          <div className={styles.card}>
            <ColorOptionEditor
              colors={value.colors}
              existingIds={existingIds}
              onChange={(colors) => patch({ colors })}
            />
          </div>
          <OptionGroupEditor
            groups={value.optionGroups}
            existingIds={existingIds}
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
            isPreorder={value.isPreorder}
            colors={value.colors}
            optionGroups={value.optionGroups}
            quantities={value.quantities}
            onQuantityChange={(key, quantity) =>
              patch({ quantities: { ...value.quantities, [key]: quantity } })
            }
            // 사전예약은 재고를 세지 않고, 1차 배송 수량은 배송 구간 설정에서 고친다.
            hideQuantity={editing && value.isPreorder}
            pausedKeys={editing ? value.pausedKeys : undefined}
            onPausedChange={
              editing
                ? (key, paused) =>
                    patch({
                      pausedKeys: paused
                        ? [...value.pausedKeys, key]
                        : value.pausedKeys.filter((item) => item !== key),
                    })
                : undefined
            }
          />
        </FormSection>

        <FormSection
          title="검색 태그"
          description="구매자에게는 보이지 않습니다. 검색에만 쓰이니 고객이 찾을 때 쓸 말을 넣어주세요."
        >
          <TagField
            preset={preset}
            value={value.tags}
            onChange={(tags) => patch({ tags })}
          />
        </FormSection>

        <FormSection title="상세 이미지" description={imageNote}>
          <div className={styles.card}>
            <ImageUploader
              ratio="portrait"
              showCount={false}
              disabled={editing}
              value={value.detailImages}
              onChange={(detailImages) => patch({ detailImages })}
            />
          </div>
        </FormSection>

        <FormSection title="제품 사양" description={imageNote}>
          <div className={styles.card}>
            <ImageUploader
              ratio="portrait"
              showCount={false}
              disabled={editing}
              value={value.specImages}
              onChange={(specImages) => patch({ specImages })}
            />
          </div>
        </FormSection>

        <FormSection title="유의 사항" description={imageNote}>
          <div className={styles.card}>
            <ImageUploader
              ratio="portrait"
              showCount={false}
              disabled={editing}
              value={value.noticeImages}
              onChange={(noticeImages) => patch({ noticeImages })}
            />
          </div>
        </FormSection>
      </fieldset>

      <div className={styles.footer}>
        <Button
          type="button"
          variant="outline"
          color="primary"
          icon={Eye}
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
          <Button type="submit" disabled={submitting || !!lockReason}>
            {submitting ? '저장 중…' : submitLabel[mode]}
          </Button>
        </div>
      </div>
    </form>
  )
}

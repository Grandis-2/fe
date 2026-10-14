import { useEffect, useRef, useState, type FormEvent } from 'react'

import { AlertCircle, Eye } from 'lucide-react'

import {
  createEmptyProductFormValue,
  getProductVariants,
  MODEL_NAME_MAX,
  PRODUCT_BRANDS,
  withPresetOptionGroups,
  type AdminProductFormValue,
  type FormField,
  type FormIssue,
  type ProductOptionPreset,
} from '@entities/admin-product'
import { findCategoryId, useCategories } from '@entities/product'
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
import { FieldError } from '../FieldError'
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
  /**
   * 제출 전에 칸별로 검사한다. 문제가 있으면 보내지 않고 그 칸에 문구를 붙인 뒤 첫 칸으로
   * 스크롤한다. 한 번 제출한 뒤에는 고칠 때마다 다시 검사해 고친 문구가 바로 사라진다.
   */
  validate?: (value: AdminProductFormValue) => FormIssue[]
  /** 서버가 준 칸별 오류(400). 받으면 그 칸에 붙이고 스크롤한다. 고치기 시작하면 걷는다 */
  serverIssues?: FormIssue[]
  /** 칸에 붙일 수 없는 실패 문구 — 버튼 줄에 보여준다 */
  submitError?: string | null
  /**
   * 오프라인이라 요청이 멈춰 있다(TanStack Query는 오프라인이면 보내지 않고 기다렸다가
   * 연결되면 보낸다). 알리지 않으면 '저장 중…'에서 멈춘 것처럼 보인다.
   */
  waitingForNetwork?: boolean
}

/** 칸을 감싼 요소에 붙이는 표식. 첫 오류 칸을 찾아 스크롤할 때 쓴다 */
const fieldAttr = (field: FormField) => ({ 'data-field': field })

/**
 * 화면 순서상 첫 오류 칸으로 스크롤하고 그 안의 입력에 포커스를 둔다. 순서는 DOM으로
 * 정한다 — 검사 순서와 화면 순서가 달라도 위에서부터 고치게 된다.
 */
function focusFirst(form: HTMLFormElement | null, fields: Set<FormField>) {
  const target = [
    ...(form?.querySelectorAll<HTMLElement>('[data-field]') ?? []),
  ].find((element) => fields.has(element.dataset.field as FormField))
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusable = target.matches('input, button, textarea')
    ? target
    : target.querySelector<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), textarea:not(:disabled)',
      )
  // 스크롤은 위에서 부드럽게 한다 — 포커스가 다시 튀어 스크롤하지 않게 막는다.
  focusable?.focus({ preventScroll: true })
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
  validate,
  serverIssues,
  submitError,
  waitingForNetwork = false,
}: AdminProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  // 처음엔 검사하지 않는다 — 쓰기도 전에 빨간 문구가 뜨면 거슬린다.
  const [attempted, setAttempted] = useState(false)
  // 고치기 시작하면 서버 오류를 걷는다. 걷은 묶음을 기억해 새 오류가 오면 다시 보인다.
  const [dismissedServer, setDismissedServer] = useState<FormIssue[]>()
  const editing = mode === 'edit'
  // 사진은 아직 올릴 곳이 없다 — 업로드(S3)가 준비되면 열고, 등록 뒤에는 바꾸는 API가
  // 아예 없다. 칸을 열어 두면 고른 사진이 조용히 버려진다.
  const imageNote = editing
    ? '등록 뒤에는 사진을 바꿀 수 없습니다.'
    : '사진 업로드를 준비하고 있습니다. 지금은 사진 없이 등록됩니다.'
  const { data: categoryTree } = useCategories()
  const [value, setValue] = useState(
    defaultValue ?? createEmptyProductFormValue(),
  )
  // 서버로 가지 않는 값이라 폼 값(AdminProductFormValue)에 넣지 않는다 — 옵션을 깔고
  // 태그 추천을 고르는 데만 쓴다. 수정 폼에는 종류가 저장돼 있지 않아 비어 있다.
  const [preset, setPreset] = useState<ProductOptionPreset>()

  const patch = (partial: Partial<AdminProductFormValue>) => {
    setValue((prev) => ({ ...prev, ...partial }))
    setDismissedServer(serverIssues)
  }

  // 조합은 상태로 두지 않고 매번 파생시킨다 — 옵션을 바꿔도 quantities는 그대로 남는다.
  const variants = getProductVariants(value)
  const comboSummary = [
    `색상 ${value.colors.length}개`,
    ...value.optionGroups.map(
      (group) => `${group.name || '옵션'} ${group.values.length}개`,
    ),
  ].join(' X ')

  // 종류는 실서버 카테고리 트리의 하위 노드다(모바일 > 스마트폰). 트리에 그 종류가
  // 없으면 대분류로 등록한다 — 서버는 상위·하위 어느 쪽에도 받는다.
  const categoryIdOf = (picked: ProductOptionPreset) =>
    categoryTree &&
    (findCategoryId(categoryTree, picked.category, picked.name) ??
      findCategoryId(categoryTree, picked.category))

  // 등록이면 고른 종류를 카테고리 id로 바꿔 싣는다. 보낼 때 찾는 건 종류를 고를 때
  // 트리가 아직 안 왔어도 되게 하려는 것이다. 수정은 서버 값 그대로다(바꿀 수 없다).
  const submitValue =
    editing || !preset
      ? value
      : { ...value, categoryId: categoryIdOf(preset) ?? '' }

  const visibleServer =
    serverIssues && serverIssues !== dismissedServer ? serverIssues : []
  const issues = [
    ...(attempted && validate ? validate(submitValue) : []),
    ...visibleServer,
  ]
  // 칸마다 첫 문구만 보인다.
  const issueOf = (field: FormField) =>
    issues.find((issue) => issue.field === field)?.message
  const issueFields = new Set(issues.map((issue) => issue.field))

  // 서버 오류가 새로 오면 그 칸으로 데려간다.
  useEffect(() => {
    if (serverIssues?.length) {
      focusFirst(formRef.current, new Set(serverIssues.map((i) => i.field)))
    }
  }, [serverIssues])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || lockReason) return
    setAttempted(true)
    const found = validate?.(submitValue) ?? []
    if (found.length > 0) {
      focusFirst(formRef.current, new Set(found.map((issue) => issue.field)))
      return
    }
    onSubmit(submitValue)
  }

  return (
    // 브라우저 기본 필수 말풍선은 끈다 — 검사는 validate가 하고 문구는 칸 아래에 띄운다.
    <form
      ref={formRef}
      className={styles.root}
      noValidate
      onSubmit={handleSubmit}
    >
      {lockReason && <InlineAlert status="info">{lockReason}</InlineAlert>}

      {/* 잠기면 안의 입력·버튼을 브라우저가 한꺼번에 막는다 — 칸마다 disabled를 넘기지
          않는다. 아래 버튼(미리보기·취소)은 잠겨도 눌려야 해서 밖에 둔다. */}
      <fieldset className={styles.sections} disabled={!!lockReason}>
        <FormSection title="기본 정보">
          <Input
            {...fieldAttr('name')}
            label="상품명"
            required
            error={issueOf('name')}
            value={value.name}
            onChange={(event) => patch({ name: event.target.value })}
          />
          <Input
            {...fieldAttr('modelName')}
            label="모델명"
            required
            error={issueOf('modelName')}
            // 서버가 1~40자만 받는다.
            maxLength={MODEL_NAME_MAX}
            value={value.modelName}
            onChange={(event) => patch({ modelName: event.target.value })}
          />
        </FormSection>

        <FormSection title="브랜드 정보">
          {/* Dropdown은 disabled를 받지 않아 fieldset으로 감싼다 — 잠금(lockReason)일 때
              바깥 fieldset이 막는다. */}
          <fieldset className={styles.plainFieldset} {...fieldAttr('brand')}>
            <Dropdown
              label="브랜드 선택"
              size="medium"
              width="220px"
              options={brandOptions}
              value={value.brand || undefined}
              onSelect={(brand) => patch({ brand })}
            />
          </fieldset>
          <FieldError message={issueOf('brand')} />
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
                <div className={styles.period} {...fieldAttr('schedule')}>
                  <div className={styles.periodTitle}>오픈 / 마감 일시</div>
                  <PreorderPeriodField
                    openAt={value.openAt}
                    onChange={(openAt, closeAt) => patch({ openAt, closeAt })}
                  />
                  <FieldError message={issueOf('schedule')} />
                </div>

                <div {...fieldAttr('firstDelivery')}>
                  <FirstDeliveryField
                    editable={mode === 'create'}
                    value={value.firstDelivery}
                    onChange={(firstDelivery) => patch({ firstDelivery })}
                    onEditDispatchWindow={onEditDispatchWindow}
                  />
                  <FieldError message={issueOf('firstDelivery')} />
                </div>
              </>
            )}
          </div>
        </FormSection>

        {/* 등록 때만 고른다 — 등록 뒤에는 상세의 공개 전환 버튼으로 바꾼다. */}
        {!editing && (
          <FormSection title="공개 설정">
            <div className={styles.card}>
              {value.isPreorder ? (
                <span className={styles.hint}>
                  사전예약은 접수 기간(오픈 ~ 마감)에만 구매자에게 자동으로
                  보입니다.
                </span>
              ) : (
                <label className={styles.checkboxRow}>
                  <Checkbox
                    checked={value.publishOnCreate}
                    onChange={(event) =>
                      patch({ publishOnCreate: event.target.checked })
                    }
                  />
                  <span className={styles.checkboxTexts}>
                    <span className={styles.checkboxLabel}>
                      등록하자마자 공개
                    </span>
                    <span className={styles.hint}>
                      끄면 숨김으로 등록됩니다. 상세에서 옵션·가격을 확인한 뒤
                      공개할 수 있습니다.
                    </span>
                  </span>
                </label>
              )}
            </div>
          </FormSection>
        )}

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
            <div {...fieldAttr('category')}>
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
              <FieldError message={issueOf('category')} />
            </div>
          )}
          <div className={styles.card} {...fieldAttr('options')}>
            <ColorOptionEditor
              colors={value.colors}
              existingIds={existingIds}
              imagesLocked
              onChange={(colors) => patch({ colors })}
            />
          </div>
          <OptionGroupEditor
            groups={value.optionGroups}
            existingIds={existingIds}
            onChange={(optionGroups) => patch({ optionGroups })}
          />
          <FieldError message={issueOf('options')} />
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

          <div {...fieldAttr('variants')} className={styles.variants}>
            <VariantTable
              variants={variants}
              isPreorder={value.isPreorder}
              colors={value.colors}
              optionGroups={value.optionGroups}
              quantities={value.quantities}
              onQuantityChange={(key, quantity) =>
                patch({ quantities: { ...value.quantities, [key]: quantity } })
              }
              // 사전예약은 재고를 세지 않는다(서버가 stock을 받지 않는다). 등록 때 1차 배송
              // 차수는 끝이 열린 채로만 보낼 수 있어서 1차 물량도 실을 곳이 없다 —
              // 물량 경계는 배송 구간 설정에서 2차를 더할 때 정한다.
              hideQuantity={value.isPreorder}
              // 등록에선 끈 조합을 만들지 않고, 수정에선 판매 중지로 둔다.
              pausedKeys={value.pausedKeys}
              excludeOnPause={!editing}
              onPausedChange={(key, paused) =>
                patch({
                  pausedKeys: paused
                    ? [...value.pausedKeys, key]
                    : value.pausedKeys.filter((item) => item !== key),
                })
              }
            />
            <FieldError message={issueOf('variants')} />
          </div>
        </FormSection>

        <FormSection
          title="검색 태그"
          description="구매자에게는 보이지 않습니다. 검색에만 쓰이니 고객이 찾을 때 쓸 말을 넣어주세요."
        >
          <div {...fieldAttr('tags')}>
            <TagField
              // 수정은 제품 종류(추천 기준)를 모른다 — 고른 태그가 '그 외'에 접혀 안
              // 보이지 않게 따로 모아 보여준다.
              showSelected={editing}
              preset={preset}
              value={value.tags}
              onChange={(tags) => patch({ tags })}
            />
            <FieldError message={issueOf('tags')} />
          </div>
        </FormSection>

        <FormSection title="상세 이미지" description={imageNote}>
          <div className={styles.card}>
            <ImageUploader
              ratio="portrait"
              showCount={false}
              disabled
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
              disabled
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
              disabled
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
        {/* 버튼은 화면 아래에 붙어 있어 맨 위 알림은 안 보인다 — 누른 자리에서 결과를
            알린다. 새로 생기면 스크린리더가 읽도록 alert로 둔다. */}
        <div className={styles.footerMessage} role="alert">
          {issues.length > 0 ? (
            <>
              <AlertCircle className={styles.footerIcon} aria-hidden="true" />
              확인이 필요한 항목 {issueFields.size}개
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => focusFirst(formRef.current, issueFields)}
              >
                첫 항목으로 이동
              </button>
            </>
          ) : waitingForNetwork ? (
            <>
              <AlertCircle className={styles.footerIcon} aria-hidden="true" />
              인터넷 연결이 끊겼습니다. 연결되면 자동으로 이어서 보냅니다.
            </>
          ) : (
            submitError && (
              <>
                <AlertCircle className={styles.footerIcon} aria-hidden="true" />
                {submitError}
              </>
            )
          )}
        </div>
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
            {waitingForNetwork
              ? '연결 대기 중…'
              : submitting
                ? '저장 중…'
                : submitLabel[mode]}
          </Button>
        </div>
      </div>
    </form>
  )
}

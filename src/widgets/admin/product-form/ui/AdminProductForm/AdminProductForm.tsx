import { useEffect, useRef, useState, type FormEvent } from 'react'

import { AlertCircle, Eye, Lock } from 'lucide-react'

import {
  createEmptyProductFormValue,
  DESCRIPTION_MAX,
  DETAIL_IMAGE_MAX,
  GALLERY_MAX,
  getProductVariants,
  MODEL_NAME_MAX,
  PRODUCT_BRANDS,
  PRODUCT_IMAGE_ACCEPT,
  uploadProductImage,
  withPresetOptionGroups,
  type AdminProductFormValue,
  type FormField,
  type FormIssue,
  type ProductOptionPreset,
} from '@entities/admin-product'
import { findCategoryId, useCategories } from '@entities/product'
import type { DropdownOption } from '@shared/ui'
import {
  Button,
  Checkbox,
  Dropdown,
  FormSection,
  ImageUploader,
  Input,
  FieldError,
  NoticeBanner,
  Tag,
  Textarea,
  Toggle,
} from '@shared/ui'

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
  onEditShipmentBatches?: () => void
  /**
   * 수정 화면에서 서버에 이미 있는 옵션 종류(축 키)·값 id. 등록 뒤에는 축을 만들거나
   * 지울 수 없고 있던 값도 지울 수 없어서(지우는 API가 없다) 그 칸들의 삭제를 막는다.
   */
  existingIds?: ReadonlySet<string>
  /**
   * 지금 고칠 수 없는 이유. 있으면 사진 말고는 읽기 전용으로 두고 이 문구를 보여준다 —
   * 사전예약은 오픈 3분 전부터 공개 여부와 사진 말고는 서버가 409로 거절한다.
   */
  lockReason?: string | null
  /** 아직 잠기지 않았지만 잠길 시각 — 그 전에 확정하라고 미리 알린다 */
  locksAt?: Date | null
  /**
   * 서버 값과 다른 곳(섹션 이름). 저장 줄에 무엇이 바뀌었는지 보여준다 — 수정 화면만
   * 넘긴다(서버 상세와 비교해야 해서 폼은 모른다).
   */
  pendingChanges?: (value: AdminProductFormValue) => string[]
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

const lockTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// 상세 이미지 세 영역 — 구매자 상세의 탭 이름과 같다(DETAIL_SECTIONS).
const detailImageFields = [
  { field: 'benefitImages', label: '구매 혜택' },
  { field: 'infoImages', label: '모델 정보' },
  { field: 'noticeImages', label: '유의 사항' },
] as const

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
  onEditShipmentBatches,
  existingIds,
  lockReason,
  locksAt,
  pendingChanges,
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
  // 사진은 고르는 즉시 올리고, 저장할 때 주소만 보낸다. 수정 화면은
  // 저장할 때 사진 넣기·빼기 API로 한 장씩 반영한다.
  const locked = !!lockReason
  const imageNote = editing
    ? `영역마다 ${DETAIL_IMAGE_MAX}장까지, JPG·PNG, 10MB 이하. 저장을 누르면 반영되고, 잠금과 상관없이 고칠 수 있어요.`
    : `영역마다 ${DETAIL_IMAGE_MAX}장까지, JPG·PNG, 10MB 이하. 세로로 위에서부터 이어 붙습니다.`
  const uploaderProps = {
    upload: uploadProductImage,
    accept: PRODUCT_IMAGE_ACCEPT,
  }
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
    if (submitting) return
    setAttempted(true)
    const found = validate?.(submitValue) ?? []
    if (found.length > 0) {
      focusFirst(formRef.current, new Set(found.map((issue) => issue.field)))
      return
    }
    onSubmit(submitValue)
  }

  const pending = pendingChanges?.(value) ?? []
  // 잠긴 섹션 제목에 붙는 표시 — 목차에도 같은 자물쇠가 붙는다.
  const lockBadge = locked ? (
    <Tag size="small" color="yellow" variant="subtle">
      잠김
    </Tag>
  ) : undefined
  // 수정 화면의 목차 — 상세 이미지는 잠기지 않는다.
  const toc = [
    { id: 'basic', label: '기본 정보', lockable: true },
    { id: 'sale', label: '판매 방식 · 일정', lockable: true },
    { id: 'option', label: '옵션 · 상품 사진', lockable: true },
    { id: 'price', label: '가격', lockable: true },
    { id: 'variants', label: '옵션별 판매', lockable: true },
    { id: 'tags', label: '검색 태그', lockable: true },
    { id: 'images', label: '상세 이미지', lockable: false },
  ]

  return (
    // 브라우저 기본 필수 말풍선은 끈다 — 검사는 validate가 하고 문구는 칸 아래에 띄운다.
    <form
      ref={formRef}
      className={styles.root}
      noValidate
      onSubmit={handleSubmit}
    >
      {lockReason ? (
        <NoticeBanner
          tone="warning"
          title="공개 여부와 사진만 고칠 수 있어요"
          description={lockReason}
        />
      ) : (
        locksAt && (
          <NoticeBanner
            tone="info"
            title={`오픈 3분 전(${lockTimeFormat.format(locksAt)})부터 잠겨요`}
            description="그때부터는 공개 여부와 사진 말고는 고칠 수 없어요. 가격·옵션·접수 기간은 그 전에 확정해 주세요."
          />
        )
      )}

      <div className={editing ? styles.withToc : styles.plain}>
        {/* 잠기면 섹션마다 fieldset으로 안의 입력·버튼을 한꺼번에 막는다 — 칸마다 disabled를
            넘기지 않는다. 사진 칸은 잠금과 상관없이 고칠 수 있어 막지 않는다. */}
        <div className={styles.sections}>
          <FormSection id="basic" title="기본 정보" badge={lockBadge}>
            <fieldset className={styles.basicGrid} disabled={locked}>
              <Input
                {...fieldAttr('name')}
                label="상품명"
                required
                error={issueOf('name')}
                value={value.name}
                onChange={(event) => patch({ name: event.target.value })}
              />
              {/* Dropdown은 disabled를 받지 않아 fieldset이 막는다. */}
              <div {...fieldAttr('brand')}>
                <Dropdown
                  label="브랜드 선택"
                  size="medium"
                  width="100%"
                  options={brandOptions}
                  value={value.brand || undefined}
                  onSelect={(brand) => patch({ brand })}
                />
                <FieldError message={issueOf('brand')} />
              </div>
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
            </fieldset>
            <fieldset className={styles.stack} disabled={locked}>
              <Textarea
                label="상품 설명"
                placeholder="상품 설명 (선택)"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                value={value.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
              <span className={styles.hint}>
                비우면 설명 없이 보여요 ·{' '}
                {value.description.length.toLocaleString('ko-KR')} /{' '}
                {DESCRIPTION_MAX.toLocaleString('ko-KR')}
              </span>
            </fieldset>
          </FormSection>

          <FormSection id="sale" title="판매 방식 · 일정" badge={lockBadge}>
            <fieldset className={styles.card} disabled={locked}>
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
                  <span className={styles.checkboxLabel}>
                    사전 예약으로 판매
                  </span>
                  <span className={styles.hint}>
                    {editing && value.isPreorder
                      ? '마감 뒤 일반 상품으로 전환할 수 있어요.'
                      : '접수 순번과 배송 차수가 적용됩니다.'}
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
                    {editing && (
                      <span className={styles.hint}>
                        오픈 시각은 지금부터 10분 뒤 이후로만 정할 수 있어요 ·
                        오픈하면 바꿀 수 없어요
                      </span>
                    )}
                    <FieldError message={issueOf('schedule')} />
                  </div>

                  <div {...fieldAttr('firstDelivery')}>
                    <FirstDeliveryField
                      editable={mode === 'create'}
                      value={value.firstDelivery}
                      onChange={(firstDelivery) => patch({ firstDelivery })}
                      onEditShipmentBatches={onEditShipmentBatches}
                    />
                    <FieldError message={issueOf('firstDelivery')} />
                  </div>
                </>
              )}
            </fieldset>
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
            id="option"
            title="옵션 · 상품 사진"
            badge={lockBadge}
            description={`고객이 옵션을 고르면 해당 사진이 표시됩니다.
색상마다 최대 ${GALLERY_MAX}장, 첫 장이 대표 사진입니다.${locked ? ' 사진은 잠금과 상관없이 고칠 수 있어요.' : ''}`}
          >
            {/* 프리셋은 옵션 종류(축)를 새로 까는데, 등록 뒤에는 축을 만들 수 없다. */}
            {editing ? (
              <span className={styles.hint}>
                등록 뒤에는 옵션 종류를 바꿀 수 없습니다. 값은 이름·추가금을
                고치거나 새로 더할 수 있고, 그만 팔 조합은 아래 표에서 판매를
                끕니다.
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
                locked={locked}
                {...uploaderProps}
                maxImages={GALLERY_MAX}
                noColorImages={value.noColorImages}
                onNoColorImagesChange={(noColorImages) =>
                  patch({ noColorImages })
                }
                onChange={(colors) => patch({ colors })}
              />
            </div>
            <fieldset className={styles.stack} disabled={locked}>
              <OptionGroupEditor
                groups={value.optionGroups}
                existingIds={existingIds}
                onChange={(optionGroups) => patch({ optionGroups })}
              />
            </fieldset>
            <FieldError message={issueOf('options')} />
          </FormSection>

          <FormSection
            id="price"
            title="가격"
            badge={lockBadge}
            description="모든 옵션 가격 = 기본 가격 + 옵션 추가금. 할인율은 모든 옵션에 같이 걸리고 100원 단위로 버립니다."
          >
            <fieldset className={styles.priceRow} disabled={locked}>
              <NumberField
                label="기본 가격"
                value={value.basePrice}
                onChange={(basePrice) => patch({ basePrice })}
              />
              {/* 모든 옵션 가격에 같이 걸린다(보증 금액엔 안 걸림). 0이면 할인 없음. */}
              <NumberField
                {...fieldAttr('discountRate')}
                label="할인율(%)"
                value={value.discountRate}
                onChange={(discountRate) => patch({ discountRate })}
                error={issueOf('discountRate')}
              />
            </fieldset>
            <fieldset className={styles.priceRow} disabled={locked}>
              <label className={styles.toggleRow}>
                <span className={styles.checkboxTexts}>
                  <span className={styles.checkboxLabel}>보증 판매</span>
                  <span className={styles.hint}>
                    할인이 걸리지 않아요 · 끄면 0원으로 저장돼요
                  </span>
                </span>
                <Toggle
                  checked={value.warranty.offered}
                  aria-label="보증 판매"
                  onChange={(event) =>
                    patch({
                      warranty: {
                        ...value.warranty,
                        offered: event.target.checked,
                      },
                    })
                  }
                />
              </label>
              {value.warranty.offered && (
                <NumberField
                  label="보증 금액(원)"
                  value={value.warranty.surcharge}
                  onChange={(surcharge) =>
                    patch({ warranty: { ...value.warranty, surcharge } })
                  }
                />
              )}
            </fieldset>
          </FormSection>

          <FormSection
            id="variants"
            title={editing ? '옵션별 판매' : '옵션별 가격 / 재고'}
            badge={lockBadge}
            description={
              variants.length > 0
                ? `${comboSummary} = ${variants.length}개 조합이 자동으로 만들어졌습니다.`
                : undefined
            }
          >
            <fieldset
              {...fieldAttr('variants')}
              className={styles.variants}
              disabled={locked}
            >
              {locked && (
                <span className={styles.hint}>
                  잠긴 동안에는 조합별 판매를 끄거나 켤 수 없어요. 오픈 뒤 상품
                  전체를 멈추는 판매 중지는 회차 취소라 되돌릴 수 없어요.
                </span>
              )}
              <VariantTable
                variants={variants}
                isPreorder={value.isPreorder}
                colors={value.colors}
                optionGroups={value.optionGroups}
                quantities={value.quantities}
                onQuantitiesChange={(changes) =>
                  patch({ quantities: { ...value.quantities, ...changes } })
                }
                // 사전예약 등록은 수량 칸을 '1차 배송 수량'으로 받는다. 수정 화면에선 1차 배송
                // 수량을 배송 구간 설정에서 고치므로 숨긴다.
                hideQuantity={editing && value.isPreorder}
                // 등록에선 끈 조합을 만들지 않고, 수정에선 판매 중지로 둔다.
                pausedKeys={value.pausedKeys}
                excludeOnPause={!editing}
                onPausedChange={(keys, paused) =>
                  patch({
                    pausedKeys: paused
                      ? [...new Set([...value.pausedKeys, ...keys])]
                      : value.pausedKeys.filter((item) => !keys.includes(item)),
                  })
                }
              />
              <FieldError message={issueOf('variants')} />
            </fieldset>
          </FormSection>

          <FormSection
            id="tags"
            title="검색 태그"
            badge={lockBadge}
            description="구매자에게는 보이지 않습니다. 검색에만 쓰이니 고객이 찾을 때 쓸 말을 넣어주세요."
          >
            <fieldset
              {...fieldAttr('tags')}
              className={styles.stack}
              disabled={locked}
            >
              <TagField
                // 수정은 제품 종류(추천 기준)를 모른다 — 고른 태그가 '그 외'에 접혀 안
                // 보이지 않게 따로 모아 보여준다.
                showSelected={editing}
                preset={preset}
                value={value.tags}
                onChange={(tags) => patch({ tags })}
              />
              <FieldError message={issueOf('tags')} />
            </fieldset>
          </FormSection>

          <FormSection id="images" title="상세 이미지" description={imageNote}>
            <div className={styles.card}>
              {detailImageFields.map(({ field, label }) => (
                <ImageUploader
                  key={field}
                  {...uploaderProps}
                  label={label}
                  ratio="portrait"
                  max={DETAIL_IMAGE_MAX}
                  value={value[field]}
                  onChange={(images) => patch({ [field]: images })}
                />
              ))}
            </div>
            {/* 올리는 중·실패한 사진이 있으면 저장을 막고 여기로 데려온다 — 어느 사진인지는
                그 사진 칸이 빨갛게 보여준다. */}
            <div {...fieldAttr('images')}>
              <FieldError message={issueOf('images')} />
            </div>
          </FormSection>
        </div>

        {editing && (
          <nav className={styles.toc} aria-label="섹션 바로가기">
            <span className={styles.tocTitle}>이 상품의 정보</span>
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={styles.tocLink}>
                {item.label}
                {locked && item.lockable && (
                  <Lock className={styles.tocIcon} aria-label="잠김" />
                )}
              </a>
            ))}
          </nav>
        )}
      </div>

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
          ) : submitError ? (
            <>
              <AlertCircle className={styles.footerIcon} aria-hidden="true" />
              {submitError}
            </>
          ) : (
            pending.length > 0 && (
              <span className={styles.pending}>
                저장하지 않은 변경 {pending.length}곳
                {pending.map((label) => (
                  <Tag
                    key={label}
                    size="small"
                    color="primary"
                    variant="subtle"
                  >
                    {label}
                  </Tag>
                ))}
              </span>
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
          <Button type="submit" disabled={submitting}>
            {waitingForNetwork
              ? '연결 대기 중…'
              : submitting
                ? '저장 중…'
                : locked
                  ? '사진 저장'
                  : submitLabel[mode]}
          </Button>
        </div>
      </div>
    </form>
  )
}

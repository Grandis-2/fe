import { useId, useRef, useState, type FormEvent } from 'react'

import { Search } from 'lucide-react'

import {
  BANNER_BADGES,
  BANNER_TEXT_MAX,
  bannerFormProblem,
  createEmptyBannerFormValue,
  uploadBannerImage,
  type AdminBannerFormValue,
  type BannerFormProblem,
  type BannerTargetType,
} from '@entities/admin-banner'
import { BANNER_ICONS } from '@entities/banner'
import { focusFirstField } from '@shared/lib/focusFirstField'
import {
  Button,
  Chip,
  FieldError,
  FormFooter,
  FormSection,
  ImageUploader,
  Input,
  Modal,
  SegmentedTabs,
  Textarea,
  Toggle,
} from '@shared/ui'

import { BannerPreview } from '../BannerPreview'

import * as styles from './AdminBannerForm.css'

import type { useBannerTargets } from '../../lib/useBannerTargets'

export type AdminBannerFormProps = {
  targets: ReturnType<typeof useBannerTargets>
  /** 저장 중 — 제출을 막는다(연타하면 같은 배너가 여러 장 생긴다) */
  submitting?: boolean
  /** 수정 화면의 초기값. 없으면 빈 폼이다 */
  defaultValue?: AdminBannerFormValue
  submitLabel?: string
  onSubmit: (value: AdminBannerFormValue) => void
  onCancel: () => void
}

const TARGET_TABS = [
  { value: 'PRODUCT', label: '일반 상품' },
  { value: 'PROMOTION', label: '홍보' },
] as const satisfies readonly { value: BannerTargetType; label: string }[]

const ICON_NAMES = Object.keys(BANNER_ICONS) as (keyof typeof BANNER_ICONS)[]

export function AdminBannerForm({
  targets,
  submitting = false,
  defaultValue,
  submitLabel = '만들기',
  onSubmit,
  onCancel,
}: AdminBannerFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [value, setValue] = useState(
    () => defaultValue ?? createEmptyBannerFormValue(),
  )
  const [problem, setProblem] = useState<BannerFormProblem | null>(null)
  const [query, setQuery] = useState('')
  const [previewing, setPreviewing] = useState(false)

  const patch = (partial: Partial<AdminBannerFormValue>) => {
    setValue((prev) => ({ ...prev, ...partial }))
    // 다시 고치기 시작하면 지난 제출의 문구는 맞지 않을 수 있다.
    setProblem(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const found = bannerFormProblem(value)
    setProblem(found)
    if (found) focusFirstField(formRef.current, new Set([found.field]))
    else onSubmit(value)
  }

  const errorOf = (field: keyof AdminBannerFormValue) =>
    problem?.field === field ? problem.message : undefined
  // 오류 문구를 칸·그룹의 설명으로 잇는다 — 칸에 다시 들어가도 스크린리더가 문구를 읽는다.
  const formId = useId()
  const errorId = (field: keyof AdminBannerFormValue) =>
    `${formId}-${field}-error`
  const describedBy = (field: keyof AdminBannerFormValue) =>
    errorOf(field) ? errorId(field) : undefined

  // 예전에 직접 쓴 배지(목록에 없는 문구)는 수정 화면에서 그대로 고를 수 있게 남긴다.
  const badges: readonly string[] =
    !value.badge || BANNER_BADGES.some((badge) => badge === value.badge)
      ? BANNER_BADGES
      : [value.badge, ...BANNER_BADGES]

  const options = targets.options[value.targetType]
  const keyword = query.trim().toLowerCase()
  const shown = options?.filter((option) =>
    option.name.toLowerCase().includes(keyword),
  )

  // 줄바꿈을 담는 칸은 Textarea(글자 수는 칸 안에 뜬다), 한 줄짜리는 Input이다.
  const multiline = (
    field: 'title' | 'description' | 'tabLabel',
    label: string,
  ) => (
    <div className={styles.field} data-field={field}>
      <Textarea
        label={label}
        className={styles.autoGrow}
        maxLength={BANNER_TEXT_MAX[field]}
        aria-invalid={Boolean(errorOf(field)) || undefined}
        aria-describedby={describedBy(field)}
        value={value[field]}
        onChange={(event) => patch({ [field]: event.target.value })}
      />
      <FieldError id={errorId(field)} message={errorOf(field)} />
    </div>
  )

  return (
    <form
      ref={formRef}
      className={styles.root}
      onSubmit={handleSubmit}
      noValidate
    >
      <FormSection
        title="배지"
        description="제목 위 왼쪽에 붙는 작은 표시입니다. 이 배너가 어떤 소식인지 한눈에 알 수 있는 말을 하나 고르세요."
      >
        <div
          className={styles.badges}
          role="group"
          aria-label="배지"
          aria-describedby={describedBy('badge')}
          data-field="badge"
        >
          {badges.map((badge) => (
            <Chip
              key={badge}
              variant="solid"
              selected={value.badge === badge}
              onClick={() => patch({ badge })}
            >
              {badge}
            </Chip>
          ))}
        </div>
        <FieldError id={errorId('badge')} message={errorOf('badge')} />
      </FormSection>

      <FormSection
        title="제목"
        description="배너에서 가장 크게 보이는 문구이고, 누르면 연결 대상으로 이동합니다. 줄바꿈한 그대로 보이니 한 줄이 너무 길지 않게 끊어 주세요."
      >
        {multiline('title', '제목')}
      </FormSection>

      <FormSection
        title="설명"
        description="제목 아래 작은 글씨로 보입니다. 혜택이나 기간처럼 제목에 다 담지 못한 내용을 적어 주세요. 줄바꿈한 그대로 보입니다."
      >
        {multiline('description', '설명')}
      </FormSection>

      <FormSection
        title="탭"
        description="노출 중인 배너가 2개 이상이면 배너 아래에 탭이 생깁니다. 탭은 아이콘 밑에 탭 문구가 붙은 모양이고, 6초마다 다음 배너로 넘어가며 누르면 그 배너로 바로 바뀝니다. 탭 문구는 두 줄까지 보이니 짧게 적어 주세요."
      >
        <div
          className={styles.iconGrid}
          role="group"
          aria-label="탭 아이콘"
          aria-describedby={describedBy('icon')}
          data-field="icon"
        >
          {ICON_NAMES.map((name) => {
            const Icon = BANNER_ICONS[name]
            const selected = value.icon === name
            return (
              <button
                key={name}
                type="button"
                className={[styles.iconButton, selected && styles.selected]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={name}
                aria-pressed={selected}
                title={name}
                onClick={() => patch({ icon: name })}
              >
                <Icon aria-hidden="true" />
              </button>
            )
          })}
        </div>
        <FieldError id={errorId('icon')} message={errorOf('icon')} />
        {/* 고객 화면에서 탭 문구는 아이콘 밑에 놓인다 — 같은 순서로 고른다. */}
        {multiline('tabLabel', '탭 문구')}
      </FormSection>

      <FormSection
        title="배너 사진"
        description="JPG, PNG 한 장, 10MB 이하. 대체 문구는 화면을 읽어 주는 기능이 대신 읽습니다."
      >
        <div className={styles.imageRow}>
          <div data-field="image">
            <ImageUploader
              max={1}
              ratio="banner"
              showCount={false}
              accept="image/jpeg,image/png"
              upload={uploadBannerImage}
              value={value.image}
              onChange={(image) => patch({ image })}
            />
            <FieldError message={errorOf('image')} />
          </div>
          <div className={styles.field} data-field="imageAlt">
            <Input
              label="사진 대체 문구"
              required
              maxLength={BANNER_TEXT_MAX.imageAlt}
              error={errorOf('imageAlt')}
              value={value.imageAlt}
              onChange={(event) => patch({ imageAlt: event.target.value })}
            />
            <span className={styles.counter}>
              {value.imageAlt.length} / {BANNER_TEXT_MAX.imageAlt}
            </span>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="연결 대상"
        description="배너를 누르면 갈 곳입니다. 비공개·판매 중지 상품이나 기간 밖 홍보는 저장은 되지만 그동안 고객에게 보이지 않습니다. 끝난 홍보는 목록에 나오지 않습니다."
      >
        <SegmentedTabs
          items={TARGET_TABS}
          value={value.targetType}
          onChange={(targetType) => {
            patch({ targetType, targetId: '' })
            setQuery('')
          }}
        />
        <Input
          label="이름으로 찾기"
          // 아이콘이 있으면 라벨을 띄우지 않고 placeholder로 보인다.
          icon={<Search />}
          placeholder={
            value.targetType === 'PROMOTION'
              ? '홍보 이름으로 찾기'
              : '상품 이름으로 찾기'
          }
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div
          className={styles.targetList}
          role="radiogroup"
          aria-label="연결 대상"
          aria-describedby={describedBy('targetId')}
          data-field="targetId"
        >
          {targets.isError[value.targetType] ? (
            <FieldError message="목록을 불러오지 못했습니다." />
          ) : targets.isPending[value.targetType] ? (
            <div className={styles.hint}>불러오는 중…</div>
          ) : shown?.length ? (
            shown.map((option) => (
              <label
                key={option.id}
                className={[
                  styles.targetItem,
                  option.taken && styles.targetItemTaken,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name="banner-target"
                  disabled={option.taken}
                  checked={value.targetId === option.id}
                  onChange={() => patch({ targetId: option.id })}
                />
                {option.name}
                {option.taken && (
                  <span className={styles.takenNote}>다른 배너에 연결됨</span>
                )}
              </label>
            ))
          ) : (
            <div className={styles.hint}>
              {keyword
                ? '찾는 이름이 없습니다.'
                : '연결할 수 있는 대상이 없습니다.'}
            </div>
          )}
        </div>
        <FieldError id={errorId('targetId')} message={errorOf('targetId')} />
      </FormSection>

      <FormSection
        title="메인 노출"
        description="끄면 저장만 되고 고객 메인에 보이지 않습니다. 켜도 연결 대상이 비공개·판매 중지 상품이거나 기간 밖 홍보면 그동안 보이지 않습니다. 보이는 순서는 배너 관리 목록의 순서를 따릅니다."
      >
        <label className={styles.toggleRow}>
          <Toggle
            checked={value.visible}
            onChange={(event) => patch({ visible: event.target.checked })}
          />
          고객 메인 화면에 노출
        </label>
      </FormSection>

      <FormFooter onPreview={() => setPreviewing(true)}>
        <Button variant="outline" color="cancel" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </FormFooter>

      <Modal
        open={previewing}
        onClose={() => setPreviewing(false)}
        title="미리보기"
        description="고객 메인 화면 맨 위에 이렇게 보입니다."
        theme="light"
        size="wide"
      >
        <BannerPreview value={value} />
      </Modal>
    </form>
  )
}

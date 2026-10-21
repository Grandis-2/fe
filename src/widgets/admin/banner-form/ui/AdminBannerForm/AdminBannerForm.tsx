import { useState, type FormEvent } from 'react'

import {
  BANNER_TEXT_MAX,
  bannerFormProblem,
  createEmptyBannerFormValue,
  uploadBannerImage,
  type AdminBannerFormValue,
  type BannerTargetType,
} from '@entities/admin-banner'
import { BANNER_ICONS } from '@entities/banner'
import {
  Button,
  FieldError,
  FormSection,
  ImageUploader,
  Input,
  SegmentedTabs,
  Textarea,
  Toggle,
} from '@shared/ui'

import * as styles from './AdminBannerForm.css'

import type { useBannerTargets } from '../../lib/useBannerTargets'

export type AdminBannerFormProps = {
  targets: ReturnType<typeof useBannerTargets>
  /** 저장 중 — 제출을 막는다(연타하면 같은 배너가 여러 장 생긴다) */
  submitting?: boolean
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
  onSubmit,
  onCancel,
}: AdminBannerFormProps) {
  const [value, setValue] = useState(createEmptyBannerFormValue)
  const [problem, setProblem] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const patch = (partial: Partial<AdminBannerFormValue>) => {
    setValue((prev) => ({ ...prev, ...partial }))
    // 고치기 시작하면 지난 제출의 문구는 맞지 않을 수 있다.
    setProblem(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const found = bannerFormProblem(value)
    setProblem(found)
    if (!found) onSubmit(value)
  }

  const options = targets.options[value.targetType]
  const keyword = query.trim().toLowerCase()
  const shown = options?.filter((option) =>
    option.name.toLowerCase().includes(keyword),
  )

  // 줄바꿈을 담는 칸은 Textarea, 한 줄짜리는 Input이다.
  const multiline = (
    field: 'title' | 'description' | 'tabLabel',
    label: string,
  ) => (
    <Textarea
      label={label}
      rows={field === 'description' ? 3 : 2}
      maxLength={BANNER_TEXT_MAX[field]}
      value={value[field]}
      onChange={(event) => patch({ [field]: event.target.value })}
    />
  )

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <FormSection
        title="배지"
        description={`제목 위에 붙는 짧은 문구입니다. ${BANNER_TEXT_MAX.badge}자까지.`}
      >
        <Input
          label="배지"
          required
          maxLength={BANNER_TEXT_MAX.badge}
          value={value.badge}
          onChange={(event) => patch({ badge: event.target.value })}
        />
      </FormSection>

      <FormSection
        title="제목"
        description={`줄바꿈한 그대로 보입니다. ${BANNER_TEXT_MAX.title}자까지.`}
      >
        {multiline('title', '제목')}
      </FormSection>

      <FormSection
        title="설명"
        description={`제목 아래 부가 설명입니다. ${BANNER_TEXT_MAX.description}자까지.`}
      >
        {multiline('description', '설명')}
      </FormSection>

      <FormSection
        title="탭"
        description={`배너 아래 탭에 아이콘과 함께 보입니다. ${BANNER_TEXT_MAX.tabLabel}자까지.`}
      >
        {multiline('tabLabel', '탭 문구')}
        <div className={styles.iconGrid} role="group" aria-label="탭 아이콘">
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
      </FormSection>

      <FormSection
        title="배너 사진"
        description="JPG, PNG 한 장, 10MB 이하. 대체 문구는 화면을 읽어 주는 기능이 대신 읽습니다."
      >
        <div className={styles.imageRow}>
          <ImageUploader
            max={1}
            showCount={false}
            accept="image/jpeg,image/png"
            upload={uploadBannerImage}
            value={value.image}
            onChange={(image) => patch({ image })}
          />
          <Input
            label="사진 대체 문구"
            required
            maxLength={BANNER_TEXT_MAX.imageAlt}
            value={value.imageAlt}
            onChange={(event) => patch({ imageAlt: event.target.value })}
          />
        </div>
      </FormSection>

      <FormSection
        title="연결 대상"
        description="배너를 누르면 갈 곳입니다. 비공개·판매 중지 상품이나 기간 밖 홍보는 저장은 되지만 그동안 고객에게 보이지 않습니다."
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
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={styles.targetList} role="radiogroup">
          {targets.isError[value.targetType] ? (
            <FieldError message="목록을 불러오지 못했습니다." />
          ) : targets.isPending[value.targetType] ? (
            <div className={styles.hint}>불러오는 중…</div>
          ) : shown?.length ? (
            shown.map((option) => (
              <label key={option.id} className={styles.targetItem}>
                <input
                  type="radio"
                  name="banner-target"
                  checked={value.targetId === option.id}
                  onChange={() => patch({ targetId: option.id })}
                />
                {option.name}
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
      </FormSection>

      <FormSection title="노출">
        <label className={styles.toggleRow}>
          <Toggle
            checked={value.visible}
            onChange={(event) => patch({ visible: event.target.checked })}
          />
          고객에게 보이기
        </label>
      </FormSection>

      <div className={styles.actions}>
        <FieldError message={problem ?? undefined} />
        <Button variant="outline" color="cancel" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          만들기
        </Button>
      </div>
    </form>
  )
}

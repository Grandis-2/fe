import { useState, type KeyboardEvent } from 'react'

import { ChevronDown } from 'lucide-react'

import {
  recommendedTags,
  TAG_PRESETS,
  type ProductOptionPreset,
} from '@entities/admin-product'
import { Button, Input, Tag } from '@shared/ui'

import * as fields from '../fields.css'

import * as styles from './TagField.css'

export type TagFieldProps = {
  value: string[]
  onChange: (tags: string[]) => void
  /**
   * 추천을 뽑는 기준이 되는 제품 종류. 아직 안 골랐거나 수정 폼이면 없다 —
   * 그때는 추천을 비우고 전체 목록만 안내한다.
   */
  preset?: ProductOptionPreset
}

/** Tag는 span이라 누를 수 없어 버튼으로 감싼다 — 생김새는 전부 안의 Tag가 가진다. */
function TagToggle({
  tag,
  picked,
  onToggle,
}: {
  tag: string
  picked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      className={styles.tagButton}
      onClick={onToggle}
    >
      {/* 고른 건 채우고 안 고른 건 테두리만 — 색까지 바꾸면 안 고른 태그가
          의미색을 달고 있는 것처럼 읽힌다. */}
      <Tag
        className={styles.tag}
        size="medium"
        color={picked ? 'primary' : 'gray'}
        variant={picked ? 'solid' : 'outline'}
      >
        {tag}
      </Tag>
    </button>
  )
}

/**
 * 검색 태그를 고르고 직접 적는 칸.
 *
 * 위에는 고른 제품 종류에 맞는 추천과 직접 적은 태그만 둔다 — 후보 30여 개를 한꺼번에
 * 펼치면 어느 게 이 상품에 맞는 말인지 고르기 어렵다. 나머지는 '전체 보기'로 접어 둔다.
 */
export function TagField({ value, onChange, preset }: TagFieldProps) {
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)

  const recommended = recommendedTags(preset)
  // 직접 적은 태그만 위에 둔다 — 후보 목록에 없는 말이라 아래에 설 자리가 없다.
  const typed = value.filter((tag) => !TAG_PRESETS.includes(tag))
  // 추천으로 위에 올라간 것만 뺀다. 고른 태그는 제자리에 남는다 — 누르자마자
  // 위로 올라가면 방금 누른 칩이 손가락 아래에서 사라지고 줄이 다시 짜인다.
  const rest = TAG_PRESETS.filter((tag) => !recommended.includes(tag))
  // 접으면 아래에서 고른 게 안 보이니 몇 개인지는 버튼에 적어 둔다.
  const restPickedCount = rest.filter((tag) => value.includes(tag)).length

  const toggle = (tag: string) =>
    onChange(
      value.includes(tag)
        ? value.filter((item) => item !== tag)
        : [...value, tag],
    )

  const add = () => {
    const tag = draft.trim()
    // 같은 태그가 두 번 들어가도 검색에 보탬이 없다 — 입력칸만 비운다.
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    // 폼 안의 Enter는 그냥 두면 상품 등록까지 보낸다.
    event.preventDefault()
    add()
  }

  return (
    <div className={styles.root}>
      <div className={styles.addRow}>
        <Input
          className={fields.growField}
          size="small"
          label="태그 직접 입력"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          color="primary"
          size="small"
          disabled={draft.trim() === ''}
          onClick={add}
        >
          추가
        </Button>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>
          {recommended.length > 0
            ? `${preset?.name} 추천 태그`
            : '제품 카테고리를 고르면 추천 태그가 나옵니다'}
        </div>
        {(typed.length > 0 || recommended.length > 0) && (
          <div className={styles.tags}>
            {[...typed, ...recommended].map((tag) => (
              <TagToggle
                key={tag}
                tag={tag}
                picked={value.includes(tag)}
                onToggle={() => toggle(tag)}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.group}>
        <button
          type="button"
          aria-expanded={expanded}
          className={styles.moreButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? '그 외 태그 접기'
            : `그 외 태그 전체 보기 (${rest.length}${
                restPickedCount > 0 ? ` · ${restPickedCount}개 선택` : ''
              })`}
          <ChevronDown
            className={expanded ? styles.chevronUp : styles.chevron}
            aria-hidden="true"
          />
        </button>
        {expanded && (
          <div className={styles.tags}>
            {rest.map((tag) => (
              <TagToggle
                key={tag}
                tag={tag}
                picked={value.includes(tag)}
                onToggle={() => toggle(tag)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

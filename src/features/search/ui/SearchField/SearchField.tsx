import { useRef, type Ref } from 'react'

import { Search, X } from 'lucide-react'

import { KEYWORD_MAX_LENGTH, toKeyword } from '../../lib/toKeyword'

import * as styles from './SearchField.css'

export type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  // 엔터. toKeyword로 정리한 검색어가 빈 문자열이면 부르지 않는다.
  onSubmit: (keyword: string) => void
  ref?: Ref<HTMLInputElement>
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  ref,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form
      role="search"
      className={styles.field}
      onSubmit={(event) => {
        event.preventDefault()
        const keyword = toKeyword(value)
        if (keyword) onSubmit(keyword)
      }}
    >
      <Search className={styles.icon} aria-hidden="true" />
      <input
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="search"
        // 모바일 키보드의 엔터 키를 '검색'으로 보이게 한다.
        enterKeyHint="search"
        maxLength={KEYWORD_MAX_LENGTH}
        className={styles.input}
        value={value}
        placeholder="상품명이나 모델을 검색해 보세요"
        aria-label="검색어"
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="검색어 지우기"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </form>
  )
}

import * as styles from './CodeBlock.css'

export type CodeBlockProps = {
  code: string
  /** 눈에 띄게 할 줄 — 판단에 쓰는 값(이벤트 종류 등) */
  highlight?: (line: string) => boolean
  /** 스크린리더가 읽을 이름 */
  label: string
  className?: string
}

/**
 * 원문·JSON 같은 긴 글을 고정폭 글꼴로 보여주는 어두운 상자. 길면 상자 안에서 스크롤하고,
 * highlight가 고른 줄은 노란 띠로 강조한다.
 */
export function CodeBlock({
  code,
  highlight,
  label,
  className,
}: CodeBlockProps) {
  return (
    // 길면 상자 안에서 스크롤하므로 키보드로도 닿게 한다.
    <pre
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label={label}
      tabIndex={0}
    >
      {code.split('\n').map((line, index) => (
        // 줄은 순서가 곧 정체라 index를 키로 쓴다.
        <span
          key={index}
          className={highlight?.(line) ? styles.marked : undefined}
        >
          {line}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

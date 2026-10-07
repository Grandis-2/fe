export type HighlightProps = {
  text: string
  match: string
  // 겹치는 부분에 입힐 스타일 — 쓰는 곳마다 강조 색이 다르다.
  className: string
}

// 검색어와 겹치는 첫 부분만 강조한다 — 대소문자는 가리지 않는다.
export function Highlight({ text, match, className }: HighlightProps) {
  const start = text.toLowerCase().indexOf(match.toLowerCase())
  if (!match || start < 0) return <span>{text}</span>
  const end = start + match.length
  return (
    <span>
      {text.slice(0, start)}
      <b className={className}>{text.slice(start, end)}</b>
      {text.slice(end)}
    </span>
  )
}

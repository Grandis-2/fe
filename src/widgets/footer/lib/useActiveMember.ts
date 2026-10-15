import { useEffect, useState } from 'react'

import { DEFAULT_MEMBER_ID, TEAM } from '../model/team'

// 상세가 흐려졌다가 새 팀원으로 다시 나타나기까지의 간격.
const FADE_MS = 170

// 데스크톱은 행성에 올린(hover) 팀원이, 없으면 누른(선택) 팀원이, 그것도 없으면 기본 팀원이 활성이다.
// 상세는 활성이 바뀌면 잠깐 흐려졌다가(isShownVisible=false) FADE_MS 뒤 새 팀원으로 바뀐다.
export function useActiveMember() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = hoveredId ?? selectedId ?? DEFAULT_MEMBER_ID
  const [shownId, setShownId] = useState(activeId)

  useEffect(() => {
    const timer = setTimeout(() => setShownId(activeId), FADE_MS)
    return () => clearTimeout(timer)
  }, [activeId])

  return {
    activeId,
    shownMember: TEAM.find((member) => member.id === shownId) ?? TEAM[0],
    isShownVisible: shownId === activeId,
    hover: setHoveredId,
    // 같은 팀원을 다시 누르면 선택을 푼다.
    toggle: (id: string) => {
      setHoveredId(null)
      setSelectedId((current) => (current === id ? null : id))
    },
  }
}

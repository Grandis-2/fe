export type TeamRole = 'Frontend' | 'Backend'

export type TeamMember = {
  id: string
  name: string
  role: TeamRole
  /** GitHub 아이디(@ 없이) */
  handle: string
  github: string
  /** 맡은 기능 — 상세의 WORKED ON 태그 */
  features: string[]
}

// 궤도 가운데 GitHub 버튼이 여는 저장소.
export const REPO = {
  url: 'https://github.com/Grandis-2',
  label: 'Grandis-Nova',
}

// ponytail: 시안의 자리표시 값 그대로다 — 실제 팀원 이름·GitHub·담당 기능이 정해지면 여기만 바꾼다.
const placeholder = (id: string, role: TeamRole, name: string): TeamMember => ({
  id,
  name,
  role,
  handle: 'username',
  github: 'https://github.com/',
  features: ['담당 기능 1', '담당 기능 2', '담당 기능 3'],
})

export const TEAM: TeamMember[] = [
  placeholder('fe0', 'Frontend', 'Frontend 1'),
  placeholder('fe1', 'Frontend', 'Frontend 2'),
  placeholder('be0', 'Backend', 'Backend 1'),
  placeholder('be1', 'Backend', 'Backend 2'),
  placeholder('be2', 'Backend', 'Backend 3'),
  placeholder('be3', 'Backend', 'Backend 4'),
  placeholder('be4', 'Backend', 'Backend 5'),
]

// 아무도 고르지 않았을 때 상세에 보여 줄 팀원.
export const DEFAULT_MEMBER_ID = 'be0'

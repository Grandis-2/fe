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
const placeholder = (
  id: string,
  role: TeamRole,
  name: string,
  handle: string,
  features: string[],
): TeamMember => ({
  id,
  name,
  role,
  handle,
  github: `https://github.com/${handle}`,
  features,
})

export const TEAM: TeamMember[] = [
  placeholder('0', 'Backend', '설승환', 'SH-Seol', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('1', 'Backend', '김태중', 'taejoong15', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('2', 'Frontend', '김혜진', 'llmeajinll', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('3', 'Backend', '유희준', 'UHeeJoon', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('4', 'Frontend', '이주현', 'hana03030', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('5', 'Backend', '이호성', 'leehosss', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
  placeholder('6', 'Backend', '허건', 'HUHGEON', [
    '담당 기능 1',
    '담당 기능 2',
  ]),
]

// 아무도 고르지 않았을 때 상세에 보여 줄 팀원.
export const DEFAULT_MEMBER_ID = '0'

import { style, styleVariants } from '@vanilla-extract/css'

import {
  color,
  motion,
  onDark,
  spacing,
  typography,
} from '@shared/config/theme'

// 크기·여백은 dialog가 아니라 안쪽 래퍼(content)가 갖는다.
// position은 건드리지 않는다 — <dialog>를 showModal()로 띄우면 브라우저 기본
// 스타일시트가 position:fixed + inset:0 + margin:auto로 항상 가운데 정렬해 준다.
export const dialog = style({
  // 전역 리셋(`* { margin: 0 }`, app/styles/index.css)이 author 스타일이라
  // dialog:modal의 UA 기본 margin:auto(중앙 정렬)를 항상 이긴다 — 명시적으로 되살린다.
  margin: 'auto',
  boxSizing: 'border-box',
  // 남색→보라로 번지는 1px 테두리 — 바탕은 padding-box, 그라데이션은 border-box에 깔아
  // 투명한 border 자리로만 비치게 한다. 내용이 자기 바탕을 깔아도 dialog의
  // overflow:auto(:modal UA 기본)가 둥근 모서리로 잘라 준다.
  border: '1px solid transparent',
  borderRadius: '24px',
  padding: 0,
  background: [
    `linear-gradient(${color.background.base}, ${color.background.base}) padding-box`,
    `linear-gradient(140deg, color-mix(in srgb, ${color.primary.subtle} 60%, transparent), ${onDark(6)} 40%, ${onDark(4)} 60%, color-mix(in srgb, ${color.secondary.subtle} 50%, transparent)) border-box`,
  ].join(', '),
  boxShadow: `0 30px 80px rgba(0, 0, 0, 0.7), 0 0 100px color-mix(in srgb, ${color.primary.base} 35%, transparent)`,
  opacity: 0,
  transform: 'scale(0.95)',
  transition: [
    `opacity ${motion.duration.normal} ${motion.easing.out}`,
    `transform ${motion.duration.normal} ${motion.easing.out}`,
    `overlay ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
    `display ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
  ].join(', '),
  selectors: {
    '&[open]': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '&::backdrop': {
      background: 'transparent',
      backdropFilter: 'blur(0)',
      transition: [
        `background ${motion.duration.normal} ${motion.easing.out} allow-discrete`,
        `backdrop-filter ${motion.duration.normal} ${motion.easing.out}`,
      ].join(', '),
    },
    '&[open]::backdrop': {
      background: `color-mix(in srgb, ${color.backgroundDark.base} 62%, transparent)`,
      backdropFilter: 'blur(4px)',
    },
  },
  '@starting-style': {
    selectors: {
      '&[open]': {
        opacity: 0,
        transform: 'scale(0.95)',
      },
      '&[open]::backdrop': {
        background: 'transparent',
        backdropFilter: 'blur(0)',
      },
    },
  },
})

// 모든 모달이 같은 폭·여백을 쓴다 — 내용마다 달리 잡던 걸 한 곳으로 모았다.
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[16],
  maxWidth: '100%',
  padding: `${spacing[32]} ${spacing[24]} ${spacing[24]}`,
  boxSizing: 'border-box',
})

// wide는 화면을 통째로 담는 모달(상품 상세 미리보기)용 — 구매자 상세의 웹 폭과 맞춘다.
// 높이를 dialog의 UA 최대 높이(100% - 2em - 6px, 테두리 2px 제외)에 맞춰 dialog 자체는 스크롤되지
// 않게 하고, 본문(scrollBody)만 스크롤한다 — 제목·닫기 버튼이 따라 올라가지 않고, 스크롤바가
// 둥근 모서리에 걸치지 않는다.
export const size = styleVariants({
  default: { width: '400px' },
  wide: {
    width: '1200px',
    maxHeight: 'calc(100dvh - 2em - 8px)',
    paddingRight: spacing[8],
  },
})

// 오른쪽 여백을 content 대신 여기서 남겨, 스크롤바가 내용과 모서리 사이 여백 안에 놓이게 한다.
export const scrollBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  paddingRight: spacing[8],
  // 제목 밑·모달 바닥에서 내용이 칼같이 잘리지 않게 가장자리를 흐린다. 같은 폭만큼 위아래를
  // 비워 둬서, 스크롤하지 않은 상태에선 내용이 흐려지지 않는다.
  paddingBlock: spacing[16],
  maskImage: `linear-gradient(transparent, black ${spacing[16]}, black calc(100% - ${spacing[16]}), transparent)`,
  scrollbarWidth: 'thin',
  scrollbarColor: `${color.border.hover} transparent`,
  scrollbarGutter: 'stable',
})

// 한글은 기본값이면 글자 단위로 끊겨 '시도합니 / 다'처럼 단어 중간에서 줄이 바뀐다.
// keep-all로 어절 단위로만 끊고, 띄어쓰기 없는 긴 값(예약번호 등)은 넘치지 않게 끊어 준다.
const wrapByWord = {
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
} as const

export const title = style([
  typography.title.lgSemibold,
  {
    color: color.text.primary,
    textAlign: 'center',
    // 오른쪽 위 닫기(X) 버튼과 겹치지 않게 양옆을 비운다(가운데 정렬이라 대칭으로).
    paddingInline: spacing[32],
    ...wrapByWord,
  },
])

export const description = style([
  typography.body.sub,
  {
    color: color.text.secondary,
    textAlign: 'center',
    // 줄바꿈을 그대로 살린다 — 안내 문구는 문장 단위로 끊어 읽힌다.
    whiteSpace: 'pre-line',
    ...wrapByWord,
  },
])

export const actions = style({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[8],
  marginTop: spacing[8],
})

// X는 콘텐츠 padding과 무관하게 항상 dialog 우상단에 고정한다.
export const closeButton = style({
  position: 'absolute',
  top: spacing[16],
  right: spacing[16],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  color: color.text.tertiary,
  cursor: 'pointer',
  transition: `background ${motion.duration.fast} ${motion.easing.default}`,
  // 밝은 내용(배송지 폼)과 어두운 내용(대기열) 위에 다 얹히므로 글자색을 바꾸지 않고,
  // 자기 글자색을 옅게 깐 원으로만 hover를 보여 준다.
  selectors: {
    '&:hover': {
      background: 'color-mix(in srgb, currentColor 14%, transparent)',
    },
  },
})

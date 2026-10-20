import { style } from '@vanilla-extract/css'

import { color } from '@shared/config/theme'
import { fontWeight } from '@shared/config/theme/tokens/typography/base'

import { panel, panelHeader, panelLink, panelTitle } from '../panel.css'

export const root = panel
export const header = panelHeader
export const title = panelTitle
export const link = panelLink

// 칸 글자 크기·여백은 공용 표(Table)를 따르고, 상품 이름만 굵게 한다.
export const name = style({
  fontWeight: fontWeight.semibold,
  color: color.text.primary,
})

export const failures = style({
  fontWeight: fontWeight.semibold,
  color: color.status.danger,
})

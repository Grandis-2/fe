import { globalStyle, style } from '@vanilla-extract/css'

import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from './base'

const face = { fontFamily: fontFamily.pretendard }

// 모든 페이지의 기본 서체 — typography 토큰을 안 쓴 글자(InlineAlert big 제목 등)가 브라우저
// 기본값(명조)으로 떨어지지 않게 한다. 색상 쪽 body 기본값(color/semantic.css.ts)과 짝.
globalStyle('body', face)

export const title = {
  xxlSemibold: style({
    ...face,
    fontSize: fontSize[32],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[4],
  }),
  xlSemibold: style({
    ...face,
    fontSize: fontSize[24],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[4],
  }),
  lgSemibold: style({
    ...face,
    fontSize: fontSize[20],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[2],
  }),
  mdSemibold: style({
    ...face,
    fontSize: fontSize[18],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[4],
  }),
  mdMedium: style({
    ...face,
    fontSize: fontSize[18],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[4],
  }),
  smMedium: style({
    ...face,
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[140],
    letterSpacing: letterSpacing[4],
  }),
}

export const display = {
  time: style({
    ...face,
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[150],
    letterSpacing: letterSpacing[2],
  }),
}

export const navigation = {
  tab: style({
    ...face,
    fontSize: fontSize[20],
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
}

export const button = {
  smMedium: style({
    ...face,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[0],
  }),
  lgSemibold: style({
    ...face,
    fontSize: fontSize[20],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[0],
  }),
  mdBold: style({
    ...face,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[4],
  }),
}

export const body = {
  defaultRegular: style({
    ...face,
    fontSize: fontSize[16],
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[4],
  }),
  defaultMedium: style({
    ...face,
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[4],
  }),
  subSemibold: style({
    ...face,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
  subMedium: style({
    ...face,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
  sub: style({
    ...face,
    fontSize: fontSize[14],
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
  caption: style({
    ...face,
    fontSize: fontSize[12],
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
  captionMedium: style({
    ...face,
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[130],
    letterSpacing: letterSpacing[2],
  }),
  smallArticleMedium: style({
    ...face,
    fontSize: fontSize[14],
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight[150],
    letterSpacing: letterSpacing[4],
  }),
}

export const logo = {
  wordmark: style({
    fontFamily: fontFamily.michroma,
    fontSize: fontSize[24],
    fontWeight: fontWeight.regular,
    lineHeight: 'normal',
    letterSpacing: letterSpacing[4],
  }),
}

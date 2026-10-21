import type {
  Draw as DrawDto,
  DrawEntry as DrawEntryDto,
  DrawEntryStatus as DrawEntryStatusDto,
  DrawGift as DrawGiftDto,
  DrawPage as DrawPageDto,
  DrawPhase as DrawPhaseDto,
  EnterDrawRequest as EnterDrawRequestDto,
  EntryConfirmResponse,
  EntryPaymentAttempt,
  MyDrawEntriesResponse,
  MyDrawEntryFilter as MyDrawEntryFilterDto,
  MyDrawEntryItem,
  MyDrawEntryState as MyDrawEntryStateDto,
} from '@shared/api/types'

// order 서비스의 럭키 드로우 — 응답 모양 그대로 쓴다. 시각은 ISO 문자열이고, 화면이 필요할 때 Date로 바꾼다.
export type Draw = DrawDto
export type DrawGift = DrawGiftDto
export type DrawPage = DrawPageDto
export type DrawPhase = DrawPhaseDto
export type DrawEntry = DrawEntryDto
export type DrawEntryStatus = DrawEntryStatusDto
export type EnterDrawRequest = EnterDrawRequestDto
export type DrawPaymentAttempt = EntryPaymentAttempt
export type DrawPaymentResult = EntryConfirmResponse
export type MyDrawEntry = MyDrawEntryItem
export type MyDrawEntryState = MyDrawEntryStateDto
export type MyDrawEntryFilter = MyDrawEntryFilterDto
export type MyDrawEntryPage = MyDrawEntriesResponse

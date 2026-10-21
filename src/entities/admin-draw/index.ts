// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수를 내보내면 signal 취소·
// 4xx 재시도 차단을 건너뛰는 길이 열린다. 폼 값을 요청으로 바꾸는 매퍼도 훅 안에서만 쓴다.
export {
  DrawUnconfirmedError,
  useAdminDraw,
  useAdminDrawProgress,
  useAdminDraws,
  useCreateAdminDraw,
  useStuckDraws,
} from './api/useAdminDraws'
export {
  drawPhaseColor,
  drawPhaseLabel,
  drawPhaseLabels,
  drawPhases,
} from './model/types'
export type {
  AdminDraw,
  AdminDrawPhase,
  AdminDrawProgress,
} from './model/types'
export {
  DRAW_STUCK_AFTER_MS,
  drawStageDescription,
  drawStageLabel,
  drawStageOf,
  drawStageSteps,
  isDrawSettled,
} from './model/stage'
export type { DrawStage } from './model/stage'
export {
  createEmptyDrawFormValue,
  DRAW_ENTRY_FEE_MIN,
  DRAW_TITLE_MAX,
  drawServerIssuesOf,
  validateDrawForm,
} from './model/form'
export type {
  AdminDrawFormValue,
  DrawFormField,
  DrawFormIssue,
} from './model/form'

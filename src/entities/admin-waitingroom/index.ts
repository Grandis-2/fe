// 밖에서는 TanStack Query 훅으로만 들어온다.
export {
  useAdmissionRates,
  useChangeAdmissionRate,
  useWaitingroomStatus,
} from './api/useAdminWaitingroom'
export type { AdmissionRateChange } from './api/useAdminWaitingroom'
export {
  isBraking,
  LEAVE_GRACE_SECONDS_RANGE,
  MAX_WAIT_SECONDS_RANGE,
  settingSourceLabel,
  WAITINGROOM_DEFAULTS,
  waitingroomPhaseLabel,
  waitingroomRuntimeColor,
  waitingroomRuntimeLabel,
  waitingroomRuntimeLabels,
} from './model/types'
export type {
  AdmissionRates,
  WaitingroomProductRate,
  WaitingroomProductStatus,
  WaitingroomSetting,
  WaitingroomStatus,
} from './model/types'

// 밖에서는 TanStack Query 훅으로만 들어온다.
export { useExternalLedgerHasRows } from './api/useExternalLedger'
export {
  useInjectMockFault,
  useMockConfig,
  useResetMockLedger,
  useUpdateMockConfig,
} from './api/useExternalMock'
export {
  externalStatusLabel,
  MOCK_FAULT_DELAY_MAX_MS,
  MOCK_LATENCY_MAX_MS,
  mockFailureModeLabel,
  mockFaultTypeLabel,
  mockMixedResponseLabel,
  mockMixedResponses,
} from './model/types'
export type {
  ExternalReservation,
  MockConfig,
  MockConfigUpdate,
  MockFailureMode,
  MockFaultType,
  MockMixedResponse,
} from './model/types'

import { http } from 'msw'

import { ok } from '../response'
import { url } from '../url'

import type { CountResponse } from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 알림 목록/읽음 처리 API가 아직 없어 개수만 고정값으로 흉내낸다.
const UNREAD_COUNT = 5

export const notificationHandlers: RequestHandler[] = [
  http.get(url('/api/v1/notifications/unread-count'), () =>
    ok<CountResponse>({ count: UNREAD_COUNT }),
  ),
]

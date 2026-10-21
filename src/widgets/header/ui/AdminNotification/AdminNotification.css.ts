import { style } from '@vanilla-extract/css'

import { color, spacing, typography } from '@shared/config/theme'

// 회원 알림 목록의 빈 상태(NotificationList의 status)와 같은 자리·글자.
export const empty = style([
  typography.body.sub,
  {
    padding: `${spacing[32]} ${spacing[20]}`,
    textAlign: 'center',
    color: color.text.tertiary,
  },
])

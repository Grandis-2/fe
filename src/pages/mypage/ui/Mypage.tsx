import { useSearchParams } from 'react-router'

import { MYPAGE_TABS } from '@/shared/config/routes'
import { Container } from '@/shared/ui'
import { MypageAddress } from '@/widgets/mypage-address'
import { MypageCart } from '@/widgets/mypage-cart'
import { MypageHistory } from '@/widgets/mypage-history'
import { MypageMenu, type MypageMenuLink } from '@/widgets/mypage-menu'
import { MypagePreorder } from '@/widgets/mypage-preorder'

import * as styles from './Mypage.css'

// ponytail: 아직 인증/유저 API가 없어서 목업 이름으로 대체
const userName = '기매진'

const defaultLink: MypageMenuLink = 'preorder-check'

const linkTitle: Record<MypageMenuLink, string> = {
  'preorder-check': '사전예약 확인',
  cart: '장바구니',
  history: '구매 내역',
  'address-manage': '배송지 관리',
}

function renderContent(activeLink: MypageMenuLink) {
  switch (activeLink) {
    case 'preorder-check':
      return <MypagePreorder />
    case 'cart':
      return <MypageCart />
    case 'history':
      return <MypageHistory />
    case 'address-manage':
      return <MypageAddress />
  }
}

export function Mypage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = searchParams.get('state')
  // ?state=foo처럼 알 수 없는 값은 기본 탭으로 본다 — 캐스트만 하면 제목/내용이 비어 버린다.
  const activeLink = MYPAGE_TABS.find((tab) => tab === state) ?? defaultLink

  const handleLinkClick = (link: MypageMenuLink) => {
    setSearchParams({ state: link })
  }

  return (
    <Container>
      <div className={styles.root}>
        <MypageMenu
          userName={userName}
          activeLink={activeLink}
          onLinkClick={handleLinkClick}
        />
        <div className={styles.content}>
          <div className={styles.title}>{linkTitle[activeLink]}</div>
          {renderContent(activeLink)}
        </div>
      </div>
    </Container>
  )
}

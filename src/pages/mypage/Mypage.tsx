import { useSearchParams } from 'react-router'

import { useProfile } from '@entities/profile'
import { MYPAGE_TABS } from '@shared/config/routes'
import { Container } from '@shared/ui'
import { MypageAddress } from '@widgets/mypage-address'
import { MypageCart } from '@widgets/mypage-cart'
import { MypageHistory } from '@widgets/mypage-history'
import { MypageMenu, type MypageMenuLink } from '@widgets/mypage-menu'
import { MypagePreorder } from '@widgets/mypage-preorder'
import { MypageReviews } from '@widgets/mypage-reviews'

import * as styles from './Mypage.css'

const defaultLink: MypageMenuLink = 'preorder-check'

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
    case 'reviews':
      return <MypageReviews />
  }
}

export function Mypage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: profile } = useProfile()
  const state = searchParams.get('state')
  // ?state=foo처럼 알 수 없는 값은 기본 탭으로 본다 — 캐스트만 하면 내용이 비어 버린다.
  const activeLink = MYPAGE_TABS.find((tab) => tab === state) ?? defaultLink

  const handleLinkClick = (link: MypageMenuLink) => {
    setSearchParams({ state: link })
    window.scrollTo(0, 0)
  }

  return (
    <div className={styles.root} data-theme="dark" data-header-theme="dark">
      <Container>
        <div className={styles.layout}>
          <MypageMenu
            userName={profile?.name || profile?.displayName}
            email={profile?.email ?? undefined}
            activeLink={activeLink}
            onLinkClick={handleLinkClick}
          />
          <main className={styles.content}>{renderContent(activeLink)}</main>
        </div>
      </Container>
    </div>
  )
}

import { useSearchParams } from 'react-router'

import { MYPAGE_TABS } from '@/shared/config/routes'
import { Container, SegmentedTabs } from '@/shared/ui'
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

// 모바일 탭은 4개가 한 줄에 들어가야 해서 제목보다 짧게 쓴다.
const mobileTabLabel: Record<MypageMenuLink, string> = {
  'preorder-check': '사전예약',
  cart: '장바구니',
  history: '구매내역',
  'address-manage': '배송지',
}

const mobileTabs = MYPAGE_TABS.map((tab) => ({
  value: tab,
  label: mobileTabLabel[tab],
}))

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
        {/* 모바일은 사이드 메뉴 대신 이름 + 가로 탭을 쓴다 — 노출 전환은 CSS 미디어쿼리로. */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileUserName}>{userName} 님</div>
          <SegmentedTabs
            className={styles.mobileTabs}
            items={mobileTabs}
            value={activeLink}
            onChange={handleLinkClick}
          />
        </div>
        <MypageMenu
          className={styles.desktopOnly}
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

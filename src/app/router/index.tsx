import { createBrowserRouter } from 'react-router'

import { AdminLayout } from '@/app/layouts/AdminLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { KAKAO_CALLBACK_PATH } from '@/features/kakao-login'
import { PAYMENT_CALLBACK_PATH } from '@/features/toss-payment'
import { AdminHomePage } from '@/pages/admin-home'
import { AdminPlaceholderPage } from '@/pages/admin-placeholder'
import { AdminProductDetailPage } from '@/pages/admin-product-detail'
import { AdminProductNewPage } from '@/pages/admin-product-new'
import { AdminProductsPage } from '@/pages/admin-products'
import { AdminPromotionEditPage } from '@/pages/admin-promotion-edit'
import { AdminPromotionNewPage } from '@/pages/admin-promotion-new'
import { AdminPromotionsPage } from '@/pages/admin-promotions'
import { AdminReservationDetailPage } from '@/pages/admin-reservation-detail'
import { AdminReservationsPage } from '@/pages/admin-reservations'
import { KakaoCallbackPage } from '@/pages/kakao-callback'
import { MainPage } from '@/pages/main'
import { Mypage } from '@/pages/mypage'
import { NotFoundPage } from '@/pages/not-found'
import { PaymentPage } from '@/pages/payment'
import { PaymentCallbackPage } from '@/pages/payment-callback'
import { PreorderPage } from '@/pages/preorder'
import { PreorderDetailPage } from '@/pages/preorder-detail'
import { ProductDetailPage } from '@/pages/product-detail'
import { ResultPage } from '@/pages/result'
import { ReviewsPage } from '@/pages/reviews'
import { SearchPage } from '@/pages/search'
import { SignupPage } from '@/pages/signup'
import { SIGNUP_PATH } from '@/shared/config/routes'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <MainPage /> },
          { path: '/preorder', element: <PreorderPage /> },
          { path: '/preorder/:preorderId', element: <PreorderDetailPage /> },
          { path: '/products/:productId', element: <ProductDetailPage /> },
          { path: '/payment', element: <PaymentPage /> },
          { path: PAYMENT_CALLBACK_PATH, element: <PaymentCallbackPage /> },
          { path: '/result', element: <ResultPage /> },
          { path: '/reviews', element: <ReviewsPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: SIGNUP_PATH, element: <SignupPage /> },
          {
            path: KAKAO_CALLBACK_PATH,
            element: <KakaoCallbackPage />,
          },
          { path: '/mypage', element: <Mypage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminHomePage /> },
          // 홈을 제외한 나머지는 아직 기능 범위가 안 정해져서 전부 placeholder —
          // 스코프가 정해지는 대로 각자 전용 페이지로 교체.
          { path: '/admin/products', element: <AdminProductsPage /> },
          { path: '/admin/products/new', element: <AdminProductNewPage /> },
          {
            path: '/admin/products/:productId',
            element: <AdminProductDetailPage />,
          },
          { path: '/admin/preorders', element: <AdminPromotionsPage /> },
          { path: '/admin/preorders/new', element: <AdminPromotionNewPage /> },
          {
            path: '/admin/preorders/:promotionId',
            element: <AdminPromotionEditPage />,
          },
          { path: '/admin/orders', element: <AdminReservationsPage /> },
          {
            path: '/admin/orders/:reservationId',
            element: <AdminReservationDetailPage />,
          },
          {
            path: '/admin/consistency-check',
            element: <AdminPlaceholderPage title="정합성 대조" />,
          },
          {
            path: '/admin/load-test',
            element: <AdminPlaceholderPage title="부하 검증" />,
          },
          {
            path: '/admin/notifications',
            element: <AdminPlaceholderPage title="관리자 알림 내역 확인" />,
          },
          {
            path: '/admin/mock-settings',
            element: <AdminPlaceholderPage title="Mock 설정" />,
          },
        ],
      },
    ],
  },
])

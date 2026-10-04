import { createBrowserRouter } from 'react-router'

import { AdminLayout } from '@app/layouts/AdminLayout'
import { MainLayout } from '@app/layouts/MainLayout'
import { RequireLogin } from '@app/layouts/RequireLogin'
import { RootLayout } from '@app/layouts/RootLayout'
import { KAKAO_CALLBACK_PATH } from '@features/login'
import { PAYMENT_CALLBACK_PATH } from '@features/payment'
import { AdminHomePage } from '@pages/admin-home'
import { AdminPlaceholderPage } from '@pages/admin-placeholder'
import { AdminProductDetailPage } from '@pages/admin-product-detail'
import { AdminProductNewPage } from '@pages/admin-product-new'
import { AdminProductsPage } from '@pages/admin-products'
import { AdminPromotionEditPage } from '@pages/admin-promotion-edit'
import { AdminPromotionNewPage } from '@pages/admin-promotion-new'
import { AdminPromotionsPage } from '@pages/admin-promotions'
import { AdminReservationsPage } from '@pages/admin-reservations'
import { KakaoCallbackPage } from '@pages/kakao-callback/KakaoCallbackPage'
import { MainPage } from '@pages/main/MainPage'
import { Mypage } from '@pages/mypage/Mypage'
import { NotFoundPage } from '@pages/not-found/NotFoundPage'
import { PaymentPage } from '@pages/payment/PaymentPage'
import { PaymentCallbackPage } from '@pages/payment-callback/PaymentCallbackPage'
import { PreorderPage } from '@pages/preorder/PreorderPage'
import { PreorderDetailPage } from '@pages/preorder-detail/PreorderDetailPage'
import { ProductDetailPage } from '@pages/product-detail/ProductDetailPage'
import { ResultPage } from '@pages/result/ResultPage'
import { ReviewsPage } from '@pages/reviews/ReviewsPage'
import { SearchPage } from '@pages/search/SearchPage'
import { SignupPage } from '@pages/signup/SignupPage'
import {
  ADMIN_CONSISTENCY_CHECK_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOAD_TEST_PATH,
  ADMIN_MOCK_SETTINGS_PATH,
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PRODUCT_NEW_PATH,
  ADMIN_PRODUCTS_PATH,
  ADMIN_PROMOTION_NEW_PATH,
  ADMIN_PROMOTIONS_PATH,
  ADMIN_RESERVATIONS_PATH,
  adminProductPath,
  adminPromotionPath,
  HOME_PATH,
  MYPAGE_PATH,
  PAYMENT_PATH,
  PREORDER_PATH,
  preorderPath,
  productPath,
  RESULT_PATH,
  REVIEWS_PATH,
  SEARCH_PATH,
  SIGNUP_PATH,
} from '@shared/config/routes'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: HOME_PATH, element: <MainPage /> },
          { path: PREORDER_PATH, element: <PreorderPage /> },
          {
            path: preorderPath(':preorderId'),
            element: <PreorderDetailPage />,
          },
          {
            path: productPath(':productId'),
            element: <ProductDetailPage />,
          },
          { path: REVIEWS_PATH, element: <ReviewsPage /> },
          { path: SEARCH_PATH, element: <SearchPage /> },
          { path: SIGNUP_PATH, element: <SignupPage /> },
          {
            path: KAKAO_CALLBACK_PATH,
            element: <KakaoCallbackPage />,
          },
          {
            // 사전예약·장바구니·결제는 회원 전용이다.
            element: <RequireLogin />,
            children: [
              { path: MYPAGE_PATH, element: <Mypage /> },
              { path: PAYMENT_PATH, element: <PaymentPage /> },
              { path: PAYMENT_CALLBACK_PATH, element: <PaymentCallbackPage /> },
              { path: RESULT_PATH, element: <ResultPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <AdminLayout />,
        children: [
          { path: ADMIN_HOME_PATH, element: <AdminHomePage /> },
          // 홈을 제외한 나머지는 아직 기능 범위가 안 정해져서 전부 placeholder —
          // 스코프가 정해지는 대로 각자 전용 페이지로 교체.
          { path: ADMIN_PRODUCTS_PATH, element: <AdminProductsPage /> },
          { path: ADMIN_PRODUCT_NEW_PATH, element: <AdminProductNewPage /> },
          {
            path: adminProductPath(':productId'),
            element: <AdminProductDetailPage />,
          },
          { path: ADMIN_PROMOTIONS_PATH, element: <AdminPromotionsPage /> },
          {
            path: ADMIN_PROMOTION_NEW_PATH,
            element: <AdminPromotionNewPage />,
          },
          {
            path: adminPromotionPath(':promotionId'),
            element: <AdminPromotionEditPage />,
          },
          { path: ADMIN_RESERVATIONS_PATH, element: <AdminReservationsPage /> },
          {
            path: ADMIN_CONSISTENCY_CHECK_PATH,
            element: <AdminPlaceholderPage title="정합성 대조" />,
          },
          {
            path: ADMIN_LOAD_TEST_PATH,
            element: <AdminPlaceholderPage title="부하 검증" />,
          },
          {
            path: ADMIN_NOTIFICATIONS_PATH,
            element: <AdminPlaceholderPage title="관리자 알림 내역 확인" />,
          },
          {
            path: ADMIN_MOCK_SETTINGS_PATH,
            element: <AdminPlaceholderPage title="Mock 설정" />,
          },
        ],
      },
    ],
  },
])

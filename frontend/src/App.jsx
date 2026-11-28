import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import { RequireAdmin, RequireAuth } from './components/RouteGuards.jsx';
import { PageLoader } from './components/ui/States.jsx';

// Route-level code splitting: every page is its own chunk.
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const CatalogPage = lazy(() => import('./pages/CatalogPage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));

const AccountLayout = lazy(() => import('./pages/account/AccountLayout.jsx'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage.jsx'));
const PasswordPage = lazy(() => import('./pages/account/PasswordPage.jsx'));
const AddressesPage = lazy(() => import('./pages/account/AddressesPage.jsx'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage.jsx'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/AnalyticsPage.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/ProductsPage.jsx'));
const AdminProductForm = lazy(() => import('./pages/admin/ProductFormPage.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/CategoriesPage.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage.jsx'));
const AdminUserDetail = lazy(() => import('./pages/admin/UserDetailPage.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/OrdersPage.jsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetailPage.jsx'));
const AdminDiscounts = lazy(() => import('./pages/admin/DiscountsPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<CatalogPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route element={<RequireAuth />}>
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path="password" element={<PasswordPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="discounts" element={<AdminDiscounts />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

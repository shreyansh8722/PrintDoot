import React, { lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout Components (loaded eagerly — always needed)
import MainLayout from './components/Layouts/MainLayout';
import AuthLayout from './components/Layouts/AuthLayout';

// Components (loaded eagerly — always visible)
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';

// Page Components (lazy loaded — only fetched when navigated to)
const Homepage = lazy(() => import('./pages/Homepage/Homepage'));
const Categories = lazy(() => import('./pages/Categories/Categories'));
const Product = lazy(() => import('./pages/Product/Product'));
const TemplateSelection = lazy(() => import('./pages/TemplateSelection/TemplateSelection'));
const Editor = lazy(() => import('./pages/Editor/Editor'));
const ZakekeEditor = lazy(() => import('./pages/Editor/ZakekeEditor'));
const Cart = lazy(() => import('./pages/Cart/Cart'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const CheckoutAddress = lazy(() => import('./pages/Checkout/CheckoutAddress'));
const CheckoutShipping = lazy(() => import('./pages/Checkout/CheckoutShipping'));
const CheckoutPayment = lazy(() => import('./pages/Checkout/CheckoutPayment'));
const CheckoutReview = lazy(() => import('./pages/Checkout/CheckoutReview'));
const CheckoutSuccess = lazy(() => import('./pages/Checkout/CheckoutSuccess'));
const CheckoutFailed = lazy(() => import('./pages/Checkout/CheckoutFailed'));
const InstamojoCallback = lazy(() => import('./pages/Checkout/InstamojoCallback'));
const AccountDashboard = lazy(() => import('./pages/Account/AccountDashboard'));
const Profile = lazy(() => import('./pages/Account/Profile'));
const Addresses = lazy(() => import('./pages/Account/Addresses'));
const Settings = lazy(() => import('./pages/Account/Settings'));
const Orders = lazy(() => import('./pages/Account/Orders'));
const OrderDetail = lazy(() => import('./pages/Account/OrderDetail'));
const OrderTracking = lazy(() => import('./pages/Account/OrderTracking'));
const SearchResults = lazy(() => import('./pages/Search/SearchResults'));
const Contact = lazy(() => import('./pages/Help/Contact'));
const FAQ = lazy(() => import('./pages/Help/FAQ'));
const Returns = lazy(() => import('./pages/Help/Returns'));
const Shipping = lazy(() => import('./pages/Help/Shipping'));
const Terms = lazy(() => import('./pages/Legal/Terms'));
const Privacy = lazy(() => import('./pages/Legal/Privacy'));
const Cookies = lazy(() => import('./pages/Legal/Cookies'));
const RefundPolicy = lazy(() => import('./pages/Legal/RefundPolicy'));
const MyDesigns = lazy(() => import('./pages/Account/MyDesigns'));
const MyAssets = lazy(() => import('./pages/Account/MyAssets'));
const Favorites = lazy(() => import('./pages/Favorites/Favorites'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// Minimal loading fallback
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-brand rounded-full animate-spin" />
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <WhatsAppButton />
            <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Authentication Routes - No Header/Footer */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                </Route>

                {/* Main Routes - With Header/Footer */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/view-all" element={<Categories />} />
                    <Route path="/categories/:category" element={<Categories />} />
                    <Route path="/categories/:category/:productSlug" element={<Product />} />
                    <Route path="/product" element={<Product />} />
                    <Route path="/product/:slug" element={<Product />} />
                    <Route path="/product/:slug/templates" element={<TemplateSelection />} />
                    <Route path="/editor/:templateId" element={<Editor />} />
                    <Route path="/zakeke-editor/:productId" element={<ZakekeEditor />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

                    {/* Checkout Routes */}
                    <Route path="/checkout/address" element={<ProtectedRoute><CheckoutAddress /></ProtectedRoute>} />
                    <Route path="/checkout/shipping" element={<ProtectedRoute><CheckoutShipping /></ProtectedRoute>} />
                    <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
                    <Route path="/checkout/review" element={<ProtectedRoute><CheckoutReview /></ProtectedRoute>} />
                    <Route path="/checkout/success/:orderId" element={<CheckoutSuccess />} />
                    <Route path="/checkout/failed" element={<CheckoutFailed />} />
                    <Route path="/checkout/instamojo-callback" element={<ProtectedRoute><InstamojoCallback /></ProtectedRoute>} />

                    {/* Account Routes */}
                    <Route path="/account" element={<ProtectedRoute><AccountDashboard /></ProtectedRoute>} />
                    <Route path="/account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/account/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                    <Route path="/account/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/account/designs" element={<ProtectedRoute><MyDesigns /></ProtectedRoute>} />
                    <Route path="/account/assets" element={<ProtectedRoute><MyAssets /></ProtectedRoute>} />
                    <Route path="/account/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/account/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                    <Route path="/track-order/:trackingNumber" element={<OrderTracking />} />
                    <Route path="/track-order" element={<OrderTracking />} />

                    {/* Search Routes */}
                    <Route path="/search" element={<SearchResults />} />

                    {/* Help & Support Routes */}
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/help" element={<Contact />} />

                    {/* Legal Routes */}
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/cookie-policy" element={<Cookies />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/return-policy" element={<RefundPolicy />} />

                    {/* 404 - Catch all unknown routes */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;

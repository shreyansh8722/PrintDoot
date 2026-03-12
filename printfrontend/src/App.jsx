import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout Components
import MainLayout from './components/Layouts/MainLayout';
import AuthLayout from './components/Layouts/AuthLayout';

// Page Components
import Homepage from './pages/Homepage/Homepage';
import Categories from './pages/Categories/Categories';
import Product from './pages/Product/Product';
import TemplateSelection from './pages/TemplateSelection/TemplateSelection';
import Editor from './pages/Editor/Editor';
import ZakekeEditor from './pages/Editor/ZakekeEditor';
import Cart from './pages/Cart/Cart';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import CheckoutAddress from './pages/Checkout/CheckoutAddress';
import CheckoutShipping from './pages/Checkout/CheckoutShipping';
import CheckoutPayment from './pages/Checkout/CheckoutPayment';
import CheckoutReview from './pages/Checkout/CheckoutReview';
import CheckoutSuccess from './pages/Checkout/CheckoutSuccess';
import CheckoutFailed from './pages/Checkout/CheckoutFailed';
import InstamojoCallback from './pages/Checkout/InstamojoCallback';
import AccountDashboard from './pages/Account/AccountDashboard';
import Profile from './pages/Account/Profile';
import Addresses from './pages/Account/Addresses';
import Settings from './pages/Account/Settings';
import Orders from './pages/Account/Orders';
import OrderDetail from './pages/Account/OrderDetail';
import OrderTracking from './pages/Account/OrderTracking';
import SearchResults from './pages/Search/SearchResults';
import Contact from './pages/Help/Contact';
import FAQ from './pages/Help/FAQ';
import Returns from './pages/Help/Returns';
import Shipping from './pages/Help/Shipping';
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';
import Cookies from './pages/Legal/Cookies';
import RefundPolicy from './pages/Legal/RefundPolicy';
import MyDesigns from './pages/Account/MyDesigns';
import MyAssets from './pages/Account/MyAssets';
import Favorites from './pages/Favorites/Favorites';
import NotFound from './pages/NotFound/NotFound';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <BackToTop />
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

                    {/* Search Routes */}
                    <Route path="/search" element={<SearchResults />} />

                    {/* Help & Support Routes */}
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/help" element={<FAQ />} />

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
        </BrowserRouter>
    );
}

export default App;

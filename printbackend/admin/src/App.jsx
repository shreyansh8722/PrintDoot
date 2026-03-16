import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesAnalytics from './pages/SalesAnalytics';
import Reviews from './pages/Reviews';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Offers from './pages/Offers';
import Orders from './pages/Orders';
import Finance from './pages/Finance';
import Payments from './pages/Payments';
import Marketing from './pages/Marketing';
import Stocks from './pages/Stocks';
import Banners from './pages/Banners';
import UserAnalytics from './pages/UserAnalytics';
import OrderAnalytics from './pages/OrderAnalytics';
import CartAnalysis from './pages/CartAnalysis';
import Courier from './pages/Courier';

function App() {
  return (
    <AuthProvider>
      <DataCacheProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="sales-analytics" element={<SalesAnalytics />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="offers" element={<Offers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<Payments />} />
            <Route path="finance" element={<Finance />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="banners" element={<Banners />} />
            <Route path="user-analytics" element={<UserAnalytics />} />
            <Route path="order-analytics" element={<OrderAnalytics />} />
            <Route path="cart-analysis" element={<CartAnalysis />} />
            <Route path="courier" element={<Courier />} />
            <Route path="*" element={<div className="p-4">Page Not Found</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </DataCacheProvider>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Megaphone,
  Tag,
  Box,
  BarChart2,
  Star,
  Gift,
  Image,
  Truck,
  Settings,
  PieChart,
  UserCheck,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PieChart, label: 'Sales Analytics', path: '/sales-analytics' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: UserCheck, label: 'User Analytics', path: '/user-analytics' },
    { icon: TrendingUp, label: 'Order Analytics', path: '/order-analytics' },
    { icon: ShoppingBag, label: 'Cart Analysis', path: '/cart-analysis' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Megaphone, label: 'Marketing', path: '/marketing' },
    { icon: Tag, label: 'Promo Codes', path: '/offers' },
    { icon: Image, label: 'Site Images', path: '/banners' },
    { icon: Box, label: 'Stocks', path: '/stocks' },
    { icon: Truck, label: 'Courier', path: '/courier' },
    { icon: BarChart2, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Management', path: '/categories' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="admin-title">ADMIN DASHBOARD</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <item.icon size={20} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

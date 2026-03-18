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
  Image,
  Truck,
  Settings,
  PieChart,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  X
} from 'lucide-react';
import logo from '../assets/logo.webp';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
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
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: Image, label: 'Site Images', path: '/banners' },
    { icon: Box, label: 'Stocks', path: '/stocks' },
    { icon: Truck, label: 'Courier', path: '/courier' },
    { icon: BarChart2, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Management', path: '/categories' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-wrap">
          <img src={logo} alt="Printdoot" className="sidebar-logo-img" />
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
            onClick={onClose}
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

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
  Image,
  Box,
  Truck,
  BarChart2,
  Settings
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Tag, label: 'Categories', path: '/categories' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Megaphone, label: 'Marketing', path: '/marketing' },
    { icon: Image, label: 'Navbar Images', path: '/navbar-images' },
    { icon: Box, label: 'Stocks', path: '/stocks' },
    { icon: Truck, label: 'Courier', path: '/courier' },
    { icon: BarChart2, label: 'Finance', path: '/finance' },
    { icon: Settings, label: 'Reviews', path: '/reviews' },
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

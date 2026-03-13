import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Layouts.css';

const MainLayout = () => {
    const location = useLocation();
    const isEditorPage = location.pathname.startsWith('/zakeke-editor') || location.pathname.startsWith('/editor');

    return (
        <div className='app'>
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            {!isEditorPage && <Footer />}
        </div>
    );
};

export default MainLayout;

import React from 'react';
import { Outlet } from 'react-router-dom';
import './Layouts.css';

const AuthLayout = () => {
    return (
        <div className='app auth-layout'>
            <main className="auth-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AuthLayout;

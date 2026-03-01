import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import userService from '../../services/userService';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await userService.login(formData.username, formData.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-new">
            {/* Left side — branding */}
            <div className="auth-brand">
                <div className="auth-brand-content">
                    <Link to="/" className="auth-logo">PrintDoot</Link>
                    <h2>Welcome back!</h2>
                    <p>Sign in to access your designs, orders, and personalized products.</p>
                    <div className="auth-brand-features">
                        <div className="auth-feature">
                            <span className="auth-feature-dot" />
                            <span>Track your orders in real-time</span>
                        </div>
                        <div className="auth-feature">
                            <span className="auth-feature-dot" />
                            <span>Save and manage your designs</span>
                        </div>
                        <div className="auth-feature">
                            <span className="auth-feature-dot" />
                            <span>Faster checkout experience</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side — form */}
            <div className="auth-form-side">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <h1>Sign In</h1>
                        <p>Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form-new">
                        {error && (
                            <div className="auth-error-new">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="8" cy="8" r="8" fill="#FEE2E2" />
                                    <path d="M8 5v3M8 10.5h.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="auth-field">
                            <label htmlFor="username">Username or Email</label>
                            <div className="auth-input-wrap">
                                <FiMail className="auth-input-icon" />
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="you@example.com"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div className="auth-field-header">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="auth-forgot">Forgot?</Link>
                            </div>
                            <div className="auth-input-wrap">
                                <FiLock className="auth-input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-pw"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <label className="auth-remember">
                            <input type="checkbox" />
                            <span>Keep me signed in</span>
                        </label>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="auth-spinner" />
                            ) : (
                                <>
                                    Sign In
                                    <FiArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <p className="auth-switch">
                        Don't have an account?{' '}
                        <Link to="/register">Create one for free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import userService from '../../services/userService';
import './Auth.css';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('No verification token provided.');
                return;
            }
            try {
                const result = await userService.verifyEmail(token);
                setStatus('success');
                setMessage(result.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                const detail = err.response?.data;
                setMessage(
                    detail?.token?.[0] ||
                    detail?.detail ||
                    'Verification failed. The link may be expired or invalid.'
                );
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    {status === 'verifying' && (
                        <>
                            <h1>Verifying Email…</h1>
                            <p>Please wait while we verify your email address.</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <h1>✅ Email Verified!</h1>
                            <p>{message}</p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <h1>Verification Failed</h1>
                            <p>{message}</p>
                        </>
                    )}
                </div>

                <div className="auth-footer">
                    {status !== 'verifying' && (
                        <Link to="/login" className="auth-button" style={{ display: 'block', textAlign: 'center' }}>
                            Go to Sign In
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;

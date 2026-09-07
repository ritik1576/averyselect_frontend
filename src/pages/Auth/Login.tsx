import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { loginRequest } from '../../store/slices/authSlice';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './Auth.css';

const BrandMark: React.FC<{ width?: number; height?: number }> = ({ width = 26, height = 40 }) => (
  <svg viewBox="0 0 31.5 48.5" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
    <defs>
      <linearGradient id="login-bg1" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
        <stop offset="0"   stopColor="#c94018"/>
        <stop offset=".40" stopColor="#8b2a10"/>
        <stop offset=".80" stopColor="#e05030"/>
        <stop offset="1"   stopColor="#f47050"/>
      </linearGradient>
    </defs>
    <path d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z" fill="url(#login-bg1)"/>
    <rect x="0.5" y="18.5" width="9" height="10" fill="#ff6040"/>
    <rect x="22" y="19.5" width="9.5" height="9.5" fill="#ff6040"/>
  </svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useAppSelector(s => s.auth);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginRequest({ email: email.trim().toLowerCase(), password }));
  };

  return (
    <motion.div className="auth-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* Left brand panel */}
      <div className="auth-left">
        <div className="auth-left-bg">
          <video autoPlay muted loop playsInline preload="auto" aria-hidden="true">
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        <div className="auth-left-brand">
          <BrandMark />
          <span className="auth-left-brand-text">AverySelect</span>
        </div>

        <div className="auth-left-content">
          <p className="auth-left-quote">
            "The next layer of<br/>technical intelligence."
          </p>
          <p className="auth-left-sub">
            Sign back into your recruiter panel to manage assessments, review candidates, and build your engineering team.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <BrandMark width={22} height={34} />
            <span className="auth-mobile-brand-text">AverySelect</span>
          </div>

          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">
              New to AverySelect?{' '}
              <Link to="/register">Register your company →</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">Work Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Mail size={15}/></span>
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Lock size={15}/></span>
                <input
                  id="login-password"
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <><span className="auth-spinner" />Signing in…</>
              ) : (
                'Sign In →'
              )}
            </button>

          </form>
        </div>
      </div>

    </motion.div>
  );
};

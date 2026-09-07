import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { signupRequest } from '../../store/slices/authSlice';
import { Building2, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './Auth.css';

interface FormState {
  companyName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  companyName?: string;
  userName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const BrandMark: React.FC<{ width?: number; height?: number }> = ({ width = 26, height = 40 }) => (
  <svg viewBox="0 0 31.5 48.5" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height}>
    <defs>
      <linearGradient id="reg-bg1" x1="8" y1="0" x2="34.1" y2="28.9" gradientUnits="userSpaceOnUse">
        <stop offset="0"   stopColor="#c94018"/>
        <stop offset=".40" stopColor="#8b2a10"/>
        <stop offset=".80" stopColor="#e05030"/>
        <stop offset="1"   stopColor="#f47050"/>
      </linearGradient>
    </defs>
    <path d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z" fill="url(#reg-bg1)"/>
    <rect x="0.5" y="18.5" width="9" height="10" fill="#ff6040"/>
    <rect x="22" y="19.5" width="9.5" height="9.5" fill="#ff6040"/>
  </svg>
);

function getPasswordStrength(pw: string): { width: string; color: string; label: string } {
  if (!pw) return { width: '0%', color: 'transparent', label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { width: '25%', color: '#ef4444', label: 'Weak' },
    { width: '50%', color: '#f97316', label: 'Fair' },
    { width: '75%', color: '#eab308', label: 'Good' },
    { width: '100%', color: '#22c55e', label: 'Strong' },
  ];
  return map[score - 1] ?? map[0];
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(s => s.auth);

  const [form, setForm] = useState<FormState>({
    companyName: '', userName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Auto-redirect if already logged in after signup
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.companyName.trim() || form.companyName.trim().length < 2)
      errs.companyName = 'Company name must be at least 2 characters';
    if (!form.userName.trim() || form.userName.trim().length < 2)
      errs.userName = 'Your name must be at least 2 characters';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid work email';
    if (!form.password || form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(signupRequest({
      companyName: form.companyName.trim(),
      userName: form.userName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }));
  };

  const strength = getPasswordStrength(form.password);
  const canSubmit = !loading && form.companyName && form.userName && form.email && form.password && form.confirmPassword;

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
            "Hire the engineers<br/>your team actually needs."
          </p>
          <p className="auth-left-sub">
            AI-powered technical assessments with live code execution, automatic grading, and deep candidate insights — built for modern engineering teams.
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
            <h1 className="auth-form-title">Register your company</h1>
            <p className="auth-form-sub">
              Already have an account?{' '}
              <Link to="/login">Sign in instead →</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            {/* Row 1: Company + Name */}
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="companyName">Company Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Building2 size={15}/></span>
                  <input
                    id="companyName"
                    className={`auth-input${errors.companyName ? ' auth-input--error' : ''}`}
                    type="text"
                    placeholder="Acme Corp"
                    value={form.companyName}
                    onChange={set('companyName')}
                    autoComplete="organization"
                    required
                  />
                </div>
                {errors.companyName && <span className="auth-field-error">{errors.companyName}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="userName">Your Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><User size={15}/></span>
                  <input
                    id="userName"
                    className={`auth-input${errors.userName ? ' auth-input--error' : ''}`}
                    type="text"
                    placeholder="Aryan Sharma"
                    value={form.userName}
                    onChange={set('userName')}
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.userName && <span className="auth-field-error">{errors.userName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Work Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Mail size={15}/></span>
                <input
                  id="email"
                  className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                  type="email"
                  placeholder="aryan@company.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Lock size={15}/></span>
                <input
                  id="password"
                  className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  required
                />
              </div>
              {form.password && (
                <div className="auth-strength-bar">
                  <div className="auth-strength-fill" style={{ width: strength.width, background: strength.color }} />
                </div>
              )}
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Lock size={15}/></span>
                <input
                  id="confirmPassword"
                  className={`auth-input${errors.confirmPassword ? ' auth-input--error' : ''}`}
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </div>
              {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {loading ? (
                <><span className="auth-spinner" />Creating account…</>
              ) : (
                'Create Company Account →'
              )}
            </button>

            <p className="auth-terms">
              By registering you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>

    </motion.div>
  );
};

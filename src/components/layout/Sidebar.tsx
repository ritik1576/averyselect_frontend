import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ClipboardList, Users, BookOpen, HelpCircle, LogOut, Sun, Moon, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

const navItems = [
  { label: 'Tests',            path: '/dashboard',             icon: ClipboardList },
  { label: 'Candidates',       path: '/dashboard/candidates',  icon: Users },
  { label: 'Question Library', path: '/dashboard/questions',   icon: BookOpen },
  { label: 'Settings',         path: '/dashboard/settings',    icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Hamburger — only shown on mobile when drawer is closed */}
      {!mobileOpen && (
        <button
          className="sidebar__hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Backdrop overlay when drawer is open */}
      {mobileOpen && (
        <div className="sidebar__overlay" onClick={closeMobile} />
      )}

      <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>

        {/* ─── Branding ─────────────────────────────── */}
        <div className="sidebar__brand">
          <div className="sidebar__logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">AverySelect</span>
            <span className="sidebar__brand-tier">Recruiter Panel</span>
          </div>
          {/* Close button — only visible on mobile */}
          <button className="sidebar__close" onClick={closeMobile} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        {/* ─── Navigation ───────────────────────────── */}
        <nav className="sidebar__nav">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/dashboard'}
              className={() => {
                let isActive = false;
                if (path === '/dashboard') {
                  isActive = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/tests');
                } else {
                  isActive = location.pathname.startsWith(path);
                }
                return `sidebar__link${isActive ? ' sidebar__link--active' : ''}`;
              }}
              onClick={closeMobile}
            >
              <Icon size={20} className="sidebar__icon" />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ─── Footer ───────────────────────────────── */}
        <div className="sidebar__footer">
          <button className="sidebar__link" onClick={toggle}>
            {theme === 'dark' ? <Sun size={20} className="sidebar__icon" /> : <Moon size={20} className="sidebar__icon" />}
            <span className="sidebar__label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="sidebar__link">
            <HelpCircle size={20} className="sidebar__icon" />
            <span className="sidebar__label">Help &amp; Support</span>
          </button>
          <button className="sidebar__link" onClick={() => dispatch(logout())}>
            <LogOut size={20} className="sidebar__icon" />
            <span className="sidebar__label">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

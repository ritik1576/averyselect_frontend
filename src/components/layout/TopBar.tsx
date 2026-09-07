import React from 'react';
import { Bell, User } from 'lucide-react';
import { Input } from '@/components/ui';
import './TopBar.css';

export const TopBar: React.FC = () => {
  return (
    <header className="layout-topbar">
      <div className="layout-topbar__search">
        <Input isSearch placeholder="Search tests, candidates, or settings..." />
      </div>
      <div className="layout-topbar__actions">
        <button className="layout-topbar__icon-btn">
          <Bell size={20} />
          <span className="layout-topbar__badge"></span>
        </button>
        <div className="layout-topbar__avatar">
          <User size={20} color="#ffffff" />
        </div>
      </div>
    </header>
  );
};

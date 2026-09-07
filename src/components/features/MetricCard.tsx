import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass?: string; // e.g., 'bg-orange-light'
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, iconBgClass }) => {
  return (
    <div className="ql-metric-card">
      <div className="ql-metric-header">
        <span className="ql-metric-label">{label}</span>
        <div className={`ql-metric-icon ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <div className="ql-metric-value">{value}</div>
    </div>
  );
};

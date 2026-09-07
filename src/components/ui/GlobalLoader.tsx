import React from 'react';
import { PencilLoader } from './PencilLoader';
import './GlobalLoader.css';

export const GlobalLoader: React.FC<{ fullScreen?: boolean; text?: string }> = ({ 
  text
}) => {
  return (
    <div className="global-loader-overlay">
      <div className="global-loader-content">
        <PencilLoader />
        {text && <p className="mt-4 text-sm font-medium text-neutral-500">{text}</p>}
      </div>
    </div>
  );
};

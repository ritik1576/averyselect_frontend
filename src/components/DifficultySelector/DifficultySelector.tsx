import React from 'react';
import { Star } from 'lucide-react';
import './DifficultySelector.css';

const LABELS = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];

interface Props {
  value: number;
  onChange: (val: number) => void;
}

export const DifficultySelector: React.FC<Props> = ({ value, onChange }) => {
  // ensure value is between 1 and 5, default to 3 (Medium) if invalid
  const safeValue = (value >= 1 && value <= 5) ? value : 3;

  return (
    <div className="difficulty-selector">
      <div className="diff-stars-container">
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isActive = starIdx <= safeValue;
          return (
            <button
              key={starIdx}
              type="button"
              className={`diff-star-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(starIdx)}
              title={LABELS[starIdx - 1]}
            >
              <Star 
                size={22} 
                fill={isActive ? '#f59e0b' : 'none'} 
                color={isActive ? '#f59e0b' : '#cbd5e1'} 
                strokeWidth={isActive ? 2 : 1.5}
              />
            </button>
          );
        })}
      </div>
      <span className="diff-label">{LABELS[safeValue - 1]}</span>
    </div>
  );
};

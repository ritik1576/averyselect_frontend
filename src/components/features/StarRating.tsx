import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  count: number;
  maxStars?: number;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  count = 3, 
  maxStars = 5, 
  size = 14, 
  activeColor = '#f97316', 
  inactiveColor = '#cbd5e1',
  className = ''
}) => {
  return (
    <div className={`star-rating-container ${className || ''}`}>
      {Array.from({ length: count }, (_, i) => i + 1).map((star) => (
        <Star 
          key={star} 
          size={size} 
          fill={activeColor} 
          stroke={activeColor} 
        />
      ))}
    </div>
  );
};

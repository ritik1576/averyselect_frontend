import React from 'react';
import './Badge.css';
import { classNames } from '@/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'success' | 'error';
  rounded?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', rounded = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={classNames(
          'ui-badge',
          `ui-badge--${variant}`,
          rounded && 'ui-badge--rounded',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

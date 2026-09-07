import React from 'react';
import './Button.css';
import { classNames } from '@/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(
          'ui-button',
          `ui-button--${variant}`,
          `ui-button--${size}`,
          fullWidth && 'ui-button--full-width',
          className
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="ui-button__icon">{icon}</span>}
        {children && <span className="ui-button__content">{children}</span>}
        {icon && iconPosition === 'right' && <span className="ui-button__icon">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

import React from 'react';
import './Input.css';
import { classNames } from '@/utils';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
  isSearch?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, isSearch, ...props }, ref) => {
    return (
      <div className={classNames('ui-input-wrapper', className)}>
        {(icon || isSearch) && (
          <span className="ui-input__icon">
            {isSearch ? <Search size={16} /> : icon}
          </span>
        )}
        <input
          ref={ref}
          className={classNames(
            'ui-input',
            (icon || isSearch) ? 'ui-input--with-icon' : undefined,
            error ? 'ui-input--error' : undefined,
            isSearch ? 'ui-input--search' : undefined
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

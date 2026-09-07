import React from 'react';
import './Typography.css';
import { classNames } from '@/utils';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'displayLg' | 'headlineLg' | 'titleMd';
}

export const Heading: React.FC<HeadingProps> = ({
  level = 2,
  variant = 'headlineLg',
  className,
  children,
  ...props
}) => {
  const Tag = `h${level}` as any;
  return (
    <Tag className={classNames('ui-heading', `ui-heading--${variant}`, className)} {...props}>
      {children}
    </Tag>
  );
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'bodyLg' | 'bodyMd' | 'labelSm';
  color?: 'primary' | 'secondary' | 'neutral' | 'error';
}

export const Text: React.FC<TextProps> = ({
  variant = 'bodyMd',
  color = 'secondary',
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={classNames('ui-text', `ui-text--${variant}`, `ui-text--color-${color}`, className)}
      {...props}
    >
      {children}
    </p>
  );
};

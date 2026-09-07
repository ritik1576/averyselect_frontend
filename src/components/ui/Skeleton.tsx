import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
};

export interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton variant="text" height={20} width={colIndex === 0 ? '70%' : '100%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export interface ListSkeletonProps {
  rows?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={80} width="100%" />
      ))}
    </div>
  );
};

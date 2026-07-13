import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  padded = true,
  hoverable = false,
  ...props
}: CardProps) {
  const baseStyles =
    'rounded-2xl border border-gray-200 bg-white shadow-sm';
  const paddingStyles = padded ? 'p-6' : '';
  const hoverStyles = hoverable
    ? 'transition-shadow duration-200 hover:shadow-md'
    : '';

  return (
    <div className={`${baseStyles} ${paddingStyles} ${hoverStyles} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

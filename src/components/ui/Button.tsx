import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function Button({
  children,
  className = '',
  disabled = false,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const baseStyles =
    'rounded-full px-6 py-3 font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70';

  const variantStyles =
    variant === 'secondary'
      ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
      : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

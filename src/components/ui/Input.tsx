import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

function toInputId(label?: string, id?: string) {
  if (id) return id;
  if (!label) return undefined;

  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Input({
  className = '',
  label,
  error,
  id,
  ...props
}: InputProps) {
  const inputId = toInputId(label, id);

  const baseStyles =
    'w-full rounded-lg border border-gray-300 px-4 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : '';

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={`${baseStyles} ${errorStyles} ${className}`.trim()}
        {...props}
      />

      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

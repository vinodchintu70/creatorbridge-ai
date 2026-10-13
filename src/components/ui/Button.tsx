import React from 'react';
import { ButtonVariant, ComponentSize } from '@/types/common';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 shadow-sm shadow-purple-500/25 border border-purple-500/30 font-semibold tracking-normal',
  secondary:
    'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 font-medium',
  outline:
    'bg-transparent text-zinc-200 hover:bg-zinc-800/60 active:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 font-medium',
  ghost:
    'bg-transparent text-zinc-300 hover:bg-zinc-800/50 hover:text-white active:bg-zinc-800 border border-transparent font-medium',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 border border-transparent font-semibold',
};

const sizeStyles: Record<ComponentSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md font-medium',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg font-medium',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            role="status"
            aria-label="Loading"
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

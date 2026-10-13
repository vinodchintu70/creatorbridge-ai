import React from 'react';
import { BadgeVariant } from '@/types/common';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  leftIcon?: React.ReactNode;
}

const badgeVariantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  success: 'bg-green-500/10 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  outline: 'bg-transparent text-zinc-400 border-zinc-700',
  accent: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
};

export function Badge({
  variant = 'default',
  leftIcon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeVariantStyles[variant]} ${className}`}
      {...props}
    >
      {leftIcon}
      {children}
    </span>
  );
}

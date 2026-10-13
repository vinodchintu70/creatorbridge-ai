import React from 'react';

export type ComponentSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type BadgeVariant = 'default' | 'verified' | 'success' | 'warning' | 'outline' | 'accent';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

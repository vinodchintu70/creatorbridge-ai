'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';

export interface PageTransitionProps {
  children: React.ReactNode;
}

function PathnameTransitionContent({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition flex-1 flex flex-col w-full">
      {children}
    </div>
  );
}

/**
 * Route-level transition wrapper.
 * Triggers a subtle 180ms fade-in with a 6px vertical settle ONLY on route pathname changes.
 * Preserves query string updates (search, filters, creator deep links) without re-animating
 * or interrupting focus.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <Suspense fallback={<div className="page-transition flex-1 flex flex-col w-full">{children}</div>}>
      <PathnameTransitionContent>{children}</PathnameTransitionContent>
    </Suspense>
  );
}

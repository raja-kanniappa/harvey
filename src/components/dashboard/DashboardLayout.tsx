import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Simplified dashboard layout with CSS Grid
 */
export default function DashboardLayout({ 
  children, 
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn(
      // Base layout
      "min-h-screen bg-dashboard",
      // Container with max width and centering
      "mx-auto max-w-7xl",
      // Responsive padding
      "px-4 sm:px-6 lg:px-8",
      // Vertical spacing
      "py-6 lg:py-8",
      className
    )}>
      {/* Simplified grid container */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8 auto-rows-max">
        {children}
      </div>
    </div>
  );
}
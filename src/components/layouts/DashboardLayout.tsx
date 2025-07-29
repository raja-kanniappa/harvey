import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main dashboard layout component with responsive 12-column grid system
 * Follows the design system specifications from the design document
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      "w-full max-w-screen-2xl mx-auto",
      "px-4 md:px-6 lg:px-8",
      "py-6 md:py-8",
      className
    )}>
      {/* Header section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              AI Usage Dashboard
            </h1>
            <p className="text-lg text-secondary">
              Organizational insights and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Dashboard section wrapper for organizing content
 */
interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
}

export function DashboardSection({ 
  children, 
  title, 
  subtitle, 
  className,
  headerAction 
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-semibold text-primary">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Responsive grid layouts for different content types
 */
interface GridLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricsGrid({ children, className }: GridLayoutProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}

export function ChartsGrid({ children, className }: GridLayoutProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 lg:grid-cols-2",
      className
    )}>
      {children}
    </div>
  );
}

export function TableGrid({ children, className }: GridLayoutProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1",
      className
    )}>
      {children}
    </div>
  );
}

export function SidebarGrid({ children, className }: GridLayoutProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Mobile-responsive container for main content
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full",
      "px-4 sm:px-6 lg:px-8",
      "py-4 sm:py-6 lg:py-8",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Sticky header component for filters and actions
 */
interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <div className={cn(
      "sticky top-0 z-10",
      "bg-background/80 backdrop-blur-sm",
      "border-b border-border",
      "py-4",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Content area with proper spacing
 */
interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentArea({ children, className }: ContentAreaProps) {
  return (
    <div className={cn(
      "space-y-6 md:space-y-8",
      className
    )}>
      {children}
    </div>
  );
}
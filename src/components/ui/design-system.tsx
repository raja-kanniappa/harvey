import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';

/**
 * Typography components following the design system
 */
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricDisplay({ children, className }: TypographyProps) {
  return (
    <div className={cn("text-metric-sm lg:text-metric-lg text-primary", className)}>
      {children}
    </div>
  );
}

export function Heading({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-heading-md lg:text-heading-lg text-primary", className)}>
      {children}
    </h2>
  );
}

export function SubHeading({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("text-heading-sm lg:text-heading-md text-primary", className)}>
      {children}
    </h3>
  );
}

export function BodyText({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-body lg:text-body-lg text-secondary", className)}>
      {children}
    </p>
  );
}

export function SmallText({ children, className }: TypographyProps) {
  return (
    <span className={cn("text-small text-secondary", className)}>
      {children}
    </span>
  );
}

/**
 * Status indicator component
 */
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function StatusIndicator({ status, children, className }: StatusIndicatorProps) {
  const statusStyles = {
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    neutral: "text-secondary bg-muted border-border"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
      statusStyles[status],
      className
    )}>
      {children}
    </span>
  );
}

/**
 * Dashboard card wrapper with consistent styling
 */
interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
}

export function DashboardCard({ 
  children, 
  title, 
  subtitle, 
  className,
  headerAction 
}: DashboardCardProps) {
  return (
    <Card className={cn("shadow-card hover:shadow-card-hover transition-smooth p-lg rounded-lg", className)}>
      {(title || subtitle || headerAction) && (
        <CardHeader className="pb-md">
          <div className="flex items-start justify-between">
            <div className="space-y-xs">
              {title && <CardTitle className="text-heading-sm lg:text-heading-md">{title}</CardTitle>}
              {subtitle && <BodyText>{subtitle}</BodyText>}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={title || subtitle ? "pt-0" : ""}>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Metric card for displaying key statistics
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  subtitle?: string;
  className?: string;
}

export function MetricCard({ title, value, change, subtitle, className }: MetricCardProps) {
  const changeIcon = change?.type === 'increase' ? '↗' : change?.type === 'decrease' ? '↘' : '';
  const changeColor = change?.type === 'increase' ? 'text-success' : 
                     change?.type === 'decrease' ? 'text-warning' : 'text-secondary';

  return (
    <DashboardCard className={cn("h-full", className)}>
      <div className="space-y-3">
        <SmallText className="font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </SmallText>
        <div className="space-y-2">
          <MetricDisplay className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {value}
          </MetricDisplay>
          {change && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
              <span className="text-lg">{changeIcon}</span>
              <span>{change.value}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <SmallText className="text-muted-foreground">
            {subtitle}
          </SmallText>
        )}
      </div>
    </DashboardCard>
  );
}

/**
 * Loading skeleton component
 */
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-muted rounded",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
            className
          )}
        />
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      <div className="space-y-3">
        <Heading>{title}</Heading>
        {description && <BodyText>{description}</BodyText>}
        {action && <div className="pt-4">{action}</div>}
      </div>
    </div>
  );
}
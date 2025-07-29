import React, { useState, useEffect } from 'react';
import { DashboardCard, BodyText, StatusIndicator, Skeleton, EmptyState } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { User, UserDetails, FilterState, Session } from '../../types';

interface UserDeepDiveProps {
  userId?: string;
  user?: User;
  filters?: FilterState;
  className?: string;
  onUserChange?: (user: User) => void;
}

export default function UserDeepDive({
  userId,
  user: initialUser,
  filters,
  className,
  onUserChange
}: UserDeepDiveProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'agents' | 'sessions'>('overview');

  useEffect(() => {
    if (!userId && !initialUser) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const timeRange = filters?.timeRange || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily' as const
        };

        const userIdToFetch = userId || initialUser?.id;
        if (!userIdToFetch) {
          setError('No user specified');
          return;
        }

        const details = await dataService.getUserDetails(userIdToFetch, timeRange);
        setUserDetails(details);
        
        if (onUserChange && details.user) {
          onUserChange(details.user);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, initialUser, filters, onUserChange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUsageLevel = (weeklySpend: number) => {
    if (weeklySpend === 0) return { level: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (weeklySpend < 20) return { level: 'Light', color: 'bg-blue-100 text-blue-800' };
    if (weeklySpend < 100) return { level: 'Moderate', color: 'bg-green-100 text-green-800' };
    if (weeklySpend < 300) return { level: 'Heavy', color: 'bg-orange-100 text-orange-800' };
    return { level: 'Very Heavy', color: 'bg-red-100 text-red-800' };
  };

  const getSessionStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardCard className={className} title="User Deep Dive">
        <div className="space-y-6">
          {/* User Profile Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Metrics Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error || !userDetails) {
    return (
      <DashboardCard className={className} title="User Deep Dive">
        <EmptyState
          title="Error Loading User Data"
          description={error || 'User details could not be loaded'}
          action={
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          }
        />
      </DashboardCard>
    );
  }

  const { user, costTrend, topAgents, recentActivity } = userDetails;
  const usageLevel = getUsageLevel(user.weeklySpend);
  const totalTrendCost = costTrend.reduce((sum, point) => sum + point.cost, 0);
  const avgDailyCost = totalTrendCost / Math.max(costTrend.length, 1);

  return (
    <DashboardCard 
      className={className} 
      title="User Deep Dive"
      subtitle={`Detailed analysis for ${user.name}`}
      headerAction={
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 text-sm border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        {/* User Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${usageLevel.color}`}>
                {usageLevel.level} User
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{user.email}</div>
              <div className="flex items-center gap-4">
                <span>{user.department} • {user.role}</span>
                <span>{user.agentCount} agents used</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Activity' },
            { id: 'agents', label: 'Agents' },
            { id: 'sessions', label: 'Sessions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === tab.id
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Weekly Spend</div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(user.weeklySpend)}</div>
                <div className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(avgDailyCost)}/day
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Requests</div>
                <div className="text-2xl font-bold text-primary">{formatNumber(user.requestCount)}</div>
                <div className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(user.weeklySpend / Math.max(user.requestCount, 1))}/req
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Agents Used</div>
                <div className="text-2xl font-bold text-primary">{user.agentCount}</div>
                <div className="text-xs text-muted-foreground">
                  {user.agentCount > 3 ? 'High diversity' : user.agentCount > 1 ? 'Moderate' : 'Limited'}
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Sessions</div>
                <div className="text-2xl font-bold text-primary">{user.recentSessions.length}</div>
                <div className="text-xs text-muted-foreground">
                  Recent activity
                </div>
              </div>
            </div>

            {/* Daily Activity Chart */}
            <div className="space-y-4">
              <h4 className="font-medium">Daily Activity Trend</h4>
              <div className="flex items-end gap-2 h-32 p-4 bg-card rounded-lg border">
                {costTrend.map((point, index) => {
                  const maxCost = Math.max(...costTrend.map(p => p.cost));
                  const height = maxCost > 0 ? (point.cost / maxCost) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="relative w-full">
                        <div
                          className="bg-primary/70 rounded-t-lg transition-all duration-300 group-hover:bg-primary w-full"
                          style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                        />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(point.cost)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {point.timestamp.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="space-y-4">
            <h4 className="font-medium">Daily Usage Breakdown</h4>
            <div className="space-y-3">
              {user.trendData.map((daily, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {daily.date.toLocaleDateString('en-US', { day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {daily.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {daily.requestCount} requests
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">{formatCurrency(daily.cost)}</div>
                    <div className="text-xs text-muted-foreground">
                      {daily.requestCount > 0 ? formatCurrency(daily.cost / daily.requestCount) : '$0'}/req
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'agents' && (
          <div className="space-y-4">
            <h4 className="font-medium">Agent Usage Breakdown</h4>
            <div className="space-y-3">
              {topAgents.map((agentUsage, index) => (
                <div key={index} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                      </div>
                      <div>
                        <div className="font-medium">{agentUsage.agentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {agentUsage.requestCount} requests
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium">{formatCurrency(agentUsage.cost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {agentUsage.percentage.toFixed(1)}% of spend
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${agentUsage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'sessions' && (
          <div className="space-y-4">
            <h4 className="font-medium">Recent Sessions</h4>
            <div className="space-y-2">
              {recentActivity.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {session.timestamp.toLocaleDateString('en-US', { day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{session.agentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(session.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm">{formatCurrency(session.cost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(session.tokenCount)} tokens
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                      {session.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
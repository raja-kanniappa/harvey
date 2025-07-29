import React, { useState, useEffect } from 'react';
import { DashboardCard, BodyText, StatusIndicator, MetricCard } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { DepartmentSummary, User, Agent, Alert } from '../../types';

interface MobileSummaryProps {
  className?: string;
}

interface MobileSummaryData {
  todaySpend: number;
  todayRequests: number;
  topUser: User | null;
  topAgent: Agent | null;
  systemStatus: 'healthy' | 'warning' | 'critical';
  activeAlerts: Alert[];
  budgetUtilization: number;
}

export default function MobileSummary({ className }: MobileSummaryProps) {
  const [summaryData, setSummaryData] = useState<MobileSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMobileSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get today's data
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const todayTimeRange = {
          start: todayStart,
          end: todayEnd,
          granularity: 'hourly' as const
        };

        // Get week's data for top user/agent
        const weekTimeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily' as const
        };

        // Fetch all required data
        const [
          departmentSummary,
          agentLeaderboard,
          usageTrends,
          systemHealth
        ] = await Promise.all([
          dataService.getDepartmentSummary(todayTimeRange),
          dataService.getAgentLeaderboard(weekTimeRange, 1),
          dataService.getUsageTrends({ timeRange: todayTimeRange, granularity: 'hourly' }),
          dataService.getSystemHealth?.() || Promise.resolve({
            totalUsers: 0,
            activeUsers: 0,
            totalSessions: 0,
            errorRate: 0,
            avgResponseTime: 0
          })
        ]);
        
        // Calculate today's spend from time series data
        const todaySpend = usageTrends.points.reduce((sum, point) => sum + point.cost, 0);
        const todayRequests = usageTrends.points.reduce((sum, point) => sum + point.requestCount, 0);
        
        // Find top user (highest weekly spend)
        const topUser = await dataService.getTopSpenders?.(1).then(users => users[0]) || null;
        
        // Get top agent
        const topAgent = agentLeaderboard.data[0] || null;
        
        // Determine system status
        const systemStatus = systemHealth.errorRate > 5 ? 'critical' : 
                           systemHealth.errorRate > 2 ? 'warning' : 'healthy';
        
        // Get active alerts
        const activeAlerts = await dataService.getAlerts();
        
        setSummaryData({
          todaySpend,
          todayRequests,
          topUser,
          topAgent,
          systemStatus,
          activeAlerts: activeAlerts.slice(0, 3), // Show only top 3 alerts
          budgetUtilization: departmentSummary.budgetUtilization
        });
      } catch (err) {
        console.error('Error fetching mobile summary:', err);
        setError('Failed to load summary');
      } finally {
        setLoading(false);
      }
    };

    fetchMobileSummary();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMobileSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const getSystemStatusColor = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'warning';
      default: return 'neutral';
    }
  };

  const getSystemStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className={`lg:hidden ${className}`}>
        <DashboardCard title="Today's Summary">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
            </div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className={`lg:hidden ${className}`}>
        <DashboardCard title="Today's Summary">
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📱</div>
            <BodyText className="text-warning mb-4">
              {error || 'Unable to load mobile summary'}
            </BodyText>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className={`lg:hidden ${className}`}>
      <DashboardCard 
        title="Today's Summary"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
        headerAction={
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            🔄
          </button>
        }
      >
        <div className="space-y-6">

          {/* Key Today Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Today's Spend"
              value={formatCurrency(summaryData.todaySpend)}
              subtitle={`${summaryData.todayRequests} requests`}
            />
            <MetricCard
              title="Budget Status"
              value={`${summaryData.budgetUtilization.toFixed(0)}%`}
              subtitle={summaryData.budgetUtilization > 90 ? 'Over budget' : 'On track'}
            />
          </div>

          {/* System Status */}
          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">System Status</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSystemStatusIcon(summaryData.systemStatus)}</span>
                <StatusIndicator status={getSystemStatusColor(summaryData.systemStatus)}>
                  {summaryData.systemStatus.charAt(0).toUpperCase() + summaryData.systemStatus.slice(1)}
                </StatusIndicator>
              </div>
            </div>
            
            {summaryData.activeAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Active Alerts</h4>
                {summaryData.activeAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    <StatusIndicator status={alert.severity === 'high' ? 'warning' : 'neutral'}>
                      {alert.severity}
                    </StatusIndicator>
                    <span className="flex-1 text-xs">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="space-y-4">
            <h3 className="font-medium">Top Performers</h3>
            
            {summaryData.topUser && (
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {summaryData.topUser.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{summaryData.topUser.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {summaryData.topUser.department} • Top User
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">
                      {formatCurrency(summaryData.topUser.weeklySpend)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(summaryData.topUser.requestCount)} requests
                    </div>
                  </div>
                </div>
              </div>
            )}

            {summaryData.topAgent && (
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{summaryData.topAgent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {summaryData.topAgent.type} • Top Agent
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">
                      {formatCurrency(summaryData.topAgent.weeklySpend)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(summaryData.topAgent.requestCount)} requests
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {/* Navigate to full dashboard */}}
              className="p-3 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              📊 Full Dashboard
            </button>
            <button 
              onClick={() => {/* Navigate to alerts */}}
              className="p-3 text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              🔔 All Alerts
            </button>
          </div>

          {/* Last Updated */}
          <div className="text-center">
            <BodyText className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </BodyText>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { BodyText, StatusIndicator, DashboardCard } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { User, UserDetails, FilterState } from '../../types';

interface UserDeepDiveProps {
  className?: string;
  filters?: FilterState;
}

export default function UserDeepDive({ className, filters }: UserDeepDiveProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const timeRange = filters?.timeRange || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily' as const
        };
        
        // Get filtered data to extract users
        const filteredData = await dataService.getFilteredData(filters || {
          timeRange,
          departments: [],
          projects: [],
          users: [],
          agents: [],
          costThreshold: undefined
        });
        
        // Sort users by weekly spend
        const sortedUsers = filteredData.users.data.sort((a, b) => b.weeklySpend - a.weeklySpend);
        setUsers(sortedUsers);
        
        // Auto-select top user if none selected
        if (sortedUsers.length > 0 && !selectedUser) {
          setSelectedUser(sortedUsers[0]);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters]);

  // Fetch user details when selected user changes
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!selectedUser) return;
      
      try {
        setDetailsLoading(true);
        
        const timeRange = filters?.timeRange || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily' as const
        };
        
        const details = await dataService.getUserDetails(selectedUser.id, timeRange);
        setUserDetails(details);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchUserDetails();
  }, [selectedUser, filters]);

  const formatCostTrend = (costTrend: any[]) => {
    if (!costTrend.length) return [];
    
    // Get last 7 days
    const last7Days = costTrend.slice(-7);
    const maxCost = Math.max(...last7Days.map(d => d.cost));
    
    return last7Days.map(point => ({
      ...point,
      normalizedHeight: maxCost > 0 ? (point.cost / maxCost) * 100 : 0
    }));
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <BodyText className="ml-3 text-muted-foreground">Loading user analysis...</BodyText>
        </div>
      </div>
    );
  }

  if (error || users.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-32">
          <BodyText className="text-warning">{error || 'No user data available'}</BodyText>
        </div>
      </div>
    );
  }

  const trendData = userDetails ? formatCostTrend(userDetails.costTrend) : [];

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* User Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <BodyText className="font-semibold">User Analysis:</BodyText>
        <select
          value={selectedUser?.id || ''}
          onChange={(e) => {
            const user = users.find(u => u.id === e.target.value);
            setSelectedUser(user || null);
          }}
          className="text-sm border border-border rounded px-3 py-2 bg-background min-w-[200px]"
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - ${user.weeklySpend.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile */}
          <DashboardCard title="User Profile" className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <BodyText className="font-semibold text-lg">{selectedUser.name}</BodyText>
                <BodyText className="text-sm text-muted-foreground">{selectedUser.email}</BodyText>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <BodyText className="text-xs text-muted-foreground">Department</BodyText>
                  <BodyText className="font-medium">{selectedUser.department}</BodyText>
                </div>
                <div>
                  <BodyText className="text-xs text-muted-foreground">Role</BodyText>
                  <BodyText className="font-medium">{selectedUser.role}</BodyText>
                </div>
                <div>
                  <BodyText className="text-xs text-muted-foreground">Weekly Spend</BodyText>
                  <BodyText className="font-mono font-bold text-primary">${selectedUser.weeklySpend.toFixed(2)}</BodyText>
                </div>
                <div>
                  <BodyText className="text-xs text-muted-foreground">Requests</BodyText>
                  <BodyText className="font-mono font-medium">{selectedUser.requestCount}</BodyText>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Daily Usage Trend */}
          <DashboardCard title="Daily Usage Trend" className="lg:col-span-2">
            {detailsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <BodyText className="ml-2 text-muted-foreground">Loading...</BodyText>
              </div>
            ) : (
              <div className="h-32">
                <div className="flex items-end justify-between gap-2 h-24 mb-4">
                  {trendData.map((point, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="w-full bg-muted/30 rounded-t relative overflow-hidden group-hover:bg-muted/50 transition-colors">
                        <div 
                          className="bg-primary/70 rounded-t transition-all duration-300 group-hover:bg-primary"
                          style={{ 
                            height: `${Math.max(point.normalizedHeight, 8)}%`,
                            minHeight: '4px'
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          ${point.cost.toFixed(2)}
                        </div>
                      </div>
                      <BodyText className="text-xs text-muted-foreground">
                        {new Date(point.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                      </BodyText>
                    </div>
                  ))}
                </div>
                <BodyText className="text-xs text-muted-foreground text-center">
                  Last 7 days - Total: ${trendData.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}
                </BodyText>
              </div>
            )}
          </DashboardCard>

          {/* Agent Breakdown */}
          <DashboardCard title="Agent Usage Breakdown" className="lg:col-span-1">
            {detailsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : userDetails?.topAgents ? (
              <div className="space-y-3">
                {userDetails.topAgents.slice(0, 5).map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <div className="flex-1 min-w-0">
                      <BodyText className="text-sm font-medium truncate">{agent.agentName}</BodyText>
                      <BodyText className="text-xs text-muted-foreground">
                        {agent.requestCount} requests
                      </BodyText>
                    </div>
                    <div className="text-right ml-2">
                      <BodyText className="text-sm font-mono">${agent.cost.toFixed(2)}</BodyText>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BodyText className="text-muted-foreground text-center py-8">No agent data</BodyText>
            )}
          </DashboardCard>

          {/* Recent Sessions */}
          <DashboardCard title="Recent Sessions" className="lg:col-span-2">
            {detailsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : userDetails?.recentActivity ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userDetails.recentActivity.slice(0, 10).map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/20 rounded hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BodyText className="text-sm font-medium truncate">{session.agentName}</BodyText>
                        <StatusIndicator status={
                          session.status === 'success' ? 'success' : 
                          session.status === 'error' ? 'warning' : 'neutral'
                        }>
                          {session.status}
                        </StatusIndicator>
                      </div>
                      <BodyText className="text-xs text-muted-foreground">
                        {new Date(session.timestamp).toLocaleString()} • {session.tokenCount} tokens
                      </BodyText>
                    </div>
                    <div className="text-right ml-3">
                      <BodyText className="text-sm font-mono font-medium">${session.cost.toFixed(4)}</BodyText>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BodyText className="text-muted-foreground text-center py-8">No recent sessions</BodyText>
            )}
          </DashboardCard>
        </div>
      )}
    </div>
  );
} 
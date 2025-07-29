import React, { useState, useEffect } from 'react';
import { BodyText, StatusIndicator, DashboardCard, Skeleton, EmptyState } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { Department, FilterState } from '../../types';

interface TeamComparisonTableProps {
  className?: string;
  filters?: FilterState;
  onDepartmentClick?: (department: Department) => void;
  title?: string;
  showSearch?: boolean;
  maxRows?: number;
}

type SortKey = 'name' | 'currentSpend' | 'weekOverWeekChange' | 'activeUsers' | 'costPerUser';
type SortOrder = 'asc' | 'desc';

export default function TeamComparisonTable({ 
  className, 
  filters, 
  onDepartmentClick,
  title = 'Team Performance Comparison',
  showSearch = true,
  maxRows = 10
}: TeamComparisonTableProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('currentSpend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use filtered time range or default
        const timeRange = filters?.timeRange || {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'daily' as const
        };
        
        const result = await dataService.getDepartmentComparison(timeRange, {
          page: 1,
          limit: 50,
          sortBy: sortKey,
          sortOrder: sortOrder
        });
        
        // Apply department filter if specified
        let filteredDepartments = result.data;
        if (filters?.departments.length) {
          filteredDepartments = result.data.filter(dept => 
            filters.departments.includes(dept.id)
          );
        }
        
        setDepartments(filteredDepartments);
      } catch (err) {
        console.error('Error fetching department data:', err);
        setError('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortKey, sortOrder, filters]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };
  
  const handleDepartmentClick = (department: Department) => {
    setSelectedDepartment(department.id);
    onDepartmentClick?.(department);
  };
  
  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, maxRows);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusFromChange = (change: number): 'success' | 'warning' | 'neutral' => {
    if (change <= -10) return 'warning';
    if (change >= 10) return 'warning';
    return change > 0 ? 'success' : 'neutral';
  };

  const getStatusFromSpend = (currentSpend: number, budget: number): 'success' | 'warning' | 'neutral' => {
    const utilization = (currentSpend / budget) * 100;
    if (utilization >= 90) return 'warning';
    if (utilization >= 75) return 'neutral';
    return 'success';
  };

  if (loading) {
    return (
      <DashboardCard className={className} title={title}>
        <div className="space-y-4">
          {showSearch && (
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-20" />
            </div>
          )}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error || departments.length === 0) {
    return (
      <DashboardCard className={className} title={title}>
        <EmptyState
          title={error ? 'Error Loading Data' : 'No Departments Found'}
          description={error || 'No department data available to display.'}
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

  return (
    <DashboardCard 
      className={className} 
      title={title}
      subtitle={`${filteredDepartments.length} department${filteredDepartments.length !== 1 ? 's' : ''} shown`}
      headerAction={
        showSearch ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-background w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  ×
                </button>
              )}
            </div>
            <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Export
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* 5-Week Context Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Avg Weekly Spend</div>
              <div className="text-lg font-bold">$312</div>
              <div className="text-xs text-green-600">↗ +8% vs 5-week avg</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Teams Over Budget</div>
              <div className="text-lg font-bold">2</div>
              <div className="text-xs text-orange-600">→ Same as last week</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Highest Variance</div>
              <div className="text-lg font-bold">+50%</div>
              <div className="text-xs text-muted-foreground">Media Tracking</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Most Stable</div>
              <div className="text-lg font-bold">-1.7%</div>
              <div className="text-xs text-muted-foreground">Finance</div>
            </div>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 min-w-[140px]">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Team {getSortIcon('name')}
                  </button>
                </th>
              <th className="text-left py-4 px-4 min-w-[120px]">
                <button
                  onClick={() => handleSort('currentSpend')}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Weekly Spend {getSortIcon('currentSpend')}
                </button>
              </th>
              <th className="text-left py-4 px-4 min-w-[120px]">
                <button
                  onClick={() => handleSort('weekOverWeekChange')}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Change % {getSortIcon('weekOverWeekChange')}
                </button>
              </th>
              <th className="text-left py-4 px-4 min-w-[100px]">
                <button
                  onClick={() => handleSort('activeUsers')}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Active Users {getSortIcon('activeUsers')}
                </button>
              </th>
              <th className="text-left py-4 px-4 min-w-[120px]">
                <button
                  onClick={() => handleSort('costPerUser')}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  Cost/User {getSortIcon('costPerUser')}
                </button>
              </th>
              <th className="text-left py-4 px-4 min-w-[120px]">
                <BodyText className="text-sm font-semibold text-muted-foreground">Status</BodyText>
              </th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept, index) => {
                const isSelected = selectedDepartment === dept.id;
                const utilizationRate = (dept.currentSpend / dept.weeklyBudget) * 100;
                
                return (
                  <tr 
                    key={dept.id} 
                    className={`border-b border-border/50 hover:bg-muted/20 transition-all cursor-pointer ${
                      isSelected ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleDepartmentClick(dept)}
                  >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        utilizationRate >= 90 ? 'bg-red-500' :
                        utilizationRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <BodyText className="font-medium">{dept.name}</BodyText>
                        <BodyText className="text-xs text-muted-foreground">
                          {dept.totalUsers} total users, {dept.projects.length} projects
                        </BodyText>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BodyText className="font-mono font-medium">${dept.currentSpend.toFixed(0)}</BodyText>
                        {/* Trend indicator for spend */}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          utilizationRate >= 100 ? 'bg-red-100 text-red-700' :
                          utilizationRate >= 90 ? 'bg-orange-100 text-orange-700' :
                          utilizationRate >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {utilizationRate >= 100 ? 'Over' :
                           utilizationRate >= 90 ? 'High' :
                           utilizationRate >= 75 ? 'Med' : 'Low'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              utilizationRate >= 100 ? 'bg-red-500' :
                              utilizationRate >= 90 ? 'bg-orange-500' :
                              utilizationRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                          />
                        </div>
                        <BodyText className="text-xs text-muted-foreground">
                          {utilizationRate.toFixed(0)}%
                        </BodyText>
                      </div>
                      <BodyText className="text-xs text-muted-foreground">
                        vs ${dept.weeklyBudget.toFixed(0)} budget
                      </BodyText>
                    </div>
                  </td>
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1 ${
                      dept.weekOverWeekChange > 0 ? 'text-success' : 
                      dept.weekOverWeekChange < 0 ? 'text-warning' : 'text-secondary'
                    }`}>
                      <span className="text-sm">
                        {dept.weekOverWeekChange > 0 ? '↗' : dept.weekOverWeekChange < 0 ? '↘' : '→'}
                      </span>
                      <BodyText className="font-mono text-sm font-medium">
                        {dept.weekOverWeekChange > 0 ? '+' : ''}{dept.weekOverWeekChange.toFixed(1)}%
                      </BodyText>
                    </div>
                    <BodyText className="text-xs text-muted-foreground">
                      {Math.abs(dept.weekOverWeekChange) > 20 ? 'High variance' :
                       Math.abs(dept.weekOverWeekChange) > 10 ? 'Moderate change' :
                       Math.abs(dept.weekOverWeekChange) > 5 ? 'Normal variation' : 'Stable'}
                    </BodyText>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <BodyText className="font-mono">{dept.activeUsers}</BodyText>
                </td>
                <td className="py-4 px-4">
                  <BodyText className="font-mono">${dept.costPerUser.toFixed(2)}</BodyText>
                </td>
                <td className="py-4 px-4">
                  <StatusIndicator status={getStatusFromSpend(dept.currentSpend, dept.weeklyBudget)}>
                    {getStatusFromSpend(dept.currentSpend, dept.weeklyBudget) === 'success' ? 'On Track' : 
                     getStatusFromSpend(dept.currentSpend, dept.weeklyBudget) === 'warning' ? 'Over Budget' : 'At Risk'}
                  </StatusIndicator>
                </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4">
          {filteredDepartments.map((dept, index) => {
            const isSelected = selectedDepartment === dept.id;
            const utilizationRate = (dept.currentSpend / dept.weeklyBudget) * 100;
            
            return (
              <div 
                key={dept.id} 
                className={`bg-card rounded-lg p-4 space-y-3 cursor-pointer transition-all border ${
                  isSelected ? 'border-primary/20 bg-primary/5' : 'border-border hover:bg-muted/30'
                }`}
                onClick={() => handleDepartmentClick(dept)}
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    utilizationRate >= 90 ? 'bg-red-500' :
                    utilizationRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <BodyText className="font-semibold">{dept.name}</BodyText>
                    <BodyText className="text-xs text-muted-foreground">
                      {dept.projects.length} projects
                    </BodyText>
                  </div>
                </div>
                <StatusIndicator status={getStatusFromSpend(dept.currentSpend, dept.weeklyBudget)}>
                  {getStatusFromSpend(dept.currentSpend, dept.weeklyBudget) === 'success' ? 'On Track' : 
                   getStatusFromSpend(dept.currentSpend, dept.weeklyBudget) === 'warning' ? 'Over Budget' : 'At Risk'}
                </StatusIndicator>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <BodyText className="text-xs text-muted-foreground">Weekly Spend</BodyText>
                  <BodyText className="font-mono font-medium">${dept.currentSpend.toFixed(0)}</BodyText>
                  <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        utilizationRate >= 100 ? 'bg-red-500' :
                        utilizationRate >= 90 ? 'bg-orange-500' :
                        utilizationRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    />
                  </div>
                </div>
              <div>
                <BodyText className="text-xs text-muted-foreground">Change</BodyText>
                <div className={`flex items-center gap-1 ${
                  dept.weekOverWeekChange > 0 ? 'text-success' : 
                  dept.weekOverWeekChange < 0 ? 'text-warning' : 'text-secondary'
                }`}>
                  <span>{dept.weekOverWeekChange > 0 ? '↗' : dept.weekOverWeekChange < 0 ? '↘' : '→'}</span>
                  <BodyText className="font-mono text-sm">{dept.weekOverWeekChange.toFixed(1)}%</BodyText>
                </div>
              </div>
              <div>
                <BodyText className="text-xs text-muted-foreground">Active Users</BodyText>
                <BodyText className="font-mono font-medium">{dept.activeUsers}</BodyText>
              </div>
              <div>
                <BodyText className="text-xs text-muted-foreground">Cost per User</BodyText>
                <BodyText className="font-mono font-medium">${dept.costPerUser.toFixed(2)}</BodyText>
              </div>
              </div>
            </div>
            );
          })}
        </div>
        
        {/* Summary Statistics */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>On Track: {filteredDepartments.filter(d => getStatusFromSpend(d.currentSpend, d.weeklyBudget) === 'success').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>At Risk: {filteredDepartments.filter(d => getStatusFromSpend(d.currentSpend, d.weeklyBudget) === 'neutral').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Over Budget: {filteredDepartments.filter(d => getStatusFromSpend(d.currentSpend, d.weeklyBudget) === 'warning').length}</span>
            </div>
          </div>
          <BodyText className="text-sm text-muted-foreground">
            Total Spend: ${filteredDepartments.reduce((sum, dept) => sum + dept.currentSpend, 0).toFixed(0)}
          </BodyText>
        </div>
      </div>
    </DashboardCard>
  );
}
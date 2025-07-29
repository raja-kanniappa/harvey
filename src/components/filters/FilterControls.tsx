import React, { useState, useEffect } from 'react';
import { DashboardCard, BodyText, StatusIndicator } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { FilterState, TimeRange } from '../../types';

interface FilterControlsProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  className?: string;
  showQuickFilters?: boolean;
}

interface FilterOptions {
  departments: { id: string; name: string }[];
  users: { id: string; name: string; department: string }[];
  agents: { id: string; name: string; type: string }[];
  timeRanges: { label: string; range: TimeRange }[];
}

export default function FilterControls({
  onFiltersChange,
  initialFilters,
  className,
  showQuickFilters = true
}: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      timeRange: {
        start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 5 weeks default
        end: new Date(),
        granularity: 'weekly'
      },
      departments: [],
      projects: [],
      users: [],
      agents: []
    }
  );
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    users: [],
    agents: [],
    timeRanges: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const options = await dataService.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError('Failed to load filter options');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    // Calculate active filters count
    const count = filters.departments.length + 
                 filters.users.length + 
                 filters.agents.length + 
                 (filters.costThreshold ? 1 : 0);
    setActiveFiltersCount(count);
    
    // Notify parent of filter changes
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    updateFilter('timeRange', range);
  };

  const handleDepartmentChange = (departmentIds: string[]) => {
    updateFilter('departments', departmentIds);
    
    // When departments change, filter users to only show those in selected departments
    if (departmentIds.length > 0) {
      const selectedDepartmentNames = filterOptions.departments
        .filter(dept => departmentIds.includes(dept.id))
        .map(dept => dept.name);
      
      const filteredUsers = filters.users.filter(userId => {
        const user = filterOptions.users.find(u => u.id === userId);
        return user && selectedDepartmentNames.includes(user.department);
      });
      
      if (filteredUsers.length !== filters.users.length) {
        updateFilter('users', filteredUsers);
      }
    }
  };

  const clearAllFilters = () => {
    setFilters({
      timeRange: {
        start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 5 weeks default
        end: new Date(),
        granularity: 'weekly'
      },
      departments: [],
      projects: [],
      users: [],
      agents: []
    });
  };

  const applyQuickFilter = (type: string) => {
    const now = new Date();
    let start: Date;
    let granularity: TimeRange['granularity'] = 'daily';

    switch (type) {
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        granularity = 'hourly';
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        granularity = 'daily';
        break;
      case '5w':
        start = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 5 weeks
        granularity = 'weekly';
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        granularity = 'weekly';
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        granularity = 'weekly';
        break;
      default:
        start = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 5 weeks default
        granularity = 'weekly';
    }

    handleTimeRangeChange({ start, end: now, granularity });
  };

  const getFilteredUsers = () => {
    if (filters.departments.length === 0) return filterOptions.users;
    
    const selectedDepartmentNames = filterOptions.departments
      .filter(dept => filters.departments.includes(dept.id))
      .map(dept => dept.name);
    
    return filterOptions.users.filter(user => 
      selectedDepartmentNames.includes(user.department)
    );
  };

  if (loading) {
    return (
      <DashboardCard className={className}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <BodyText className="ml-3 text-muted-foreground">Loading filters...</BodyText>
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard className={className}>
        <div className="flex items-center justify-center py-8">
          <BodyText className="text-warning">{error}</BodyText>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={className}>
      <div className="space-y-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            {activeFiltersCount > 0 && (
              <StatusIndicator status="neutral">
                {activeFiltersCount} active
              </StatusIndicator>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              {isExpanded ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Quick Time Range Filters */}
        {showQuickFilters && (
          <div className="flex flex-wrap gap-2">
            {['24h', '7d', '5w', '30d', '90d'].map((range) => {
              const isActive = (() => {
                const now = new Date();
                const days = range === '24h' ? 1 : 
                           range === '7d' ? 7 : 
                           range === '5w' ? 35 : 
                           range === '30d' ? 30 : 90;
                const expectedStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                const timeDiff = Math.abs(filters.timeRange.start.getTime() - expectedStart.getTime());
                return timeDiff < 60000; // Within 1 minute
              })();

              return (
                <button
                  key={range}
                  onClick={() => applyQuickFilter(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {range === '24h' ? 'Last 24h' : 
                   range === '7d' ? 'Last 7 days' :
                   range === '5w' ? 'Last 5 weeks' :
                   range === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Custom Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.timeRange.start.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value);
                    handleTimeRangeChange({
                      ...filters.timeRange,
                      start: newStart
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.timeRange.end.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value);
                    handleTimeRangeChange({
                      ...filters.timeRange,
                      end: newEnd
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Departments ({filters.departments.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-3 border rounded-md bg-background">
                {filterOptions.departments.map((dept) => (
                  <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.departments.includes(dept.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleDepartmentChange([...filters.departments, dept.id]);
                        } else {
                          handleDepartmentChange(filters.departments.filter(id => id !== dept.id));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Users ({filters.users.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-3 border rounded-md bg-background">
                {getFilteredUsers().map((user) => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.users.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('users', [...filters.users, user.id]);
                        } else {
                          updateFilter('users', filters.users.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.department}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Agent Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Agents ({filters.agents.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-3 border rounded-md bg-background">
                {filterOptions.agents.map((agent) => (
                  <label key={agent.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.agents.includes(agent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('agents', [...filters.agents, agent.id]);
                        } else {
                          updateFilter('agents', filters.agents.filter(id => id !== agent.id));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.type}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Cost Threshold Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Minimum Cost Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.costThreshold || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateFilter('costThreshold', value);
                  }}
                  placeholder="0.00"
                  className="w-32 px-3 py-2 text-sm border rounded-md bg-background"
                />
                <span className="text-sm text-muted-foreground">USD</span>
                {filters.costThreshold && (
                  <button
                    onClick={() => updateFilter('costThreshold', undefined)}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Filters Summary */}
        {(activeFiltersCount > 0 && !isExpanded) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.departments.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm">
                <span className="text-primary font-medium">Departments:</span>
                <span className="text-primary">{filters.departments.length}</span>
              </div>
            )}
            {filters.users.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm">
                <span className="text-primary font-medium">Users:</span>
                <span className="text-primary">{filters.users.length}</span>
              </div>
            )}
            {filters.agents.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm">
                <span className="text-primary font-medium">Agents:</span>
                <span className="text-primary">{filters.agents.length}</span>
              </div>
            )}
            {filters.costThreshold && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md text-sm">
                <span className="text-primary font-medium">Min Cost:</span>
                <span className="text-primary">${filters.costThreshold}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
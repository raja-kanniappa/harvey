import React, { useState, useEffect } from 'react';
import { BodyText } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { FilterState, TimeRange } from '../../types';

interface FilterOptions {
  departments: { id: string; name: string }[];
  users: { id: string; name: string; department: string }[];
  agents: { id: string; name: string; type: string }[];
  timeRanges: { label: string; range: TimeRange }[];
}

interface FilterControlsProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

interface MultiSelectProps {
  label: string;
  options: { id: string; name: string; department?: string; type?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect({ label, options, selected, onChange, placeholder, disabled }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId));
    } else {
      onChange([...selected, optionId]);
    }
  };

  const selectedOptions = options.filter(opt => selected.includes(opt.id));

  return (
    <div className="flex flex-col gap-2 min-w-0 relative">
      <BodyText className="text-sm font-medium text-muted-foreground">{label}</BodyText>
      
      {/* Selected items display */}
      <div className="min-h-[40px] border border-border rounded px-3 py-2 bg-background">
        {selected.length === 0 ? (
          <BodyText className="text-sm text-muted-foreground">{placeholder || `Select ${label.toLowerCase()}...`}</BodyText>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map(option => (
              <span 
                key={option.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs"
              >
                {option.name}
                {option.department && ` (${option.department})`}
                {option.type && ` (${option.type})`}
                <button
                  onClick={() => handleToggle(option.id)}
                  className="hover:bg-primary/20 rounded px-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
      >
        {isOpen ? 'Hide Options ▲' : 'Show Options ▼'}
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/30 transition-colors ${
                selected.includes(option.id) ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  readOnly
                  className="rounded"
                />
                <span>
                  {option.name}
                  {option.department && <span className="text-muted-foreground"> ({option.department})</span>}
                  {option.type && <span className="text-muted-foreground"> ({option.type})</span>}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterControls({ onFiltersChange, className }: FilterControlsProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
      granularity: 'daily'
    },
    departments: [],
    projects: [],
    users: [],
    agents: [],
    costThreshold: undefined
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        const options = await dataService.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    // Notify parent component of filter changes
    onFiltersChange(currentFilters);
  }, [currentFilters, onFiltersChange]);

  const updateFilters = (key: keyof FilterState, value: any) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTimeRangeChange = (selectedRange: TimeRange) => {
    updateFilters('timeRange', selectedRange);
  };

  const handleDepartmentChange = (departmentIds: string[]) => {
    updateFilters('departments', departmentIds);
    // Clear users when departments change
    if (departmentIds.length === 0) {
      updateFilters('users', []);
    }
  };

  const handleUserChange = (userIds: string[]) => {
    updateFilters('users', userIds);
  };

  const handleAgentChange = (agentIds: string[]) => {
    updateFilters('agents', agentIds);
  };

  const handleCostThresholdChange = (threshold: number | undefined) => {
    updateFilters('costThreshold', threshold);
  };

  const clearFilters = () => {
    setCurrentFilters({
      timeRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
        granularity: 'daily'
      },
      departments: [],
      projects: [],
      users: [],
      agents: [],
      costThreshold: undefined
    });
  };

  const getFilteredUsers = () => {
    if (!filterOptions) return [];
    if (currentFilters.departments.length === 0) return filterOptions.users;
    
    const selectedDepartments = filterOptions.departments
      .filter(dept => currentFilters.departments.includes(dept.id))
      .map(dept => dept.name);
    
    return filterOptions.users.filter(user => 
      selectedDepartments.includes(user.department)
    );
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <BodyText className="text-muted-foreground">Loading filters...</BodyText>
        </div>
      </div>
    );
  }

  if (!filterOptions) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <BodyText className="text-warning">Failed to load filter options</BodyText>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Time Range Filter */}
        <div className="flex flex-col gap-2 min-w-0">
          <BodyText className="text-sm font-medium text-muted-foreground">Time Range</BodyText>
          <select
            value={filterOptions.timeRanges.findIndex(tr => 
              tr.range.start.getTime() === currentFilters.timeRange.start.getTime() &&
              tr.range.end.getTime() === currentFilters.timeRange.end.getTime()
            )}
            onChange={(e) => {
              const selectedRange = filterOptions.timeRanges[parseInt(e.target.value)];
              if (selectedRange) {
                handleTimeRangeChange(selectedRange.range);
              }
            }}
            className="text-sm border border-border rounded px-3 py-2 bg-background"
          >
            {filterOptions.timeRanges.map((range, index) => (
              <option key={index} value={index}>{range.label}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <MultiSelect
          label="Departments"
          options={filterOptions.departments}
          selected={currentFilters.departments}
          onChange={handleDepartmentChange}
          placeholder="All departments"
        />

        {/* User Filter */}
        <MultiSelect
          label="Users"
          options={getFilteredUsers()}
          selected={currentFilters.users}
          onChange={handleUserChange}
          placeholder="All users"
          disabled={getFilteredUsers().length === 0}
        />

        {/* Agent Filter */}
        <MultiSelect
          label="Agents"
          options={filterOptions.agents}
          selected={currentFilters.agents}
          onChange={handleAgentChange}
          placeholder="All agents"
        />

        {/* Cost Threshold Filter */}
        <div className="flex flex-col gap-2 min-w-0">
          <BodyText className="text-sm font-medium text-muted-foreground">Min Cost ($)</BodyText>
          <input
            type="number"
            step="0.01"
            min="0"
            value={currentFilters.costThreshold || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              handleCostThresholdChange(value);
            }}
            placeholder="0.00"
            className="text-sm border border-border rounded px-3 py-2 bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors border border-border rounded hover:bg-muted/30"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(currentFilters.departments.length > 0 || currentFilters.users.length > 0 || currentFilters.agents.length > 0 || currentFilters.costThreshold) && (
        <div className="mt-4 pt-4 border-t border-border">
          <BodyText className="text-sm font-medium text-muted-foreground mb-2">Active Filters:</BodyText>
          <div className="flex flex-wrap gap-2">
            {currentFilters.departments.length > 0 && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                {currentFilters.departments.length} Department{currentFilters.departments.length !== 1 ? 's' : ''}
              </div>
            )}
            {currentFilters.users.length > 0 && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                {currentFilters.users.length} User{currentFilters.users.length !== 1 ? 's' : ''}
              </div>
            )}
            {currentFilters.agents.length > 0 && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                {currentFilters.agents.length} Agent{currentFilters.agents.length !== 1 ? 's' : ''}
              </div>
            )}
            {currentFilters.costThreshold && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                Min Cost: ${currentFilters.costThreshold}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
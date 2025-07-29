import React, { useState, useEffect } from 'react';
import { BodyText, DashboardCard, SubHeading, Skeleton } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { TimeSeriesData, TrendFilters, FilterState } from '../../types';

interface UsageTrendChartProps {
  className?: string;
  filters?: FilterState;
  title?: string;
  showControls?: boolean;
}

type ChartMetric = 'cost' | 'requests' | 'users';

export default function UsageTrendChart({ 
  className, 
  filters, 
  title = 'Usage Trends',
  showControls = true 
}: UsageTrendChartProps) {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('cost');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const trendFilters: TrendFilters = {
          timeRange: filters?.timeRange || {
            start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            end: new Date(),
            granularity: days <= 7 ? 'daily' : days <= 30 ? 'daily' : 'weekly'
          },
          granularity: days <= 7 ? 'daily' : days <= 30 ? 'daily' : 'weekly',
          departmentIds: filters?.departments.length ? filters.departments : undefined,
          userIds: filters?.users.length ? filters.users : undefined,
          agentIds: filters?.agents.length ? filters.agents : undefined
        };
        
        const data = await dataService.getUsageTrends(trendFilters);
        setTimeSeriesData(data);
      } catch (err) {
        console.error('Error fetching usage trends:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, filters]);

  if (loading) {
    return (
      <DashboardCard className={className} title={title}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="min-h-[200px] flex items-end justify-between gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-1">
                <Skeleton className={`w-full rounded-t-lg h-[${20 + Math.random() * 100}px]`} />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error || !timeSeriesData) {
    return (
      <DashboardCard className={className} title={title}>
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-4xl text-muted-foreground">📊</div>
            <BodyText className="text-warning">{error || 'No chart data available'}</BodyText>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </DashboardCard>
    );
  }

  // Prepare chart data - take appropriate amount based on time range
  const dataPoints = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const chartData = timeSeriesData.points.slice(-dataPoints);
  
  // Get the appropriate metric value
  const getMetricValue = (item: any) => {
    switch (selectedMetric) {
      case 'cost': return item.cost;
      case 'requests': return item.requestCount;
      case 'users': return item.userCount;
      default: return item.cost;
    }
  };
  
  const maxValue = Math.max(...chartData.map(d => getMetricValue(d)));
  const minValue = Math.min(...chartData.map(d => getMetricValue(d)));
  
  // Format dates based on time range
  const formatDate = (date: Date) => {
    if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  // Format metric value for display
  const formatMetricValue = (value: number) => {
    switch (selectedMetric) {
      case 'cost': return `$${value.toFixed(2)}`;
      case 'requests': return value.toLocaleString();
      case 'users': return value.toString();
      default: return value.toString();
    }
  };
  
  // Calculate percentage change for trend indicator
  const getPercentageChange = () => {
    if (chartData.length < 2) return 0;
    const firstValue = getMetricValue(chartData[0]);
    const lastValue = getMetricValue(chartData[chartData.length - 1]);
    return firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  };
  
  const percentageChange = getPercentageChange();
  const isIncreasing = percentageChange > 0;
  const isDecreasing = percentageChange < 0;

  return (
    <DashboardCard 
      className={className} 
      title={title}
      subtitle={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} trend over time`}
      headerAction={
        showControls ? (
          <div className="flex items-center gap-2">
            {/* Metric Selector */}
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ChartMetric)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="cost">Cost</option>
              <option value="requests">Requests</option>
              <option value="users">Users</option>
            </select>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {range === '7d' ? '7d' : range === '30d' ? '30d' : '90d'}
                </button>
              ))}
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Trend Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-primary">
              {formatMetricValue(getMetricValue(chartData[chartData.length - 1] || {}))}
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isIncreasing ? 'text-green-600' : isDecreasing ? 'text-red-600' : 'text-muted-foreground'
            }`}>
              <span className="text-base">
                {isIncreasing ? '↗' : isDecreasing ? '↘' : '→'}
              </span>
              <span>{Math.abs(percentageChange).toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Peak: {formatMetricValue(maxValue)}</div>
            <div>Min: {formatMetricValue(minValue)}</div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative">
          <div className="flex items-end justify-between gap-2 min-h-[200px] pb-8">
            {chartData.map((item, index) => {
              const value = getMetricValue(item);
              const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const isHovered = hoveredIndex === index;
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center gap-3 flex-1 min-w-0 group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="w-full bg-muted/30 rounded-t-lg relative overflow-hidden min-h-[20px] group-hover:bg-muted/50 transition-all duration-300">
                    <div 
                      className={`rounded-t-lg transition-all duration-500 ease-out w-full ${
                        selectedMetric === 'cost' ? 'bg-blue-500' :
                        selectedMetric === 'requests' ? 'bg-green-500' :
                        'bg-purple-500'
                      } ${isHovered ? 'shadow-lg opacity-100' : 'opacity-70'}`}
                      style={{ 
                        height: `${Math.max(heightPercent * 1.5, 12)}px`,
                        minHeight: '12px'
                      }}
                    />
                    
                    {/* Enhanced Hover tooltip */}
                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-opacity duration-200 whitespace-nowrap z-10 ${
                      isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}>
                      <div className="text-center space-y-1">
                        <div className="font-medium">{formatDate(item.timestamp)}</div>
                        <div className="text-yellow-200">{formatMetricValue(value)}</div>
                        <div className="text-gray-300 text-xs">
                          {selectedMetric === 'cost' ? `${item.requestCount} requests` :
                           selectedMetric === 'requests' ? `$${item.cost.toFixed(2)} cost` :
                           `${item.requestCount} requests`}
                        </div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                  
                  <BodyText className={`text-xs text-muted-foreground font-medium whitespace-nowrap transition-colors ${
                    isHovered ? 'text-primary' : ''
                  }`}>
                    {timeRange === '7d' ? formatDate(item.timestamp) : 
                     timeRange === '30d' ? formatDate(item.timestamp) :
                     formatDate(item.timestamp)}
                  </BodyText>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                selectedMetric === 'cost' ? 'bg-blue-500' :
                selectedMetric === 'requests' ? 'bg-green-500' :
                'bg-purple-500'
              }`} />
              <BodyText className="text-sm text-muted-foreground">
                {selectedMetric === 'cost' ? 'Daily Cost' :
                 selectedMetric === 'requests' ? 'Daily Requests' :
                 'Daily Active Users'}
              </BodyText>
            </div>
            <BodyText className="text-sm text-muted-foreground">
              Total: {selectedMetric === 'cost' ? 
                `$${timeSeriesData.summary.totalCost.toFixed(2)}` :
                selectedMetric === 'requests' ? 
                `${timeSeriesData.summary.totalRequests.toLocaleString()}` :
                `${chartData.reduce((sum, item) => sum + item.userCount, 0)} user-days`}
            </BodyText>
            <BodyText className="text-sm text-muted-foreground">
              Avg per day: {selectedMetric === 'cost' ? 
                `$${(timeSeriesData.summary.totalCost / chartData.length).toFixed(2)}` :
                selectedMetric === 'requests' ? 
                `${Math.round(timeSeriesData.summary.totalRequests / chartData.length).toLocaleString()}` :
                `${Math.round(chartData.reduce((sum, item) => sum + item.userCount, 0) / chartData.length)}`}
            </BodyText>
          </div>
          <div className="flex items-center gap-2">
            <BodyText className="text-xs text-muted-foreground">
              {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 3 months'}
            </BodyText>
            <button 
              onClick={() => setHoveredIndex(null)}
              className="text-xs text-primary hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
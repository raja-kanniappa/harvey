import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Activity,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import TopSummaryBar from '../components/dashboard/TopSummaryBar';
import TopCostDrivers from '../components/dashboard/TopCostDrivers';
import { dashboardApiService } from '../services/dashboardApiService';
import { DashboardSummaryResponse } from '../types/api';

const quickStats = [
  {
    title: 'Active Users',
    value: '284',
    change: '+12%',
    changeType: 'positive' as const,
    description: 'vs last week',
    icon: Users,
    colSpan: 1,
  },
  {
    title: 'Active Agents',
    value: '47',
    change: '+3',
    changeType: 'positive' as const,
    description: 'vs last week',
    icon: Activity,
    colSpan: 1,
  },
  {
    title: 'Top Model',
    value: 'GPT-4',
    percentage: '42%',
    cost: '$156.80',
    tokens: '2.1M',
    usageChange: '+8%',
    costChange: '+12%',
    changeType: 'positive' as const,
    description: 'vs last week',
    icon: TrendingUp,
    colSpan: 2,
  },
];

// Generate week options (current week + 4 past weeks)
const generateWeekOptions = () => {
  const weeks = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7));
    // Get Monday of that week
    const monday = new Date(weekStart);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    // Get Sunday of that week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const label = i === 0 ? 'Current Week' : `${i} week${i > 1 ? 's' : ''} ago`;
    const dateRange = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    weeks.push({
      value: `week-${i}`,
      label,
      dateRange,
      weekStart: monday,
      weekEnd: sunday
    });
  }
  
  return weeks;
};


export default function Dashboard() {
  const [selectedWeek, setSelectedWeek] = useState('week-0'); // Default to current week
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const weekOptions = generateWeekOptions();

  // Fetch dashboard data based on selected week
  const fetchDashboardData = async (weekValue: string) => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected week
      const selectedWeekOption = weekOptions.find(w => w.value === weekValue);
      if (!selectedWeekOption) return;

      const startDate = selectedWeekOption.weekStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDate = selectedWeekOption.weekEnd.toISOString().split('T')[0];     // YYYY-MM-DD

      const data = await dashboardApiService.getDashboardSummary({ 
        environment: 'UAT',
        start_date: startDate,
        end_date: endDate
      });
      
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or selected week changes
  useEffect(() => {
    fetchDashboardData(selectedWeek);
  }, [selectedWeek]);

  // Generate real Quick Stats from API data
  const getRealQuickStats = () => {
    if (!dashboardData) return quickStats; // Fallback to mock data if API data not loaded

    // Get selected week info for description
    const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
    const weekDescription = selectedWeekOption?.label || 'selected period';
    const isCurrentWeek = selectedWeek === 'week-0';
    
    // Format description based on whether it's current week or historical
    const getDescription = (baseDescription: string) => {
      if (isCurrentWeek) {
        return baseDescription;
      } else {
        return `for ${weekDescription.toLowerCase()}`;
      }
    };

    return [
      {
        title: 'Active Users',
        value: dashboardData.active_users.toString(),
        change: isCurrentWeek ? '+12%' : 'N/A', // Show change only for current week
        changeType: 'positive' as const,
        description: getDescription('vs last week'),
        icon: Users,
        colSpan: 1,
      },
      {
        title: 'Total Users',
        value: dashboardData.total_users.toString(),
        change: isCurrentWeek ? '+8%' : 'N/A',
        changeType: 'positive' as const,
        description: getDescription('registered users'),
        icon: Users,
        colSpan: 1,
      },
      {
        title: 'Active Agents',
        value: dashboardData.active_agents.toString(),
        change: isCurrentWeek ? '+2' : 'N/A',
        changeType: 'positive' as const,
        description: getDescription('vs last week'),
        icon: Activity,
        colSpan: 1,
      },
      {
        title: 'Avg Cost per User',
        value: `$${dashboardData.avg_cost_per_user.toFixed(2)}`,
        change: isCurrentWeek ? '-$0.23' : 'N/A',
        changeType: 'positive' as const,
        description: getDescription('vs last week'),
        icon: DollarSign,
        colSpan: 1,
      },
    ];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage="dashboard" 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-12 p-8 overflow-y-auto">
      {/* Page Header */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-lg text-gray-600 font-light">
              Welcome, Let's dive into your personalized analytics.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50 shadow-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live data</span>
          </div>
        </div>

        {/* Weekly Budget Summary */}
        <TopSummaryBar />
      </div>

      {/* Quick Stats */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-gray-900">Performance Overview</h2>
            <p className="text-sm text-gray-500">Key metrics for the selected period</p>
          </div>
          
          {/* Modern Week Selector */}
          <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-gray-200/50">
            {weekOptions.slice(0, 4).map((week, index) => (
              <button
                key={week.value}
                onClick={() => setSelectedWeek(week.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedWeek === week.value
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {index === 0 ? 'This Week' : 
                 index === 1 ? 'Last Week' : 
                 index === 2 ? '2 Weeks Ago' : 
                 '3 Weeks Ago'}
              </button>
            ))}
            
            {/* Only show dropdown if selected week is beyond the quick buttons */}
            {!weekOptions.slice(0, 4).find(week => week.value === selectedWeek) && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent hover:bg-gray-50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.slice(4).map((week) => (
                      <SelectItem key={week.value} value={week.value} className="focus:bg-accent focus:text-accent-foreground">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{week.label}</span>
                          <span className="text-xs opacity-70">{week.dateRange}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            
            {/* Show "More..." button when recent week is selected */}
            {weekOptions.slice(0, 4).find(week => week.value === selectedWeek) && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Select value="" onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[100px] border-0 bg-transparent hover:bg-gray-50 rounded-xl text-gray-500">
                    <SelectValue placeholder="More" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.slice(4).map((week) => (
                      <SelectItem key={week.value} value={week.value} className="focus:bg-accent focus:text-accent-foreground">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{week.label}</span>
                          <span className="text-xs opacity-70">{week.dateRange}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            // Modern Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-lg" />
                  <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-lg" />
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : (
            getRealQuickStats().map((stat) => {
            const Icon = stat.icon;
            const isTopModel = stat.title === 'Top Model';
            
            return (
              <Card 
                key={stat.title} 
                className={`border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group ${isTopModel ? 'lg:col-span-2' : ''}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isTopModel ? (
                    // Top Model Card Layout
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        {/* Line 1: Model Name */}
                        <div className="text-3xl font-light text-gray-900">{stat.value}</div>
                        
                        {/* Line 2: Usage share and tokens */}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-blue-600">{(stat as any).percentage}</span>
                            <span className="text-gray-500">usage share</span>
                          </div>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <span className="text-gray-500">{(stat as any).tokens} tokens</span>
                        </div>
                      </div>
                      
                      {/* Right side: Cost with modern styling */}
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-light text-gray-900">{(stat as any).cost}</div>
                        <div className="flex items-center justify-end gap-1.5 text-sm">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            (stat as any).changeType === 'positive' ? 'bg-green-50 text-green-700' :
                            (stat as any).changeType === 'negative' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {(stat as any).changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                            {(stat as any).changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                            {(stat as any).changeType === 'neutral' && <CheckCircle className="h-3 w-3" />}
                            {(stat as any).costChange}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Standard Card Layout
                    <div className="space-y-3">
                      <div className="text-3xl font-light text-gray-900">{stat.value}</div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          (stat as any).changeType === 'positive' ? 'bg-green-50 text-green-700' :
                          (stat as any).changeType === 'negative' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {(stat as any).changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                          {(stat as any).changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                          {(stat as any).changeType === 'neutral' && <CheckCircle className="h-3 w-3" />}
                          {stat.change}
                        </div>
                        <span className="text-sm text-gray-500">{stat.description}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            })
          )}
        </div>
      </div>

      {/* Top Cost Drivers */}
      <TopCostDrivers selectedWeek={selectedWeek} weekOptions={weekOptions} />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border/30">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Harvey Analytics Dashboard v2.1.0
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
}
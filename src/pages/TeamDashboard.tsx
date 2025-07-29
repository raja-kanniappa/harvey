import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  TrendingUp,
  DollarSign,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Menu,
  BarChart3,
  Settings,
  Home,
  Calendar
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ComposedChart } from 'recharts';
import { BodyText } from '@/components/ui/design-system';
import { teamApiService } from '@/services/teamApiService';
import { TeamData, TeamChartDataPoint, WeekOption } from '@/types/api';

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

const chartConfig = {
  cost: {
    label: "Cost",
    color: "hsl(var(--chart-1))",
  },
  inputTokens: {
    label: "Input Tokens", 
    color: "hsl(var(--chart-2))",
  },
  outputTokens: {
    label: "Output Tokens",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


export default function TeamDashboard() {
  const [selectedWeek, setSelectedWeek] = useState('week-0');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamsData, setTeamsData] = useState<TeamData[]>([]);
  const [currentTeamDetails, setCurrentTeamDetails] = useState<TeamData | null>(null);
  const [chartData, setChartData] = useState<TeamChartDataPoint[]>([]);
  const [chartFilter, setChartFilter] = useState<'cost' | 'requests' | 'sessions' | 'users'>('cost');
  const [totalCost, setTotalCost] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedView, setSelectedView] = useState('main');
  const [teamAnalyticsExpanded, setTeamAnalyticsExpanded] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  
  const weekOptions = generateWeekOptions();
  const currentTeam = currentTeamDetails;

  const formatNumber = (num: number | undefined): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Fetch teams data from API
  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekOptions = generateWeekOptions();
      const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
      const weekOffset = selectedWeekOption ? parseInt(selectedWeek.split('-')[1]) : 0;
      const dateRange = teamApiService.getWeekDateRange(weekOffset);
      
      const analytics = await teamApiService.getTeamAnalytics({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        environment: 'All'
      });
      
      setTeamsData(analytics.teams);
      setChartData(analytics.chartData);
      setTotalCost(analytics.totalCost);
      setTotalTeams(analytics.totalTeams);
    } catch (error) {
      console.error('Error fetching teams data:', error);
      setError('Failed to load teams data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchTeamsData();
  }, [selectedWeek]);

  const fetchTeamDetails = async (teamId: string) => {
    if (!teamId) {
      setCurrentTeamDetails(null);
      return;
    }

    try {
      setDetailsLoading(true);
      setTeamLoading(true);
      
      const weekOptions = generateWeekOptions();
      const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
      const weekOffset = selectedWeekOption ? parseInt(selectedWeek.split('-')[1]) : 0;
      const dateRange = teamApiService.getWeekDateRange(weekOffset);
      
      // Find team from current data first
      const team = teamsData.find(t => t.id === teamId);
      if (!team) {
        setCurrentTeamDetails(null);
        setDetailsLoading(false);
        setTeamLoading(false);
        return;
      }
      
      // Fetch detailed team data
      const teamDetails = await teamApiService.getTeamDetails(team.name, {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        environment: 'All'
      });
      
      setCurrentTeamDetails(teamDetails);
    } catch (error) {
      console.error('Error fetching team details:', error);
      // Fallback to basic team data
      setCurrentTeamDetails(teamsData.find(team => team.id === teamId) || null);
    } finally {
      setDetailsLoading(false);
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam);
    } else {
      setCurrentTeamDetails(null);
    }
  }, [selectedTeam, selectedView, teamsData]);

  const getChartData = () => {
    if (currentTeamDetails?.trends && currentTeamDetails.trends.length > 0) {
      return currentTeamDetails.trends.map(trend => ({
        name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: trend.date,
        cost: trend.cost,
        requests: trend.requests,
        sessions: 0, // Sessions data not available in trends
        users: trend.users,
        value: chartFilter === 'cost' ? trend.cost : 
               chartFilter === 'requests' ? trend.requests :
               chartFilter === 'sessions' ? 0 : trend.users
      }));
    }
    return chartData;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && <Skeleton className="h-6 w-32" />}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-200">
              <div className="flex items-center gap-1 px-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-10 w-[200px] rounded-md" />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && <h1 className="text-lg font-semibold text-gray-900">Harvey Analytics</h1>}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Analytics</h2>
              <p className="text-sm text-gray-600">Detailed team performance with user breakdown</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-200">
              <div className="flex items-center gap-1 px-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Week:</span>
              </div>
              <div className="w-[200px] h-10 bg-white rounded-md flex items-center px-3 text-gray-400">
                Select week
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-6 p-6">
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <BodyText>{error}</BodyText>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Button onClick={() => setError(null)} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Custom Sidebar with Team Navigation */}
      <div className={`bg-white/80 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200/50">
          {!sidebarCollapsed && (
            <div className="space-y-1">
              <h1 className="text-xl font-light text-gray-900">Harvey</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">ANALYTICS</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-6'}`}>
          <div className="space-y-8">
            {/* Team Analytics - Expandable Navigation */}
            <div className="space-y-3">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                  Navigation
                </h3>
              )}
              
              {/* Team Analytics Section */}
              <div className="rounded-2xl overflow-hidden bg-blue-50/30 border border-blue-100">
                {/* Parent Level - Team Analytics */}
                <div 
                  onClick={() => {
                    if (!sidebarCollapsed) {
                      setTeamAnalyticsExpanded(!teamAnalyticsExpanded);
                      setSelectedView('main');
                      setSelectedTeam('');
                    }
                  }}
                  className={`group flex items-center gap-4 cursor-pointer transition-all duration-200 bg-blue-100 hover:bg-blue-150 ${sidebarCollapsed ? 'justify-center px-2 py-4' : 'px-4 py-4'}`}
                >
                  <Users className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-blue-900">Team Analytics</div>
                      <div className="text-xs text-blue-600">Performance & Usage</div>
                    </div>
                  )}
                  {!sidebarCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform text-blue-600 ${
                      teamAnalyticsExpanded ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>

                {/* Child Level - Navigation Options */}
                {!sidebarCollapsed && teamAnalyticsExpanded && (
                  <div className="bg-blue-50/50 p-3">
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {/* Main View */}
                      <div
                        onClick={() => {
                          setSelectedView('main');
                          setSelectedTeam('');
                          setTeamLoading(false);
                        }}
                        className={`px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                          selectedView === 'main'
                            ? 'bg-blue-200 text-blue-900 font-semibold shadow-sm' 
                            : 'text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                        }`}
                      >
                        <div className="font-medium text-sm">Main</div>
                      </div>
                      
                      {/* Individual Teams */}
                      {teamsData.length > 0 && (
                        teamsData.map((team) => (
                          <div
                            key={team.id}
                            onClick={() => {
                              setSelectedTeam(team.id);
                              setSelectedView('team');
                            }}
                            className={`px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                              selectedTeam === team.id && selectedView === 'team'
                                ? 'bg-blue-200 text-blue-900 font-semibold shadow-sm' 
                                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate flex-1">{team.name}</div>
                              {teamLoading && selectedTeam === team.id && selectedView === 'team' && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Other Navigation Items */}
              <a href="/" className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
                <Home className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Dashboard</div>
                    <div className="text-xs text-gray-500">Overview</div>
                  </div>
                )}
              </a>

              <a href="/agents" className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
                <Brain className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Agents</div>
                    <div className="text-xs text-gray-500">AI Agents</div>
                  </div>
                )}
              </a>

              <a href="/users" className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
                <Users className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Users</div>
                    <div className="text-xs text-gray-500">User Analytics</div>
                  </div>
                )}
              </a>

              <a href="/models" className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
                <BarChart3 className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Models</div>
                    <div className="text-xs text-gray-500">AI Models</div>
                  </div>
                )}
              </a>
            </div>

            {/* Settings Section */}
            <div className="space-y-3">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                  Settings
                </h3>
              )}
              <div className={`group flex items-center gap-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
                <Settings className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">Settings</div>
                    <div className="text-xs text-gray-500">Configuration</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-6 border-t border-gray-200/50">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Environment</span>
              </div>
              <div className="text-sm font-medium text-gray-900">UAT Testing</div>
              <div className="text-xs text-gray-500">Development mode</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-12 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <h1 className="text-4xl font-light tracking-tight text-gray-900">
                  {selectedView === 'main' ? 'Teams' : currentTeam?.name || 'Team Details'}
                </h1>
                <p className="text-lg text-gray-600 font-light">
                  {selectedView === 'main' 
                    ? 'Detailed team performance with user breakdown'
                    : 'Performance metrics and user analysis for selected team'
                  }
                </p>
                {/* Selected Week Date Range */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {(() => {
                      const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
                      if (selectedWeekOption) {
                        return `${selectedWeekOption.weekStart.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} - ${selectedWeekOption.weekEnd.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}`;
                      }
                      return 'Select a week';
                    })()}
                  </span>
                </div>
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
          </div>

      {/* Main View - Shows all teams data */}
      {selectedView === 'main' && (
        <>
      {/* Consolidated Metric Cards - Above Chart */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Teams</CardTitle>
            <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-light text-gray-900">{totalTeams}</div>
            <p className="text-sm text-gray-500">Total teams</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Active Users</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-light text-gray-900">
              {teamsData.reduce((total, team) => total + team.activeUsers, 0)}/{teamsData.reduce((total, team) => total + team.totalUsers, 0)}
            </div>
            <p className="text-sm text-gray-500">Active users across all teams</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Avg Cost/User</CardTitle>
            <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-all">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-light text-gray-900">
              ${(teamsData.reduce((total, team) => total + team.totalCost, 0) / Math.max(teamsData.reduce((total, team) => total + team.activeUsers, 0), 1)).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Average cost per active user</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Total Cost</CardTitle>
            <div className="p-2 rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-all">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-light text-gray-900">${totalCost.toFixed(2)}</div>
            <p className="text-sm text-gray-500">Total cost across all teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Cost Overview Chart */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Team Cost Overview</CardTitle>
                <CardDescription className="text-gray-600">
                  Cost comparison across all teams • Sorted by highest cost
                </CardDescription>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total spend
                  </div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalTeams}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total teams
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-4 border-t">
            <h4 className="text-lg font-semibold mb-6">Team Cost Distribution</h4>
            <ChartContainer config={chartConfig} className="h-[300px] w-full [&>div]:!aspect-auto">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 20,
                  right: 12,
                  left: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">
                              {data.fullName || 'Team'}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div>Cost: ${data.cost?.toFixed(2) || '0.00'}</div>
                              <div>Active Users: {data.activeUsers || 0}/{data.totalUsers || 0}</div>
                              <div>Sessions: {formatNumber(data.sessions)}</div>
                              <div>Requests: {formatNumber(data.requests)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="cost" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Team-Specific View - Shows data for selected team only */}
      {selectedView === 'team' && selectedTeam && (
        <>
      {/* Team-Specific Analysis */}
      {teamsData.length > 0 && (
        <div className="space-y-6">
            {/* Team Overview Metric Cards */}
            {currentTeam ? (
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Active Users</CardTitle>
                    <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{currentTeam.activeUsers}/{currentTeam.totalUsers}</div>
                    <p className="text-sm text-gray-500">Active users</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Requests</CardTitle>
                    <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
                      <Brain className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{formatNumber(currentTeam?.requests || 0)}</div>
                    <p className="text-sm text-gray-500">Total requests</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Sessions</CardTitle>
                    <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-all">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{formatNumber(currentTeam?.sessions || 0)}</div>
                    <p className="text-sm text-gray-500">Total sessions</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Total Cost</CardTitle>
                    <div className="p-2 rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-all">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">${currentTeam.totalCost.toFixed(2)}</div>
                    <p className="text-sm text-gray-500">Team total cost</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Please select a team to view details.
              </div>
            )}
            
            {/* Trends Chart for Selected Team */}
            {currentTeam?.trends && (
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">{currentTeam.name} Trends</CardTitle>
                      <CardDescription className="text-gray-600">
                        Performance trends for the selected team over time
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(['cost', 'requests', 'sessions', 'users'] as const).map((filter) => (
                        <Button
                          key={filter}
                          variant={chartFilter === filter ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartFilter(filter)}
                          className="capitalize"
                        >
                          {filter}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full [&>div]:!aspect-auto">
                    {(chartFilter === 'cost' || chartFilter === 'users') ? (
                      <BarChart
                        accessibilityLayer
                        data={getChartData()}
                        margin={{
                          top: 20,
                          right: 12,
                          left: 12,
                          bottom: 12,
                        }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={0}
                          textAnchor="middle"
                          height={60}
                          interval={0}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            if (chartFilter === 'cost') return `$${value}`;
                            if (chartFilter === 'requests') return formatNumber(value);
                            if (chartFilter === 'sessions') return value.toString();
                            if (chartFilter === 'users') return value.toString();
                            return value.toString();
                          }}
                        />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="font-medium">
                                      {currentTeam.name} - {label}
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                      <div>Cost: ${data.cost?.toFixed(2) || '0.00'}</div>
                                      <div>Requests: {formatNumber(data.requests)}</div>
                                      <div>Tokens: {formatNumber(data.tokens)}</div>
                                      <div>Users: {data.users || 0}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    ) : (
                      <LineChart
                        accessibilityLayer
                        data={getChartData()}
                        margin={{
                          top: 20,
                          right: 12,
                          left: 12,
                          bottom: 12,
                        }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={0}
                          textAnchor="middle"
                          height={60}
                          interval={0}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            if (chartFilter === 'cost') return `$${value}`;
                            if (chartFilter === 'requests') return formatNumber(value);
                            if (chartFilter === 'sessions') return value.toString();
                            if (chartFilter === 'users') return value.toString();
                            return value.toString();
                          }}
                        />
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="font-medium">
                                      {currentTeam.name} - {label}
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                      <div>Cost: ${data.cost?.toFixed(2) || '0.00'}</div>
                                      <div>Requests: {formatNumber(data.requests)}</div>
                                      <div>Tokens: {formatNumber(data.tokens)}</div>
                                      <div>Users: {data.users || 0}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone"
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    )}
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            
            {/* Team Users Analysis */}
            {currentTeam && (
            <div className="space-y-8">
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Team Users Overview</h3>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium text-sm">User</th>
                            <th className="text-center p-3 font-medium text-sm">Requests</th>
                            <th className="text-center p-3 font-medium text-sm">Sessions</th>
                            <th className="text-right p-3 font-medium text-sm">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTeam.users.sort((a, b) => b.cost - a.cost).map((user) => (
                            <tr key={user.name} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                    {user.name.split('@')[0].charAt(0).toUpperCase()}
                                  </div>
                                  <div className="font-medium">{user.name}</div>
                                </div>
                              </td>
                              <td className="p-3 text-center">{formatNumber(user.requests)}</td>
                              <td className="p-3 text-center">{formatNumber(user.sessions)}</td>
                              <td className="p-3 text-right">
                                <span className="font-semibold text-green-600">${user.cost}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                      {currentTeam.users.sort((a, b) => b.cost - a.cost).map((user) => (
                        <div key={user.name} className="border rounded-lg p-4 bg-muted/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                {user.name.split('@')[0].charAt(0).toUpperCase()}
                              </div>
                              <h4 className="font-medium text-lg">{user.name}</h4>
                            </div>
                            <span className="font-semibold text-green-600">${user.cost}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Requests:</span>
                              <span>{formatNumber(user.requests)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sessions:</span>
                              <span>{formatNumber(user.sessions)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}
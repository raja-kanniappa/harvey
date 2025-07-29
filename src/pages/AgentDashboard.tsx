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
  TrendingDown,
  DollarSign,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Menu,
  BarChart3,
  Settings,
  Home,
  Calendar,
  ExternalLink,
  Minus
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ComposedChart } from 'recharts';
import { agentApiService } from '@/services/agentApiService';
import { AgentData, ChartDataPoint } from '@/types/api';
import { API_CONFIG } from '@/config/api';
import { BodyText } from '@/components/ui/design-system';
import Sidebar from '../components/layout/Sidebar';


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

export default function AgentDashboard() {
  const [selectedWeek, setSelectedWeek] = useState('week-0');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agentsData, setAgentsData] = useState<AgentData[]>([]);
  const [currentAgentDetails, setCurrentAgentDetails] = useState<AgentData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartFilter, setChartFilter] = useState<'cost' | 'requests' | 'tokens' | 'users'>('cost');
  const [totalCost, setTotalCost] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedView, setSelectedView] = useState<'main' | 'agent'>('main');
  const [agentAnalyticsExpanded, setAgentAnalyticsExpanded] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  
  const weekOptions = generateWeekOptions();
  const currentAgent = currentAgentDetails || agentsData.find(agent => agent.id === selectedAgent);


  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Fetch detailed agent data when an agent is selected
  const fetchAgentDetails = async (agentName: string) => {
    if (!agentName) {
      setCurrentAgentDetails(null);
      return;
    }

    try {
      setDetailsLoading(true);
      setAgentLoading(true);
      
      // Get week date range based on selected week
      const weekIndex = parseInt(selectedWeek.replace('week-', ''));
      const dateRange = agentApiService.getWeekDateRange(weekIndex);

      // Fetch detailed agent data
      const agentDetails = await agentApiService.getAgentDetails(agentName, {
        ...dateRange,
        environment: API_CONFIG.DEFAULT_ENVIRONMENT
      });

      setCurrentAgentDetails(agentDetails);
    } catch (error) {
      console.error('Error fetching agent details:', error);
      // Fallback to basic agent data if details fetch fails
      setCurrentAgentDetails(agentsData.find(agent => agent.id === agentName || agent.name === agentName) || null);
    } finally {
      setDetailsLoading(false);
      setAgentLoading(false);
    }
  };

  // Fetch agent data from API
  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get week date range based on selected week
      const weekIndex = parseInt(selectedWeek.replace('week-', ''));
      const dateRange = agentApiService.getWeekDateRange(weekIndex);

      // Fetch analytics data
      const analytics = await agentApiService.getAgentAnalytics({
        ...dateRange,
        environment: API_CONFIG.DEFAULT_ENVIRONMENT
      });

      setAgentsData(analytics.agents);
      setChartData(analytics.chartData);
      setTotalCost(analytics.totalCost);
      setTotalAgents(analytics.totalAgents);

      // Set default selected agent if none selected
      if (!selectedAgent && analytics.agents.length > 0) {
        setSelectedAgent(analytics.agents[0].id);
      }
    } catch (err) {
      console.error('Error fetching agent data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when week changes
  useEffect(() => {
    fetchAgentData();
  }, [selectedWeek]);

  // Fetch detailed agent data when agent selection or week changes
  useEffect(() => {
    if (selectedAgent) {
      const agentName = agentsData.find(agent => agent.id === selectedAgent)?.name || selectedAgent;
      fetchAgentDetails(agentName);
    } else {
      setCurrentAgentDetails(null);
    }
  }, [selectedAgent, selectedWeek, agentsData]);

  const getChartData = () => {
    // If we have trends data from the selected agent, use it
    if (currentAgent?.trends && currentAgent.trends.length > 0) {
      return currentAgent.trends.map(trend => ({
        name: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: trend.date,
        cost: trend.cost,
        requests: trend.requests,
        tokens: trend.tokens,
        users: trend.users,
        value: chartFilter === 'cost' ? trend.cost : 
               chartFilter === 'requests' ? trend.requests :
               chartFilter === 'tokens' ? trend.tokens : trend.users
      }));
    }
    // Fallback to original chart data
    return chartData;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && <Skeleton className="h-6 w-32" />}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
  {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
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
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
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

  // Error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && <h1 className="text-lg font-semibold text-gray-900">Harvey Analytics</h1>}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
  {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Agent Analytics</h2>
              <p className="text-sm text-gray-600">Detailed agent performance with team and user breakdown</p>
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
                <Button onClick={fetchAgentData} variant="outline">
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
      {/* Left Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold text-gray-900">Harvey Analytics</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
{sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-6">
            {/* Agent Analytics - Unified Navigation */}
            <div className="rounded-lg overflow-hidden">
              {/* Parent Level - Agent Analytics */}
              <div 
                onClick={() => {
                  if (!sidebarCollapsed) {
                    setAgentAnalyticsExpanded(!agentAnalyticsExpanded);
                    setSelectedView('main');
                    setSelectedAgent('');
                  }
                }}
                className={`bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors ${
                  sidebarCollapsed ? 'flex justify-center px-2 py-3' : 'px-3 py-3'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Agent Analytics</div>
                      <div className="text-xs text-blue-700 opacity-80">Performance & Usage</div>
                    </div>
                  )}
                  {!sidebarCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      agentAnalyticsExpanded ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>
              </div>

              {/* Child Level - Navigation Options */}
              {!sidebarCollapsed && agentAnalyticsExpanded && (
                <div className="bg-blue-50 px-3 py-2">
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-0 -mr-3">
                    {/* Main View */}
                    <div
                      onClick={() => {
                        setSelectedView('main');
                        setSelectedAgent('');
                        setAgentLoading(false);
                      }}
                      className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        selectedView === 'main'
                          ? 'bg-blue-200 text-blue-800 font-medium' 
                          : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                    >
                      <div className="font-medium text-sm">Main</div>
                    </div>
                    
                    {/* Individual Agents */}
                    {agentsData.length > 0 && (
                      agentsData.map((agent) => (
                        <div
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgent(agent.id);
                            setSelectedView('agent');
                          }}
                          className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                            selectedAgent === agent.id && selectedView === 'agent'
                              ? 'bg-blue-200 text-blue-800 font-medium' 
                              : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate flex-1">{agent.name}</div>
                            {agentLoading && selectedAgent === agent.id && selectedView === 'agent' && (
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

            {/* Main Navigation Separator */}
            {!sidebarCollapsed && <div className="border-t border-gray-200"></div>}

            {/* Main Navigation Items */}
            <div className="space-y-2">
              <a href="/" className={`flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}>
                <Home className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Dashboard</div>
                    <div className="text-xs text-gray-500">Overview</div>
                  </div>
                )}
              </a>

              <a href="/teams" className={`flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}>
                <Users className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Teams</div>
                    <div className="text-xs text-gray-500">Team Analytics</div>
                  </div>
                )}
              </a>

              <a href="/users" className={`flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}>
                <Users className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Users</div>
                    <div className="text-xs text-gray-500">User Analytics</div>
                  </div>
                )}
              </a>

              <a href="/models" className={`flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}>
                <BarChart3 className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Models</div>
                    <div className="text-xs text-gray-500">AI Models</div>
                  </div>
                )}
              </a>

              {/* Separator */}
              {!sidebarCollapsed && <div className="border-t border-gray-200 my-2"></div>}

              <div className={`flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}>
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Settings</div>
                    <div className="text-xs text-gray-500">Configuration</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Environment: <span className="font-medium text-gray-700">{API_CONFIG.DEFAULT_ENVIRONMENT}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 space-y-12 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-gray-900">
                  {selectedView === 'main' ? 'Agents' : currentAgent?.name || 'Agent Details'}
                </h1>
                <p className="text-lg text-gray-600 font-light">
                  {selectedView === 'main' 
                    ? 'Detailed agent performance with team and user breakdown'
                    : 'Performance metrics and user analysis for selected agent'
                  }
                </p>
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

        {/* Scrollable Content */}
          {/* Main View - Shows all agents data */}
          {selectedView === 'main' && (
            <>
          {/* Consolidated Metric Cards - Above Chart */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Users</CardTitle>
                <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-light text-gray-900">
                  {agentsData.reduce((total, agent) => total + (agent.totalUsers || agent.activeUsers), 0)}
                </div>
                <p className="text-sm text-gray-500">Total users across all agents</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Traces</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-light text-gray-900">
                  {agentsData.reduce((total, agent) => total + (agent.totalTraces || agent.requests), 0)}
                </div>
                <p className="text-sm text-gray-500">Total traces across all agents</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Tokens</CardTitle>
                <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-all">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-light text-gray-900">
                  {formatNumber(agentsData.reduce((total, agent) => total + agent.totalTokens, 0))}
                </div>
                <p className="text-sm text-gray-500">Total tokens across all agents</p>
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
                <p className="text-sm text-gray-500">Total cost across all agents</p>
              </CardContent>
            </Card>
      </div>

      {/* Agent Cost Overview Chart */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Agent Cost Overview</CardTitle>
                <CardDescription className="text-gray-600">
                  Cost comparison across all agents • Sorted by highest cost
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
                    {totalAgents}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total agents
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-4 border-t">
            <h4 className="text-lg font-semibold mb-6">Agent Cost Distribution</h4>
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
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
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
                              {data.fullName || 'Agent'}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div>Cost: ${data.cost}</div>
                              <div>Active Users: {data.activeUsers}</div>
                              <div>Sessions: {data.sessions}</div>
                              <div>Requests: {data.requests}</div>
                              <div>Input Tokens: {formatNumber(data.inputTokens)}</div>
                              <div>Output Tokens: {formatNumber(data.outputTokens)}</div>
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

      {/* Agent Cost Breakdown Table */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Agent Cost Breakdown</CardTitle>
          <CardDescription className="text-gray-600">
            Detailed cost analysis and performance metrics for all agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider">Agent Name</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider"># Requests</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider">$/Request</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider"># Active Users</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider">Week Change</th>
                  <th className="text-left p-3 font-medium text-sm text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agentsData.map((agent, index) => {
                  const getTrendIcon = (change: number) => {
                    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
                    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
                    return <Minus className="h-4 w-4 text-gray-400" />;
                  };

                  const getTrendColor = (change: number) => {
                    if (change > 0) return 'text-red-600';
                    if (change < 0) return 'text-green-600';
                    return 'text-gray-600';
                  };

                  return (
                    <tr key={agent.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                          {agent.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">${agent.totalCost.toFixed(2)}</span>
                          {/* Mini Spike Chart */}
                          <div className="flex items-end gap-0.5 h-6">
                            {(() => {
                              // Calculate relative height based on cost
                              const maxCost = Math.max(...agentsData.map(a => a.totalCost));
                              const heights = Array.from({ length: 8 }, (_, i) => {
                                const baseHeight = (agent.totalCost / maxCost) * 100;
                                // Add some variation to create a spike pattern
                                const variation = Math.sin(i * 0.8) * 20 + Math.cos(i * 1.2) * 15;
                                return Math.max(10, Math.min(100, baseHeight + variation));
                              });
                              
                              return heights.map((height, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-blue-500 rounded-sm"
                                  style={{ height: `${height}%` }}
                                />
                              ));
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span>{agent.requests.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        <span>${agent.avgCostPerRequest.toFixed(2)}</span>
                      </td>
                      <td className="p-3">
                        <span>{agent.activeUsers}</span>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center gap-1 ${getTrendColor(agent.weekChange || 0)}`}>
                          {getTrendIcon(agent.weekChange || 0)}
                          <span className="font-medium">
                            {(agent.weekChange || 0) === 0 ? '—' : `${(agent.weekChange || 0) > 0 ? '+' : ''}${(agent.weekChange || 0).toFixed(1)}%`}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => window.open(agent.langfuseUrl, '_blank')}
                        >
                          View in Langfuse
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Agent-Specific View - Shows data for selected agent only */}
      {selectedView === 'agent' && selectedAgent && (
        <>

      {/* Agent-Specific Analysis */}
      {agentsData.length > 0 && (
        <div className="space-y-6">
            
            {/* Line 3: Agent Overview Metric Cards */}
            {currentAgent ? (
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Users</CardTitle>
                    <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{currentAgent.totalUsers || currentAgent.activeUsers}</div>
                    <p className="text-sm text-gray-500">Total users</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Traces</CardTitle>
                    <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
                      <Brain className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{currentAgent.totalTraces || currentAgent.requests}</div>
                    <p className="text-sm text-gray-500">Total traces</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Tokens</CardTitle>
                    <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-all">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-light text-gray-900">{formatNumber(currentAgent.totalTokens)}</div>
                    <p className="text-sm text-gray-500">Total tokens</p>
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-3xl font-light text-gray-900">${currentAgent.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="flex flex-col justify-center text-right ml-4">
                        <div className={`flex items-center justify-end gap-1 text-lg font-medium ${currentAgent.weeklyVariance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          <span>{currentAgent.weeklyVariance}</span>
                          <TrendingUp className={`h-4 w-4 ${currentAgent.weeklyVariance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Total cost for agent</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Please select an agent to view details.
              </div>
            )}
            
            {/* Trends Chart for Selected Agent */}
            {currentAgent?.trends && (
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">{currentAgent.name} Trends</CardTitle>
                      <CardDescription className="text-gray-600">
                        Performance trends for the selected agent over time
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(['cost', 'requests', 'tokens', 'users'] as const).map((filter) => (
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
                            if (chartFilter === 'tokens') return formatNumber(value);
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
                                      {currentAgent.name} - {label}
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                      <div>Cost: ${data.cost}</div>
                                      <div>Requests: {data.requests}</div>
                                      <div>Tokens: {formatNumber(data.tokens)}</div>
                                      <div>Users: {data.users}</div>
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
                            if (chartFilter === 'tokens') return formatNumber(value);
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
                                      {currentAgent.name} - {label}
                                    </div>
                                    <div className="grid gap-1 text-sm">
                                      <div>Cost: ${data.cost}</div>
                                      <div>Requests: {data.requests}</div>
                                      <div>Tokens: {formatNumber(data.tokens)}</div>
                                      <div>Users: {data.users}</div>
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

            {/* Agent Analysis - Users Only */}
            {currentAgent && (
            <div className="space-y-8">
              {/* Users Analysis */}
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Agent Users Overview</h3>
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
                          {currentAgent.users.sort((a, b) => b.cost - a.cost).map((user) => (
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
                      {currentAgent.users.sort((a, b) => b.cost - a.cost).map((user) => (
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
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users as UsersIcon, 
  Activity,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Menu,
  BarChart3,
  Settings,
  Home,
  Brain,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { userApiService } from '@/services/userApiService';
import type { UserData, UserChartDataPoint } from '@/services/userApiService';
import type { UserDetailsResponse } from '@/types/api';
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

const userStats = [
  {
    title: 'Total Users',
    value: '156',
    change: '+12',
    changeType: 'positive' as const,
    description: 'this month',
    icon: UsersIcon,
  },
  {
    title: 'Active This Week',
    value: '124',
    change: '+8%',
    changeType: 'positive' as const,
    description: 'vs last week',
    icon: Activity,
  },
  {
    title: 'Avg Cost per User',
    value: '$42.80',
    change: '-$3.20',
    changeType: 'positive' as const,
    description: 'vs last week',
    icon: DollarSign,
  },
  {
    title: 'User Satisfaction',
    value: '94%',
    change: '+2%',
    changeType: 'positive' as const,
    description: 'approval rate',
    icon: TrendingUp,
  },
];

// Chart configuration for adoption chart
const adoptionChartConfig = {
  activeUsers: {
    label: "Active Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function Users() {
  const [selectedWeek, setSelectedWeek] = useState('week-0'); // Default to current week
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [chartData, setChartData] = useState<UserChartDataPoint[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetailsResponse | null>(null);
  const weekOptions = generateWeekOptions();

  // Fetch users data
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analytics = await userApiService.getUserAnalytics({
        environment: 'UAT',
        limit: 50
      });
      
      setUsersData(analytics.users);
      setChartData(analytics.chartData);
      setTotalCost(analytics.totalCost);
      setTotalUsers(analytics.totalUsers);
      setTotalRequests(analytics.totalRequests);
    } catch (err) {
      console.error('Error fetching users data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual user details
  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      const details = await userApiService.getUserDetails(userId, {
        environment: 'UAT'
      });
      setSelectedUserDetails(details);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setSelectedUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchUsersData();
  }, []);

  // Load user details when a user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser);
    } else {
      setSelectedUserDetails(null);
    }
  }, [selectedUser]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="flex-1 p-6">
            <div className="text-center">Loading user analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
              <h2 className="text-xl font-semibold text-gray-900">User Analytics</h2>
              <p className="text-sm text-gray-600">User performance and usage analysis</p>
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>Error loading user data: {error}</p>
              <Button onClick={fetchUsersData} className="mt-4">
                Try Again
              </Button>
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
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Main Navigation Items */}
            <div className="space-y-2">
              <a href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Home className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Dashboard</div>
                    <div className="text-xs text-gray-500">Overview</div>
                  </div>
                )}
              </a>

              <a href="/agents" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Brain className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Agents</div>
                    <div className="text-xs text-gray-500">AI Agents</div>
                  </div>
                )}
              </a>

              <a href="/teams" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <UsersIcon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <div className="font-medium text-sm">Teams</div>
                    <div className="text-xs text-gray-500">Team Analytics</div>
                  </div>
                )}
              </a>

              {/* User Analytics Section - Current Page with rounded edges */}
              <div className={`bg-blue-100 text-blue-800 px-3 py-2 rounded-lg ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium text-sm">Users</div>
                      <div className="text-xs text-blue-700 opacity-80">Current Page</div>
                    </div>
                  )}
                </div>
              </div>

              <a href="/models" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
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

              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
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
              Environment: <span className="font-medium text-gray-700">UAT</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 space-y-12 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-gray-900">
                  {selectedUser ? `User: ${usersData.find(u => u.id === selectedUser)?.name || selectedUser}` : 'Users'}
                </h1>
                <p className="text-lg text-gray-600 font-light">
                  {selectedUser ? 'Performance metrics and agent usage for selected user' : 'User performance and usage analysis'}
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
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Total Users</CardTitle>
                <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-light text-gray-900">{totalUsers}</div>
                <p className="text-sm text-gray-500">Active users</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Total Requests</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-light text-gray-900">
                  {totalRequests.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">Total requests across all users</p>
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
                  ${totalUsers > 0 ? (totalCost / totalUsers).toFixed(2) : '0.00'}
                </div>
                <p className="text-sm text-gray-500">Average cost per user</p>
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
                <p className="text-sm text-gray-500">Total cost across all users</p>
              </CardContent>
            </Card>
          </div>

          {/* User Cost Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Cost Overview</CardTitle>
              <CardDescription>
                Cost comparison across users • Sorted by highest cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                cost: {
                  label: "Cost",
                  color: "hsl(var(--chart-1))",
                },
              }} className="h-[400px] w-full">
                <BarChart
                  accessibilityLayer
                  data={chartData.slice(0, 15)}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 50,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
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
                                {data.fullName || 'User'}
                              </div>
                              <div className="grid gap-1 text-sm">
                                <div>Cost: ${data.cost?.toFixed(2) || '0.00'}</div>
                                <div>Requests: {data.requests?.toLocaleString() || 0}</div>
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
            </CardContent>
          </Card>

          {/* User Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Detailed breakdown of user activity and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedUser && selectedUserDetails ? (
                  // Show individual user details
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="font-medium text-lg">{selectedUserDetails.user_id}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Team: {selectedUserDetails.team} • Role: {selectedUserDetails.role}
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${selectedUserDetails.total_cost.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Total Cost</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{selectedUserDetails.total_requests}</div>
                          <div className="text-sm text-gray-500">Total Requests</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{selectedUserDetails.agents_used.length}</div>
                          <div className="text-sm text-gray-500">Agents Used</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Agents Used</h4>
                      <div className="grid gap-2">
                        {selectedUserDetails.agents_used.map((agent, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <span className="font-medium">{agent}</span>
                            {selectedUserDetails.cost_breakdown.find(cb => cb.agent === agent) && (
                              <Badge variant="outline">
                                {selectedUserDetails.cost_breakdown.find(cb => cb.agent === agent)?.percentage.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show all users list
                  usersData.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.team && user.role ? `${user.team} • ${user.role}` : `${user.agentsUsed.length} agents used`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${user.totalCost.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          {user.totalRequests} requests
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant={user.weeklyVariance.startsWith('+') ? 'default' : 'secondary'}>
                          {user.weeklyVariance}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

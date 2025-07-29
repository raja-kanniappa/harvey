import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  TrendingUp,
  DollarSign,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import Sidebar from '../components/layout/Sidebar';

// Mock data for models with detailed information
const modelsData = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    type: 'Foundation',
    agents: ['Foundational Models', 'Synapse Reports'],
    teams: ['Engineering', 'Marketing'],
    totalCost: 1820,
    totalInputTokens: 3710000,
    totalOutputTokens: 1300000,
    weeklyVariance: '+15%',
    activeUsers: 17,
    sessions: 290,
    users: [
      { name: 'Sarah Chen', team: 'Engineering', agent: 'Foundational Models', inputTokens: 340000, outputTokens: 120000, cost: 165, variance: '+18%' },
      { name: 'Mike Johnson', team: 'Engineering', agent: 'Foundational Models', inputTokens: 280000, outputTokens: 98000, cost: 135, variance: '+8%' },
      { name: 'Rachel Green', team: 'Marketing', agent: 'Foundational Models', inputTokens: 200000, outputTokens: 72000, cost: 125, variance: '+20%' },
      { name: 'Mark Thompson', team: 'Marketing', agent: 'Foundational Models', inputTokens: 240000, outputTokens: 85000, cost: 145, variance: '+15%' },
      { name: 'Alex Kim', team: 'Engineering', agent: 'Foundational Models', inputTokens: 360000, outputTokens: 122000, cost: 185, variance: '+22%' },
      { name: 'Jessica Lee', team: 'Marketing', agent: 'Foundational Models', inputTokens: 140000, outputTokens: 48000, cost: 75, variance: '+22%' },
      { name: 'Lisa Rodriguez', team: 'Engineering', agent: 'Synapse Reports', inputTokens: 280000, outputTokens: 105000, cost: 165, variance: '+15%' },
      { name: 'Robert Chen', team: 'Engineering', agent: 'Synapse Reports', inputTokens: 320000, outputTokens: 125000, cost: 185, variance: '+25%' },
      { name: 'Kevin Davis', team: 'Marketing', agent: 'Synapse Reports', inputTokens: 180000, outputTokens: 62000, cost: 98, variance: '+5%' },
      { name: 'Amanda Wilson', team: 'Marketing', agent: 'Synapse Reports', inputTokens: 210000, outputTokens: 75000, cost: 115, variance: '+12%' },
      { name: 'Maria Garcia', team: 'Engineering', agent: 'Synapse Reports', inputTokens: 150000, outputTokens: 60000, cost: 95, variance: '+18%' },
      { name: 'Brian Garcia', team: 'Marketing', agent: 'Synapse Reports', inputTokens: 130000, outputTokens: 43000, cost: 72, variance: '+6%' }
    ]
  },
  {
    id: 'claude-3',
    name: 'Claude-3',
    provider: 'Anthropic',
    type: 'Foundation',
    agents: ['Foundational Models', 'Synapse Reports', 'Hashtag', 'Scoping'],
    teams: ['Engineering', 'Marketing', 'Product'],
    totalCost: 1535,
    totalInputTokens: 3120000,
    totalOutputTokens: 1150000,
    weeklyVariance: '+18%',
    activeUsers: 20,
    sessions: 245,
    users: [
      { name: 'Sarah Chen', team: 'Engineering', agent: 'Foundational Models', inputTokens: 340000, outputTokens: 120000, cost: 165, variance: '+18%' },
      { name: 'Mike Johnson', team: 'Engineering', agent: 'Foundational Models', inputTokens: 280000, outputTokens: 98000, cost: 135, variance: '+8%' },
      { name: 'Rachel Green', team: 'Marketing', agent: 'Foundational Models', inputTokens: 200000, outputTokens: 72000, cost: 125, variance: '+20%' },
      { name: 'Lisa Rodriguez', team: 'Engineering', agent: 'Synapse Reports', inputTokens: 280000, outputTokens: 105000, cost: 165, variance: '+15%' },
      { name: 'Robert Chen', team: 'Engineering', agent: 'Synapse Reports', inputTokens: 320000, outputTokens: 125000, cost: 185, variance: '+25%' },
      { name: 'Anna Kim', team: 'Product', agent: 'Hashtag', inputTokens: 180000, outputTokens: 65000, cost: 105, variance: '+15%' },
      { name: 'Steve Park', team: 'Product', agent: 'Hashtag', inputTokens: 200000, outputTokens: 72000, cost: 115, variance: '+10%' },
      { name: 'Michelle Chen', team: 'Product', agent: 'Hashtag', inputTokens: 140000, outputTokens: 48000, cost: 75, variance: '+8%' },
      { name: 'Sophie Wang', team: 'Product', agent: 'Scoping', inputTokens: 290000, outputTokens: 105000, cost: 135, variance: '+8%' },
      { name: 'Lucas Brown', team: 'Product', agent: 'Scoping', inputTokens: 150000, outputTokens: 48000, cost: 60, variance: '+15%' }
    ]
  },
  {
    id: 'gpt-35-turbo',
    name: 'GPT-3.5-Turbo',
    provider: 'OpenAI',
    type: 'Foundation',
    agents: ['Digital Tracker', 'RBAC Agent', 'Scoping'],
    teams: ['Engineering', 'Marketing', 'Product'],
    totalCost: 725,
    totalInputTokens: 1750000,
    totalOutputTokens: 630000,
    weeklyVariance: '+10%',
    activeUsers: 12,
    sessions: 156,
    users: [
      { name: 'David Liu', team: 'Engineering', agent: 'Digital Tracker', inputTokens: 240000, outputTokens: 85000, cost: 105, variance: '+5%' },
      { name: 'Emma Wilson', team: 'Engineering', agent: 'Digital Tracker', inputTokens: 300000, outputTokens: 110000, cost: 135, variance: '+12%' },
      { name: 'James Park', team: 'Engineering', agent: 'Digital Tracker', inputTokens: 180000, outputTokens: 65000, cost: 80, variance: '+3%' },
      { name: 'Nicole Martinez', team: 'Marketing', agent: 'RBAC Agent', inputTokens: 200000, outputTokens: 70000, cost: 85, variance: '+18%' },
      { name: 'Daniel Kim', team: 'Marketing', agent: 'RBAC Agent', inputTokens: 230000, outputTokens: 82000, cost: 95, variance: '+12%' },
      { name: 'Lauren Chen', team: 'Marketing', agent: 'RBAC Agent', inputTokens: 120000, outputTokens: 43000, cost: 40, variance: '+20%' },
      { name: 'Ryan Martinez', team: 'Product', agent: 'Scoping', inputTokens: 240000, outputTokens: 82000, cost: 105, variance: '+12%' },
      { name: 'Sophie Wang', team: 'Product', agent: 'Scoping', inputTokens: 240000, outputTokens: 93000, cost: 80, variance: '+8%' }
    ]
  }
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

export default function ModelDashboard() {
  const [selectedWeek, setSelectedWeek] = useState('week-0');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<'model' | 'provider'>('model');
  const [analysisMode, setAnalysisMode] = useState<'teams' | 'agents' | 'users'>('teams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const weekOptions = generateWeekOptions();

  const currentModel = modelsData.find(model => model.id === selectedModel);

  const toggleTeamExpansion = (team: string) => {
    setExpandedTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const toggleAgentExpansion = (agent: string) => {
    setExpandedAgents(prev => 
      prev.includes(agent) 
        ? prev.filter(a => a !== agent)
        : [...prev, agent]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChartData = () => {
    if (chartMode === 'model') {
      return modelsData.map(model => ({
        name: model.name,
        displayName: model.name,
        fullName: model.name,
        cost: model.totalCost,
        activeUsers: model.activeUsers,
        sessions: model.sessions,
        variance: model.weeklyVariance,
        inputTokens: model.totalInputTokens,
        outputTokens: model.totalOutputTokens,
        provider: model.provider,
        type: 'model'
      }));
    } else {
      // Provider mode - aggregate by providers
      const providerStats: Record<string, any> = {};
      modelsData.forEach(model => {
        if (!providerStats[model.provider]) {
          providerStats[model.provider] = {
            name: model.provider,
            cost: 0,
            activeUsers: 0,
            sessions: 0,
            inputTokens: 0,
            outputTokens: 0,
            models: 0
          };
        }
        providerStats[model.provider].cost += model.totalCost;
        providerStats[model.provider].activeUsers += model.activeUsers;
        providerStats[model.provider].sessions += model.sessions;
        providerStats[model.provider].inputTokens += model.totalInputTokens;
        providerStats[model.provider].outputTokens += model.totalOutputTokens;
        providerStats[model.provider].models += 1;
      });
      
      return Object.values(providerStats).map((provider: any) => ({
        ...provider,
        type: 'provider'
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage="models" 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 space-y-12 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-gray-900">Models</h1>
                <p className="text-lg text-gray-600 font-light">
                  Detailed model performance with agent and user breakdown
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

          {/* Model Cost Overview Chart */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="space-y-4">
            {/* Chart Mode Toggle */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">View by</h4>
              <div className="flex justify-start">
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={chartMode === 'model' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartMode('model')}
                    className="px-4"
                  >
                    Model
                  </Button>
                  <Button
                    variant={chartMode === 'provider' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartMode('provider')}
                    className="px-4"
                  >
                    Provider
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">{chartMode === 'model' ? 'Model Cost Overview' : 'Provider Cost Overview'}</CardTitle>
                <CardDescription className="text-gray-600">
                  {chartMode === 'model' ? 'Cost comparison across all models • Sorted by highest cost' : 'Cost comparison across all providers • Weekly performance'}
                </CardDescription>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${modelsData.reduce((sum, model) => sum + model.totalCost, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total spend
                  </div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {chartMode === 'model' ? modelsData.length : new Set(modelsData.map(model => model.provider)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chartMode === 'model' ? 'Total models' : 'Total providers'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-4 border-t">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">{chartMode === 'model' ? 'Model Cost Distribution' : 'Provider Cost Distribution'}</h4>
            <ChartContainer config={chartConfig} className="h-[300px] w-full [&>div]:!aspect-auto">
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
                              {data.type === 'model' ? `${data.fullName} Model` : `${data.name} Provider`}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div>Cost: ${data.cost}</div>
                              {data.type === 'model' ? (
                                <>
                                  <div>Provider: {data.provider}</div>
                                  <div>Active Users: {data.activeUsers}</div>
                                  <div>Sessions: {data.sessions}</div>
                                  <div>Input Tokens: {formatNumber(data.inputTokens)}</div>
                                  <div>Output Tokens: {formatNumber(data.outputTokens)}</div>
                                  <div>Weekly Variance: {data.variance}</div>
                                </>
                              ) : (
                                <>
                                  <div>Active Users: {data.activeUsers}</div>
                                  <div>Sessions: {data.sessions}</div>
                                  <div>Input Tokens: {formatNumber(data.inputTokens)}</div>
                                  <div>Output Tokens: {formatNumber(data.outputTokens)}</div>
                                  <div>Models: {data.models}</div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Detailed Model Analysis */}
      {currentModel && (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Line 1: Heading */}
            <h2 className="text-2xl font-semibold text-gray-900">Model Detailed Analysis</h2>
            
            {/* Line 2: Dropdown */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[240px] px-4 border-2 border-primary/20 hover:border-primary/40 focus:border-primary bg-white flex items-center" style={{ height: '48px' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelsData.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="focus:bg-accent focus:text-accent-foreground">
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs opacity-70">{model.activeUsers} users • ${model.totalCost}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Line 3: Model Overview Metric Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Active Users</CardTitle>
                  <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-all">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-light text-gray-900">{currentModel.activeUsers}</div>
                  <p className="text-sm text-gray-500">Users this week</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Sessions</CardTitle>
                  <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-all">
                    <Brain className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-light text-gray-900">{currentModel.sessions}</div>
                  <p className="text-sm text-gray-500">Total sessions</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Top Agent</CardTitle>
                  <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-all">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    // Calculate agent usage
                    const agentUsage = currentModel.users.reduce((acc, user) => {
                      acc[user.agent] = (acc[user.agent] || 0) + user.cost;
                      return acc;
                    }, {} as Record<string, number>);
                    
                    const topAgent = Object.entries(agentUsage).sort(([,a], [,b]) => b - a)[0];
                    const topAgentCost = topAgent ? topAgent[1] : 0;
                    const usageShare = Math.round((topAgentCost / currentModel.totalCost) * 100);
                    const topAgentName = topAgent ? (topAgent[0].length > 10 ? topAgent[0].substring(0, 10) + '...' : topAgent[0]) : 'N/A';
                    
                    return (
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="text-3xl font-light text-gray-900 mb-1">{topAgentName}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="text-sm font-semibold text-gray-900">{usageShare}%</span>
                            <span>usage share</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-start text-right ml-4">
                          <div className="text-2xl font-light text-gray-900">${topAgentCost.toFixed(0)}</div>
                        </div>
                      </div>
                    );
                  })()}
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
                      <div className="text-3xl font-light text-gray-900">${currentModel.totalCost}</div>
                    </div>
                    <div className="flex flex-col justify-center text-right ml-4">
                      <div className={`flex items-center justify-end gap-1 text-lg font-medium ${currentModel.weeklyVariance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{currentModel.weeklyVariance}</span>
                        <TrendingUp className={`h-4 w-4 ${currentModel.weeklyVariance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Total model cost</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Analysis Mode Section */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Detailed Analysis</h3>
              <div className="flex justify-start">
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={analysisMode === 'teams' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisMode('teams')}
                    className="px-4"
                  >
                    Teams
                  </Button>
                  <Button
                    variant={analysisMode === 'agents' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisMode('agents')}
                    className="px-4"
                  >
                    Agents
                  </Button>
                  <Button
                    variant={analysisMode === 'users' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisMode('users')}
                    className="px-4"
                  >
                    Users
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Model Analysis - Conditional Rendering Based on Mode */}
          <div className="space-y-8">
            
            {/* Teams Analysis */}
            {analysisMode === 'teams' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Model Teams Usage</h3>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium text-sm">Team</th>
                            <th className="text-center p-3 font-medium text-sm">Users</th>
                            <th className="text-center p-3 font-medium text-sm">Sessions</th>
                            <th className="text-center p-3 font-medium text-sm">Input</th>
                            <th className="text-center p-3 font-medium text-sm">Output</th>
                            <th className="text-center p-3 font-medium text-sm">Total</th>
                            <th className="text-right p-3 font-medium text-sm">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(new Set(currentModel.users.map(user => user.team))).map((team) => {
                            const teamUsers = currentModel.users.filter(user => user.team === team);
                            const teamStats = teamUsers.reduce((acc, user) => ({
                              users: acc.users + 1,
                              inputTokens: acc.inputTokens + user.inputTokens,
                              outputTokens: acc.outputTokens + user.outputTokens,
                              cost: acc.cost + user.cost
                            }), { users: 0, inputTokens: 0, outputTokens: 0, cost: 0 });
                            
                            return (
                              <tr key={team} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <div className="font-medium">{team}</div>
                                </td>
                                <td className="p-3 text-center">{teamStats.users}</td>
                                <td className="p-3 text-center">{teamStats.users}</td>
                                <td className="p-3 text-center">{formatNumber(teamStats.inputTokens)}</td>
                                <td className="p-3 text-center">{formatNumber(teamStats.outputTokens)}</td>
                                <td className="p-3 text-center">{formatNumber(teamStats.inputTokens + teamStats.outputTokens)}</td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold text-green-600">${teamStats.cost.toFixed(0)}</span>
                                    <div className="flex items-center gap-1 text-sm text-green-600">
                                      <TrendingUp className="h-3 w-3" />
                                      <span>+12%</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                      {Array.from(new Set(currentModel.users.map(user => user.team))).map((team) => {
                        const teamUsers = currentModel.users.filter(user => user.team === team);
                        const teamStats = teamUsers.reduce((acc, user) => ({
                          users: acc.users + 1,
                          inputTokens: acc.inputTokens + user.inputTokens,
                          outputTokens: acc.outputTokens + user.outputTokens,
                          cost: acc.cost + user.cost
                        }), { users: 0, inputTokens: 0, outputTokens: 0, cost: 0 });
                        
                        return (
                          <div key={team} className="border rounded-lg p-4 bg-muted/10">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg">{team}</h4>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-600">${teamStats.cost.toFixed(0)}</span>
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>+12%</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Users:</span>
                                <span>{teamStats.users}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sessions:</span>
                                <span>{teamStats.users}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Input:</span>
                                <span>{formatNumber(teamStats.inputTokens)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Output:</span>
                                <span>{formatNumber(teamStats.outputTokens)}</span>
                              </div>
                              <div className="flex justify-between col-span-2 pt-2 border-t">
                                <span className="text-muted-foreground">Total Tokens:</span>
                                <span>{formatNumber(teamStats.inputTokens + teamStats.outputTokens)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Agents Analysis */}
            {analysisMode === 'agents' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Model Agents Usage</h3>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium text-sm">Agent</th>
                            <th className="text-center p-3 font-medium text-sm">Users</th>
                            <th className="text-center p-3 font-medium text-sm">Sessions</th>
                            <th className="text-center p-3 font-medium text-sm">Input</th>
                            <th className="text-center p-3 font-medium text-sm">Output</th>
                            <th className="text-center p-3 font-medium text-sm">Total</th>
                            <th className="text-right p-3 font-medium text-sm">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(new Set(currentModel.users.map(user => user.agent))).map((agent) => {
                            const agentUsers = currentModel.users.filter(user => user.agent === agent);
                            const agentStats = agentUsers.reduce((acc, user) => ({
                              users: acc.users + 1,
                              inputTokens: acc.inputTokens + user.inputTokens,
                              outputTokens: acc.outputTokens + user.outputTokens,
                              cost: acc.cost + user.cost
                            }), { users: 0, inputTokens: 0, outputTokens: 0, cost: 0 });
                            
                            return (
                              <tr key={agent} className="border-b hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <div className="font-medium">{agent}</div>
                                </td>
                                <td className="p-3 text-center">{agentStats.users}</td>
                                <td className="p-3 text-center">{agentStats.users}</td>
                                <td className="p-3 text-center">{formatNumber(agentStats.inputTokens)}</td>
                                <td className="p-3 text-center">{formatNumber(agentStats.outputTokens)}</td>
                                <td className="p-3 text-center">{formatNumber(agentStats.inputTokens + agentStats.outputTokens)}</td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold text-green-600">${agentStats.cost.toFixed(0)}</span>
                                    <div className="flex items-center gap-1 text-sm text-green-600">
                                      <TrendingUp className="h-3 w-3" />
                                      <span>+15%</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                      {Array.from(new Set(currentModel.users.map(user => user.agent))).map((agent) => {
                        const agentUsers = currentModel.users.filter(user => user.agent === agent);
                        const agentStats = agentUsers.reduce((acc, user) => ({
                          users: acc.users + 1,
                          inputTokens: acc.inputTokens + user.inputTokens,
                          outputTokens: acc.outputTokens + user.outputTokens,
                          cost: acc.cost + user.cost
                        }), { users: 0, inputTokens: 0, outputTokens: 0, cost: 0 });
                        
                        return (
                          <div key={agent} className="border rounded-lg p-4 bg-muted/10">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg">{agent}</h4>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-600">${agentStats.cost.toFixed(0)}</span>
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>+15%</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Users:</span>
                                <span>{agentStats.users}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sessions:</span>
                                <span>{agentStats.users}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Input:</span>
                                <span>{formatNumber(agentStats.inputTokens)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Output:</span>
                                <span>{formatNumber(agentStats.outputTokens)}</span>
                              </div>
                              <div className="flex justify-between col-span-2 pt-2 border-t">
                                <span className="text-muted-foreground">Total Tokens:</span>
                                <span>{formatNumber(agentStats.inputTokens + agentStats.outputTokens)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Analysis */}
            {analysisMode === 'users' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Model Users Overview</h3>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left p-3 font-medium text-sm">User</th>
                            <th className="text-left p-3 font-medium text-sm">Team</th>
                            <th className="text-left p-3 font-medium text-sm">Agent</th>
                            <th className="text-center p-3 font-medium text-sm">Sessions</th>
                            <th className="text-center p-3 font-medium text-sm">Input</th>
                            <th className="text-center p-3 font-medium text-sm">Output</th>
                            <th className="text-center p-3 font-medium text-sm">Total</th>
                            <th className="text-right p-3 font-medium text-sm">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentModel.users.sort((a, b) => b.cost - a.cost).map((user) => (
                            <tr key={`${user.name}-${user.team}-${user.agent}`} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="font-medium">{user.name}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium">{user.team}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium">{user.agent}</div>
                              </td>
                              <td className="p-3 text-center">1</td>
                              <td className="p-3 text-center">{formatNumber(user.inputTokens)}</td>
                              <td className="p-3 text-center">{formatNumber(user.outputTokens)}</td>
                              <td className="p-3 text-center">{formatNumber(user.inputTokens + user.outputTokens)}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-semibold text-green-600">${user.cost}</span>
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{user.variance}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                      {currentModel.users.sort((a, b) => b.cost - a.cost).map((user) => (
                        <div key={`${user.name}-${user.team}-${user.agent}`} className="border rounded-lg p-4 bg-muted/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <h4 className="font-medium text-lg">{user.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">${user.cost}</span>
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                <span>{user.variance}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">Team</div>
                            <div className="font-medium">{user.team}</div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">Agent</div>
                            <div className="font-medium">{user.agent}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sessions:</span>
                              <span>1</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Input:</span>
                              <span>{formatNumber(user.inputTokens)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Output:</span>
                              <span>{formatNumber(user.outputTokens)}</span>
                            </div>
                            <div className="flex justify-between col-span-2 pt-2 border-t">
                              <span className="text-muted-foreground">Total Tokens:</span>
                              <span>{formatNumber(user.inputTokens + user.outputTokens)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
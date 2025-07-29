import React, { useState, useEffect } from 'react';
import { DashboardCard, BodyText, StatusIndicator, Skeleton, EmptyState } from '../ui/design-system';
import { dataService } from '../../services/dataService';
import { Agent, FilterState } from '../../types';

interface AgentLeaderboardProps {
  className?: string;
  maxAgents?: number;
  filters?: FilterState;
  title?: string;
  showTypeFilter?: boolean;
  onAgentClick?: (agent: Agent) => void;
}

type SortKey = 'name' | 'weeklySpend' | 'requestCount' | 'averageCost' | 'popularityRank';
type SortOrder = 'asc' | 'desc';

export default function AgentLeaderboard({
  className,
  maxAgents = 10,
  filters,
  title = 'Agent Leaderboard',
  showTypeFilter = true,
  onAgentClick
}: AgentLeaderboardProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('weeklySpend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedType, setSelectedType] = useState<Agent['type'] | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

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
        
        const result = await dataService.getAgentLeaderboard(timeRange, maxAgents, {
          page: 1,
          limit: maxAgents,
          sortBy: sortKey,
          sortOrder: sortOrder
        });
        
        let filteredAgents = result.data;
        
        // Apply type filter
        if (selectedType !== 'all') {
          filteredAgents = filteredAgents.filter(agent => agent.type === selectedType);
        }
        
        // Apply agent filter from global filters
        if (filters?.agents.length) {
          filteredAgents = filteredAgents.filter(agent => 
            filters.agents.includes(agent.id)
          );
        }
        
        setAgents(filteredAgents);
      } catch (err) {
        console.error('Error fetching agent leaderboard:', err);
        setError('Failed to load agent data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortKey, sortOrder, selectedType, filters, maxAgents]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent.id);
    onAgentClick?.(agent);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getTypeColor = (type: Agent['type']) => {
    switch (type) {
      case 'Pre-built': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DIY': return 'bg-green-100 text-green-800 border-green-200';
      case 'Foundation': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'Pre-built': return '🏢';
      case 'DIY': return '🔧';
      case 'Foundation': return '🏗️';
      default: return '🤖';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getAgentTypeColor = (type: string): 'success' | 'warning' | 'neutral' => {
    switch (type) {
      case 'Pre-built':
        return 'success';
      case 'DIY':
        return 'warning';
      case 'Foundation':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getAgentTypeLabel = (type: string): string => {
    switch (type) {
      case 'Pre-built':
        return 'Pre-built';
      case 'DIY':
        return 'DIY';
      case 'Foundation':
        return 'Foundation';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <DashboardCard className={className} title={title}>
        <div className="space-y-4">
          {showTypeFilter && (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          )}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard className={className} title={title}>
        <EmptyState
          title="Error Loading Agent Data"
          description={error}
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

  if (agents.length === 0) {
    return (
      <DashboardCard className={className} title={title}>
        <EmptyState
          title="No Agents Found"
          description="No agents match the current filters."
          action={
            <button 
              onClick={() => setSelectedType('all')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              Show All Types
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
      subtitle={`Top ${agents.length} agents by performance`}
      headerAction={
        showTypeFilter ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as Agent['type'] | 'all')}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="Pre-built">Pre-built</option>
              <option value="DIY">DIY</option>
              <option value="Foundation">Foundation</option>
            </select>
            <button
              onClick={() => setSortKey('weeklySpend')}
              className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sort by Cost
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* 5-Week Agent Performance Context */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Avg Agent Cost</div>
              <div className="text-lg font-bold">$28.40</div>
              <div className="text-xs text-green-600">↘ -5% vs 5-week avg</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Most Used Type</div>
              <div className="text-lg font-bold">Pre-built</div>
              <div className="text-xs text-muted-foreground">67% of requests</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Top Performer</div>
              <div className="text-lg font-bold">Gemini Pro</div>
              <div className="text-xs text-green-600">↗ +12% efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Cost Efficiency</div>
              <div className="text-lg font-bold">$0.03</div>
              <div className="text-xs text-green-600">↘ Improving trend</div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort('popularityRank')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Rank {getSortIcon('popularityRank')}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Agent {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort('weeklySpend')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Weekly Spend {getSortIcon('weeklySpend')}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort('requestCount')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Requests {getSortIcon('requestCount')}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort('averageCost')}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Avg Cost {getSortIcon('averageCost')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => {
                const isSelected = selectedAgent === agent.id;
                const displayRank = index + 1;
                
                return (
                  <tr 
                    key={agent.id} 
                    className={`border-b border-border/50 hover:bg-muted/20 transition-all cursor-pointer ${
                      isSelected ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleAgentClick(agent)}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          displayRank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          displayRank === 2 ? 'bg-gray-100 text-gray-800' :
                          displayRank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {displayRank}
                        </div>
                        {displayRank <= 3 && (
                          <span className="text-lg">
                            {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAgentIcon(agent.type)}</span>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(agent.type)}`}>
                            {agent.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-medium">
                            {formatCurrency(agent.weeklySpend)}
                          </div>
                          {/* Trend indicator based on spend level */}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            agent.weeklySpend > 50 ? 'bg-red-100 text-red-700' :
                            agent.weeklySpend > 30 ? 'bg-orange-100 text-orange-700' :
                            agent.weeklySpend > 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {agent.weeklySpend > 50 ? 'High' :
                             agent.weeklySpend > 30 ? 'Med+' :
                             agent.weeklySpend > 15 ? 'Med' : 'Low'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.weeklySpend > 40 ? 'Above avg spend' :
                           agent.weeklySpend > 20 ? 'Typical usage' : 'Light usage'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-mono">
                            {formatNumber(agent.requestCount)}
                          </div>
                          {/* Activity level indicator */}
                          <div className={`w-2 h-2 rounded-full ${
                            agent.requestCount > 1000 ? 'bg-green-500' :
                            agent.requestCount > 500 ? 'bg-yellow-500' :
                            agent.requestCount > 100 ? 'bg-orange-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.requestCount > 1000 ? 'Very active' :
                           agent.requestCount > 500 ? 'Active' :
                           agent.requestCount > 100 ? 'Moderate' : 'Light use'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm">
                            {formatCurrency(agent.averageCost)}
                          </div>
                          {/* Cost efficiency indicator */}
                          <span className="text-xs">
                            {agent.averageCost < 0.02 ? '💰' :
                             agent.averageCost < 0.05 ? '📈' :
                             agent.averageCost < 0.10 ? '⚠️' : '💸'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.averageCost < 0.02 ? 'Very efficient' :
                           agent.averageCost < 0.05 ? 'Good value' :
                           agent.averageCost < 0.10 ? 'Higher cost' : 'Expensive'}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {agents.map((agent, index) => {
            const isSelected = selectedAgent === agent.id;
            const displayRank = index + 1;
            
            return (
              <div 
                key={agent.id} 
                className={`bg-card rounded-lg p-4 space-y-3 cursor-pointer transition-all border ${
                  isSelected ? 'border-primary/20 bg-primary/5' : 'border-border hover:bg-muted/30'
                }`}
                onClick={() => handleAgentClick(agent)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      displayRank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      displayRank === 2 ? 'bg-gray-100 text-gray-800' :
                      displayRank === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {displayRank}
                    </div>
                    <span className="text-2xl">{getAgentIcon(agent.type)}</span>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(agent.type)}`}>
                        {agent.type}
                      </div>
                    </div>
                  </div>
                  {displayRank <= 3 && (
                    <span className="text-2xl">
                      {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <BodyText className="text-xs text-muted-foreground">Weekly Spend</BodyText>
                    <BodyText className="font-mono font-medium">
                      {formatCurrency(agent.weeklySpend)}
                    </BodyText>
                  </div>
                  <div>
                    <BodyText className="text-xs text-muted-foreground">Requests</BodyText>
                    <BodyText className="font-mono font-medium">
                      {formatNumber(agent.requestCount)}
                    </BodyText>
                  </div>
                  <div>
                    <BodyText className="text-xs text-muted-foreground">Average Cost</BodyText>
                    <BodyText className="font-mono font-medium">
                      {formatCurrency(agent.averageCost)}
                    </BodyText>
                  </div>
                  <div>
                    <BodyText className="text-xs text-muted-foreground">Efficiency</BodyText>
                    <BodyText className="font-mono font-medium">
                      {(agent.requestCount / agent.weeklySpend).toFixed(1)} req/$
                    </BodyText>
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
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Pre-built: {agents.filter(a => a.type === 'Pre-built').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>DIY: {agents.filter(a => a.type === 'DIY').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Foundation: {agents.filter(a => a.type === 'Foundation').length}</span>
            </div>
          </div>
          <BodyText className="text-sm text-muted-foreground">
            Total Spend: {formatCurrency(agents.reduce((sum, agent) => sum + agent.weeklySpend, 0))}
          </BodyText>
        </div>
      </div>
    </DashboardCard>
  );
}
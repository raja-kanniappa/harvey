import React, { useState, useEffect } from 'react';
import { DashboardCard, BodyText, StatusIndicator, Skeleton, EmptyState } from '../ui/design-system';
import { LLMModel } from '../../types';
import { MockDataGenerator } from '../../data/mockData/generators';

interface ModelUsageTableProps {
  className?: string;
  title?: string;
}

export default function ModelUsageTable({
  className,
  title = 'LLM Model Usage Statistics'
}: ModelUsageTableProps) {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const fetchModelData = () => {
      try {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
          const modelData = MockDataGenerator.generateLLMModels();
          setModels(modelData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error generating model data:', error);
        setLoading(false);
      }
    };

    fetchModelData();
  }, []);

  if (loading) {
    return (
      <DashboardCard className={className} title={title}>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatLatency = (ms: number) => `${ms}ms`;

  const getModelIcon = (family: string) => {
    switch (family) {
      case 'GPT': return '🤖';
      case 'Claude': return '🧠';
      case 'Gemini': return '💎';
      case 'Llama': return '🦙';
      default: return '⚡';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'bg-green-100 text-green-800 border-green-200';
      case 'Anthropic': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Google': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Meta': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalWeeklySpend = models.reduce((sum, model) => sum + model.weeklySpend, 0);
  const totalRequests = models.reduce((sum, model) => sum + model.requestCount, 0);
  const avgSuccessRate = models.reduce((sum, model) => sum + model.successRate, 0) / models.length;

  return (
    <DashboardCard 
      className={className} 
      title={title}
      subtitle={`${models.length} models tracked this week`}
    >
      <div className="space-y-6">
        
        {/* Summary Statistics */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Weekly Spend</div>
              <div className="text-lg font-bold">{formatCurrency(totalWeeklySpend)}</div>
              <div className="text-xs text-muted-foreground">Across all models</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Requests</div>
              <div className="text-lg font-bold">{formatNumber(totalRequests)}</div>
              <div className="text-xs text-muted-foreground">This week</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Avg Success Rate</div>
              <div className="text-lg font-bold">{avgSuccessRate.toFixed(1)}%</div>
              <div className="text-xs text-green-600">↗ High reliability</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Most Used</div>
              <div className="text-lg font-bold">{models[0]?.modelFamily}</div>
              <div className="text-xs text-muted-foreground">{models[0]?.name}</div>
            </div>
          </div>
        </div>

        {/* Model List */}
        <div className="space-y-3">
          {models.map((model, index) => {
            const marketShare = (model.weeklySpend / totalWeeklySpend) * 100;
            const requestShare = (model.requestCount / totalRequests) * 100;
            
            return (
              <div 
                key={model.id}
                className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  
                  {/* Model Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                      {getModelIcon(model.modelFamily)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{model.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getProviderColor(model.provider)}`}>
                          {model.provider}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Market Share: {marketShare.toFixed(1)}%</span>
                        <span>•</span>
                        <span>Used by: {model.topAgents.length} agents</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    
                    {/* Weekly Spend */}
                    <div>
                      <div className="text-lg font-bold">{formatCurrency(model.weeklySpend)}</div>
                      <div className="text-xs text-muted-foreground mb-1">Weekly Spend</div>
                      <div className={`text-xs flex items-center justify-center gap-1 ${
                        model.weekOverWeekChange > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        <span>{model.weekOverWeekChange > 0 ? '↗' : '↘'}</span>
                        {model.weekOverWeekChange > 0 ? '+' : ''}{model.weekOverWeekChange.toFixed(1)}%
                      </div>
                    </div>

                    {/* Requests */}
                    <div>
                      <div className="text-lg font-bold">{formatNumber(model.requestCount)}</div>
                      <div className="text-xs text-muted-foreground mb-1">Requests</div>
                      <div className="text-xs text-muted-foreground">
                        {requestShare.toFixed(1)}% of total
                      </div>
                    </div>

                    {/* Performance */}
                    <div>
                      <div className="text-lg font-bold">{formatLatency(model.averageLatency)}</div>
                      <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
                      <div className="text-xs">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                          model.averageLatency < 1000 ? 'bg-green-100 text-green-700' :
                          model.averageLatency < 2000 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {model.averageLatency < 1000 ? 'Fast' : 
                           model.averageLatency < 2000 ? 'Good' : 'Slow'}
                        </span>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div>
                      <div className="text-lg font-bold">{model.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                      <div className="text-xs">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                          model.successRate >= 98 ? 'bg-green-100 text-green-700' :
                          model.successRate >= 95 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {model.successRate >= 98 ? 'Excellent' : 
                           model.successRate >= 95 ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Token Usage Bar */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Token Usage Distribution</span>
                    <span>{formatNumber(model.tokenUsage.total)} total tokens</span>
                  </div>
                  <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500"
                      style={{ width: `${(model.tokenUsage.input / model.tokenUsage.total) * 100}%` }}
                      title={`Input: ${formatNumber(model.tokenUsage.input)} tokens`}
                    />
                    <div 
                      className="bg-green-500"
                      style={{ width: `${(model.tokenUsage.output / model.tokenUsage.total) * 100}%` }}
                      title={`Output: ${formatNumber(model.tokenUsage.output)} tokens`}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-blue-600">Input: {formatNumber(model.tokenUsage.input)}</span>
                    <span className="text-green-600">Output: {formatNumber(model.tokenUsage.output)}</span>
                  </div>
                </div>

                {/* Top Agents Using This Model */}
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Used by agents:</div>
                  <div className="flex flex-wrap gap-1">
                    {model.topAgents.map(agent => (
                      <span 
                        key={agent}
                        className="px-2 py-1 bg-muted rounded text-xs"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </DashboardCard>
  );
}
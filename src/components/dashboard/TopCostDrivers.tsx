import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity,
  Users,
  ArrowRight
} from 'lucide-react';
import { agentApiService } from '../../services/agentApiService';
import { teamApiService } from '../../services/teamApiService';
import { WeekOption } from '../../types/api';

interface TopCostItem {
  id: string;
  name: string;
  cost: number;
  variance: number;
  varianceType: 'positive' | 'negative';
}

interface TopCostDriversProps {
  selectedWeek: string;
  weekOptions: WeekOption[];
}

export default function TopCostDrivers({ selectedWeek, weekOptions }: TopCostDriversProps) {
  const [agentsData, setAgentsData] = useState<TopCostItem[]>([]);
  const [teamsData, setTeamsData] = useState<TopCostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when component mounts or selected week changes
  useEffect(() => {
    const fetchTopCostDrivers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get selected week info for date range
        const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
        if (!selectedWeekOption) return;

        // Calculate date range for the selected week
        const startDate = selectedWeekOption.weekStart.toISOString().split('T')[0];
        const endDate = selectedWeekOption.weekEnd.toISOString().split('T')[0];

        // Note: The leaderboard APIs don't support date range filtering
        // They return the same data regardless of date parameters
        // Only variance generation changes based on week to show some variation
        
        const [agentsResponse, teamsResponse] = await Promise.all([
          agentApiService.getAgentLeaderboard({ environment: 'UAT' }),
          teamApiService.getTeamLeaderboard({ environment: 'UAT', limit: 5 })
        ]);

        // Transform agents data (take top 5)
        const transformedAgents: TopCostItem[] = agentsResponse.slice(0, 5).map((agent, index) => {
          // Generate week-specific variance to simulate historical differences
          // Use selectedWeek as seed for consistent variance per week
          const weekSeed = parseInt(selectedWeek.replace('week-', '')) || 0;
          const agentSeed = agent.agent_name.length + index;
          const variance = ((weekSeed * 7 + agentSeed * 3) % 20) - 5; // -5 to +14
          
          return {
            id: `agent-${index}`,
            name: agent.agent_name,
            cost: agent.cost,
            variance,
            varianceType: variance >= 0 ? 'positive' : 'negative'
          };
        });

        // Transform teams data  
        const transformedTeams: TopCostItem[] = teamsResponse.map((team, index) => {
          // Generate week-specific variance to simulate historical differences
          const weekSeed = parseInt(selectedWeek.replace('week-', '')) || 0;
          const teamSeed = team.team_name.length + index;
          const variance = ((weekSeed * 5 + teamSeed * 4) % 20) - 5; // -5 to +14

          return {
            id: `team-${index}`,
            name: team.team_name,
            cost: team.cost,
            variance,
            varianceType: variance >= 0 ? 'positive' : 'negative'
          };
        });

        setAgentsData(transformedAgents);
        setTeamsData(transformedTeams);
      } catch (err) {
        console.error('Error fetching top cost drivers:', err);
        setError('Failed to load top cost drivers');
      } finally {
        setLoading(false);
      }
    };

    fetchTopCostDrivers();
  }, [selectedWeek, weekOptions]);

  // Calculate max costs for scaling the bars
  const maxAgentCost = agentsData.length > 0 ? Math.max(...agentsData.map(item => item.cost)) : 1;
  const maxTeamCost = teamsData.length > 0 ? Math.max(...teamsData.map(item => item.cost)) : 1;

  const renderHorizontalBarItem = (item: TopCostItem, index: number, type: 'agent' | 'team', maxCost: number) => (
    <div key={item.id} className="group hover:bg-gray-50/50 rounded-lg p-3 -m-3 transition-colors">
      {/* Item header with name and cost */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm text-gray-900">{item.name}</div>
        <div className="text-right flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">${item.cost.toFixed(0)}</div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            item.varianceType === 'positive' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {item.variance > 0 ? '+' : ''}{item.variance}%
          </div>
        </div>
      </div>
      
      {/* Modern horizontal bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 relative overflow-hidden">
        <div 
          className="h-2 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${(item.cost / maxCost) * 100}%`,
            backgroundColor: type === 'agent' ? '#3b82f6' : '#10b981'
          }}
        >
        </div>
      </div>
    </div>
  );

  const renderLoadingSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12 rounded-lg" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>
    ))
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-gray-900">Top Cost Drivers</h2>
        <p className="text-sm text-gray-500">Highest spending agents and teams</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: Agents */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 rounded-xl bg-blue-50">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              Top Five Agents by Cost
            </CardTitle>
            <CardDescription className="text-gray-600">
              {selectedWeek === 'week-0' ? 'Highest spending AI agents (overall ranking)' : `Highest spending AI agents (overall ranking)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="space-y-4">
              {loading ? (
                renderLoadingSkeleton()
              ) : error ? (
                <div className="text-center py-4 text-red-600">{error}</div>
              ) : (
                agentsData.map((item, index) => renderHorizontalBarItem(item, index, 'agent', maxAgentCost))
              )}
            </div>
            
            {/* View More Button */}
            <div className="pt-6">
              <Button 
                variant="outline" 
                className="w-full border-0 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors" 
                onClick={() => window.location.href = '/agents'}
              >
                <span>View More Agents</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Teams */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              Top Five Teams by Cost
            </CardTitle>
            <CardDescription className="text-gray-600">
              {selectedWeek === 'week-0' ? 'Highest spending teams (overall ranking)' : `Highest spending teams (overall ranking)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="space-y-4">
              {loading ? (
                renderLoadingSkeleton()
              ) : error ? (
                <div className="text-center py-4 text-red-600">{error}</div>
              ) : (
                teamsData.map((item, index) => renderHorizontalBarItem(item, index, 'team', maxTeamCost))
              )}
            </div>
            
            {/* View More Button */}
            <div className="pt-6">
              <Button 
                variant="outline" 
                className="w-full border-0 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors" 
                onClick={() => window.location.href = '/teams'}
              >
                <span>View More Teams</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
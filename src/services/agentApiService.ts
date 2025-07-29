/**
 * Agent API Service
 * Handles all agent-related API calls and data transformations
 */

import { apiClient } from './apiClient';
import { API_CONFIG, getEnvironmentConfig, getPaginationConfig } from '../config/api';
import {
  AgentSummaryResponse,
  AgentLeaderboardResponse,
  UserLeaderboardResponse,
  AgentData,
  UserData,
  ChartDataPoint,
  AgentApiParams,
  DateRangeParams,
  EnvironmentParams
} from '../types/api';

export class AgentApiService {
  /**
   * Get agent summary data
   */
  async getAgentSummary(params?: DateRangeParams): Promise<AgentSummaryResponse[]> {
    return await apiClient.get<AgentSummaryResponse[]>('users/agent-summary', params);
  }

  /**
   * Get agent leaderboard data
   */
  async getAgentLeaderboard(params?: EnvironmentParams & DateRangeParams & { days?: number }): Promise<AgentLeaderboardResponse[]> {
    return await apiClient.get<AgentLeaderboardResponse[]>('analytics/dashboard/agents/leaderboard', params);
  }

  /**
   * Get user leaderboard data (for user-agent associations)
   */
  async getUserLeaderboard(params?: { limit?: number; offset?: number }): Promise<UserLeaderboardResponse[]> {
    return await apiClient.get<UserLeaderboardResponse[]>('analytics/dashboard/users/leaderboard', params);
  }

  /**
   * Get detailed agent data by name
   */
  async getAgentDetailsFromAPI(agentName: string, params?: DateRangeParams & EnvironmentParams): Promise<any> {
    return await apiClient.get<any>(`analytics/dashboard/agents/${encodeURIComponent(agentName)}/details`, params);
  }

  /**
   * Transform API agent summary data to UI format
   */
  private transformAgentSummaryToAgentData(
    summaryData: AgentSummaryResponse[],
    leaderboardData: AgentLeaderboardResponse[],
    userLeaderboardData: UserLeaderboardResponse[]
  ): AgentData[] {
    // Ensure all data is in array format
    if (!Array.isArray(summaryData)) {
      console.warn('summaryData is not an array:', summaryData);
      return [];
    }
    
    if (!Array.isArray(leaderboardData)) {
      console.warn('leaderboardData is not an array:', leaderboardData);
      leaderboardData = [];
    }
    
    if (!Array.isArray(userLeaderboardData)) {
      console.warn('userLeaderboardData is not an array:', userLeaderboardData);
      userLeaderboardData = [];
    }
    
    return summaryData.map(summary => {
      // Find corresponding leaderboard data
      const leaderboardEntry = leaderboardData.find(
        lb => lb.agent_name === summary.agent_name
      );

      // Find users who used this agent
      const agentUsers = userLeaderboardData
        .filter(user => 
          user.agents && Array.isArray(user.agents) && 
          user.agents.some(agent => agent.agent_name === summary.agent_name)
        )
        .map(user => {
          const agentUsage = user.agents.find(
            agent => agent.agent_name === summary.agent_name
          );

          return {
            id: user.user_id,
            name: user.user_id,
            cost: agentUsage?.cost || 0,
            requests: agentUsage?.requests || 0,
            sessions: 0, // User leaderboard doesn't provide sessions, use agent details API for accurate data
            agentsUsed: (user.agents || []).map(agent => ({
              agentName: agent.agent_name,
              cost: agent.cost,
              requests: agent.requests
            }))
          };
        });

      // Calculate weekly variance (placeholder - API doesn't provide this)
      const variance = '+0%';

      return {
        id: `${summary.agent_name}-${summary.environment}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: summary.agent_name,
        type: leaderboardEntry?.type || 'Foundation',
        totalCost: summary.total_cost,
        totalInputTokens: Math.floor(summary.total_tokens * 0.6), // Estimate
        totalOutputTokens: Math.floor(summary.total_tokens * 0.4), // Estimate
        totalTokens: summary.total_tokens,
        weeklyVariance: variance,
        activeUsers: summary.total_users,
        sessions: summary.total_sessions,
        requests: leaderboardEntry?.requests || summary.total_traces,
        avgCostPerRequest: leaderboardEntry?.avg_cost_per_request || 0,
        environment: summary.environment,
        users: agentUsers,
        // Fields for Agent Cost Breakdown table
        weekChange: 0, // Default to 0 as requested
        langfuseUrl: `https://langfuse.example.com/agent/${encodeURIComponent(summary.agent_name)}` // Dummy URL
      };
    });
  }

  /**
   * Transform agent data to chart format
   */
  private transformToChartData(agentData: AgentData[]): ChartDataPoint[] {
    return agentData.map(agent => ({
      name: agent.name.length > 12 ? agent.name.substring(0, 12) + '...' : agent.name,
      displayName: agent.name.length > 12 ? agent.name.substring(0, 12) + '...' : agent.name,
      fullName: agent.name,
      cost: agent.totalCost,
      activeUsers: agent.activeUsers,
      sessions: agent.sessions,
      requests: agent.requests,
      variance: agent.weeklyVariance,
      inputTokens: agent.totalInputTokens,
      outputTokens: agent.totalOutputTokens,
      type: 'agent' as const
    }));
  }

  /**
   * Get complete agent analytics data
   */
  async getAgentAnalytics(params?: AgentApiParams): Promise<{
    agents: AgentData[];
    chartData: ChartDataPoint[];
    totalCost: number;
    totalAgents: number;
  }> {
    try {
      // Fetch all required data in parallel
      const [summaryData, leaderboardData, userLeaderboardData] = await Promise.all([
        this.getAgentSummary({
          start_date: params?.start_date,
          end_date: params?.end_date
        }),
        this.getAgentLeaderboard({
          environment: params?.environment || API_CONFIG.DEFAULT_ENVIRONMENT,
          days: API_CONFIG.DEFAULT_DAYS
        }),
        this.getUserLeaderboard(getPaginationConfig(params?.limit, params?.offset))
      ]);


      // Filter summary data by environment if not 'All'
      const filteredSummaryData = params?.environment && params.environment !== 'All' 
        ? summaryData.filter(summary => summary.environment === params.environment)
        : summaryData;

      // Transform data
      const agents = this.transformAgentSummaryToAgentData(
        filteredSummaryData,
        leaderboardData,
        userLeaderboardData
      );

      // Sort agents by cost (highest first)
      agents.sort((a, b) => b.totalCost - a.totalCost);

      const chartData = this.transformToChartData(agents);
      const totalCost = agents.reduce((sum, agent) => sum + agent.totalCost, 0);
      const totalAgents = agents.length;

      return {
        agents,
        chartData,
        totalCost,
        totalAgents
      };
    } catch (error) {
      console.error('Error fetching agent analytics:', error);
      
      // Return empty state when API fails
      return {
        agents: [],
        chartData: [],
        totalCost: 0,
        totalAgents: 0
      };
    }
  }

  /**
   * Get single agent details by name
   */
  async getAgentDetails(agentName: string, params?: DateRangeParams & EnvironmentParams): Promise<AgentData | null> {
    try {
      // First get basic agent data from summary
      const analytics = await this.getAgentAnalytics(params);
      const baseAgent = analytics.agents.find(agent => 
        agent.name === agentName || agent.id === agentName
      );

      if (!baseAgent) {
        return null;
      }

      // Get detailed data from the agent details endpoint
      const detailsData = await this.getAgentDetailsFromAPI(agentName, {
        ...params,
        environment: params?.environment || API_CONFIG.DEFAULT_ENVIRONMENT
      });

      // Transform user breakdown data
      const users = detailsData.breakdown?.map((user: any) => ({
        id: user.user_id,
        name: user.user_id,
        cost: user.cost || 0,
        requests: user.requests || 0,
        sessions: user.sessions || 0,
        agentsUsed: [{
          agentName: agentName,
          cost: user.cost || 0,
          requests: user.requests || 0
        }]
      })) || [];

      // Return enhanced agent data with real user breakdown and details
      return {
        ...baseAgent,
        users: users,
        // Add details data for metrics
        totalUsers: parseInt(detailsData.details?.total_users || '0'),
        totalTraces: parseInt(detailsData.details?.total_traces || '0'),
        totalTokens: parseInt(detailsData.details?.total_tokens || '0'),
        totalCost: detailsData.details?.total_cost || 0,
        avgCostPerRequest: detailsData.details?.avg_cost_per_request || 0,
        // Add trends data for chart
        trends: detailsData.trends || []
      };
    } catch (error) {
      console.error('Error fetching agent details:', error);
      
      // Fallback to basic agent data if details API fails
      const analytics = await this.getAgentAnalytics(params);
      return analytics.agents.find(agent => 
        agent.name === agentName || agent.id === agentName
      ) || null;
    }
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate week date range for API calls
   */
  getWeekDateRange(weekOffset: number = 0): DateRangeParams {
    const now = new Date();
    const monday = new Date(now);
    
    // Get Monday of the specified week
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1) - (weekOffset * 7);
    monday.setDate(diff);
    
    // Get Sunday of the same week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start_date: this.formatDateForApi(monday),
      end_date: this.formatDateForApi(sunday)
    };
  }
}

// Export singleton instance
export const agentApiService = new AgentApiService();
export default agentApiService;
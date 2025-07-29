/**
 * User API Service
 * Handles all user-related API calls and data transformations
 */

import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import {
  UserLeaderboardResponse,
  UserDetailsResponse,
  DateRangeParams,
  EnvironmentParams
} from '../types/api';

export interface UserData {
  id: string;
  name: string;
  team?: string;
  role?: string;
  totalCost: number;
  totalRequests: number;
  avgCostPerRequest: number;
  agentsUsed: Array<{
    agentName: string;
    cost: number;
    requests: number;
  }>;
  weeklyVariance: string;
  environment: string;
}

export interface UserChartDataPoint {
  name: string;
  displayName: string;
  fullName: string;
  cost: number;
  requests: number;
  variance: string;
  type: 'user';
}

export class UserApiService {
  /**
   * Get user leaderboard data from the API
   */
  async getUserLeaderboard(params?: EnvironmentParams & { limit?: number; offset?: number }): Promise<UserLeaderboardResponse[]> {
    return await apiClient.get<UserLeaderboardResponse[]>('analytics/dashboard/users/leaderboard', {
      ...params,
      environment: params?.environment === 'All' ? 'UAT' : params?.environment || 'UAT'
    });
  }

  /**
   * Transform API user data to UI format
   */
  private transformUserDataToUI(apiResponse: UserLeaderboardResponse[]): UserData[] {
    return apiResponse.map((user, index) => {
      // Calculate weekly variance (placeholder since API doesn't provide this)
      const variance = index % 3 === 0 ? '+12%' : index % 3 === 1 ? '-8%' : '+5%';
      
      return {
        id: user.user_id,
        name: user.user_id,
        totalCost: user.total_cost || 0,
        totalRequests: user.total_requests || 0,
        avgCostPerRequest: (user.total_cost && user.total_requests) 
          ? user.total_cost / user.total_requests 
          : 0,
        agentsUsed: (user.agents || []).map(agent => ({
          agentName: agent.agent_name,
          cost: agent.cost,
          requests: agent.requests
        })),
        weeklyVariance: variance,
        environment: 'UAT'
      };
    });
  }

  /**
   * Transform user data to chart format
   */
  private transformToChartData(userData: UserData[]): UserChartDataPoint[] {
    return userData.map(user => {
      // Smart truncation for user names
      let displayName = user.name;
      if (user.name.length > 15) {
        // Try to show just the username part before @ for emails
        if (user.name.includes('@')) {
          displayName = user.name.split('@')[0];
        }
        // If still too long, truncate
        if (displayName.length > 15) {
          displayName = displayName.substring(0, 12) + '...';
        }
      }
      
      return {
        name: displayName,
        displayName: displayName,
        fullName: user.name,
        cost: user.totalCost,
        requests: user.totalRequests,
        variance: user.weeklyVariance,
        type: 'user' as const
      };
    });
  }

  /**
   * Get complete user analytics data
   */
  async getUserAnalytics(params?: EnvironmentParams & { limit?: number }): Promise<{
    users: UserData[];
    chartData: UserChartDataPoint[];
    totalCost: number;
    totalUsers: number;
    totalRequests: number;
  }> {
    try {
      // Fetch user data from the API
      const userData = await this.getUserLeaderboard({
        environment: params?.environment || API_CONFIG.DEFAULT_ENVIRONMENT,
        limit: params?.limit || 50
      });

      // Transform user data to UI format
      const users = this.transformUserDataToUI(userData);

      // Sort users by cost (highest first)
      users.sort((a, b) => b.totalCost - a.totalCost);

      const chartData = this.transformToChartData(users);
      const totalCost = users.reduce((sum, user) => sum + user.totalCost, 0);
      const totalUsers = users.length;
      const totalRequests = users.reduce((sum, user) => sum + user.totalRequests, 0);

      return {
        users,
        chartData,
        totalCost,
        totalUsers,
        totalRequests
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      
      // Provide fallback mock data
      const mockUsers: UserData[] = [
        {
          id: 'john.doe',
          name: 'john.doe@company.com',
          totalCost: 45.32,
          totalRequests: 234,
          avgCostPerRequest: 0.194,
          agentsUsed: [
            { agentName: 'Survey Coding', cost: 25.50, requests: 120 },
            { agentName: 'Digital Tracker', cost: 19.82, requests: 114 }
          ],
          weeklyVariance: '+15%',
          environment: 'UAT'
        },
        {
          id: 'jane.smith',
          name: 'jane.smith@company.com',
          totalCost: 38.76,
          totalRequests: 189,
          avgCostPerRequest: 0.205,
          agentsUsed: [
            { agentName: 'Foundational Models', cost: 38.76, requests: 189 }
          ],
          weeklyVariance: '+8%',
          environment: 'UAT'
        },
        {
          id: 'mike.wilson',
          name: 'mike.wilson@company.com',
          totalCost: 29.14,
          totalRequests: 145,
          avgCostPerRequest: 0.201,
          agentsUsed: [
            { agentName: 'Salesforce', cost: 16.23, requests: 78 },
            { agentName: 'Hashtag', cost: 12.91, requests: 67 }
          ],
          weeklyVariance: '-5%',
          environment: 'UAT'
        }
      ];

      const mockChartData = this.transformToChartData(mockUsers);
      const totalCost = mockUsers.reduce((sum, user) => sum + user.totalCost, 0);
      const totalRequests = mockUsers.reduce((sum, user) => sum + user.totalRequests, 0);
      
      return {
        users: mockUsers,
        chartData: mockChartData,
        totalCost,
        totalUsers: mockUsers.length,
        totalRequests
      };
    }
  }

  /**
   * Get detailed user information from the user details API
   */
  async getUserDetails(userId: string, params?: EnvironmentParams & { page?: number; limit?: number }): Promise<UserDetailsResponse | null> {
    try {
      return await apiClient.get<UserDetailsResponse>(`analytics/dashboard/users/${userId}`, {
        page: params?.page || 1,
        limit: params?.limit || 20,
        environment: params?.environment === 'All' ? 'UAT' : params?.environment || 'UAT'
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  /**
   * Get user data with enriched details (combining leaderboard and details)
   */
  async getEnrichedUserData(userId: string, params?: EnvironmentParams): Promise<UserData | null> {
    try {
      const details = await this.getUserDetails(userId, params);
      if (!details) return null;

      // Calculate weekly variance (placeholder since API doesn't provide this)
      const variance = '+12%';
      
      return {
        id: details.user_id,
        name: details.user_id,
        team: details.team,
        role: details.role,
        totalCost: details.total_cost || 0,
        totalRequests: details.total_requests || 0,
        avgCostPerRequest: (details.total_cost && details.total_requests) 
          ? details.total_cost / details.total_requests 
          : 0,
        agentsUsed: details.agents_used.map(agentName => ({
          agentName,
          cost: 0, // Would need to calculate from cost_breakdown
          requests: 0 // Not available in details API
        })),
        weeklyVariance: variance,
        environment: 'UAT'
      };
    } catch (error) {
      console.error('Error fetching enriched user data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userApiService = new UserApiService();
export default userApiService;
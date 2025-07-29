/**
 * API Response Types for Galen Usage Tracker
 */

// Agent Summary API Response
export interface AgentSummaryResponse {
  agent_name: string;
  total_traces: number;
  total_sessions: number;
  total_observations: number;
  total_tokens: number;
  total_cost: number;
  total_users: number;
  avg_tokens_per_trace: number;
  environment: string;
}

// Agent Leaderboard API Response
export interface AgentLeaderboardResponse {
  agent_name: string;
  type: 'DIY' | 'Foundation' | 'Pre-built';
  cost: number;
  requests: number;
  avg_cost_per_request: number;
}

// User Leaderboard API Response
export interface UserLeaderboardResponse {
  user_id: string;
  total_cost: number;
  total_requests: number;
  agents: Array<{
    agent_name: string;
    cost: number;
    requests: number;
  }>;
}

// User Details API Response
export interface UserDetailsResponse {
  user_id: string;
  team: string;
  role: string;
  total_cost: number;
  total_requests: number;
  agents_used: string[];
  usage_pattern: Array<{
    date: string;
    cost: number;
    requests: number;
    tokens: number;
    users: number;
  }>;
  cost_breakdown: Array<{
    agent: string;
    percentage: number;
  }>;
  all_requests: Array<{
    project_id: string;
    trace_id: string;
    timestamp: string;
    cost: number;
    tokens: number;
    agent_name: string;
    agent_environment: string;
  }>;
  all_requests_pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Date range parameters for API calls
export interface DateRangeParams {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string;   // YYYY-MM-DD format
}

// Environment parameter
export interface EnvironmentParams {
  environment?: string; // "Production" | "UAT" | "Evals" | "All"
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Common API parameters
export interface AgentApiParams extends DateRangeParams, EnvironmentParams, PaginationParams {}

// Transformed data types for the UI (mapped from API responses)
export interface AgentData {
  id: string;
  name: string;
  type: 'DIY' | 'Foundation' | 'Pre-built';
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  weeklyVariance: string;
  activeUsers: number;
  sessions: number;
  requests: number;
  avgCostPerRequest: number;
  environment: string;
  users: UserData[];
  // Additional fields from agent details API
  totalUsers?: number;
  totalTraces?: number;
  trends?: Array<{
    date: string;
    cost: number;
    requests: number;
    tokens: number;
    users: number;
  }>;
  // Fields for Agent Cost Breakdown table
  weekChange?: number;
  langfuseUrl?: string;
}

// Dashboard Summary API Response
export interface DashboardSummaryResponse {
  current_week_spend: number;
  projected_amount: number;
  active_users: number;
  total_users: number;
  active_agents: number;
  avg_cost_per_user: number;
  active_users_summary: string;
}

export interface UserData {
  id: string;
  name: string;
  cost: number;
  requests: number;
  sessions: number;
  agentsUsed: Array<{
    agentName: string;
    cost: number;
    requests: number;
  }>;
}

// Chart data format
export interface ChartDataPoint {
  name: string;
  displayName: string;
  fullName: string;
  cost: number;
  activeUsers: number;
  sessions: number;
  requests: number;
  variance: string;
  inputTokens: number;
  outputTokens: number;
  type: 'agent';
}

// Week option for date selection
export interface WeekOption {
  value: string;
  label: string;
  dateRange: string;
  weekStart: Date;
  weekEnd: Date;
}

// Team Summary API Response
export interface TeamSummaryResponse {
  team_name: string;
  total_traces: number;
  total_sessions: number;
  total_observations: number;
  total_tokens: number;
  total_cost: number;
  total_users: number;
  avg_tokens_per_trace: number;
  environment: string;
  department?: string;
  active_agents?: number;
}

// Team Leaderboard API Response
export interface TeamLeaderboardResponse {
  team_name: string;
  department: string;
  cost: number;
  requests: number;
  avg_cost_per_request: number;
  total_users: number;
}

// Team API parameters
export interface TeamApiParams extends DateRangeParams, EnvironmentParams, PaginationParams {}

// Transformed team data for the UI
export interface TeamData {
  id: string;
  name: string;
  department: string;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  weeklyVariance: string;
  totalUsers: number;
  activeUsers: number;
  activeAgents: number;
  sessions: number;
  requests: number;
  avgCostPerRequest: number;
  costPerUser: number;
  environment: string;
  users: UserData[];
  // Additional fields from team details API
  totalTraces?: number;
  trends?: Array<{
    date: string;
    cost: number;
    requests: number;
    tokens: number;
    users: number;
  }>;
}

// Chart data format for teams
export interface TeamChartDataPoint {
  name: string;
  displayName: string;
  fullName: string;
  cost: number;
  totalUsers: number;
  activeUsers: number;
  sessions: number;
  requests: number;
  variance: string;
  inputTokens: number;
  outputTokens: number;
  type: 'team';
  department: string;
}

// API Error type
export interface ApiErrorResponse {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
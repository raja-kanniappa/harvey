// Core data model interfaces for the Langfuse Organizational Dashboard

export interface Department {
  id: string;
  name: string;
  weeklyBudget: number;
  currentSpend: number;
  projectedSpend: number;
  weekOverWeekChange: number;
  activeUsers: number;
  totalUsers: number;
  costPerUser: number;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  weeklySpend: number;
  userCount: number;
  agentCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  weeklySpend: number;
  requestCount: number;
  agentCount: number;
  trendData: DailyUsage[];
  agentBreakdown: AgentUsage[];
  recentSessions: Session[];
}

export interface Agent {
  id: string;
  name: string;
  type: 'Pre-built' | 'DIY' | 'Foundation';
  weeklySpend: number;
  requestCount: number;
  averageCost: number;
  popularityRank: number;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  modelFamily: 'GPT' | 'Claude' | 'Gemini' | 'Llama';
  weeklySpend: number;
  requestCount: number;
  averageCost: number;
  averageLatency: number; // in milliseconds
  successRate: number; // percentage
  weekOverWeekChange: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  topAgents: string[]; // Agent names using this model
}

export interface Session {
  id: string;
  timestamp: Date;
  userId: string;
  agentName: string;
  cost: number;
  tokenCount: number;
  duration: number;
  status: 'success' | 'error' | 'timeout';
}

export interface DailyUsage {
  date: Date;
  cost: number;
  requestCount: number;
}

export interface AgentUsage {
  agentId: string;
  agentName: string;
  cost: number;
  requestCount: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  cost: number;
  requestCount: number;
  userCount: number;
}

export interface Alert {
  id: string;
  type: 'budget' | 'usage' | 'error';
  severity: 'low' | 'medium' | 'high';
  message: string;
  departmentId?: string;
  userId?: string;
  timestamp: Date;
}

// Filter and query interfaces
export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hourly' | 'daily' | 'weekly';
}

export interface FilterState {
  timeRange: TimeRange;
  departments: string[];
  projects: string[];
  users: string[];
  agents: string[];
  costThreshold?: number;
}

export interface SessionFilters {
  userId?: string;
  agentId?: string;
  departmentId?: string;
  timeRange: TimeRange;
  status?: Session['status'];
  minCost?: number;
  maxCost?: number;
}

export interface TrendFilters {
  timeRange: TimeRange;
  departmentIds?: string[];
  userIds?: string[];
  agentIds?: string[];
  granularity: TimeRange['granularity'];
}

export interface ExportFilters {
  timeRange: TimeRange;
  departments?: string[];
  users?: string[];
  agents?: string[];
  includeDetails: boolean;
}

// API response interfaces
export interface DepartmentSummary {
  totalSpend: number;
  totalBudget: number;
  budgetUtilization: number;
  alertCount: number;
  departments: Department[];
}

export interface UserDetails {
  user: User;
  costTrend: TimeSeriesPoint[];
  topAgents: AgentUsage[];
  recentActivity: Session[];
}

export interface SessionDetails {
  session: Session;
  context: {
    userInfo: Pick<User, 'name' | 'email' | 'department'>;
    agentInfo: Pick<Agent, 'name' | 'type'>;
    relatedSessions: Session[];
  };
}

export interface TimeSeriesData {
  points: TimeSeriesPoint[];
  summary: {
    totalCost: number;
    totalRequests: number;
    averageCostPerRequest: number;
    peakUsageDate: Date;
  };
}

export interface ExportResult {
  data: string | object;
  format: 'csv' | 'json';
  filename: string;
  size: number;
}

// Error handling interfaces
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface ErrorResponse {
  error: ApiError;
  fallbackData?: any;
  retryable: boolean;
}

// Mock data store interface
export interface MockDataStore {
  departments: Department[];
  users: User[];
  agents: Agent[];
  sessions: Session[];
  timeSeriesData: TimeSeriesPoint[];
  budgetAlerts: Alert[];
}

// Data summary interface
export interface DataSummary {
  departments: number;
  users: number;
  agents: number;
  sessions: number;
  timeSeriesPoints: number;
  alerts: number;
  totalWeeklySpend: number;
  totalWeeklyBudget: number;
  highUsageUsers: number;
  zeroUsageUsers: number;
}
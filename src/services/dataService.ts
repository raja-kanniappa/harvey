import {
  Department,
  User,
  Agent,
  Session,
  TimeRange,
  FilterState,
  SessionFilters,
  TrendFilters,
  ExportFilters,
  DepartmentSummary,
  UserDetails,
  SessionDetails,
  TimeSeriesData,
  ExportResult,
  ApiError,
  ErrorResponse,
  TimeSeriesPoint,
  AgentUsage,
  Alert
} from '../types/index.js';
import { mockDataStore } from '../data/mockData/index.js';

// Pagination interface
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error simulation configuration
interface ErrorSimulationConfig {
  enabled: boolean;
  errorRate: number; // 0-1, probability of error
  errorTypes: {
    400: number; // Bad Request
    401: number; // Unauthorized
    403: number; // Forbidden
    404: number; // Not Found
    429: number; // Too Many Requests
    500: number; // Internal Server Error
  };
}

/**
 * DataService class provides a comprehensive API for dashboard data queries
 * with mock backend simulation, error handling, and filtering capabilities
 */
export class DataService {
  private errorConfig: ErrorSimulationConfig = {
    enabled: false,
    errorRate: 0.1, // 10% error rate when enabled
    errorTypes: {
      400: 0.2, // 20% of errors are 400
      401: 0.1, // 10% of errors are 401
      403: 0.1, // 10% of errors are 403
      404: 0.2, // 20% of errors are 404
      429: 0.1, // 10% of errors are 429
      500: 0.3  // 30% of errors are 500
    }
  };

  private requestCount = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private requestTimestamps: number[] = [];

  constructor() {
    // Initialize with error simulation disabled by default
  }

  // Configuration methods
  enableErrorSimulation(enabled: boolean = true): void {
    this.errorConfig.enabled = enabled;
  }

  setErrorRate(rate: number): void {
    this.errorConfig.errorRate = Math.max(0, Math.min(1, rate));
  }

  // Private helper methods
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 200 + 50; // 50-250ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      throw this.createApiError(429, 'Too Many Requests', 'RATE_LIMIT_EXCEEDED');
    }
    
    this.requestTimestamps.push(now);
  }

  private shouldSimulateError(): boolean {
    if (!this.errorConfig.enabled) return false;
    return Math.random() < this.errorConfig.errorRate;
  }

  private generateRandomError(): ApiError {
    const rand = Math.random();
    let cumulativeProbability = 0;
    
    for (const [statusCode, probability] of Object.entries(this.errorConfig.errorTypes)) {
      cumulativeProbability += probability;
      if (rand <= cumulativeProbability) {
        return this.createApiError(parseInt(statusCode), this.getErrorMessage(parseInt(statusCode)));
      }
    }
    
    // Fallback to 500 error
    return this.createApiError(500, 'Internal Server Error');
  }

  private createApiError(status: number, message: string, code?: string): ApiError {
    return { status, message, code };
  }

  private getErrorMessage(status: number): string {
    const messages = {
      400: 'Bad Request - Invalid parameters provided',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Requested resource does not exist',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Something went wrong'
    };
    return messages[status as keyof typeof messages] || 'Unknown Error';
  }

  private async executeWithErrorSimulation<T>(operation: () => T): Promise<T> {
    await this.simulateNetworkDelay();
    this.checkRateLimit();
    
    if (this.shouldSimulateError()) {
      throw this.generateRandomError();
    }
    
    return operation();
  }

  // Date utility methods
  private isDateInRange(date: Date, timeRange: TimeRange): boolean {
    return date >= timeRange.start && date <= timeRange.end;
  }

  private getDefaultTimeRange(): TimeRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 35); // Last 5 weeks
    
    return {
      start,
      end,
      granularity: 'daily'
    };
  }

  // Filtering utility methods
  private applyDepartmentFilter(data: any[], departmentIds: string[]): any[] {
    if (!departmentIds.length) return data;
    return data.filter(item => 
      departmentIds.includes(item.departmentId || item.department || item.id)
    );
  }

  private applyUserFilter(data: any[], userIds: string[]): any[] {
    if (!userIds.length) return data;
    return data.filter(item => 
      userIds.includes(item.userId || item.id)
    );
  }

  private applyAgentFilter(data: any[], agentIds: string[]): any[] {
    if (!agentIds.length) return data;
    return data.filter(item => 
      agentIds.includes(item.agentId || item.id)
    );
  }

  private applyTimeRangeFilter(data: any[], timeRange: TimeRange, dateField: string = 'timestamp'): any[] {
    return data.filter(item => {
      const date = item[dateField];
      return date && this.isDateInRange(date, timeRange);
    });
  }

  // Pagination utility
  private paginate<T>(data: T[], options: PaginationOptions): PaginatedResponse<T> {
    const { page, limit, sortBy, sortOrder = 'desc' } = options;
    
    // Sort data if sortBy is provided
    let sortedData = [...data];
    if (sortBy) {
      sortedData.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        if (aVal instanceof Date && bVal instanceof Date) {
          return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sortOrder === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    
    const total = sortedData.length;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Department-level queries
  async getDepartmentSummary(timeRange?: TimeRange): Promise<DepartmentSummary> {
    return this.executeWithErrorSimulation(() => {
      const departments = mockDataStore.getDepartments();
      const range = timeRange || this.getDefaultTimeRange();
      
      // Filter departments based on time range if needed
      const filteredDepartments = departments.filter(dept => {
        // For this mock, we'll assume all departments are always included
        // In a real API, you might filter based on when departments were created/active
        return true;
      });
      
      const totalSpend = filteredDepartments.reduce((sum, dept) => sum + dept.currentSpend, 0);
      const totalBudget = filteredDepartments.reduce((sum, dept) => sum + dept.weeklyBudget, 0);
      const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
      
      const alerts = mockDataStore.getBudgetAlerts();
      const alertCount = alerts.filter(alert => 
        alert.departmentId && filteredDepartments.some(dept => dept.id === alert.departmentId)
      ).length;
      
      return {
        totalSpend,
        totalBudget,
        budgetUtilization,
        alertCount,
        departments: filteredDepartments
      };
    });
  }

  async getDepartmentComparison(timeRange?: TimeRange, pagination?: PaginationOptions): Promise<PaginatedResponse<Department>> {
    return this.executeWithErrorSimulation(() => {
      const departments = mockDataStore.getDepartments();
      const range = timeRange || this.getDefaultTimeRange();
      
      // Apply time range filtering if needed
      const filteredDepartments = departments;
      
      if (pagination) {
        return this.paginate(filteredDepartments, pagination);
      }
      
      return {
        data: filteredDepartments,
        pagination: {
          page: 1,
          limit: filteredDepartments.length,
          total: filteredDepartments.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    });
  }

  // User-level queries
  async getUsersByDepartment(departmentId: string, timeRange?: TimeRange, pagination?: PaginationOptions): Promise<PaginatedResponse<User>> {
    return this.executeWithErrorSimulation(() => {
      const users = mockDataStore.getUsers();
      const departments = mockDataStore.getDepartments();
      
      // Verify department exists
      const department = departments.find(dept => dept.id === departmentId);
      if (!department) {
        throw this.createApiError(404, `Department with id ${departmentId} not found`);
      }
      
      const departmentUsers = users.filter(user => user.department === department.name);
      
      if (pagination) {
        return this.paginate(departmentUsers, pagination);
      }
      
      return {
        data: departmentUsers,
        pagination: {
          page: 1,
          limit: departmentUsers.length,
          total: departmentUsers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    });
  }

  async getUserDetails(userId: string, timeRange?: TimeRange): Promise<UserDetails> {
    return this.executeWithErrorSimulation(() => {
      const users = mockDataStore.getUsers();
      const sessions = mockDataStore.getSessions();
      const timeSeriesData = mockDataStore.getTimeSeriesData();
      
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw this.createApiError(404, `User with id ${userId} not found`);
      }
      
      const range = timeRange || this.getDefaultTimeRange();
      
      // Get user's cost trend
      const userSessions = sessions.filter(session => session.userId === userId);
      const filteredSessions = this.applyTimeRangeFilter(userSessions, range);
      
      // Create cost trend from user's daily usage data
      const costTrend: TimeSeriesPoint[] = user.trendData.map(daily => ({
        timestamp: daily.date,
        cost: daily.cost,
        requestCount: daily.requestCount,
        userCount: 1
      }));
      
      // Get recent activity
      const recentActivity = filteredSessions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);
      
      return {
        user,
        costTrend,
        topAgents: user.agentBreakdown,
        recentActivity
      };
    });
  }

  // Agent-level queries
  async getAgentLeaderboard(timeRange?: TimeRange, limit: number = 10, pagination?: PaginationOptions): Promise<PaginatedResponse<Agent>> {
    return this.executeWithErrorSimulation(() => {
      const agents = mockDataStore.getAgents();
      const range = timeRange || this.getDefaultTimeRange();
      
      // Sort agents by weekly spend (descending)
      const sortedAgents = agents
        .sort((a, b) => b.weeklySpend - a.weeklySpend)
        .slice(0, limit);
      
      if (pagination) {
        return this.paginate(sortedAgents, pagination);
      }
      
      return {
        data: sortedAgents,
        pagination: {
          page: 1,
          limit: sortedAgents.length,
          total: sortedAgents.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    });
  }

  async getAgentUsageByUser(userId: string, timeRange?: TimeRange): Promise<AgentUsage[]> {
    return this.executeWithErrorSimulation(() => {
      const users = mockDataStore.getUsers();
      
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw this.createApiError(404, `User with id ${userId} not found`);
      }
      
      return user.agentBreakdown;
    });
  }

  // Session-level queries
  async getRecentSessions(filters: SessionFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<Session>> {
    return this.executeWithErrorSimulation(() => {
      let sessions = mockDataStore.getSessions();
      
      // Apply filters
      if (filters.userId) {
        sessions = sessions.filter(session => session.userId === filters.userId);
      }
      
      if (filters.agentId) {
        const agents = mockDataStore.getAgents();
        const agent = agents.find(a => a.id === filters.agentId);
        if (agent) {
          sessions = sessions.filter(session => session.agentName === agent.name);
        }
      }
      
      if (filters.departmentId) {
        const users = mockDataStore.getUsers();
        const departments = mockDataStore.getDepartments();
        const department = departments.find(d => d.id === filters.departmentId);
        if (department) {
          const departmentUserIds = users
            .filter(user => user.department === department.name)
            .map(user => user.id);
          sessions = sessions.filter(session => departmentUserIds.includes(session.userId));
        }
      }
      
      if (filters.status) {
        sessions = sessions.filter(session => session.status === filters.status);
      }
      
      if (filters.minCost !== undefined) {
        sessions = sessions.filter(session => session.cost >= filters.minCost!);
      }
      
      if (filters.maxCost !== undefined) {
        sessions = sessions.filter(session => session.cost <= filters.maxCost!);
      }
      
      // Apply time range filter
      sessions = this.applyTimeRangeFilter(sessions, filters.timeRange);
      
      if (pagination) {
        return this.paginate(sessions, { ...pagination, sortBy: pagination.sortBy || 'timestamp' });
      }
      
      // Default sort by timestamp descending
      sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return {
        data: sessions,
        pagination: {
          page: 1,
          limit: sessions.length,
          total: sessions.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    });
  }

  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    return this.executeWithErrorSimulation(() => {
      const sessions = mockDataStore.getSessions();
      const users = mockDataStore.getUsers();
      const agents = mockDataStore.getAgents();
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw this.createApiError(404, `Session with id ${sessionId} not found`);
      }
      
      const user = users.find(u => u.id === session.userId);
      const agent = agents.find(a => a.name === session.agentName);
      
      if (!user) {
        throw this.createApiError(404, `User for session ${sessionId} not found`);
      }
      
      if (!agent) {
        throw this.createApiError(404, `Agent for session ${sessionId} not found`);
      }
      
      // Get related sessions (same user, same agent, within 24 hours)
      const relatedSessions = sessions
        .filter(s => 
          s.id !== sessionId &&
          s.userId === session.userId &&
          s.agentName === session.agentName &&
          Math.abs(s.timestamp.getTime() - session.timestamp.getTime()) < 24 * 60 * 60 * 1000
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
      
      return {
        session,
        context: {
          userInfo: {
            name: user.name,
            email: user.email,
            department: user.department
          },
          agentInfo: {
            name: agent.name,
            type: agent.type
          },
          relatedSessions
        }
      };
    });
  }

  // Time-series data
  async getUsageTrends(filters: TrendFilters): Promise<TimeSeriesData> {
    return this.executeWithErrorSimulation(() => {
      let timeSeriesData = mockDataStore.getTimeSeriesData();
      
      // Apply time range filter
      timeSeriesData = this.applyTimeRangeFilter(timeSeriesData, filters.timeRange);
      
      // Apply additional filters if provided
      if (filters.departmentIds?.length || filters.userIds?.length || filters.agentIds?.length) {
        const sessions = mockDataStore.getSessions();
        const users = mockDataStore.getUsers();
        const agents = mockDataStore.getAgents();
        
        // Pre-filter sessions by time range first to reduce dataset size
        let filteredSessions = this.applyTimeRangeFilter(sessions, filters.timeRange);
        
        if (filters.departmentIds?.length) {
          const departments = mockDataStore.getDepartments();
          const departmentNames = new Set(
            departments
              .filter(dept => filters.departmentIds!.includes(dept.id))
              .map(dept => dept.name)
          );
          const departmentUserIds = new Set(
            users
              .filter(user => departmentNames.has(user.department))
              .map(user => user.id)
          );
          filteredSessions = filteredSessions.filter(session => 
            departmentUserIds.has(session.userId)
          );
        }
        
        if (filters.userIds?.length) {
          const userIdSet = new Set(filters.userIds);
          filteredSessions = filteredSessions.filter(session => 
            userIdSet.has(session.userId)
          );
        }
        
        if (filters.agentIds?.length) {
          const agentNames = new Set(
            agents
              .filter(agent => filters.agentIds!.includes(agent.id))
              .map(agent => agent.name)
          );
          filteredSessions = filteredSessions.filter(session => 
            agentNames.has(session.agentName)
          );
        }
        
        // Recalculate time series data based on filtered sessions
        const timeSeriesMap = new Map<string, TimeSeriesPoint>();
        const usersByDay = new Map<string, Set<string>>();
        
        filteredSessions.forEach(session => {
          const dateKey = session.timestamp.toISOString().split('T')[0];
          
          if (!timeSeriesMap.has(dateKey)) {
            timeSeriesMap.set(dateKey, {
              timestamp: new Date(dateKey),
              cost: 0,
              requestCount: 0,
              userCount: 0
            });
            usersByDay.set(dateKey, new Set<string>());
          }
          
          const point = timeSeriesMap.get(dateKey)!;
          const usersSet = usersByDay.get(dateKey)!;
          
          point.cost += session.cost;
          point.requestCount += 1;
          usersSet.add(session.userId);
        });
        
        // Set user counts
        usersByDay.forEach((usersSet, dateKey) => {
          const point = timeSeriesMap.get(dateKey);
          if (point) {
            point.userCount = usersSet.size;
          }
        });
        
        timeSeriesData = Array.from(timeSeriesMap.values())
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      }
      
      // Calculate summary statistics
      const totalCost = timeSeriesData.reduce((sum, point) => sum + point.cost, 0);
      const totalRequests = timeSeriesData.reduce((sum, point) => sum + point.requestCount, 0);
      const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
      const peakUsagePoint = timeSeriesData.reduce((peak, point) => 
        point.cost > peak.cost ? point : peak, timeSeriesData[0] || { cost: 0, timestamp: new Date() }
      );
      
      return {
        points: timeSeriesData,
        summary: {
          totalCost,
          totalRequests,
          averageCostPerRequest,
          peakUsageDate: peakUsagePoint.timestamp
        }
      };
    });
  }

  // Export functionality
  async exportData(filters: ExportFilters, format: 'csv' | 'json' = 'csv'): Promise<ExportResult> {
    return this.executeWithErrorSimulation(() => {
      const { timeRange, departments, users, agents, includeDetails } = filters;
      
      // Gather data based on filters
      let exportData: any[] = [];
      
      if (departments?.length) {
        const deptData = mockDataStore.getDepartments()
          .filter(dept => departments.includes(dept.id));
        exportData.push(...deptData.map(dept => ({
          type: 'department',
          ...dept
        })));
      }
      
      if (users?.length) {
        const userData = mockDataStore.getUsers()
          .filter(user => users.includes(user.id));
        exportData.push(...userData.map(user => ({
          type: 'user',
          ...user,
          // Flatten complex objects for CSV
          trendData: includeDetails ? JSON.stringify(user.trendData) : undefined,
          agentBreakdown: includeDetails ? JSON.stringify(user.agentBreakdown) : undefined,
          recentSessions: includeDetails ? JSON.stringify(user.recentSessions) : undefined
        })));
      }
      
      if (agents?.length) {
        const agentData = mockDataStore.getAgents()
          .filter(agent => agents.includes(agent.id));
        exportData.push(...agentData.map(agent => ({
          ...agent,
          type: 'agent'
        })));
      }
      
      // If no specific filters, export summary data
      if (!departments?.length && !users?.length && !agents?.length) {
        const summary = {
          type: 'summary',
          exportDate: new Date().toISOString(),
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          totalDepartments: mockDataStore.getDepartments().length,
          totalUsers: mockDataStore.getUsers().length,
          totalAgents: mockDataStore.getAgents().length,
          totalSessions: mockDataStore.getSessions().length
        };
        exportData.push(summary);
      }
      
      let result: string | object;
      let filename: string;
      
      if (format === 'csv') {
        result = this.convertToCSV(exportData);
        filename = `langfuse-export-${Date.now()}.csv`;
      } else {
        result = exportData;
        filename = `langfuse-export-${Date.now()}.json`;
      }
      
      return {
        data: result,
        format,
        filename,
        size: typeof result === 'string' ? result.length : JSON.stringify(result).length
      };
    });
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    const headers = Array.from(allKeys);
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return String(value);
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Utility methods for complex filtering
  async getFilteredData(filters: FilterState, pagination?: PaginationOptions): Promise<{
    departments: PaginatedResponse<Department>;
    users: PaginatedResponse<User>;
    agents: PaginatedResponse<Agent>;
    sessions: PaginatedResponse<Session>;
  }> {
    return this.executeWithErrorSimulation(() => {
      let departments = mockDataStore.getDepartments();
      let users = mockDataStore.getUsers();
      let agents = mockDataStore.getAgents();
      let sessions = mockDataStore.getSessions();
      
      // Apply department filter
      if (filters.departments.length) {
        departments = this.applyDepartmentFilter(departments, filters.departments);
        const departmentNames = departments.map(dept => dept.name);
        users = users.filter(user => departmentNames.includes(user.department));
      }
      
      // Apply user filter
      if (filters.users.length) {
        users = this.applyUserFilter(users, filters.users);
        sessions = sessions.filter(session => filters.users.includes(session.userId));
      }
      
      // Apply agent filter
      if (filters.agents.length) {
        agents = this.applyAgentFilter(agents, filters.agents);
        const agentNames = agents.map(agent => agent.name);
        sessions = sessions.filter(session => agentNames.includes(session.agentName));
      }
      
      // Apply time range filter
      sessions = this.applyTimeRangeFilter(sessions, filters.timeRange);
      
      // Apply cost threshold filter
      if (filters.costThreshold !== undefined) {
        sessions = sessions.filter(session => session.cost >= filters.costThreshold!);
        users = users.filter(user => user.weeklySpend >= filters.costThreshold!);
        agents = agents.filter(agent => agent.weeklySpend >= filters.costThreshold!);
      }
      
      const defaultPagination: PaginationOptions = {
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc'
      };
      
      const paginationOptions = pagination || defaultPagination;
      
      return {
        departments: this.paginate(departments, paginationOptions),
        users: this.paginate(users, { ...paginationOptions, sortBy: 'weeklySpend' }),
        agents: this.paginate(agents, { ...paginationOptions, sortBy: 'weeklySpend' }),
        sessions: this.paginate(sessions, { ...paginationOptions, sortBy: 'timestamp' })
      };
    });
  }

  // Health check and utility methods
  async healthCheck(): Promise<{ status: string; timestamp: Date; dataStats: any }> {
    return this.executeWithErrorSimulation(() => {
      const dataStats = mockDataStore.getDataSummary();
      return {
        status: 'healthy',
        timestamp: new Date(),
        dataStats
      };
    });
  }

  // Get available filter options
  async getFilterOptions(): Promise<{
    departments: { id: string; name: string }[];
    users: { id: string; name: string; department: string }[];
    agents: { id: string; name: string; type: string }[];
    timeRanges: { label: string; range: TimeRange }[];
  }> {
    return this.executeWithErrorSimulation(() => {
      const departments = mockDataStore.getDepartments();
      const users = mockDataStore.getUsers();
      const agents = mockDataStore.getAgents();
      
      const now = new Date();
      const timeRanges = [
        {
          label: 'Last 7 days',
          range: {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
            granularity: 'daily' as const
          }
        },
        {
          label: 'Last 30 days',
          range: {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
            granularity: 'daily' as const
          }
        },
        {
          label: 'Last 3 months',
          range: {
            start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            end: now,
            granularity: 'weekly' as const
          }
        }
      ];
      
      return {
        departments: departments.map(dept => ({ id: dept.id, name: dept.name })),
        users: users.map(user => ({ id: user.id, name: user.name, department: user.department })),
        agents: agents.map(agent => ({ id: agent.id, name: agent.name, type: agent.type })),
        timeRanges
      };
    });
  }
}

// Export singleton instance
export const dataService = new DataService();
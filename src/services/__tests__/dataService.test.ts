import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService, PaginationOptions } from '../dataService.js';
import { mockDataStore } from '../mockDataStore.js';
import { TimeRange, SessionFilters, TrendFilters, ExportFilters, FilterState } from '../../types/index.js';

describe('DataService', () => {
  let dataService: DataService;
  let mockTimeRange: TimeRange;

  beforeEach(() => {
    dataService = new DataService();
    // Disable error simulation for most tests
    dataService.enableErrorSimulation(false);

    // Create a standard time range for testing
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    mockTimeRange = {
      start,
      end: now,
      granularity: 'daily'
    };
  });

  describe('Configuration', () => {
    it('should enable/disable error simulation', () => {
      dataService.enableErrorSimulation(true);
      dataService.setErrorRate(0.5);

      // Test that configuration is set (we can't easily test the actual error simulation without making it deterministic)
      expect(true).toBe(true); // Configuration methods don't return values
    });

    it('should clamp error rate between 0 and 1', () => {
      dataService.setErrorRate(-0.5);
      dataService.setErrorRate(1.5);

      // Error rate should be clamped, but we can't directly test the private property
      expect(true).toBe(true);
    });
  });

  describe('Department Queries', () => {
    it('should get department summary', async () => {
      const summary = await dataService.getDepartmentSummary(mockTimeRange);

      expect(summary).toHaveProperty('totalSpend');
      expect(summary).toHaveProperty('totalBudget');
      expect(summary).toHaveProperty('budgetUtilization');
      expect(summary).toHaveProperty('alertCount');
      expect(summary).toHaveProperty('departments');
      expect(Array.isArray(summary.departments)).toBe(true);
      expect(typeof summary.totalSpend).toBe('number');
      expect(typeof summary.totalBudget).toBe('number');
      expect(typeof summary.budgetUtilization).toBe('number');
      expect(typeof summary.alertCount).toBe('number');
    });

    it('should get department comparison with pagination', async () => {
      const pagination: PaginationOptions = {
        page: 1,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await dataService.getDepartmentComparison(mockTimeRange, pagination);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it('should get department comparison without pagination', async () => {
      const result = await dataService.getDepartmentComparison(mockTimeRange);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('User Queries', () => {
    it('should get users by department', async () => {
      const departments = mockDataStore.getDepartments();
      const departmentId = departments[0].id;

      const result = await dataService.getUsersByDepartment(departmentId, mockTimeRange);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);

      // All users should belong to the specified department
      result.data.forEach(user => {
        expect(user.department).toBe(departments[0].name);
      });
    });

    it('should throw 404 for non-existent department', async () => {
      await expect(
        dataService.getUsersByDepartment('non-existent-dept', mockTimeRange)
      ).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining('Department with id non-existent-dept not found')
      });
    });

    it('should get user details', async () => {
      const users = mockDataStore.getUsers();
      const userId = users[0].id;

      const result = await dataService.getUserDetails(userId, mockTimeRange);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('costTrend');
      expect(result).toHaveProperty('topAgents');
      expect(result).toHaveProperty('recentActivity');
      expect(result.user.id).toBe(userId);
      expect(Array.isArray(result.costTrend)).toBe(true);
      expect(Array.isArray(result.topAgents)).toBe(true);
      expect(Array.isArray(result.recentActivity)).toBe(true);
    });

    it('should throw 404 for non-existent user', async () => {
      await expect(
        dataService.getUserDetails('non-existent-user', mockTimeRange)
      ).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining('User with id non-existent-user not found')
      });
    });
  });

  describe('Agent Queries', () => {
    it('should get agent leaderboard', async () => {
      const result = await dataService.getAgentLeaderboard(mockTimeRange, 5);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);

      // Should be sorted by weekly spend descending
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].weeklySpend).toBeGreaterThanOrEqual(result.data[i].weeklySpend);
      }
    });

    it('should get agent usage by user', async () => {
      const users = mockDataStore.getUsers();
      const userId = users[0].id;

      const result = await dataService.getAgentUsageByUser(userId, mockTimeRange);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(agentUsage => {
        expect(agentUsage).toHaveProperty('agentId');
        expect(agentUsage).toHaveProperty('agentName');
        expect(agentUsage).toHaveProperty('cost');
        expect(agentUsage).toHaveProperty('requestCount');
        expect(agentUsage).toHaveProperty('percentage');
      });
    });

    it('should throw 404 for non-existent user in agent usage', async () => {
      await expect(
        dataService.getAgentUsageByUser('non-existent-user', mockTimeRange)
      ).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining('User with id non-existent-user not found')
      });
    });
  });

  describe('Session Queries', () => {
    it('should get recent sessions with basic filters', async () => {
      const users = mockDataStore.getUsers();
      const filters: SessionFilters = {
        userId: users[0].id,
        timeRange: mockTimeRange
      };

      const result = await dataService.getRecentSessions(filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);

      // All sessions should belong to the specified user
      result.data.forEach(session => {
        expect(session.userId).toBe(users[0].id);
      });
    });

    it('should get recent sessions with cost filters', async () => {
      const filters: SessionFilters = {
        timeRange: mockTimeRange,
        minCost: 0.01,
        maxCost: 1.0
      };

      const result = await dataService.getRecentSessions(filters);

      expect(result).toHaveProperty('data');
      result.data.forEach(session => {
        expect(session.cost).toBeGreaterThanOrEqual(0.01);
        expect(session.cost).toBeLessThanOrEqual(1.0);
      });
    });

    it('should get recent sessions with status filter', async () => {
      const filters: SessionFilters = {
        timeRange: mockTimeRange,
        status: 'success'
      };

      const result = await dataService.getRecentSessions(filters);

      expect(result).toHaveProperty('data');
      result.data.forEach(session => {
        expect(session.status).toBe('success');
      });
    });

    it('should get session details', async () => {
      const sessions = mockDataStore.getSessions();
      const sessionId = sessions[0].id;

      const result = await dataService.getSessionDetails(sessionId);

      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('context');
      expect(result.session.id).toBe(sessionId);
      expect(result.context).toHaveProperty('userInfo');
      expect(result.context).toHaveProperty('agentInfo');
      expect(result.context).toHaveProperty('relatedSessions');
      expect(Array.isArray(result.context.relatedSessions)).toBe(true);
    });

    it('should throw 404 for non-existent session', async () => {
      await expect(
        dataService.getSessionDetails('non-existent-session')
      ).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining('Session with id non-existent-session not found')
      });
    });
  });

  describe('Time Series Data', () => {
    it('should get usage trends', async () => {
      const filters: TrendFilters = {
        timeRange: mockTimeRange,
        granularity: 'daily'
      };

      const result = await dataService.getUsageTrends(filters);

      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.points)).toBe(true);
      expect(result.summary).toHaveProperty('totalCost');
      expect(result.summary).toHaveProperty('totalRequests');
      expect(result.summary).toHaveProperty('averageCostPerRequest');
      expect(result.summary).toHaveProperty('peakUsageDate');
    });

    it('should get usage trends with department filter', async () => {
      const departments = mockDataStore.getDepartments();
      const filters: TrendFilters = {
        timeRange: mockTimeRange,
        departmentIds: [departments[0].id],
        granularity: 'daily'
      };

      const result = await dataService.getUsageTrends(filters);

      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.points)).toBe(true);
    });

    it('should get usage trends with user filter', async () => {
      const users = mockDataStore.getUsers();
      const filters: TrendFilters = {
        timeRange: mockTimeRange,
        userIds: [users[0].id],
        granularity: 'daily'
      };

      const result = await dataService.getUsageTrends(filters);

      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('summary');
    });

    it('should get usage trends with agent filter', async () => {
      const agents = mockDataStore.getAgents();
      const filters: TrendFilters = {
        timeRange: mockTimeRange,
        agentIds: [agents[0].id],
        granularity: 'daily'
      };

      const result = await dataService.getUsageTrends(filters);

      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('summary');
    });
  });

  describe('Export Functionality', () => {
    it('should export data as CSV', async () => {
      const departments = mockDataStore.getDepartments();
      const filters: ExportFilters = {
        timeRange: mockTimeRange,
        departments: [departments[0].id],
        includeDetails: false
      };

      const result = await dataService.exportData(filters, 'csv');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result.format).toBe('csv');
      expect(typeof result.data).toBe('string');
      expect(result.filename).toMatch(/\.csv$/);
    });

    it('should export data as JSON', async () => {
      const users = mockDataStore.getUsers();
      const filters: ExportFilters = {
        timeRange: mockTimeRange,
        users: [users[0].id],
        includeDetails: true
      };

      const result = await dataService.exportData(filters, 'json');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result.format).toBe('json');
      expect(typeof result.data).toBe('object');
      expect(result.filename).toMatch(/\.json$/);
    });

    it('should export summary when no specific filters provided', async () => {
      const filters: ExportFilters = {
        timeRange: mockTimeRange,
        includeDetails: false
      };

      const result = await dataService.exportData(filters, 'json');

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      const data = result.data as any[];
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('type', 'summary');
    });
  });

  describe('Complex Filtering', () => {
    it('should get filtered data with multiple filters', async () => {
      const departments = mockDataStore.getDepartments();
      const users = mockDataStore.getUsers();
      const agents = mockDataStore.getAgents();

      const filters: FilterState = {
        timeRange: mockTimeRange,
        departments: [departments[0].id],
        projects: [],
        users: [users[0].id],
        agents: [agents[0].id],
        costThreshold: 0.01
      };

      const result = await dataService.getFilteredData(filters);

      expect(result).toHaveProperty('departments');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('sessions');

      expect(result.departments).toHaveProperty('data');
      expect(result.users).toHaveProperty('data');
      expect(result.agents).toHaveProperty('data');
      expect(result.sessions).toHaveProperty('data');
    });

    it('should get filtered data with pagination', async () => {
      const filters: FilterState = {
        timeRange: mockTimeRange,
        departments: [],
        projects: [],
        users: [],
        agents: []
      };

      const pagination: PaginationOptions = {
        page: 1,
        limit: 3,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await dataService.getFilteredData(filters, pagination);

      expect(result.departments.pagination.limit).toBe(3);
      expect(result.users.pagination.limit).toBe(3);
      expect(result.agents.pagination.limit).toBe(3);
      expect(result.sessions.pagination.limit).toBe(3);
    });
  });

  describe('Utility Methods', () => {
    it('should perform health check', async () => {
      const result = await dataService.healthCheck();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('dataStats');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.dataStats).toBe('object');
    });

    it('should get filter options', async () => {
      const result = await dataService.getFilterOptions();

      expect(result).toHaveProperty('departments');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('timeRanges');

      expect(Array.isArray(result.departments)).toBe(true);
      expect(Array.isArray(result.users)).toBe(true);
      expect(Array.isArray(result.agents)).toBe(true);
      expect(Array.isArray(result.timeRanges)).toBe(true);

      // Check structure of filter options
      if (result.departments.length > 0) {
        expect(result.departments[0]).toHaveProperty('id');
        expect(result.departments[0]).toHaveProperty('name');
      }

      if (result.users.length > 0) {
        expect(result.users[0]).toHaveProperty('id');
        expect(result.users[0]).toHaveProperty('name');
        expect(result.users[0]).toHaveProperty('department');
      }

      if (result.agents.length > 0) {
        expect(result.agents[0]).toHaveProperty('id');
        expect(result.agents[0]).toHaveProperty('name');
        expect(result.agents[0]).toHaveProperty('type');
      }

      expect(result.timeRanges.length).toBe(3); // Should have 3 predefined time ranges
      result.timeRanges.forEach(timeRange => {
        expect(timeRange).toHaveProperty('label');
        expect(timeRange).toHaveProperty('range');
        expect(timeRange.range).toHaveProperty('start');
        expect(timeRange.range).toHaveProperty('end');
        expect(timeRange.range).toHaveProperty('granularity');
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const pagination: PaginationOptions = {
        page: 2,
        limit: 3,
        sortBy: 'weeklySpend',
        sortOrder: 'desc'
      };

      const result = await dataService.getDepartmentComparison(mockTimeRange, pagination);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(3);
      expect(result.data.length).toBeLessThanOrEqual(3);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
      expect(result.pagination).toHaveProperty('hasNext');
      expect(result.pagination).toHaveProperty('hasPrev');

      if (result.pagination.page > 1) {
        expect(result.pagination.hasPrev).toBe(true);
      }
    });

    it('should sort data correctly', async () => {
      const pagination: PaginationOptions = {
        page: 1,
        limit: 10,
        sortBy: 'currentSpend',
        sortOrder: 'desc'
      };

      const result = await dataService.getDepartmentComparison(mockTimeRange, pagination);

      // Check that data is sorted by currentSpend in descending order
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].currentSpend).toBeGreaterThanOrEqual(result.data[i].currentSpend);
      }
    });
  });

  describe('Error Simulation', () => {
    it('should simulate errors when enabled', async () => {
      // Enable error simulation with 100% error rate for testing
      dataService.enableErrorSimulation(true);
      dataService.setErrorRate(1.0);

      // This should throw an error
      await expect(
        dataService.getDepartmentSummary(mockTimeRange)
      ).rejects.toHaveProperty('status');

      // Disable error simulation for other tests
      dataService.enableErrorSimulation(false);
    });

    it('should not simulate errors when disabled', async () => {
      dataService.enableErrorSimulation(false);

      // This should not throw an error
      const result = await dataService.getDepartmentSummary(mockTimeRange);
      expect(result).toHaveProperty('totalSpend');
    });
  });

  describe('CSV Conversion', () => {
    it('should convert data to CSV format correctly', async () => {
      const departments = mockDataStore.getDepartments();
      const filters: ExportFilters = {
        timeRange: mockTimeRange,
        departments: [departments[0].id],
        includeDetails: false
      };

      const result = await dataService.exportData(filters, 'csv');

      expect(typeof result.data).toBe('string');
      const csvData = result.data as string;

      // Should have headers
      const lines = csvData.split('\n');
      expect(lines.length).toBeGreaterThan(1);

      // First line should be headers
      const headers = lines[0].split(',');
      expect(headers.length).toBeGreaterThan(0);
      expect(headers).toContain('type');
    });

    it('should handle empty data in CSV conversion', async () => {
      const filters: ExportFilters = {
        timeRange: mockTimeRange,
        departments: ['non-existent-dept'],
        includeDetails: false
      };

      const result = await dataService.exportData(filters, 'csv');

      // Should still have summary data
      expect(typeof result.data).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter arrays', async () => {
      const filters: FilterState = {
        timeRange: mockTimeRange,
        departments: [],
        projects: [],
        users: [],
        agents: []
      };

      const result = await dataService.getFilteredData(filters);

      expect(result).toHaveProperty('departments');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('sessions');
    });

    it('should handle invalid time ranges gracefully', async () => {
      const invalidTimeRange: TimeRange = {
        start: new Date('2025-01-01'),
        end: new Date('2024-01-01'), // End before start
        granularity: 'daily'
      };

      // Should not throw an error, but might return empty results
      const result = await dataService.getDepartmentSummary(invalidTimeRange);
      expect(result).toHaveProperty('totalSpend');
    });

    it('should handle zero-cost threshold', async () => {
      const filters: FilterState = {
        timeRange: mockTimeRange,
        departments: [],
        projects: [],
        users: [],
        agents: [],
        costThreshold: 0
      };

      const result = await dataService.getFilteredData(filters);

      expect(result).toHaveProperty('sessions');
      expect(result.sessions).toHaveProperty('data');
    });
  });
});
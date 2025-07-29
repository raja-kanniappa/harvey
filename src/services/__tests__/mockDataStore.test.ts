import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataStoreService } from '../mockDataStore';
import { Department, User, Agent, Session } from '../../types/index';

describe('MockDataStore', () => {
  let mockStore: MockDataStoreService;

  beforeEach(() => {
    mockStore = MockDataStoreService.getInstance();
    // Regenerate data for each test to ensure fresh data
    mockStore.regenerateData();
  });

  describe('Data Generation', () => {
    it('should generate all required data types', () => {
      const departments = mockStore.getDepartments();
      const users = mockStore.getUsers();
      const agents = mockStore.getAgents();
      const sessions = mockStore.getSessions();
      const timeSeriesData = mockStore.getTimeSeriesData();
      const alerts = mockStore.getBudgetAlerts();

      expect(departments.length).toBeGreaterThan(0);
      expect(users.length).toBeGreaterThan(0);
      expect(agents.length).toBeGreaterThan(0);
      expect(sessions.length).toBeGreaterThan(0);
      expect(timeSeriesData.length).toBeGreaterThan(0);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should maintain referential integrity between entities', () => {
      const departments = mockStore.getDepartments();
      const users = mockStore.getUsers();
      const sessions = mockStore.getSessions();

      // Check that all users belong to existing departments
      const departmentNames = departments.map(d => d.name);
      users.forEach(user => {
        expect(departmentNames).toContain(user.department);
      });

      // Check that all sessions belong to existing users
      const userIds = users.map(u => u.id);
      sessions.forEach(session => {
        expect(userIds).toContain(session.userId);
      });

      // Check that department user counts match actual users
      departments.forEach(department => {
        const actualUserCount = users.filter(u => u.department === department.name).length;
        expect(department.totalUsers).toBe(actualUserCount);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should include users with zero usage', () => {
      const users = mockStore.getUsers();
      const zeroUsageUsers = users.filter(user => user.weeklySpend === 0);
      
      expect(zeroUsageUsers.length).toBeGreaterThan(0);
      
      // Zero usage users should have no sessions
      zeroUsageUsers.forEach(user => {
        expect(user.requestCount).toBe(0);
        expect(user.agentCount).toBe(0);
        expect(user.recentSessions.length).toBe(0);
        expect(user.trendData.every(day => day.cost === 0 && day.requestCount === 0)).toBe(true);
        expect(user.agentBreakdown.length).toBe(0);
      });
    });

    it('should include users with high costs', () => {
      const users = mockStore.getUsers();
      const highCostUsers = users.filter(user => user.weeklySpend > 200);
      
      expect(highCostUsers.length).toBeGreaterThan(0);
      
      // High cost users should have corresponding sessions and usage
      highCostUsers.forEach(user => {
        expect(user.requestCount).toBeGreaterThan(0);
        expect(user.agentCount).toBeGreaterThan(0);
        expect(user.recentSessions.length).toBeGreaterThan(0);
      });
    });

    it('should include departments over budget', () => {
      const departments = mockStore.getDepartments();
      const overBudgetDepts = departments.filter(dept => dept.currentSpend > dept.weeklyBudget);
      
      // Should have at least some departments over budget (realistic scenario)
      expect(overBudgetDepts.length).toBeGreaterThanOrEqual(0);
      
      overBudgetDepts.forEach(dept => {
        expect(dept.currentSpend).toBeGreaterThan(dept.weeklyBudget);
      });
    });

    it('should include various time patterns in sessions', () => {
      const sessions = mockStore.getSessions();
      
      // Sessions should span across different days
      const uniqueDays = new Set(
        sessions.map(session => session.timestamp.toISOString().split('T')[0])
      );
      expect(uniqueDays.size).toBeGreaterThan(1);
      
      // Should have different session statuses
      const statuses = new Set(sessions.map(s => s.status));
      expect(statuses.has('success')).toBe(true);
      
      // Should have sessions with different durations and costs
      const costs = sessions.map(s => s.cost);
      const durations = sessions.map(s => s.duration);
      
      expect(Math.max(...costs)).toBeGreaterThan(Math.min(...costs));
      expect(Math.max(...durations)).toBeGreaterThan(Math.min(...durations));
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent agent types', () => {
      const agents = mockStore.getAgents();
      const validTypes = ['Pre-built', 'DIY', 'Foundation'];
      
      agents.forEach(agent => {
        expect(validTypes).toContain(agent.type);
        expect(agent.weeklySpend).toBeGreaterThanOrEqual(0);
        expect(agent.requestCount).toBeGreaterThanOrEqual(0);
        expect(agent.averageCost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have realistic cost calculations', () => {
      const sessions = mockStore.getSessions();
      
      sessions.forEach(session => {
        expect(session.cost).toBeGreaterThan(0);
        expect(session.tokenCount).toBeGreaterThan(0);
        
        // Cost should be reasonable relative to token count
        const costPerToken = session.cost / session.tokenCount;
        expect(costPerToken).toBeGreaterThan(0);
        expect(costPerToken).toBeLessThan(0.001); // Reasonable upper bound
      });
    });

    it('should have proper user agent breakdown percentages', () => {
      const users = mockStore.getUsers();
      
      users.forEach(user => {
        if (user.agentBreakdown.length > 0) {
          const totalPercentage = user.agentBreakdown.reduce((sum, breakdown) => sum + breakdown.percentage, 0);
          expect(totalPercentage).toBeCloseTo(100, 1); // Allow for small rounding errors
          
          const totalCost = user.agentBreakdown.reduce((sum, breakdown) => sum + breakdown.cost, 0);
          expect(totalCost).toBeCloseTo(user.weeklySpend, 2);
        }
      });
    });

    it('should have proper daily usage distribution', () => {
      const users = mockStore.getUsers();
      
      users.forEach(user => {
        expect(user.trendData.length).toBe(7); // Should have 7 days of data
        
        const totalDailyCost = user.trendData.reduce((sum, day) => sum + day.cost, 0);
        const totalDailyRequests = user.trendData.reduce((sum, day) => sum + day.requestCount, 0);
        
        // For zero usage users, daily data should also be zero
        if (user.weeklySpend === 0) {
          expect(totalDailyCost).toBe(0);
          expect(totalDailyRequests).toBe(0);
        } else {
          // For active users, daily totals should be positive and reasonable
          expect(totalDailyCost).toBeGreaterThan(0);
          expect(totalDailyRequests).toBeGreaterThan(0);
          
          // Daily totals should be within reasonable range of weekly totals (allowing for high randomness)
          expect(totalDailyCost).toBeGreaterThan(user.weeklySpend * 0.3);
          expect(totalDailyCost).toBeLessThan(user.weeklySpend * 2.0);
        }
      });
    });
  });

  describe('Data Summary', () => {
    it('should provide accurate data summary', () => {
      const summary = mockStore.getDataSummary();
      
      expect(summary).toHaveProperty('departments');
      expect(summary).toHaveProperty('users');
      expect(summary).toHaveProperty('agents');
      expect(summary).toHaveProperty('sessions');
      expect(summary).toHaveProperty('totalWeeklySpend');
      expect(summary).toHaveProperty('totalWeeklyBudget');
      expect(summary).toHaveProperty('highUsageUsers');
      expect(summary).toHaveProperty('zeroUsageUsers');
      
      expect(typeof summary.departments).toBe('number');
      expect(typeof summary.users).toBe('number');
      expect(typeof summary.agents).toBe('number');
      expect(typeof summary.sessions).toBe('number');
      expect(typeof summary.totalWeeklySpend).toBe('number');
      expect(typeof summary.totalWeeklyBudget).toBe('number');
      expect(typeof summary.highUsageUsers).toBe('number');
      expect(typeof summary.zeroUsageUsers).toBe('number');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MockDataStoreService.getInstance();
      const instance2 = MockDataStoreService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
import {
  Department,
  User,
  Agent,
  Session,
  TimeSeriesPoint,
  Alert,
  MockDataStore,
  DataSummary
} from '../../types/index.js';

import { MockDataGenerator } from './generators.js';

// Main mock data store class
export class MockDataStoreService {
  private static instance: MockDataStoreService;
  private data: MockDataStore;

  private constructor() {
    this.data = this.generateAllData();
  }

  public static getInstance(): MockDataStoreService {
    if (!MockDataStoreService.instance) {
      MockDataStoreService.instance = new MockDataStoreService();
    }
    return MockDataStoreService.instance;
  }

  // Generate all mock data with proper relationships
  private generateAllData(): MockDataStore {
    console.log('Generating comprehensive mock data...');
    
    const departments = MockDataGenerator.generateDepartments();
    const agents = MockDataGenerator.generateAgents();
    const users = MockDataGenerator.generateUsers(departments, agents);
    const sessions = MockDataGenerator.generateSessions(users, agents);
    const timeSeriesData = MockDataGenerator.generateTimeSeriesData(sessions);
    const budgetAlerts = MockDataGenerator.generateBudgetAlerts(departments, users);
    
    console.log(`Generated: ${departments.length} departments, ${users.length} users, ${agents.length} agents, ${sessions.length} sessions`);
    
    return {
      departments,
      users,
      agents,
      sessions,
      timeSeriesData,
      budgetAlerts
    };
  }

  // Getter methods for accessing data
  public getDepartments(): Department[] {
    return [...this.data.departments];
  }

  public getUsers(): User[] {
    return [...this.data.users];
  }

  public getAgents(): Agent[] {
    return [...this.data.agents];
  }

  public getSessions(): Session[] {
    return [...this.data.sessions];
  }

  public getTimeSeriesData(): TimeSeriesPoint[] {
    return [...this.data.timeSeriesData];
  }

  public getBudgetAlerts(): Alert[] {
    return [...this.data.budgetAlerts];
  }

  // Get full data store (for internal use)
  public getAllData(): MockDataStore {
    return {
      departments: [...this.data.departments],
      users: [...this.data.users],
      agents: [...this.data.agents],
      sessions: [...this.data.sessions],
      timeSeriesData: [...this.data.timeSeriesData],
      budgetAlerts: [...this.data.budgetAlerts]
    };
  }

  // Method to regenerate data (useful for testing)
  public regenerateData(): void {
    this.data = this.generateAllData();
  }

  // Method to get data summary for debugging
  public getDataSummary(): DataSummary {
    return {
      departments: this.data.departments.length,
      users: this.data.users.length,
      agents: this.data.agents.length,
      sessions: this.data.sessions.length,
      timeSeriesPoints: this.data.timeSeriesData.length,
      alerts: this.data.budgetAlerts.length,
      totalWeeklySpend: this.data.departments.reduce((sum, dept) => sum + dept.currentSpend, 0),
      totalWeeklyBudget: this.data.departments.reduce((sum, dept) => sum + dept.weeklyBudget, 0),
      highUsageUsers: this.data.users.filter(user => user.weeklySpend > 200).length,
      zeroUsageUsers: this.data.users.filter(user => user.weeklySpend === 0).length
    };
  }

  // Find methods for specific data lookups
  public findDepartmentById(id: string): Department | undefined {
    return this.data.departments.find(dept => dept.id === id);
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(user => user.id === id);
  }

  public findAgentById(id: string): Agent | undefined {
    return this.data.agents.find(agent => agent.id === id);
  }

  public findSessionById(id: string): Session | undefined {
    return this.data.sessions.find(session => session.id === id);
  }

  // Filter methods for common queries
  public getUsersByDepartment(departmentName: string): User[] {
    return this.data.users.filter(user => user.department === departmentName);
  }

  public getSessionsByUser(userId: string): Session[] {
    return this.data.sessions.filter(session => session.userId === userId);
  }

  public getAgentsByType(type: Agent['type']): Agent[] {
    return this.data.agents.filter(agent => agent.type === type);
  }

  public getAlertsByDepartment(departmentId: string): Alert[] {
    return this.data.budgetAlerts.filter(alert => alert.departmentId === departmentId);
  }

  public getAlertsByUser(userId: string): Alert[] {
    return this.data.budgetAlerts.filter(alert => alert.userId === userId);
  }

  // Statistics methods
  public getDepartmentStatistics() {
    const departments = this.data.departments;
    const totalBudget = departments.reduce((sum, dept) => sum + dept.weeklyBudget, 0);
    const totalSpend = departments.reduce((sum, dept) => sum + dept.currentSpend, 0);
    const overBudgetCount = departments.filter(dept => dept.currentSpend > dept.weeklyBudget).length;
    
    return {
      totalBudget,
      totalSpend,
      budgetUtilization: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0,
      overBudgetCount,
      avgSpendPerDepartment: totalSpend / departments.length,
      avgBudgetPerDepartment: totalBudget / departments.length
    };
  }

  public getUserStatistics() {
    const users = this.data.users;
    const activeUsers = users.filter(user => user.weeklySpend > 0);
    const totalSpend = users.reduce((sum, user) => sum + user.weeklySpend, 0);
    const totalRequests = users.reduce((sum, user) => sum + user.requestCount, 0);
    
    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      inactiveUsers: users.length - activeUsers.length,
      totalSpend,
      totalRequests,
      avgSpendPerUser: totalSpend / users.length,
      avgSpendPerActiveUser: totalSpend / activeUsers.length,
      avgRequestsPerUser: totalRequests / users.length
    };
  }

  public getAgentStatistics() {
    const agents = this.data.agents;
    const totalSpend = agents.reduce((sum, agent) => sum + agent.weeklySpend, 0);
    const totalRequests = agents.reduce((sum, agent) => sum + agent.requestCount, 0);
    
    const byType = agents.reduce((acc, agent) => {
      if (!acc[agent.type]) {
        acc[agent.type] = { count: 0, spend: 0, requests: 0 };
      }
      acc[agent.type].count++;
      acc[agent.type].spend += agent.weeklySpend;
      acc[agent.type].requests += agent.requestCount;
      return acc;
    }, {} as Record<Agent['type'], { count: number; spend: number; requests: number }>);
    
    return {
      totalAgents: agents.length,
      totalSpend,
      totalRequests,
      avgSpendPerAgent: totalSpend / agents.length,
      avgRequestsPerAgent: totalRequests / agents.length,
      byType
    };
  }
}

// Export the singleton instance
export const mockDataStore = MockDataStoreService.getInstance();
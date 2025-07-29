// Static fixtures and constants for testing and development
import { Agent, Department, User, Session, TimeSeriesPoint, Alert } from '../../types/index.js';

// Fixed test data for consistent testing
export const testDepartments: Department[] = [
  {
    id: 'dept-test-1',
    name: 'Test Engineering',
    weeklyBudget: 500,
    currentSpend: 450,
    projectedSpend: 475,
    weekOverWeekChange: 12.5,
    activeUsers: 8,
    totalUsers: 10,
    costPerUser: 56.25,
    projects: [
      {
        id: 'dept-test-1-proj-1',
        name: 'Test Project Alpha',
        departmentId: 'dept-test-1',
        weeklySpend: 200,
        userCount: 4,
        agentCount: 3
      },
      {
        id: 'dept-test-1-proj-2',
        name: 'Test Project Beta',
        departmentId: 'dept-test-1',
        weeklySpend: 250,
        userCount: 6,
        agentCount: 2
      }
    ]
  },
  {
    id: 'dept-test-2',
    name: 'Test Product',
    weeklyBudget: 300,
    currentSpend: 350,
    projectedSpend: 380,
    weekOverWeekChange: -5.2,
    activeUsers: 5,
    totalUsers: 7,
    costPerUser: 70,
    projects: [
      {
        id: 'dept-test-2-proj-1',
        name: 'Test Product Suite',
        departmentId: 'dept-test-2',
        weeklySpend: 350,
        userCount: 5,
        agentCount: 4
      }
    ]
  }
];

export const testAgents: Agent[] = [
  {
    id: 'agent-test-1',
    name: 'Foundational Models',
    type: 'Pre-built',
    weeklySpend: 150,
    requestCount: 500,
    averageCost: 0.3,
    popularityRank: 1
  },
  {
    id: 'agent-test-2',
    name: 'Scoping',
    type: 'Pre-built',
    weeklySpend: 80,
    requestCount: 800,
    averageCost: 0.1,
    popularityRank: 2
  },
  {
    id: 'agent-test-3',
    name: 'Message Labs',
    type: 'DIY',
    weeklySpend: 40,
    requestCount: 1200,
    averageCost: 0.033,
    popularityRank: 3
  }
];

export const testUsers: User[] = [
  {
    id: 'user-test-1',
    email: 'john.doe@test.com',
    name: 'John Doe',
    department: 'Test Engineering',
    role: 'Software Engineer',
    weeklySpend: 85,
    requestCount: 120,
    agentCount: 3,
    trendData: [
      { date: new Date('2024-01-01'), cost: 10, requestCount: 15 },
      { date: new Date('2024-01-02'), cost: 12, requestCount: 18 },
      { date: new Date('2024-01-03'), cost: 15, requestCount: 22 },
      { date: new Date('2024-01-04'), cost: 18, requestCount: 25 },
      { date: new Date('2024-01-05'), cost: 13, requestCount: 20 },
      { date: new Date('2024-01-06'), cost: 9, requestCount: 12 },
      { date: new Date('2024-01-07'), cost: 8, requestCount: 8 }
    ],
    agentBreakdown: [
      { agentId: 'agent-test-1', agentName: 'Foundational Models', cost: 45, requestCount: 60, percentage: 52.9 },
      { agentId: 'agent-test-2', agentName: 'Scoping', cost: 25, requestCount: 35, percentage: 29.4 },
      { agentId: 'agent-test-3', agentName: 'Message Labs', cost: 15, requestCount: 25, percentage: 17.6 }
    ],
    recentSessions: []
  },
  {
    id: 'user-test-2',
    email: 'jane.smith@test.com',
    name: 'Jane Smith',
    department: 'Test Product',
    role: 'Product Manager',
    weeklySpend: 120,
    requestCount: 80,
    agentCount: 2,
    trendData: [
      { date: new Date('2024-01-01'), cost: 15, requestCount: 10 },
      { date: new Date('2024-01-02'), cost: 20, requestCount: 12 },
      { date: new Date('2024-01-03'), cost: 18, requestCount: 11 },
      { date: new Date('2024-01-04'), cost: 22, requestCount: 15 },
      { date: new Date('2024-01-05'), cost: 25, requestCount: 18 },
      { date: new Date('2024-01-06'), cost: 12, requestCount: 8 },
      { date: new Date('2024-01-07'), cost: 8, requestCount: 6 }
    ],
    agentBreakdown: [
      { agentId: 'agent-test-1', agentName: 'Foundational Models', cost: 80, requestCount: 50, percentage: 66.7 },
      { agentId: 'agent-test-2', agentName: 'Scoping', cost: 40, requestCount: 30, percentage: 33.3 }
    ],
    recentSessions: []
  },
  {
    id: 'user-test-3',
    email: 'zero.usage@test.com',
    name: 'Zero Usage',
    department: 'Test Engineering',
    role: 'Software Engineer',
    weeklySpend: 0,
    requestCount: 0,
    agentCount: 0,
    trendData: [
      { date: new Date('2024-01-01'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-02'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-03'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-04'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-05'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-06'), cost: 0, requestCount: 0 },
      { date: new Date('2024-01-07'), cost: 0, requestCount: 0 }
    ],
    agentBreakdown: [],
    recentSessions: []
  }
];

export const testSessions: Session[] = [
  {
    id: 'session-test-1',
    timestamp: new Date('2024-01-07T10:30:00'),
    userId: 'user-test-1',
    agentName: 'Foundational Models',
    cost: 2.5,
    tokenCount: 1500,
    duration: 45,
    status: 'success'
  },
  {
    id: 'session-test-2',
    timestamp: new Date('2024-01-07T11:15:00'),
    userId: 'user-test-1',
    agentName: 'Scoping',
    cost: 1.2,
    tokenCount: 800,
    duration: 30,
    status: 'success'
  },
  {
    id: 'session-test-3',
    timestamp: new Date('2024-01-07T14:20:00'),
    userId: 'user-test-2',
    agentName: 'Foundational Models',
    cost: 3.8,
    tokenCount: 2200,
    duration: 60,
    status: 'error'
  },
  {
    id: 'session-test-4',
    timestamp: new Date('2024-01-06T16:45:00'),
    userId: 'user-test-2',
    agentName: 'Message Labs',
    cost: 0.9,
    tokenCount: 600,
    duration: 15,
    status: 'timeout'
  }
];

export const testTimeSeriesData: TimeSeriesPoint[] = [
  {
    timestamp: new Date('2024-01-01'),
    cost: 25,
    requestCount: 25,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-02'),
    cost: 32,
    requestCount: 30,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-03'),
    cost: 33,
    requestCount: 33,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-04'),
    cost: 40,
    requestCount: 40,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-05'),
    cost: 38,
    requestCount: 38,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-06'),
    cost: 21,
    requestCount: 20,
    userCount: 2
  },
  {
    timestamp: new Date('2024-01-07'),
    cost: 16,
    requestCount: 14,
    userCount: 2
  }
];

export const testAlerts: Alert[] = [
  {
    id: 'alert-test-1',
    type: 'budget',
    severity: 'high',
    message: 'Test Product has exceeded weekly budget by 16.7%',
    departmentId: 'dept-test-2',
    timestamp: new Date('2024-01-07T09:00:00')
  },
  {
    id: 'alert-test-2',
    type: 'budget',
    severity: 'medium',
    message: 'Test Engineering is at 90.0% of weekly budget',
    departmentId: 'dept-test-1',
    timestamp: new Date('2024-01-06T15:30:00')
  },
  {
    id: 'alert-test-3',
    type: 'usage',
    severity: 'medium',
    message: 'Jane Smith has high weekly usage: $120.00',
    userId: 'user-test-2',
    timestamp: new Date('2024-01-05T12:00:00')
  }
];

// Export combined test data
export const testFixtures = {
  departments: testDepartments,
  users: testUsers,
  agents: testAgents,
  sessions: testSessions,
  timeSeriesData: testTimeSeriesData,
  budgetAlerts: testAlerts
};

// Helper function to create a minimal mock data store for testing
export function createTestDataStore() {
  return {
    departments: testDepartments,
    users: testUsers,
    agents: testAgents,
    sessions: testSessions,
    timeSeriesData: testTimeSeriesData,
    budgetAlerts: testAlerts
  };
}
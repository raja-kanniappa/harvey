import {
  Department,
  User,
  Agent,
  Session,
  TimeSeriesPoint,
  Alert,
  MockDataStore,
  DailyUsage,
  AgentUsage,
  Project,
  DataSummary
} from '../types/index.js';

// Utility functions for generating realistic data
class MockDataGenerator {
  private static readonly DEPARTMENT_NAMES = [
    'Engineering',
    'Product',
    'Marketing',
    'Sales',
    'Customer Success',
    'Data Science',
    'Design',
    'Operations'
  ];

  private static readonly AGENT_NAMES = {
    'Pre-built': [
      'GPT-4 Turbo',
      'Claude 3.5 Sonnet',
      'Gemini Pro',
      'GPT-3.5 Turbo',
      'Claude 3 Haiku'
    ],
    'DIY': [
      'Custom Code Assistant',
      'Internal Q&A Bot',
      'Document Analyzer',
      'Meeting Summarizer',
      'Email Composer'
    ],
    'Foundation': [
      'Llama 2 70B',
      'Mistral 7B',
      'Code Llama',
      'Falcon 40B',
      'Vicuna 13B'
    ]
  };

  private static readonly USER_ROLES = [
    'Software Engineer',
    'Senior Engineer',
    'Engineering Manager',
    'Product Manager',
    'Designer',
    'Data Scientist',
    'Marketing Manager',
    'Sales Representative',
    'Customer Success Manager'
  ];

  // Generate random number within range
  private static randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Generate random integer within range
  private static randomIntBetween(min: number, max: number): number {
    return Math.floor(this.randomBetween(min, max + 1));
  }

  // Generate random date within last N days
  private static randomDateWithinDays(days: number): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime()));
  }

  // Generate realistic cost based on agent type and usage
  private static generateRealisticCost(agentType: Agent['type'], tokenCount: number): number {
    const baseCostPerToken = {
      'Pre-built': 0.00003, // Higher cost for premium models
      'DIY': 0.00001,       // Medium cost for custom models
      'Foundation': 0.000005 // Lower cost for open source models
    };
    
    const cost = tokenCount * baseCostPerToken[agentType];
    // Add some randomness (±20%)
    return cost * this.randomBetween(0.8, 1.2);
  }

  // Generate departments with realistic budgets and spending
  static generateDepartments(): Department[] {
    return this.DEPARTMENT_NAMES.map((name, index) => {
      const weeklyBudget = this.randomBetween(200, 1000);
      const currentSpend = this.randomBetween(50, weeklyBudget * 1.2); // Some departments over budget
      const projectedSpend = currentSpend * this.randomBetween(1.0, 1.3);
      const weekOverWeekChange = this.randomBetween(-30, 50);
      const totalUsers = this.randomIntBetween(5, 25);
      const activeUsers = Math.min(totalUsers, this.randomIntBetween(3, totalUsers));

      return {
        id: `dept-${index + 1}`,
        name,
        weeklyBudget,
        currentSpend,
        projectedSpend,
        weekOverWeekChange,
        activeUsers,
        totalUsers,
        costPerUser: currentSpend / Math.max(activeUsers, 1),
        projects: this.generateProjectsForDepartment(`dept-${index + 1}`, name)
      };
    });
  }

  // Generate projects for a department
  private static generateProjectsForDepartment(departmentId: string, departmentName: string): Project[] {
    const projectCount = this.randomIntBetween(2, 5);
    const projects: Project[] = [];

    for (let i = 0; i < projectCount; i++) {
      projects.push({
        id: `${departmentId}-proj-${i + 1}`,
        name: `${departmentName} Project ${i + 1}`,
        departmentId,
        weeklySpend: this.randomBetween(20, 200),
        userCount: this.randomIntBetween(2, 8),
        agentCount: this.randomIntBetween(1, 5)
      });
    }

    return projects;
  }

  // Generate agents with realistic usage patterns
  static generateAgents(): Agent[] {
    const agents: Agent[] = [];
    let rankCounter = 1;

    Object.entries(this.AGENT_NAMES).forEach(([type, names]) => {
      names.forEach((name, index) => {
        const requestCount = this.randomIntBetween(50, 2000);
        const averageCost = this.generateRealisticCost(type as Agent['type'], 1000);
        const weeklySpend = requestCount * averageCost;

        agents.push({
          id: `agent-${type.toLowerCase()}-${index + 1}`,
          name,
          type: type as Agent['type'],
          weeklySpend,
          requestCount,
          averageCost,
          popularityRank: rankCounter++
        });
      });
    });

    // Sort by weekly spend to set realistic popularity ranks
    agents.sort((a, b) => b.weeklySpend - a.weeklySpend);
    agents.forEach((agent, index) => {
      agent.popularityRank = index + 1;
    });

    return agents;
  }

  // Generate users with realistic usage patterns
  static generateUsers(departments: Department[], agents: Agent[]): User[] {
    const users: User[] = [];
    let userCounter = 1;

    departments.forEach(department => {
      const userCount = department.totalUsers;
      
      for (let i = 0; i < userCount; i++) {
        const firstName = this.generateFirstName();
        const lastName = this.generateLastName();
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
        
        // Generate realistic usage - some users are heavy users, others light
        const usageProfile = this.randomBetween(0, 1);
        let weeklySpend: number;
        let requestCount: number;
        
        if (usageProfile < 0.1) {
          // 10% are zero usage users (edge case)
          weeklySpend = 0;
          requestCount = 0;
        } else if (usageProfile < 0.3) {
          // 20% are light users
          weeklySpend = this.randomBetween(1, 20);
          requestCount = this.randomIntBetween(1, 50);
        } else if (usageProfile < 0.8) {
          // 50% are moderate users
          weeklySpend = this.randomBetween(20, 100);
          requestCount = this.randomIntBetween(50, 300);
        } else {
          // 20% are heavy users (including some with very high costs - edge case)
          weeklySpend = this.randomBetween(100, 500);
          requestCount = this.randomIntBetween(300, 1500);
        }

        const user: User = {
          id: `user-${userCounter++}`,
          email,
          name: `${firstName} ${lastName}`,
          department: department.name,
          role: this.USER_ROLES[this.randomIntBetween(0, this.USER_ROLES.length - 1)],
          weeklySpend,
          requestCount,
          agentCount: weeklySpend > 0 ? this.randomIntBetween(1, 5) : 0,
          trendData: this.generateDailyUsageForUser(weeklySpend, requestCount),
          agentBreakdown: this.generateAgentBreakdownForUser(agents, weeklySpend),
          recentSessions: [] // Will be populated when generating sessions
        };

        users.push(user);
      }
    });

    return users;
  }

  // Generate daily usage trends for a user
  private static generateDailyUsageForUser(weeklySpend: number, weeklyRequests: number): DailyUsage[] {
    const dailyData: DailyUsage[] = [];
    const today = new Date();
    
    if (weeklySpend === 0) {
      // Zero usage users get zero for all days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        dailyData.push({
          date,
          cost: 0,
          requestCount: 0
        });
      }
    } else {
      // For active users, distribute usage across days ensuring total matches weekly
      let remainingCost = weeklySpend;
      let remainingRequests = weeklyRequests;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const isLastDay = i === 0;
        
        if (isLastDay) {
          // Last day gets all remaining usage
          dailyData.push({
            date,
            cost: remainingCost,
            requestCount: remainingRequests
          });
        } else {
          // Distribute with randomness but ensure some usage each day
          const maxCostForDay = remainingCost * 0.4; // Max 40% on any single day
          const minCostForDay = Math.min(remainingCost * 0.05, maxCostForDay); // Min 5% or max available
          const dailyCost = this.randomBetween(minCostForDay, maxCostForDay);
          
          const maxRequestsForDay = Math.round(remainingRequests * 0.4);
          const minRequestsForDay = Math.min(Math.round(remainingRequests * 0.05), maxRequestsForDay);
          const dailyRequests = this.randomIntBetween(minRequestsForDay, maxRequestsForDay);
          
          dailyData.push({
            date,
            cost: dailyCost,
            requestCount: dailyRequests
          });
          
          remainingCost -= dailyCost;
          remainingRequests -= dailyRequests;
          
          // Ensure we don't go negative
          remainingCost = Math.max(0, remainingCost);
          remainingRequests = Math.max(0, remainingRequests);
        }
      }
    }
    
    return dailyData;
  }

  // Generate agent breakdown for a user
  private static generateAgentBreakdownForUser(agents: Agent[], totalSpend: number): AgentUsage[] {
    if (totalSpend === 0) return [];
    
    const agentCount = this.randomIntBetween(1, Math.min(5, agents.length));
    const selectedAgents = agents
      .sort(() => 0.5 - Math.random())
      .slice(0, agentCount);
    
    const breakdown: AgentUsage[] = [];
    let remainingSpend = totalSpend;
    
    selectedAgents.forEach((agent, index) => {
      const isLast = index === selectedAgents.length - 1;
      const cost = isLast ? remainingSpend : remainingSpend * this.randomBetween(0.1, 0.6);
      const requestCount = Math.round(cost / agent.averageCost);
      
      breakdown.push({
        agentId: agent.id,
        agentName: agent.name,
        cost,
        requestCount,
        percentage: (cost / totalSpend) * 100
      });
      
      remainingSpend -= cost;
    });
    
    return breakdown.sort((a, b) => b.cost - a.cost);
  }

  // Generate sessions with realistic patterns
  static generateSessions(users: User[], agents: Agent[]): Session[] {
    const sessions: Session[] = [];
    let sessionCounter = 1;
    
    users.forEach(user => {
      if (user.weeklySpend === 0) return;
      
      const sessionCount = Math.max(1, Math.round(user.requestCount * this.randomBetween(0.8, 1.2)));
      
      for (let i = 0; i < sessionCount; i++) {
        const agent = agents[this.randomIntBetween(0, agents.length - 1)];
        const tokenCount = this.randomIntBetween(100, 5000);
        const cost = this.generateRealisticCost(agent.type, tokenCount);
        
        // Generate realistic status distribution
        let status: Session['status'] = 'success';
        const statusRand = Math.random();
        if (statusRand < 0.05) status = 'error';
        else if (statusRand < 0.08) status = 'timeout';
        
        const session: Session = {
          id: `session-${sessionCounter++}`,
          timestamp: this.randomDateWithinDays(7),
          userId: user.id,
          agentName: agent.name,
          cost,
          tokenCount,
          duration: this.randomIntBetween(1, 300), // 1-300 seconds
          status
        };
        
        sessions.push(session);
      }
    });
    
    // Sort sessions by timestamp (most recent first)
    sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Update users with their recent sessions
    users.forEach(user => {
      user.recentSessions = sessions
        .filter(session => session.userId === user.id)
        .slice(0, 10); // Keep only 10 most recent
    });
    
    return sessions;
  }

  // Generate time series data for trends
  static generateTimeSeriesData(sessions: Session[]): TimeSeriesPoint[] {
    const timeSeriesMap = new Map<string, TimeSeriesPoint>();
    
    // Group sessions by day
    sessions.forEach(session => {
      const dateKey = session.timestamp.toISOString().split('T')[0];
      
      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, {
          timestamp: new Date(dateKey),
          cost: 0,
          requestCount: 0,
          userCount: new Set<string>().size
        });
      }
      
      const point = timeSeriesMap.get(dateKey)!;
      point.cost += session.cost;
      point.requestCount += 1;
    });
    
    // Calculate unique users per day
    sessions.forEach(session => {
      const dateKey = session.timestamp.toISOString().split('T')[0];
      const point = timeSeriesMap.get(dateKey)!;
      
      if (!point.userCount) {
        const usersOnDay = new Set(
          sessions
            .filter(s => s.timestamp.toISOString().split('T')[0] === dateKey)
            .map(s => s.userId)
        );
        point.userCount = usersOnDay.size;
      }
    });
    
    return Array.from(timeSeriesMap.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Generate budget alerts
  static generateBudgetAlerts(departments: Department[], users: User[]): Alert[] {
    const alerts: Alert[] = [];
    let alertCounter = 1;
    
    // Department budget alerts
    departments.forEach(department => {
      const utilizationRate = department.currentSpend / department.weeklyBudget;
      
      if (utilizationRate > 1.0) {
        alerts.push({
          id: `alert-${alertCounter++}`,
          type: 'budget',
          severity: 'high',
          message: `${department.name} has exceeded weekly budget by ${((utilizationRate - 1) * 100).toFixed(1)}%`,
          departmentId: department.id,
          timestamp: this.randomDateWithinDays(1)
        });
      } else if (utilizationRate > 0.8) {
        alerts.push({
          id: `alert-${alertCounter++}`,
          type: 'budget',
          severity: 'medium',
          message: `${department.name} is at ${(utilizationRate * 100).toFixed(1)}% of weekly budget`,
          departmentId: department.id,
          timestamp: this.randomDateWithinDays(2)
        });
      }
    });
    
    // High usage user alerts
    users
      .filter(user => user.weeklySpend > 200)
      .forEach(user => {
        alerts.push({
          id: `alert-${alertCounter++}`,
          type: 'usage',
          severity: user.weeklySpend > 400 ? 'high' : 'medium',
          message: `${user.name} has high weekly usage: $${user.weeklySpend.toFixed(2)}`,
          userId: user.id,
          timestamp: this.randomDateWithinDays(1)
        });
      });
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Helper methods for generating names
  private static generateFirstName(): string {
    const names = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
      'Sarah', 'Michael', 'Emma', 'David', 'Jessica', 'James', 'Ashley', 'Robert',
      'Emily', 'John', 'Madison', 'William', 'Samantha', 'Christopher', 'Amanda', 'Daniel'
    ];
    return names[this.randomIntBetween(0, names.length - 1)];
  }

  private static generateLastName(): string {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
    ];
    return names[this.randomIntBetween(0, names.length - 1)];
  }
}

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
    console.log('Generating mock data...');
    
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
}

// Export the singleton instance
export const mockDataStore = MockDataStoreService.getInstance();
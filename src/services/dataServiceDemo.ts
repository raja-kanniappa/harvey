/**
 * Demo file showcasing DataService functionality
 * This file demonstrates how to use the DataService for various dashboard queries
 */

import { dataService } from './dataService.js';
import { TimeRange, SessionFilters, TrendFilters, ExportFilters, FilterState } from '../types/index.js';

// Helper function to create a time range for the last N days
function createTimeRange(days: number): TimeRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start,
    end,
    granularity: 'daily'
  };
}

/**
 * Demo function showcasing all DataService capabilities
 */
export async function runDataServiceDemo(): Promise<void> {
  console.log('🚀 DataService Demo Starting...\n');

  try {
    // 1. Health Check
    console.log('1. Health Check');
    const health = await dataService.healthCheck();
    console.log(`Status: ${health.status}`);
    console.log(`Data Summary:`, health.dataStats);
    console.log('');

    // 2. Get Filter Options
    console.log('2. Available Filter Options');
    const filterOptions = await dataService.getFilterOptions();
    console.log(`Departments: ${filterOptions.departments.length}`);
    console.log(`Users: ${filterOptions.users.length}`);
    console.log(`Agents: ${filterOptions.agents.length}`);
    console.log(`Time Ranges: ${filterOptions.timeRanges.map(tr => tr.label).join(', ')}`);
    console.log('');

    // 3. Department Summary
    console.log('3. Department Summary');
    const timeRange = createTimeRange(7); // Last 7 days
    const deptSummary = await dataService.getDepartmentSummary(timeRange);
    console.log(`Total Spend: $${deptSummary.totalSpend.toFixed(2)}`);
    console.log(`Total Budget: $${deptSummary.totalBudget.toFixed(2)}`);
    console.log(`Budget Utilization: ${deptSummary.budgetUtilization.toFixed(1)}%`);
    console.log(`Active Alerts: ${deptSummary.alertCount}`);
    console.log('');

    // 4. Department Comparison with Pagination
    console.log('4. Department Comparison (Top 3)');
    const deptComparison = await dataService.getDepartmentComparison(timeRange, {
      page: 1,
      limit: 3,
      sortBy: 'currentSpend',
      sortOrder: 'desc'
    });
    deptComparison.data.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name}: $${dept.currentSpend.toFixed(2)} (${dept.weekOverWeekChange.toFixed(1)}% change)`);
    });
    console.log('');

    // 5. Agent Leaderboard
    console.log('5. Top 5 Agents by Cost');
    const agentLeaderboard = await dataService.getAgentLeaderboard(timeRange, 5);
    agentLeaderboard.data.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} (${agent.type}): $${agent.weeklySpend.toFixed(2)} - ${agent.requestCount} requests`);
    });
    console.log('');

    // 6. User Details
    console.log('6. User Details Example');
    const firstUser = filterOptions.users[0];
    if (firstUser) {
      const userDetails = await dataService.getUserDetails(firstUser.id, timeRange);
      console.log(`User: ${userDetails.user.name} (${userDetails.user.department})`);
      console.log(`Weekly Spend: $${userDetails.user.weeklySpend.toFixed(2)}`);
      console.log(`Request Count: ${userDetails.user.requestCount}`);
      console.log(`Top Agents: ${userDetails.topAgents.slice(0, 3).map(a => a.agentName).join(', ')}`);
      console.log(`Recent Activity: ${userDetails.recentActivity.length} sessions`);
    }
    console.log('');

    // 7. Session Filtering
    console.log('7. Session Filtering Example');
    const sessionFilters: SessionFilters = {
      timeRange,
      status: 'success',
      minCost: 0.01,
      maxCost: 1.0
    };
    const sessions = await dataService.getRecentSessions(sessionFilters, {
      page: 1,
      limit: 5,
      sortBy: 'cost',
      sortOrder: 'desc'
    });
    console.log(`Found ${sessions.pagination.total} sessions matching criteria`);
    sessions.data.forEach((session, index) => {
      console.log(`${index + 1}. $${session.cost.toFixed(4)} - ${session.agentName} (${session.tokenCount} tokens)`);
    });
    console.log('');

    // 8. Usage Trends
    console.log('8. Usage Trends');
    const trendFilters: TrendFilters = {
      timeRange,
      granularity: 'daily'
    };
    const trends = await dataService.getUsageTrends(trendFilters);
    console.log(`Total Cost: $${trends.summary.totalCost.toFixed(2)}`);
    console.log(`Total Requests: ${trends.summary.totalRequests}`);
    console.log(`Average Cost per Request: $${trends.summary.averageCostPerRequest.toFixed(4)}`);
    console.log(`Peak Usage Date: ${trends.summary.peakUsageDate.toDateString()}`);
    console.log(`Data Points: ${trends.points.length}`);
    console.log('');

    // 9. Complex Filtering
    console.log('9. Complex Multi-Dimensional Filtering');
    const complexFilters: FilterState = {
      timeRange,
      departments: [filterOptions.departments[0]?.id].filter(Boolean),
      projects: [],
      users: [],
      agents: [filterOptions.agents[0]?.id].filter(Boolean),
      costThreshold: 0.01
    };
    const filteredData = await dataService.getFilteredData(complexFilters, {
      page: 1,
      limit: 3,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    console.log(`Filtered Results:`);
    console.log(`- Departments: ${filteredData.departments.pagination.total}`);
    console.log(`- Users: ${filteredData.users.pagination.total}`);
    console.log(`- Agents: ${filteredData.agents.pagination.total}`);
    console.log(`- Sessions: ${filteredData.sessions.pagination.total}`);
    console.log('');

    // 10. Export Functionality
    console.log('10. Export Functionality');
    const exportFilters: ExportFilters = {
      timeRange,
      departments: [filterOptions.departments[0]?.id].filter(Boolean),
      includeDetails: false
    };
    
    // Export as CSV
    const csvExport = await dataService.exportData(exportFilters, 'csv');
    console.log(`CSV Export: ${csvExport.filename} (${csvExport.size} bytes)`);
    
    // Export as JSON
    const jsonExport = await dataService.exportData(exportFilters, 'json');
    console.log(`JSON Export: ${jsonExport.filename} (${jsonExport.size} bytes)`);
    console.log('');

    // 11. Error Simulation Demo
    console.log('11. Error Simulation Demo');
    console.log('Enabling error simulation with 50% error rate...');
    dataService.enableErrorSimulation(true);
    dataService.setErrorRate(0.5);
    
    let errorCount = 0;
    let successCount = 0;
    
    // Try 10 requests to see error simulation in action
    for (let i = 0; i < 10; i++) {
      try {
        await dataService.healthCheck();
        successCount++;
      } catch (error: any) {
        errorCount++;
        console.log(`  Error ${errorCount}: ${error.status} - ${error.message}`);
      }
    }
    
    console.log(`Results: ${successCount} successful, ${errorCount} errors`);
    
    // Disable error simulation
    dataService.enableErrorSimulation(false);
    console.log('Error simulation disabled');
    console.log('');

    console.log('✅ DataService Demo Completed Successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export for use in other files
export { dataService };

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDataServiceDemo();
}
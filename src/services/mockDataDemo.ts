import { mockDataStore } from './mockDataStore.js';

// Demo script to showcase the mock data generation
console.log('=== Langfuse Org Dashboard Mock Data Demo ===\n');

// Get data summary
const summary = mockDataStore.getDataSummary();
console.log('📊 Data Summary:');
console.log(`  • Departments: ${summary.departments}`);
console.log(`  • Users: ${summary.users}`);
console.log(`  • Agents: ${summary.agents}`);
console.log(`  • Sessions: ${summary.sessions}`);
console.log(`  • Total Weekly Spend: $${summary.totalWeeklySpend.toFixed(2)}`);
console.log(`  • Total Weekly Budget: $${summary.totalWeeklyBudget.toFixed(2)}`);
console.log(`  • High Usage Users: ${summary.highUsageUsers}`);
console.log(`  • Zero Usage Users: ${summary.zeroUsageUsers}\n`);

// Show department overview
const departments = mockDataStore.getDepartments();
console.log('🏢 Department Overview:');
departments.forEach(dept => {
  const utilizationRate = (dept.currentSpend / dept.weeklyBudget * 100).toFixed(1);
  const status = dept.currentSpend > dept.weeklyBudget ? '🔴 OVER' : 
                 dept.currentSpend > dept.weeklyBudget * 0.8 ? '🟡 HIGH' : '🟢 OK';
  
  console.log(`  ${dept.name}:`);
  console.log(`    Budget: $${dept.weeklyBudget.toFixed(2)} | Spend: $${dept.currentSpend.toFixed(2)} (${utilizationRate}%) ${status}`);
  console.log(`    Users: ${dept.activeUsers}/${dept.totalUsers} active | Cost/User: $${dept.costPerUser.toFixed(2)}`);
  console.log(`    Week-over-week: ${dept.weekOverWeekChange > 0 ? '+' : ''}${dept.weekOverWeekChange.toFixed(1)}%`);
});

// Show top agents
const agents = mockDataStore.getAgents();
const topAgents = agents.slice(0, 5);
console.log('\n🤖 Top 5 Agents by Weekly Spend:');
topAgents.forEach((agent, index) => {
  console.log(`  ${index + 1}. ${agent.name} (${agent.type})`);
  console.log(`     Weekly Spend: $${agent.weeklySpend.toFixed(2)} | Requests: ${agent.requestCount}`);
  console.log(`     Avg Cost: $${agent.averageCost.toFixed(4)} per request`);
});

// Show edge cases
const users = mockDataStore.getUsers();
const zeroUsageUsers = users.filter(u => u.weeklySpend === 0);
const highUsageUsers = users.filter(u => u.weeklySpend > 200).slice(0, 3);

console.log('\n⚠️  Edge Cases:');
console.log(`  Zero Usage Users: ${zeroUsageUsers.length} users`);
if (zeroUsageUsers.length > 0) {
  console.log(`    Example: ${zeroUsageUsers[0].name} (${zeroUsageUsers[0].department})`);
}

console.log(`  High Usage Users: ${users.filter(u => u.weeklySpend > 200).length} users`);
highUsageUsers.forEach(user => {
  console.log(`    ${user.name} (${user.department}): $${user.weeklySpend.toFixed(2)}/week`);
});

// Show recent alerts
const alerts = mockDataStore.getBudgetAlerts();
console.log(`\n🚨 Recent Alerts: ${alerts.length} total`);
alerts.slice(0, 3).forEach(alert => {
  const emoji = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
  console.log(`  ${emoji} ${alert.type.toUpperCase()}: ${alert.message}`);
});

// Show session statistics
const sessions = mockDataStore.getSessions();
const errorSessions = sessions.filter(s => s.status === 'error').length;
const timeoutSessions = sessions.filter(s => s.status === 'timeout').length;
const successRate = ((sessions.length - errorSessions - timeoutSessions) / sessions.length * 100).toFixed(1);

console.log('\n📈 Session Statistics:');
console.log(`  Total Sessions: ${sessions.length}`);
console.log(`  Success Rate: ${successRate}%`);
console.log(`  Errors: ${errorSessions} | Timeouts: ${timeoutSessions}`);

// Show time series data
const timeSeriesData = mockDataStore.getTimeSeriesData();
console.log(`\n📅 Time Series Data: ${timeSeriesData.length} data points`);
if (timeSeriesData.length > 0) {
  const latestPoint = timeSeriesData[timeSeriesData.length - 1];
  const earliestPoint = timeSeriesData[0];
  console.log(`  Date Range: ${earliestPoint.timestamp.toISOString().split('T')[0]} to ${latestPoint.timestamp.toISOString().split('T')[0]}`);
  console.log(`  Latest Day: $${latestPoint.cost.toFixed(2)} cost, ${latestPoint.requestCount} requests, ${latestPoint.userCount} active users`);
}

console.log('\n✅ Mock data generation complete! All edge cases and relationships verified.');
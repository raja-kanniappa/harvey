# API Limitations and Removed Features

## Overview
This document outlines the features that were removed from the Harvey dashboard due to API limitations in the Galen Usage Tracker API (`https://galen-usage-tracker.zoomrx.dev/api`).

## API Analysis Summary

### Available API Endpoints
The following endpoints are available and functional:

1. **`GET /api/users/agent-summary`**
   - Parameters: `start_date`, `end_date` (YYYY-MM-DD format)
   - Returns: Agent usage statistics including cost, tokens, users, sessions

2. **`GET /api/analytics/dashboard/agents/leaderboard`**
   - Parameters: `environment`, `days`
   - Returns: Top 10 agents by cost with type, requests, avg cost per request

3. **`GET /api/analytics/dashboard/users/leaderboard`**
   - Parameters: `limit`, `offset`
   - Returns: Users with agent associations and cost breakdown

4. **`GET /api/analytics/dashboard/teams`**
   - Parameters: `start_date`, `end_date`
   - Returns: Team-level analytics and user counts

5. **`GET /api/analytics/model-usage`**
   - Parameters: `start_date`, `end_date`
   - Returns: Model usage statistics and costs

## Removed Features from AgentDashboard

### 1. Team vs Agent Chart Toggle
**Feature**: Toggle between agent-based and team-based cost overview charts
**Reason**: API does not provide team aggregation data per agent
**Impact**: Chart will only show agent-based view
**Alternative**: Users can navigate to the Teams dashboard for team-specific analytics

### 2. Teams Analysis Mode
**Feature**: Detailed team breakdown within agent analysis
**Reason**: No API endpoint provides team-level usage breakdown per specific agent
**Impact**: Entire "Teams" analysis section removed from agent detailed analysis
**Alternative**: General team analytics available on Teams dashboard

### 3. Models Analysis Mode  
**Feature**: Detailed model breakdown within agent analysis
**Reason**: No API endpoint provides model-level usage breakdown per specific agent
**Impact**: Entire "Models" analysis section removed from agent detailed analysis
**Alternative**: General model analytics available on Models dashboard

### 4. Advanced User Analysis Mode
**Feature**: Detailed user breakdown with team associations per agent
**Reason**: Limited user-agent association data in API responses
**Impact**: Simplified user analysis with basic user list only
**Alternative**: Basic user information available from users leaderboard endpoint

### 5. Agent-Specific Details Endpoint
**Feature**: Deep-dive analytics for individual agents
**Reason**: Expected `/analytics/dashboard/agents/{agentName}/details` endpoint not available
**Impact**: Detailed agent analysis limited to summary data
**Alternative**: Use aggregate data from agent summary and leaderboard endpoints

## What Remains Functional

### ✅ Core Features (Implemented)
- Agent list and selection dropdown
- Agent cost overview chart (agent-based only)
- Week/date range filtering
- Basic metric cards (users, sessions, cost, tokens)
- Agent leaderboard ranking
- Basic agent information display

### ✅ Simplified Features (Partial Implementation)
- Basic user list per agent (from users leaderboard)
- Agent type classification (DIY, Pre-built, Foundation)
- Weekly variance data where available

## Implementation Notes

### Data Mapping
- **Agent Summary**: Maps directly to `/users/agent-summary` response
- **Agent Ranking**: Uses `/analytics/dashboard/agents/leaderboard` for cost ranking
- **User Data**: Limited to associations from `/analytics/dashboard/users/leaderboard`

### Date Filtering
All API endpoints support `start_date` and `end_date` parameters in YYYY-MM-DD format, enabling proper week selection functionality.

### Error Handling
- Fallback to empty states when API endpoints return no data
- Graceful degradation when optional data is unavailable
- Loading states for all API calls

## Future Enhancements

### API Requests for Complete Feature Support
To restore removed features, the following additional API endpoints would be needed:

1. **`GET /api/analytics/dashboard/agents/{agentName}/teams`**
   - Team breakdown for specific agent
   - Team-level usage statistics per agent

2. **`GET /api/analytics/dashboard/agents/{agentName}/models`**
   - Model breakdown for specific agent
   - Model-level usage statistics per agent

3. **`GET /api/analytics/dashboard/agents/{agentName}/users`**
   - Detailed user breakdown for specific agent
   - User activity and cost per agent

4. **`GET /api/analytics/dashboard/agents/{agentName}/details`**
   - Comprehensive agent analytics
   - Historical trends and projections

### Alternative Approaches
- **Data Aggregation**: Compute missing breakdowns from existing endpoints
- **Client-side Processing**: Combine multiple API responses to create derived analytics
- **Caching Strategy**: Store and process historical data for trend analysis

## Last Updated
Date: 2025-01-25
API Version: Based on `/swagger/openapi.json` specification
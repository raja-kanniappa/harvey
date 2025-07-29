import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { Card } from '@/components/ui/card';

interface WeeklySpendingData {
  weekNumber: number;
  actual: number;
  remaining?: number;
  totalProjected?: number;
  isCurrentWeek?: boolean;
}

interface DailySpendingData {
  day: string;
  dayOfWeek: string;
  cumulative: number;
  daily: number;
  isToday?: boolean;
}

type ViewMode = 'weekly' | 'daily';

interface WeeklySpendingChartProps {
  className?: string;
}

// Generate mock data for last 5 weeks with current week projection
const generateWeeklyData = (): WeeklySpendingData[] => {
  const currentWeek = 28; // Current week number
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysPassedInWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // Treat Sunday as end of week
  
  // Sample data for completed weeks
  const completedWeeks = [
    { weekNumber: 24, actual: 180 },
    { weekNumber: 25, actual: 140 },
    { weekNumber: 26, actual: 280 },
    { weekNumber: 27, actual: 190 },
  ];
  
  // Current week data with projection
  const currentWeekSpentSoFar = 100; // This could come from real data
  const dailyAverage = currentWeekSpentSoFar / daysPassedInWeek;
  const projectedWeeklySpend = Math.round(dailyAverage * 7);
  const remainingProjected = projectedWeeklySpend - currentWeekSpentSoFar;
  
  const currentWeekData = {
    weekNumber: currentWeek,
    actual: currentWeekSpentSoFar,
    remaining: remainingProjected > 0 ? remainingProjected : 0,
    totalProjected: projectedWeeklySpend,
    isCurrentWeek: true
  };
  
  return [...completedWeeks, currentWeekData];
};

// Generate daily spending data for current week
const generateDailyData = (): DailySpendingData[] => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Sample daily spending data (cumulative)
  const dailyData = [
    { day: 'Mon', dayOfWeek: 'Monday', cumulative: 20, daily: 20 },
    { day: 'Tue', dayOfWeek: 'Tuesday', cumulative: 30, daily: 10 },
    { day: 'Wed', dayOfWeek: 'Wednesday', cumulative: 45, daily: 15 },
    { day: 'Thu', dayOfWeek: 'Thursday', cumulative: 55, daily: 10 },
    { day: 'Fri', dayOfWeek: 'Friday', cumulative: 80, daily: 25 },
    { day: 'Sat', dayOfWeek: 'Saturday', cumulative: 90, daily: 10 },
    { day: 'Sun', dayOfWeek: 'Sunday', cumulative: 100, daily: 10 },
  ];
  
  // Mark today and only show data up to today
  const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Mon=0, Tue=1, etc.
  
  return dailyData.map((item, index) => ({
    ...item,
    isToday: index === todayIndex,
    // Only show data up to today
    cumulative: index <= todayIndex ? item.cumulative : 0,
    daily: index <= todayIndex ? item.daily : 0,
  }));
};

const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    if (viewMode === 'weekly') {
      const isCurrentWeek = data.isCurrentWeek;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`Week ${label}`}{isCurrentWeek ? ' (Current)' : ''}</p>
          <p className="text-blue-600">
            <span className="font-medium">Actual: </span>
            ${data.actual.toLocaleString()}
          </p>
          {isCurrentWeek && data.totalProjected && (
            <p className="text-orange-600">
              <span className="font-medium">Projected: </span>
              ${data.totalProjected.toLocaleString()}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Target: $250
          </p>
          {isCurrentWeek && data.totalProjected && (
            <p className={`text-sm mt-1 ${
              data.totalProjected <= 250 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.totalProjected <= 250 ? '✓ On track' : '⚠ Over target'}
            </p>
          )}
        </div>
      );
    } else {
      // Daily view tooltip
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.dayOfWeek}{data.isToday ? ' (Today)' : ''}</p>
          <p className="text-blue-600">
            <span className="font-medium">Daily: </span>
            ${data.daily.toLocaleString()}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Cumulative: </span>
            ${data.cumulative.toLocaleString()}
          </p>
        </div>
      );
    }
  }
  return null;
};

export default function WeeklySpendingChart({ className }: WeeklySpendingChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  
  const weeklyData = generateWeeklyData();
  const dailyData = generateDailyData();
  const target = 250;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {viewMode === 'weekly' ? 'Weekly Spending Trend' : 'Daily Spending - Current Week'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === 'weekly' 
                ? 'Last 4 weeks + current week projection vs target ($250)'
                : 'Daily spending progression for current week'
              }
            </p>
          </div>
          
          {/* Segment Control */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
          </div>
        </div>
        
        {viewMode === 'weekly' && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Actual Spending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Remaining Projected</span>
            </div>
          </div>
        )}
        
        {viewMode === 'daily' && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Cumulative Spending</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'weekly' ? (
            <BarChart
              data={weeklyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="weekNumber" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Wk ${value}`}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} viewMode={viewMode} />} />
              
              {/* Target line */}
              <ReferenceLine 
                y={target} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  value: `Target: $${target}`, 
                  position: "top",
                  style: { 
                    fontSize: 12, 
                    fill: '#ef4444',
                    fontWeight: 'bold'
                  }
                }}
              />
              
              <Bar 
                dataKey="actual" 
                fill="#3b82f6"
                stackId="spending"
                name="Actual Spending"
              />
              <Bar 
                dataKey="remaining" 
                fill="#f97316"
                stackId="spending"
                radius={[4, 4, 0, 0]}
                name="Remaining Projected"
              />
            </BarChart>
          ) : (
            <LineChart
              data={dailyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} viewMode={viewMode} />} />
              
              {/* Target line for daily view (weekly target) */}
              <ReferenceLine 
                y={target} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  value: `Weekly Target: $${target}`, 
                  position: "top",
                  style: { 
                    fontSize: 12, 
                    fill: '#ef4444',
                    fontWeight: 'bold'
                  }
                }}
              />
              
              <Line 
                type="stepAfter"
                dataKey="cumulative" 
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Cumulative Spending"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Summary stats */}
      {viewMode === 'weekly' ? (
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">This Week (Actual)</div>
            <div className="text-lg font-semibold text-gray-900">
              ${weeklyData[weeklyData.length - 1]?.actual.toLocaleString()}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Week Projection</div>
            <div className="text-lg font-semibold text-orange-600">
              ${weeklyData[weeklyData.length - 1]?.totalProjected?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">5-Week Avg</div>
            <div className="text-lg font-semibold text-gray-900">
              ${Math.round(weeklyData.slice(0, -1).reduce((sum: number, item: WeeklySpendingData) => sum + item.actual, 0) / (weeklyData.length - 1)).toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">vs Target</div>
            <div className={`text-lg font-semibold ${
              (weeklyData[weeklyData.length - 1]?.totalProjected || weeklyData[weeklyData.length - 1]?.actual) <= target ? 'text-green-600' : 'text-red-600'
            }`}>
              {(weeklyData[weeklyData.length - 1]?.totalProjected || weeklyData[weeklyData.length - 1]?.actual) <= target ? '✓ On Track' : '⚠ Over Target'}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Today's Spending</div>
            <div className="text-lg font-semibold text-gray-900">
              ${dailyData.find(d => d.isToday)?.daily.toLocaleString() || '0'}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Week So Far</div>
            <div className="text-lg font-semibold text-blue-600">
              ${dailyData[dailyData.findIndex(d => d.isToday)]?.cumulative.toLocaleString() || '0'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Remaining Budget</div>
            <div className={`text-lg font-semibold ${
              target - (dailyData[dailyData.findIndex(d => d.isToday)]?.cumulative || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Math.abs(target - (dailyData[dailyData.findIndex(d => d.isToday)]?.cumulative || 0)).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 
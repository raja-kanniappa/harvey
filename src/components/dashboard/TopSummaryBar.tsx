import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '../ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { BodyText, MetricCard } from '../ui/design-system';
import { dashboardApiService } from '../../services/dashboardApiService';
import { DashboardSummaryResponse } from '../../types/api';

interface WeeklyData {
  weekStart: Date;
  weekEnd: Date;
  actualSpend: number;
  projectedSpend: number;
  weekLabel: string;
}

// Helper functions for Monday-Sunday week calculation
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getSunday = (monday: Date): Date => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

const getWeekLabel = (monday: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sunday = getSunday(monday);
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
};

const calculateDailyPace = (currentSpend: number, daysElapsed: number): number => {
  if (daysElapsed === 0) return 0;
  return currentSpend / daysElapsed;
};

export default function TopSummaryBar() {
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyData | null>(null);
  const [historicalData, setHistoricalData] = useState<WeeklyData[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Constants
  const WEEKLY_BUDGET = 250;

  // Chart configuration for shadcn charts
  const chartConfig = {
    actualSpend: {
      label: "Actual Spend",
      color: "hsl(var(--chart-1))",
    },
    projectedSpend: {
      label: "Projected Spend", 
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Transform data for recharts format
  const transformDataForChart = (historical: WeeklyData[], current: WeeklyData) => {
    const allWeeks = [...historical, current];
    return allWeeks.map((week, index) => {
      const isCurrentWeek = index === historical.length;
      
      if (isCurrentWeek) {
        // Current week: 3-part stack (actual, remaining budget, over budget)
        const actualSpend = week.actualSpend;
        const projectedSpend = week.projectedSpend;
        const remainingToBudget = Math.max(0, WEEKLY_BUDGET - actualSpend);
        const overBudget = Math.max(0, projectedSpend - WEEKLY_BUDGET);
        
        return {
          week: week.weekLabel.replace(' - ', '\n'),
          weekShort: week.weekLabel.split(' - ')[0],
          currentSpend: Math.min(actualSpend, WEEKLY_BUDGET), // Blue: actual spend up to budget
          budgetRemaining: remainingToBudget, // Light blue: remaining budget space
          overBudget: overBudget, // Red: projected overage
          totalSpend: Math.round(projectedSpend),
          isCurrentWeek: true,
          utilization: (projectedSpend / WEEKLY_BUDGET) * 100,
        };
      } else {
        // Historical weeks: 2-part stack (within budget, over budget)
        const totalSpend = week.actualSpend;
        return {
          week: week.weekLabel.replace(' - ', '\n'),
          weekShort: week.weekLabel.split(' - ')[0],
          currentSpend: Math.min(totalSpend, WEEKLY_BUDGET), // Blue: spend up to budget
          budgetRemaining: 0, // No remaining budget for historical weeks
          overBudget: Math.max(0, totalSpend - WEEKLY_BUDGET), // Red: over budget
          totalSpend: Math.round(totalSpend),
          isCurrentWeek: false,
          utilization: (totalSpend / WEEKLY_BUDGET) * 100,
        };
      }
    });
  };

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real historical data for all weeks
        const allWeeks = await dashboardApiService.getHistoricalWeeks({ environment: 'UAT' });
        
        // Separate current week from historical weeks
        const currentWeek = allWeeks[allWeeks.length - 1]; // Last week is current week
        const historical = allWeeks.slice(0, -1); // All except last week

        // Set dashboard summary from current week API data
        if (currentWeek.apiData) {
          setDashboardSummary(currentWeek.apiData);
        }

        // Transform to WeeklyData format
        const currentWeekData: WeeklyData = {
          weekStart: currentWeek.weekStart,
          weekEnd: currentWeek.weekEnd,
          actualSpend: currentWeek.actualSpend,
          projectedSpend: currentWeek.projectedSpend,
          weekLabel: currentWeek.weekLabel
        };

        const historicalData: WeeklyData[] = historical.map(week => ({
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
          actualSpend: week.actualSpend,
          projectedSpend: week.projectedSpend,
          weekLabel: week.weekLabel
        }));

        setCurrentWeekData(currentWeekData);
        setHistoricalData(historicalData);
      } catch (err) {
        console.error('Error fetching weekly data:', err);
        setError('Failed to load weekly budget data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeekData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <BodyText className="text-destructive">{error || 'No weekly data available'}</BodyText>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const currentUtilization = (currentWeekData.actualSpend / WEEKLY_BUDGET) * 100;
  const projectedUtilization = (currentWeekData.projectedSpend / WEEKLY_BUDGET) * 100;
  const remainingBudget = Math.max(0, WEEKLY_BUDGET - currentWeekData.actualSpend);
  
  // Determine status
  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 100) return { status: 'decrease' as const, color: 'text-red-600' };
    if (utilization >= 90) return { status: 'neutral' as const, color: 'text-orange-600' };
    if (utilization >= 75) return { status: 'neutral' as const, color: 'text-yellow-600' };
    return { status: 'increase' as const, color: 'text-green-600' };
  };

  const currentStatus = getUtilizationStatus(currentUtilization);
  const projectedStatus = getUtilizationStatus(projectedUtilization);

  // Calculate average spending from historical data
  const averageHistoricalSpend = historicalData.length > 0 
    ? historicalData.reduce((sum, week) => sum + week.actualSpend, 0) / historicalData.length 
    : 0;

  const weekOverWeekChange = averageHistoricalSpend > 0 
    ? ((currentWeekData.projectedSpend - averageHistoricalSpend) / averageHistoricalSpend) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Weekly Budget Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Budget Progress</CardTitle>
              <CardDescription>
                Monday - Sunday cycle • Budget: ${WEEKLY_BUDGET}
              </CardDescription>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">
                  ${currentWeekData.actualSpend.toFixed(0)}
                  <span className="text-lg font-normal text-muted-foreground">/${WEEKLY_BUDGET}</span>
                </div>
                <BodyText className="text-xs text-muted-foreground">
                  Current spend
                </BodyText>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className={`text-2xl font-bold ${projectedUtilization > 100 ? 'text-red-600' : 'text-orange-600'}`}>
                  ${currentWeekData.projectedSpend.toFixed(0)}
                </div>
                <BodyText className="text-xs text-muted-foreground">
                  Projected spend
                </BodyText>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Progress Bar - 3-color scheme matching the bar chart */}
          <div className="mb-4">
              {/* Calculate segments for 3-color progress bar */}
              {(() => {
                const maxValue = Math.max(currentWeekData.projectedSpend, WEEKLY_BUDGET);
                const currentSpend = currentWeekData.actualSpend;
                const projectedSpend = currentWeekData.projectedSpend;
                
                // Calculate widths as percentages of container
                const currentSpendWidth = (Math.min(currentSpend, WEEKLY_BUDGET) / maxValue) * 100;
                const remainingBudgetWidth = currentSpend < WEEKLY_BUDGET ? 
                  ((WEEKLY_BUDGET - currentSpend) / maxValue) * 100 : 0;
                const overBudgetWidth = projectedSpend > WEEKLY_BUDGET ? 
                  ((projectedSpend - WEEKLY_BUDGET) / maxValue) * 100 : 0;
                
                return (
                  <div className="space-y-2">
                    {/* 3-color progress bar */}
                    <div className="flex h-8 w-full rounded-lg overflow-hidden bg-gray-100">
                      {/* Current spend (blue) */}
                      <div 
                        className="bg-blue-500 h-full"
                        style={{ width: `${currentSpendWidth}%` }}
                      ></div>
                      {/* Remaining budget (light blue) */}
                      {remainingBudgetWidth > 0 && (
                        <div 
                          className="bg-blue-300 h-full"
                          style={{ width: `${remainingBudgetWidth}%` }}
                        ></div>
                      )}
                      {/* Over budget (red) */}
                      {overBudgetWidth > 0 && (
                        <div 
                          className="bg-red-500 h-full border-l-2 border-gray-800"
                          style={{ width: `${overBudgetWidth}%` }}
                        ></div>
                      )}
                    </div>
                    
                    {/* Smart Labels with Overlap Detection */}
                    {(() => {
                      // Calculate label positions as percentages
                      const currentSpendPos = currentSpendWidth;
                      const budgetPos = (WEEKLY_BUDGET / maxValue) * 100;
                      const projectedSpendPos = 100;
                      
                      // Estimate label widths (approximate character width * length)
                      const estimateWidth = (text: string) => text.length * 6; // ~6px per character
                      const containerWidth = 800; // Approximate container width, could be made dynamic
                      
                      // Calculate actual pixel positions
                      const currentSpendPx = (currentSpendPos / 100) * containerWidth;
                      const budgetPx = (budgetPos / 100) * containerWidth;
                      const projectedSpendPx = (projectedSpendPos / 100) * containerWidth;
                      
                      // Check for overlaps (using 60px minimum distance for readability)
                      const minDistance = 60;
                      const currentBudgetOverlap = Math.abs(currentSpendPx - budgetPx) < minDistance;
                      const budgetProjectedOverlap = Math.abs(budgetPx - projectedSpendPx) < minDistance;
                      const currentProjectedOverlap = Math.abs(currentSpendPx - projectedSpendPx) < minDistance;
                      
                      // Priority: Projected > Current > Budget > $0
                      // Determine which labels to show
                      const showProjected = true; // Always show (highest priority)
                      const showCurrent = !currentProjectedOverlap;
                      const showBudget = !budgetProjectedOverlap && !(currentBudgetOverlap && showCurrent);
                      
                      return (
                        <div className="flex justify-between text-xs text-muted-foreground relative">
                          <span>$0</span>
                          
                          {/* Current Spend Label */}
                          {showCurrent && (
                            <span className="absolute" style={{ left: `${currentSpendPos}%`, transform: 'translateX(-50%)' }}>
                              ${currentWeekData.actualSpend.toFixed(0)}
                            </span>
                          )}
                          
                          {/* Budget Label */}
                          {showBudget && (
                            <span className="absolute" style={{ left: `${budgetPos}%`, transform: 'translateX(-50%)' }}>
                              ${WEEKLY_BUDGET}<br />
                              <span className="text-gray-600">Budget</span>
                            </span>
                          )}
                          
                          {/* Projected Spend Label (Always shown - highest priority) */}
                          <span>
                            ${currentWeekData.projectedSpend.toFixed(0)}
                            {projectedSpend > WEEKLY_BUDGET && (
                              <span className="block text-red-600 font-medium">
                                +${(projectedSpend - WEEKLY_BUDGET).toFixed(0)} over
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Status indicator */}
            <div className="text-center">
              {projectedUtilization <= 90 && (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  ✓ On Track - Under Budget
                </Badge>
              )}
              {projectedUtilization > 90 && projectedUtilization <= 100 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  ⚠ Approaching Budget Limit
                </Badge>
              )}
              {projectedUtilization > 100 && (
                <Badge variant="destructive">
                  ⚠ Projected to Exceed Budget by ${(currentWeekData.projectedSpend - WEEKLY_BUDGET).toFixed(0)}
                </Badge>
              )}
            </div>
          </div>

          {/* 5-Week Historical Trend Chart - Shadcn Bar Chart */}
          <div className="pt-4 border-t">
            <h4 className="text-lg font-semibold mb-6">5-Week Budget vs Actual Trend</h4>
            <ChartContainer config={chartConfig} className="h-[280px] w-full [&>div]:!aspect-auto">
              <BarChart
                accessibilityLayer
                data={transformDataForChart(historicalData, currentWeekData)}
                margin={{
                  top: 20,
                  right: 12,
                  left: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="weekShort"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <YAxis
                  hide
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.week.replace('\n', ' - ')}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                Total: ${data.totalSpend}
                              </span>
                            </div>
                            {data.currentSpend > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-sm">
                                  {data.isCurrentWeek ? 'Current Spend' : 'Actual Spend'}: ${Math.round(data.currentSpend)}
                                </span>
                              </div>
                            )}
                            {data.budgetRemaining > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-300"></div>
                                <span className="text-sm">Budget Remaining: ${Math.round(data.budgetRemaining)}</span>
                              </div>
                            )}
                            {data.overBudget > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span className="text-sm">
                                  {data.isCurrentWeek ? 'Projected Over' : 'Over Budget'}: ${Math.round(data.overBudget)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="currentSpend" 
                  stackId="spend"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="budgetRemaining" 
                  stackId="spend"
                  fill="#93c5fd"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="overBudget" 
                  stackId="spend"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
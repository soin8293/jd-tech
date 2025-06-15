import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Download,
  RefreshCw,
  Users,
  Building
} from "lucide-react";
import { useAvailabilityEngine } from "@/hooks/useAvailabilityEngine";
import { DateRange, OccupancyData } from "@/types/availability.types";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface RevenueAnalyticsProps {
  roomId?: string;
  className?: string;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  roomId,
  className = ""
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || '');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analyticsData, setAnalyticsData] = useState<OccupancyData | null>(null);

  const {
    getOccupancyRate,
    isLoading,
    error
  } = useAvailabilityEngine();

  // Calculate date range based on selection
  const getDateRange = (): DateRange | null => {
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        return {
          startDate: subDays(now, 7),
          endDate: now
        };
      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
      case 'quarter':
        return {
          startDate: subMonths(now, 3),
          endDate: now
        };
      case 'custom':
        if (!customStart || !customEnd) return null;
        return {
          startDate: new Date(customStart),
          endDate: new Date(customEnd)
        };
      default:
        return null;
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    if (!selectedRoomId) return;
    
    const range = getDateRange();
    if (!range) return;

    try {
      const data = await getOccupancyRate(selectedRoomId, range);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Auto-load when parameters change
  useEffect(() => {
    loadAnalytics();
  }, [selectedRoomId, timeRange, customStart, customEnd]);

  // Export analytics data
  const exportData = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Occupancy Rate', `${analyticsData.rate.toFixed(2)}%`],
      ['Total Days', analyticsData.totalDays.toString()],
      ['Booked Days', analyticsData.bookedDays.toString()],
      ['Total Revenue', `$${analyticsData.revenue.toFixed(2)}`],
      ['Average Daily Rate', `$${analyticsData.averageDailyRate.toFixed(2)}`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedRoomId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get occupancy rate color
  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue & Analytics
              </CardTitle>
              <CardDescription>
                Track occupancy rates and revenue performance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={!analyticsData}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadAnalytics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!roomId && (
              <div>
                <label className="text-sm font-medium">Room</label>
                <Input
                  placeholder="Enter room ID"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Current Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analytics Display */}
          {analyticsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className={`h-4 w-4 ${getOccupancyColor(analyticsData.rate)}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                        <p className={`text-2xl font-bold ${getOccupancyColor(analyticsData.rate)}`}>
                          {analyticsData.rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(analyticsData.revenue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Booked Days</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analyticsData.bookedDays}/{analyticsData.totalDays}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Daily Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(analyticsData.averageDailyRate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-3">Performance Analysis</h4>
                    <div className="space-y-2 text-sm">
                      {analyticsData.rate >= 80 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="h-2 w-2 bg-green-600 rounded-full" />
                          Excellent occupancy rate
                        </div>
                      )}
                      {analyticsData.rate >= 60 && analyticsData.rate < 80 && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <div className="h-2 w-2 bg-yellow-600 rounded-full" />
                          Good occupancy with room for improvement
                        </div>
                      )}
                      {analyticsData.rate < 60 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <div className="h-2 w-2 bg-red-600 rounded-full" />
                          Low occupancy - consider pricing adjustments
                        </div>
                      )}
                      
                      {analyticsData.averageDailyRate > 200 && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          Premium pricing tier
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average per booked day:</span>
                        <span className="font-medium">
                          {formatCurrency(analyticsData.averageDailyRate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential revenue (100% occupancy):</span>
                        <span className="font-medium">
                          {formatCurrency(analyticsData.averageDailyRate * analyticsData.totalDays)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue lost to vacancy:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(analyticsData.averageDailyRate * (analyticsData.totalDays - analyticsData.bookedDays))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading analytics...
            </div>
          )}

          {/* Empty State */}
          {!analyticsData && !isLoading && selectedRoomId && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
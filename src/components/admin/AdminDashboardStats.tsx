
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Users, 
  Bed,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  BarChart3,
  Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  icon?: React.ComponentType<any>;
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon = Activity,
  progress,
  status,
  className
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-background border-border';
    }
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover-scale", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getStatusColor())}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        
        {trend && (
          <div className="flex items-center text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}

        {progress && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>{progress.label}</span>
              <span>{progress.value}/{progress.max}</span>
            </div>
            <Progress 
              value={(progress.value / progress.max) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AdminDashboardStatsProps {
  roomCount: number;
}

export const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ 
  roomCount = 0 
}) => {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Mock data - in real app this would come from analytics service
  const stats = {
    totalRevenue: 45230,
    totalBookings: 234,
    occupancyRate: 78,
    averageRating: 4.6,
    pendingCheckIns: 12,
    maintenanceIssues: 3,
    avgDailyRate: 285,
    customerSatisfaction: 92
  };

  const timeRangeOptions = [
    { value: '7d' as const, label: '7 days' },
    { value: '30d' as const, label: '30 days' },
    { value: '90d' as const, label: '90 days' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.email}. Here's what's happening with your hotel.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          description={`Over the last ${timeRange}`}
          trend={{
            value: 12.5,
            label: 'from last period',
            isPositive: true
          }}
          icon={DollarSign}
          status="success"
        />

        <EnhancedStatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          description="Confirmed reservations"
          trend={{
            value: 8.2,
            label: 'from last period',
            isPositive: true
          }}
          icon={Calendar}
          status="info"
        />

        <EnhancedStatsCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          description="Current occupancy level"
          progress={{
            value: stats.occupancyRate,
            max: 100,
            label: "Occupancy"
          }}
          icon={Bed}
          status={stats.occupancyRate > 70 ? "success" : stats.occupancyRate > 50 ? "warning" : "error"}
        />

        <EnhancedStatsCard
          title="Average Rating"
          value={stats.averageRating}
          description="Based on guest reviews"
          trend={{
            value: 2.1,
            label: 'from last period',
            isPositive: true
          }}
          icon={Star}
          status="success"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatsCard
          title="Pending Check-ins"
          value={stats.pendingCheckIns}
          description="Guests arriving today"
          icon={Clock}
          status={stats.pendingCheckIns > 15 ? "warning" : "info"}
        />

        <EnhancedStatsCard
          title="Maintenance Issues"
          value={stats.maintenanceIssues}
          description="Requiring attention"
          icon={AlertCircle}
          status={stats.maintenanceIssues > 5 ? "error" : stats.maintenanceIssues > 0 ? "warning" : "success"}
        />

        <EnhancedStatsCard
          title="Avg Daily Rate"
          value={`$${stats.avgDailyRate}`}
          description="Average room rate"
          trend={{
            value: 5.4,
            label: 'from last period',
            isPositive: true
          }}
          icon={BarChart3}
          status="info"
        />

        <EnhancedStatsCard
          title="Customer Satisfaction"
          value={`${stats.customerSatisfaction}%`}
          description="Overall satisfaction score"
          progress={{
            value: stats.customerSatisfaction,
            max: 100,
            label: "Satisfaction"
          }}
          icon={Users}
          status={stats.customerSatisfaction > 85 ? "success" : stats.customerSatisfaction > 70 ? "warning" : "error"}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Button variant="outline" size="sm" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Check-ins Today
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Guest Messages
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Bed className="h-4 w-4 mr-2" />
              Room Status
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Report
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" />
              Maintenance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Room Management Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Room Management Summary</CardTitle>
          <CardDescription>
            Overview of your {roomCount} rooms and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.floor(roomCount * 0.7)}</div>
              <div className="text-sm text-muted-foreground">Available Rooms</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{Math.floor(roomCount * 0.25)}</div>
              <div className="text-sm text-muted-foreground">Occupied Rooms</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{Math.floor(roomCount * 0.05)}</div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardStats;

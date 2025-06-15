import React from "react";
import { Badge } from "@/components/ui/badge";

interface ActivityStatsProps {
  stats: {
    totalActivities: number;
    todayActivities: number;
    topUsers: Array<{ email: string; count: number }>;
    activityTypes: Array<{ type: string; count: number }>;
  };
  className?: string;
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({
  stats,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.totalActivities}</div>
        <div className="text-xs text-muted-foreground">Total Activities</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.todayActivities}</div>
        <div className="text-xs text-muted-foreground">Today</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.topUsers.length}</div>
        <div className="text-xs text-muted-foreground">Active Users</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{stats.activityTypes.length}</div>
        <div className="text-xs text-muted-foreground">Activity Types</div>
      </div>
    </div>
  );
};
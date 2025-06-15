import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  History, 
  Clock, 
  Eye, 
  Download
} from "lucide-react";
import { useActivityLogging, ActivityLog } from "@/hooks/useActivityLogging";
import { format } from "date-fns";
import { ActivityStats } from "./ActivityStats";
import { ActivityFilters } from "./ActivityFilters";
import { ActivityList } from "./ActivityList";

interface ActivityAuditTrailProps {
  roomId?: string;
  showRoomFilter?: boolean;
  maxItems?: number;
  className?: string;
}

export const ActivityAuditTrail: React.FC<ActivityAuditTrailProps> = ({
  roomId,
  showRoomFilter = true,
  maxItems = 20,
  className = ""
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    activities,
    isLoading,
    error,
    getRoomActivities,
    getActivityStats
  } = useActivityLogging();

  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    topUsers: [] as Array<{ email: string; count: number }>,
    activityTypes: [] as Array<{ type: string; count: number }>
  });

  // Load room-specific activities if roomId provided
  useEffect(() => {
    if (roomId) {
      getRoomActivities(roomId).then(roomActivities => {
        setFilteredActivities(roomActivities.slice(0, maxItems));
      });
    }
  }, [roomId, getRoomActivities, maxItems]);

  // Filter activities based on criteria
  useEffect(() => {
    let filtered = roomId ? filteredActivities : activities;

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!roomId) {
      setFilteredActivities(filtered.slice(0, maxItems));
    }
  }, [activities, filterType, searchTerm, maxItems, roomId]);

  // Load statistics
  useEffect(() => {
    getActivityStats().then(setStats);
  }, [getActivityStats]);

  const exportActivities = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'User', 'Room', 'Action', 'Details'],
      ...filteredActivities.map(activity => [
        format(activity.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        activity.type,
        activity.userEmail,
        activity.roomName || 'N/A',
        activity.details.action,
        activity.details.changes?.join(', ') || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 animate-pulse mr-2" />
            Loading activity log...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Audit Trail
                {roomId && " - Room Specific"}
              </CardTitle>
              <CardDescription>
                Track all room modifications and admin actions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportActivities}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Statistics */}
          {showDetails && (
            <ActivityStats stats={stats} />
          )}

          {/* Filters */}
          <ActivityFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            showRoomFilter={showRoomFilter}
          />

          {/* Activity List */}
          <ActivityList
            activities={filteredActivities}
            showLoadMore={!roomId && activities.length > maxItems}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityAuditTrail;
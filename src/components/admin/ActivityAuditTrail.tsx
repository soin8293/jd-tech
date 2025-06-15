import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  History, 
  User, 
  Clock, 
  Eye, 
  Undo2, 
  Filter,
  Download,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useActivityLogging, ActivityLog } from "@/hooks/useActivityLogging";
import { formatDistanceToNow, format } from "date-fns";

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedItems(newExpanded);
  };

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'room_created': return '🏨';
      case 'room_updated': return '✏️';
      case 'room_deleted': return '🗑️';
      case 'room_locked': return '🔒';
      case 'room_unlocked': return '🔓';
      case 'admin_action': return '⚙️';
      default: return '📝';
    }
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'room_created': return 'bg-green-100 text-green-800';
      case 'room_updated': return 'bg-blue-100 text-blue-800';
      case 'room_deleted': return 'bg-red-100 text-red-800';
      case 'room_locked': return 'bg-yellow-100 text-yellow-800';
      case 'room_unlocked': return 'bg-gray-100 text-gray-800';
      case 'admin_action': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
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
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
              />
            </div>
            
            {showRoomFilter && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="p-2 border rounded text-sm min-w-[150px]"
              >
                <option value="all">All Activities</option>
                <option value="room_created">Room Created</option>
                <option value="room_updated">Room Updated</option>
                <option value="room_deleted">Room Deleted</option>
                <option value="room_locked">Room Locked</option>
                <option value="room_unlocked">Room Unlocked</option>
                <option value="admin_action">Admin Actions</option>
              </select>
            )}
          </div>

          {/* Activity List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found matching your criteria
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const isExpanded = expandedItems.has(activity.id);
                
                return (
                  <div key={activity.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-lg">{getActivityIcon(activity.type)}</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
                              {activity.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {activity.details.action}
                            </span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {activity.userEmail}
                              <Clock className="h-3 w-3 ml-2" />
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </div>
                            
                            {activity.roomName && (
                              <div>Room: {activity.roomName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(activity.id)}
                        className="ml-2"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {activity.details.changes && activity.details.changes.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Changes Made:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {activity.details.changes.map((change, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {change}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activity.details.oldValues && Object.keys(activity.details.oldValues).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="font-medium text-muted-foreground mb-1">Before:</div>
                              <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(activity.details.oldValues, null, 2)}
                              </pre>
                            </div>
                            {activity.details.newValues && (
                              <div>
                                <div className="font-medium text-muted-foreground mb-1">After:</div>
                                <pre className="bg-green-50 p-2 rounded text-xs overflow-auto">
                                  {JSON.stringify(activity.details.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          <div>Full timestamp: {format(activity.timestamp, 'PPpp')}</div>
                          {activity.ipAddress && <div>IP: {activity.ipAddress}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {!roomId && activities.length > maxItems && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm">
                Load More Activities
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityAuditTrail;
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Clock, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ActivityLog } from "@/hooks/useActivityLogging";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityListProps {
  activities: ActivityLog[];
  onLoadMore?: () => void;
  showLoadMore?: boolean;
  className?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onLoadMore,
  showLoadMore = false,
  className = ""
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  return (
    <div className={className}>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activities found matching your criteria
          </div>
        ) : (
          activities.map((activity) => {
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
      {showLoadMore && onLoadMore && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
};
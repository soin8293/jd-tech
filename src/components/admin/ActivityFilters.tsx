import React from "react";
import { Search } from "lucide-react";

interface ActivityFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  showRoomFilter?: boolean;
  className?: string;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  showRoomFilter = true,
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="flex items-center gap-2 flex-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 p-2 border rounded text-sm"
        />
      </div>
      
      {showRoomFilter && (
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
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
  );
};
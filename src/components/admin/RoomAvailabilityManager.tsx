import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { useAvailabilityManagement } from '@/hooks/useAvailabilityManagement';
import { useRoomManagement } from '@/hooks/useRoomManagement';
import { CalendarDays, Shield, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ValidationConflict {
  date: string;
  currentStatus: string;
  reason: string;
  canOverride: boolean;
}

interface ValidationWarning {
  date: string;
  message: string;
}

export const RoomAvailabilityManager: React.FC = () => {
  const { rooms } = useRoomManagement();
  const { updateAvailability, validateChange, loading, validating } = useAvailabilityManagement();
  
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [operation, setOperation] = useState<'block' | 'unblock' | 'maintenance'>('block');
  const [reason, setReason] = useState('');
  const [conflicts, setConflicts] = useState<ValidationConflict[]>([]);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  // Validate changes when dates or operation changes
  useEffect(() => {
    if (selectedRoom && selectedDates.length > 0) {
      handleValidation();
    } else {
      setConflicts([]);
      setWarnings([]);
      setShowValidation(false);
    }
  }, [selectedRoom, selectedDates, operation]);

  const handleValidation = async () => {
    if (!selectedRoom || selectedDates.length === 0) return;

    try {
      const dateStrings = selectedDates.map(date => format(date, 'yyyy-MM-dd'));
      const result = await validateChange({
        roomId: selectedRoom,
        dates: dateStrings,
        operation
      });

      setConflicts(result.conflicts || []);
      setWarnings(result.warnings || []);
      setShowValidation(true);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoom || selectedDates.length === 0) return;

    // Check for blocking conflicts
    const blockingConflicts = conflicts.filter(c => !c.canOverride);
    if (blockingConflicts.length > 0) {
      return; // Cannot proceed with blocking conflicts
    }

    try {
      const dateStrings = selectedDates.map(date => format(date, 'yyyy-MM-dd'));
      const status = operation === 'unblock' ? 'available' : operation === 'maintenance' ? 'maintenance' : 'blocked';
      
      await updateAvailability({
        roomId: selectedRoom,
        dates: dateStrings,
        status,
        reason: reason.trim() || undefined
      });

      // Reset form
      setSelectedDates([]);
      setReason('');
      setConflicts([]);
      setWarnings([]);
      setShowValidation(false);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const canSubmit = selectedRoom && selectedDates.length > 0 && conflicts.filter(c => !c.canOverride).length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Room Availability Management
          </CardTitle>
          <CardDescription>
            Block or unblock dates for maintenance and operational needs. Select a room and dates to get started.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Room Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-select">Select Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger id="room-select">
                  <SelectValue placeholder="Choose a room to manage" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation-select">Operation</Label>
              <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
                <SelectTrigger id="operation-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Block Dates
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Schedule Maintenance
                    </div>
                  </SelectItem>
                  <SelectItem value="unblock">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Unblock Dates
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason Input */}
          {operation !== 'unblock' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder={`Enter reason for ${operation === 'maintenance' ? 'maintenance' : 'blocking'} these dates...`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Validation Results */}
          {showValidation && (conflicts.length > 0 || warnings.length > 0) && (
            <div className="space-y-3">
              {conflicts.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {conflicts.filter(c => !c.canOverride).length} conflicts must be resolved:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {conflicts.map((conflict, index) => (
                          <li key={index}>
                            <strong>{conflict.date}</strong>: {conflict.reason}
                            {conflict.canOverride && (
                              <Badge variant="outline" className="ml-2">Can Override</Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{warnings.length} warnings:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {warnings.map((warning, index) => (
                          <li key={index}>
                            <strong>{warning.date}</strong>: {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : `${operation === 'unblock' ? 'Unblock' : operation === 'maintenance' ? 'Schedule Maintenance' : 'Block'} ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDates([]);
                setReason('');
                setConflicts([]);
                setWarnings([]);
                setShowValidation(false);
              }}
              disabled={selectedDates.length === 0 && !reason}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {selectedRoomData && (
        <AvailabilityCalendar
          roomId={selectedRoomData.id}
          roomName={selectedRoomData.name}
          selectedDates={selectedDates}
          onDateSelect={setSelectedDates}
        />
      )}

      {/* Empty State */}
      {!selectedRoom && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Room to Begin</h3>
            <p className="text-muted-foreground">
              Choose a room from the dropdown above to view and manage its availability calendar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
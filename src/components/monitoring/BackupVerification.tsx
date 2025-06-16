
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Archive, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Download,
  RefreshCw 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface BackupStatus {
  lastBackupTime: Date | null;
  backupSize: number;
  status: 'current' | 'overdue' | 'missing';
  roomsBackedUp: number;
  usersBackedUp: number;
  totalDocuments: number;
}

export const BackupVerification: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    lastBackupTime: null,
    backupSize: 0,
    status: 'missing',
    roomsBackedUp: 0,
    usersBackedUp: 0,
    totalDocuments: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const verifyBackupStatus = async () => {
    setIsLoading(true);
    console.log('💾 BACKUP: Verifying backup status...');
    
    try {
      // Check for existing backup metadata
      const lastBackupStr = localStorage.getItem('lastBackupTimestamp');
      const lastBackupData = localStorage.getItem('lastBackupData');
      
      let lastBackupTime = null;
      let backupSize = 0;
      let roomsBackedUp = 0;
      let usersBackedUp = 0;
      
      if (lastBackupStr && lastBackupData) {
        lastBackupTime = new Date(lastBackupStr);
        const backupData = JSON.parse(lastBackupData);
        backupSize = JSON.stringify(backupData).length;
        roomsBackedUp = backupData.rooms?.length || 0;
        usersBackedUp = backupData.users?.length || 0;
      }
      
      // Get current document counts for comparison
      const roomsSnapshot = await getDocs(query(collection(db, 'rooms'), limit(100)));
      const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(100)));
      const totalDocuments = roomsSnapshot.size + usersSnapshot.size;
      
      // Determine backup status
      let status: 'current' | 'overdue' | 'missing' = 'missing';
      
      if (lastBackupTime) {
        const hoursSinceBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceBackup <= 24) {
          status = 'current';
        } else if (hoursSinceBackup <= 48) {
          status = 'overdue';
        } else {
          status = 'missing';
        }
      }
      
      setBackupStatus({
        lastBackupTime,
        backupSize,
        status,
        roomsBackedUp,
        usersBackedUp,
        totalDocuments
      });
      
      console.log('💾 BACKUP: Status verified:', {
        status,
        lastBackupTime,
        totalDocuments,
        backupSize
      });
      
    } catch (error) {
      console.error('💾 BACKUP: Status verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    console.log('💾 BACKUP: Creating new backup...');
    
    try {
      // Fetch all collections
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      const rooms = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const backupData = {
        timestamp: new Date().toISOString(),
        rooms,
        users,
        metadata: {
          totalRooms: rooms.length,
          totalUsers: users.length,
          backupVersion: '1.0'
        }
      };
      
      // Store backup in localStorage (in production, this would go to cloud storage)
      localStorage.setItem('lastBackupData', JSON.stringify(backupData));
      localStorage.setItem('lastBackupTimestamp', new Date().toISOString());
      
      console.log('💾 BACKUP: Backup created successfully:', {
        roomCount: rooms.length,
        userCount: users.length,
        size: JSON.stringify(backupData).length
      });
      
      // Refresh status
      await verifyBackupStatus();
      
    } catch (error) {
      console.error('💾 BACKUP: Backup creation failed:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = () => {
    const backupData = localStorage.getItem('lastBackupData');
    if (!backupData) return;
    
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 BACKUP: Backup downloaded');
  };

  useEffect(() => {
    verifyBackupStatus();
    
    // Check backup status every hour
    const interval = setInterval(verifyBackupStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'missing': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'default';
      case 'overdue': return 'secondary';
      case 'missing': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Automated Backup Verification
            </CardTitle>
            <CardDescription>
              Monitor backup status and ensure data protection
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadBackup}
              disabled={!backupStatus.lastBackupTime}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={createBackup}
              disabled={isCreatingBackup}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isCreatingBackup ? 'animate-spin' : ''}`} />
              Create Backup
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(backupStatus.status)}
            <div>
              <div className="font-medium">Backup Status</div>
              <div className="text-sm text-muted-foreground">
                {backupStatus.lastBackupTime 
                  ? `Last backup: ${backupStatus.lastBackupTime.toLocaleString()}`
                  : 'No backup found'
                }
              </div>
            </div>
          </div>
          <Badge variant={getStatusColor(backupStatus.status) as any}>
            {backupStatus.status.toUpperCase()}
          </Badge>
        </div>
        
        {/* Backup Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Rooms Backed Up</div>
            <div className="text-2xl font-bold">{backupStatus.roomsBackedUp}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Users Backed Up</div>
            <div className="text-2xl font-bold">{backupStatus.usersBackedUp}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Total Documents</div>
            <div className="text-2xl font-bold">{backupStatus.totalDocuments}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Backup Size</div>
            <div className="text-2xl font-bold">
              {(backupStatus.backupSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {backupStatus.status === 'missing' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No recent backup found. Create a backup to ensure data protection.
            </AlertDescription>
          </Alert>
        )}
        
        {backupStatus.status === 'overdue' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Backup is overdue. Consider creating a new backup for data safety.
            </AlertDescription>
          </Alert>
        )}
        
        {backupStatus.status === 'current' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Backup is current and data is protected. Next backup recommended in 24 hours.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

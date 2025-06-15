import React, { useState } from 'react';
import { useAuthDebug } from '@/contexts/AuthDebugContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Bug, 
  Trash2, 
  Download, 
  RefreshCw, 
  User,
  Clock,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const AuthDebugPanel = () => {
  const { debugMode, toggleDebugMode, logs, clearLogs, traceId, requestId } = useAuthDebug();
  const { currentUser, isAdmin, isLoading, authInitialized } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const exportLogs = () => {
    const logsJson = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'WARN':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-3 w-3 text-blue-500" />;
      case 'DEBUG':
        return <CheckCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'WARN':
        return 'outline';
      case 'INFO':
        return 'default';
      case 'DEBUG':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Hide the debug panel completely
  return null;
};

export default AuthDebugPanel;

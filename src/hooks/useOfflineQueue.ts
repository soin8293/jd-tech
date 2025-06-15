import { useState, useEffect, useCallback, useRef } from "react";
import { Room } from "@/types/hotel.types";
import { transactionManager, TransactionResult } from "@/utils/transactionManager";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface QueuedOperation {
  id: string;
  timestamp: Date;
  type: 'save' | 'delete' | 'update';
  data: any;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineQueueState {
  isOnline: boolean;
  queuedOperations: QueuedOperation[];
  isProcessingQueue: boolean;
  hasFailedOperations: boolean;
}

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const syncTimeout = useRef<NodeJS.Timeout>();

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue);
        setQueuedOperations(parsed.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        })));
      } catch (error) {
        logger.error('Failed to load offline queue from localStorage', error);
        localStorage.removeItem('offlineQueue');
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (queuedOperations.length > 0) {
      localStorage.setItem('offlineQueue', JSON.stringify(queuedOperations));
    } else {
      localStorage.removeItem('offlineQueue');
    }
  }, [queuedOperations]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Device back online, processing queued operations');
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Device went offline, operations will be queued');
      toast({
        title: "Connection Lost",
        description: "You're offline. Changes will be saved when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add operation to queue
  const queueOperation = useCallback((operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };

    setQueuedOperations(prev => [...prev, queuedOp]);

    toast({
      title: "Operation Queued",
      description: "Your changes have been saved locally and will sync when online.",
    });

    // Try to process immediately if online
    if (isOnline) {
      processQueue();
    }

    return queuedOp.id;
  }, [isOnline]);

  // Process queued operations
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessingQueue || queuedOperations.length === 0) {
      return;
    }

    setIsProcessingQueue(true);
    logger.info('Processing offline queue', { operationCount: queuedOperations.length });

    const processedIds: string[] = [];
    const failedOperations: QueuedOperation[] = [];

    for (const operation of queuedOperations) {
      try {
        let result: TransactionResult;

        switch (operation.type) {
          case 'save':
            if (Array.isArray(operation.data)) {
              result = await transactionManager.saveRoomsAtomically(operation.data);
            } else {
              result = await transactionManager.saveRoomAtomically(operation.data);
            }
            break;
          case 'delete':
            result = await transactionManager.deleteRoomAtomically(operation.data);
            break;
          case 'update':
            result = await transactionManager.bulkUpdateRooms(operation.data);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }

        if (result.success) {
          processedIds.push(operation.id);
          logger.info(`Queued operation ${operation.id} processed successfully`);
        } else if (result.retryable && operation.retryCount < operation.maxRetries) {
          // Increment retry count for retryable failures
          failedOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
          logger.warn(`Queued operation ${operation.id} failed, will retry`, {
            retryCount: operation.retryCount + 1,
            error: result.error
          });
        } else {
          // Max retries reached or non-retryable error
          logger.error(`Queued operation ${operation.id} failed permanently`, {
            error: result.error,
            retryCount: operation.retryCount
          });
          
          toast({
            title: "Sync Failed",
            description: `Failed to sync ${operation.type} operation: ${result.error}`,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        logger.error(`Error processing queued operation ${operation.id}`, error);
        
        if (operation.retryCount < operation.maxRetries) {
          failedOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        }
      }
    }

    // Update queue: remove processed operations, keep failed ones for retry
    setQueuedOperations(prev => [
      ...prev.filter(op => !processedIds.includes(op.id) && !failedOperations.find(f => f.id === op.id)),
      ...failedOperations
    ]);

    if (processedIds.length > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${processedIds.length} operation(s).`,
      });
    }

    setIsProcessingQueue(false);

    // Schedule retry for failed operations
    if (failedOperations.length > 0) {
      syncTimeout.current = setTimeout(() => {
        processQueue();
      }, 30000); // Retry after 30 seconds
    }
  }, [isOnline, isProcessingQueue, queuedOperations]);

  // Force sync attempt
  const forcSync = useCallback(() => {
    if (queuedOperations.length > 0) {
      processQueue();
    } else {
      toast({
        title: "Nothing to Sync",
        description: "No pending operations to synchronize.",
      });
    }
  }, [queuedOperations.length, processQueue]);

  // Clear queue (for testing or emergency reset)
  const clearQueue = useCallback(() => {
    setQueuedOperations([]);
    localStorage.removeItem('offlineQueue');
    toast({
      title: "Queue Cleared",
      description: "All pending operations have been cleared.",
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, []);

  const state: OfflineQueueState = {
    isOnline,
    queuedOperations,
    isProcessingQueue,
    hasFailedOperations: queuedOperations.some(op => op.retryCount > 0)
  };

  return {
    ...state,
    queueOperation,
    processQueue,
    forcSync,
    clearQueue,
    queueSize: queuedOperations.length
  };
};

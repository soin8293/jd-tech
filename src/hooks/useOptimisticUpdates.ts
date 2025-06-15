import { useState, useCallback, useRef, useEffect } from "react";
import { Room } from "@/types/hotel.types";
import { transactionManager, TransactionResult } from "@/utils/transactionManager";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  isRollingBack: boolean;
  error: string | null;
  timestamp: Date;
}

export interface OptimisticOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  optimisticData: T;
  rollbackData?: T;
  operation: () => Promise<TransactionResult<any>>;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution<T> {
  strategy: 'user_wins' | 'server_wins' | 'merge' | 'prompt_user';
  mergeFunction?: (local: T, server: T) => T;
}

export const useOptimisticUpdates = <T>(
  initialData: T[],
  conflictResolution: ConflictResolution<T> = { strategy: 'user_wins' }
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingOperations, setPendingOperations] = useState<Map<string, OptimisticOperation<T>>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ local: T; server: T; operation: OptimisticOperation<T> }>>([]);
  const operationQueue = useRef<OptimisticOperation<T>[]>([]);
  const processingRef = useRef(false);

  // Sync with initial data changes
  useEffect(() => {
    if (initialData && initialData.length > 0 && data.length === 0) {
      setData(initialData);
    }
  }, [initialData, data.length]);

  // Apply optimistic update immediately with conflict detection
  const applyOptimisticUpdate = useCallback((operation: OptimisticOperation<T>) => {
    setData(currentData => {
      const newData = [...currentData];
      
      switch (operation.type) {
        case 'create':
          // Check if item already exists
          const existingIndex = newData.findIndex(item => 
            (item as any).id === (operation.optimisticData as any).id
          );
          if (existingIndex === -1) {
            newData.push(operation.optimisticData);
          } else {
            // Conflict: item being created already exists
            logger.warn('Create conflict detected', { 
              id: (operation.optimisticData as any).id 
            });
          }
          break;
          
        case 'update':
          const updateIndex = newData.findIndex(item => 
            (item as any).id === (operation.optimisticData as any).id
          );
          if (updateIndex !== -1) {
            newData[updateIndex] = operation.optimisticData;
          } else {
            // Item doesn't exist, treat as create
            newData.push(operation.optimisticData);
          }
          break;
          
        case 'delete':
          return newData.filter(item => 
            (item as any).id !== (operation.optimisticData as any).id
          );
          
        default:
          return newData;
      }
      
      return newData;
    });

    setPendingOperations(prev => new Map(prev).set(operation.id, operation));
  }, []);

  // Rollback optimistic update with proper state restoration
  const rollbackOptimisticUpdate = useCallback((operation: OptimisticOperation<T>) => {
    setData(currentData => {
      switch (operation.type) {
        case 'create':
          return currentData.filter(item => 
            (item as any).id !== (operation.optimisticData as any).id
          );
          
        case 'update':
          return operation.rollbackData 
            ? currentData.map(item => 
                (item as any).id === (operation.optimisticData as any).id 
                  ? operation.rollbackData! 
                  : item
              )
            : currentData;
            
        case 'delete':
          return operation.rollbackData 
            ? [...currentData, operation.rollbackData]
            : currentData;
            
        default:
          return currentData;
      }
    });

    setPendingOperations(prev => {
      const next = new Map(prev);
      next.delete(operation.id);
      return next;
    });
  }, []);

  // Handle conflicts based on resolution strategy
  const handleConflict = useCallback(async (
    operation: OptimisticOperation<T>,
    serverData: T
  ) => {
    const localData = operation.optimisticData;
    
    switch (conflictResolution.strategy) {
      case 'user_wins':
        // Keep optimistic data, ignore server data
        logger.info('Conflict resolved: user wins', { 
          id: (localData as any).id 
        });
        break;
        
      case 'server_wins':
        // Replace optimistic data with server data
        setData(currentData => 
          currentData.map(item => 
            (item as any).id === (localData as any).id ? serverData : item
          )
        );
        logger.info('Conflict resolved: server wins', { 
          id: (localData as any).id 
        });
        break;
        
      case 'merge':
        if (conflictResolution.mergeFunction) {
          const mergedData = conflictResolution.mergeFunction(localData, serverData);
          setData(currentData => 
            currentData.map(item => 
              (item as any).id === (localData as any).id ? mergedData : item
            )
          );
          logger.info('Conflict resolved: merged', { 
            id: (localData as any).id 
          });
        }
        break;
        
      case 'prompt_user':
        setConflicts(prev => [...prev, { local: localData, server: serverData, operation }]);
        toast({
          title: "Data Conflict",
          description: "Your changes conflict with recent server changes. Please review.",
          variant: "destructive",
        });
        break;
    }
  }, [conflictResolution]);

  // Process operation queue with enhanced error handling
  const processQueue = useCallback(async () => {
    if (processingRef.current || operationQueue.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    
    const batchSize = 5; // Process in batches to avoid overwhelming the system
    const operations = operationQueue.current.splice(0, batchSize);
    
    for (const operation of operations) {
      try {
        logger.info(`Processing ${operation.type} operation`, { 
          id: operation.id,
          attempt: operation.retryCount + 1
        });
        
        const result = await transactionManager.withRetry(() => operation.operation());
        
        if (result.success) {
          // Operation succeeded
          setPendingOperations(prev => {
            const next = new Map(prev);
            next.delete(operation.id);
            return next;
          });
          
          logger.info(`Operation ${operation.id} completed successfully`);
          
        } else {
          // Operation failed
          if (operation.retryCount < operation.maxRetries && result.retryable) {
            // Retry the operation
            const retryOperation = {
              ...operation,
              retryCount: operation.retryCount + 1
            };
            operationQueue.current.push(retryOperation);
            
            logger.warn(`Operation ${operation.id} failed, will retry`, {
              error: result.error,
              retryCount: retryOperation.retryCount
            });
          } else {
            // Max retries reached or non-retryable error
            rollbackOptimisticUpdate(operation);
            
            logger.error(`Operation ${operation.id} failed permanently`, {
              error: result.error,
              retryCount: operation.retryCount
            });
            
            toast({
              title: "Operation Failed",
              description: result.error || "An unexpected error occurred",
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        logger.error(`Operation ${operation.id} threw error`, error);
        
        if (operation.retryCount < operation.maxRetries) {
          operationQueue.current.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        } else {
          rollbackOptimisticUpdate(operation);
          
          toast({
            title: "Operation Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    }
    
    // Continue processing if there are more operations
    if (operationQueue.current.length > 0) {
      setTimeout(() => {
        processingRef.current = false;
        processQueue();
      }, 100);
    } else {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [rollbackOptimisticUpdate]);

  // Execute optimistic operation with enhanced validation
  const executeOptimistic = useCallback(async (operation: Omit<OptimisticOperation<T>, 'timestamp' | 'retryCount' | 'maxRetries'>) => {
    const fullOperation: OptimisticOperation<T> = {
      ...operation,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // Validate operation before applying
    if (!fullOperation.optimisticData || !(fullOperation.optimisticData as any).id) {
      logger.error('Invalid operation data', fullOperation);
      toast({
        title: "Invalid Operation",
        description: "Operation data is missing required fields",
        variant: "destructive",
      });
      return;
    }

    // Apply optimistic update immediately
    applyOptimisticUpdate(fullOperation);
    
    // Add to queue for processing
    operationQueue.current.push(fullOperation);
    
    // Start processing if not already running
    if (!processingRef.current) {
      processQueue();
    }
  }, [applyOptimisticUpdate, processQueue]);

  // Resolve user conflicts manually
  const resolveConflict = useCallback((
    conflictIndex: number,
    resolution: 'keep_local' | 'use_server' | 'custom',
    customData?: T
  ) => {
    const conflict = conflicts[conflictIndex];
    if (!conflict) return;

    const { local, server, operation } = conflict;

    switch (resolution) {
      case 'keep_local':
        // Keep the optimistic data
        break;
        
      case 'use_server':
        setData(currentData => 
          currentData.map(item => 
            (item as any).id === (local as any).id ? server : item
          )
        );
        break;
        
      case 'custom':
        if (customData) {
          setData(currentData => 
            currentData.map(item => 
              (item as any).id === (local as any).id ? customData : item
            )
          );
        }
        break;
    }

    // Remove conflict from list
    setConflicts(prev => prev.filter((_, index) => index !== conflictIndex));
    
    // Remove from pending operations
    setPendingOperations(prev => {
      const next = new Map(prev);
      next.delete(operation.id);
      return next;
    });
  }, [conflicts]);

  // Clear all conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  // Force sync all pending operations
  const forcSync = useCallback(async () => {
    if (operationQueue.current.length === 0 && pendingOperations.size === 0) {
      toast({
        title: "Nothing to Sync",
        description: "No pending operations to synchronize",
      });
      return;
    }

    await processQueue();
  }, [processQueue]);

  // Get operation status for specific item
  const getOperationStatus = useCallback((id: string) => {
    const operation = Array.from(pendingOperations.values()).find(
      op => (op.optimisticData as any).id === id
    );
    
    if (!operation) return null;
    
    return {
      type: operation.type,
      isPending: true,
      retryCount: operation.retryCount,
      timestamp: operation.timestamp
    };
  }, [pendingOperations]);

  return {
    data,
    setData,
    executeOptimistic,
    hasPendingOperations: pendingOperations.size > 0,
    isProcessing,
    getOperationStatus,
    pendingCount: pendingOperations.size,
    queueSize: operationQueue.current.length,
    conflicts,
    resolveConflict,
    clearConflicts,
    forcSync
  };
};

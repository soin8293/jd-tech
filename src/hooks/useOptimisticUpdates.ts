import { useState, useCallback, useRef } from "react";
import { Room } from "@/types/hotel.types";
import { transactionManager, TransactionResult } from "@/utils/transactionManager";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  isRollingBack: boolean;
  error: string | null;
}

export interface OptimisticOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  optimisticData: T;
  rollbackData?: T;
  operation: () => Promise<TransactionResult<any>>;
}

export const useOptimisticUpdates = <T>(initialData: T[]) => {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingOperations, setPendingOperations] = useState<Map<string, OptimisticOperation<T>>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const operationQueue = useRef<OptimisticOperation<T>[]>([]);

  // Apply optimistic update immediately
  const applyOptimisticUpdate = useCallback((operation: OptimisticOperation<T>) => {
    setData(currentData => {
      switch (operation.type) {
        case 'create':
          return [...currentData, operation.optimisticData];
        case 'update':
          return currentData.map(item => 
            (item as any).id === (operation.optimisticData as any).id 
              ? operation.optimisticData 
              : item
          );
        case 'delete':
          return currentData.filter(item => 
            (item as any).id !== (operation.optimisticData as any).id
          );
        default:
          return currentData;
      }
    });

    setPendingOperations(prev => new Map(prev).set(operation.id, operation));
  }, []);

  // Rollback optimistic update on failure
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

  // Process operation queue
  const processQueue = useCallback(async () => {
    if (isProcessing || operationQueue.current.length === 0) return;

    setIsProcessing(true);
    
    while (operationQueue.current.length > 0) {
      const operation = operationQueue.current.shift()!;
      
      try {
        logger.info(`Processing ${operation.type} operation`, { id: operation.id });
        
        const result = await transactionManager.withRetry(operation.operation);
        
        if (result.success) {
          // Operation succeeded, remove from pending
          setPendingOperations(prev => {
            const next = new Map(prev);
            next.delete(operation.id);
            return next;
          });
          
          logger.info(`Operation ${operation.id} completed successfully`);
        } else {
          // Operation failed, rollback
          logger.error(`Operation ${operation.id} failed`, { error: result.error });
          rollbackOptimisticUpdate(operation);
          
          toast({
            title: "Operation Failed",
            description: result.error || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        logger.error(`Operation ${operation.id} threw error`, error);
        rollbackOptimisticUpdate(operation);
        
        toast({
          title: "Operation Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  }, [isProcessing, rollbackOptimisticUpdate]);

  // Execute optimistic operation
  const executeOptimistic = useCallback(async (operation: OptimisticOperation<T>) => {
    // Apply optimistic update immediately
    applyOptimisticUpdate(operation);
    
    // Add to queue for processing
    operationQueue.current.push(operation);
    
    // Process queue if not already processing
    processQueue();
  }, [applyOptimisticUpdate, processQueue]);

  // Check if any operations are pending
  const hasPendingOperations = pendingOperations.size > 0;

  // Get pending operation for specific item
  const getPendingOperation = useCallback((id: string) => {
    return Array.from(pendingOperations.values()).find(
      op => (op.optimisticData as any).id === id
    );
  }, [pendingOperations]);

  return {
    data,
    setData,
    executeOptimistic,
    hasPendingOperations,
    isProcessing,
    getPendingOperation,
    pendingCount: pendingOperations.size
  };
};
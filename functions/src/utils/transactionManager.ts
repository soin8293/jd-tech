import * as admin from "firebase-admin";
import { logger } from "./logger";

/**
 * Transaction manager for Firestore operations
 */
export class TransactionManager {
  private transaction: admin.firestore.Transaction | null = null;
  private operations: Array<() => void> = [];

  async execute<T>(operation: (transaction: admin.firestore.Transaction) => Promise<T>): Promise<T> {
    const db = admin.firestore();
    
    return await db.runTransaction(async (transaction) => {
      this.transaction = transaction;
      this.operations = [];
      
      logger.info("Starting Firestore transaction");
      
      try {
        const result = await operation(transaction);
        
        logger.info("Transaction completed successfully", { 
          operationsCount: this.operations.length 
        });
        
        return result;
      } catch (error) {
        logger.error("Transaction failed, rolling back", error);
        throw error;
      } finally {
        this.transaction = null;
        this.operations = [];
      }
    });
  }

  addOperation(operation: () => void) {
    this.operations.push(operation);
  }

  get currentTransaction(): admin.firestore.Transaction | null {
    return this.transaction;
  }
}

export const transactionManager = new TransactionManager();
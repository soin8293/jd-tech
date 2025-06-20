
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/useAuth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSecurityAuditLogger } from '@/hooks/useSecurityAuditLogger';

export const useDataDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { logSecurityEvent } = useSecurityAuditLogger();

  const deleteUserData = async (includeAccount: boolean = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete your data.",
        variant: "destructive",
      });
      return false;
    }

    setIsDeleting(true);
    
    try {
      // Log the data deletion request
      logSecurityEvent({
        type: 'DATA_ACCESS',
        action: 'DATA_DELETION_REQUESTED',
        resource: 'user_data',
        details: {
          userId: user.uid,
          includeAccount,
          timestamp: new Date().toISOString()
        },
        severity: 'MEDIUM'
      });

      // Delete user's bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const deletionPromises = bookingsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'bookings', docSnapshot.id))
      );
      
      await Promise.all(deletionPromises);

      // Delete user profile document if it exists
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (error) {
        // User document may not exist, that's okay
        console.log('User document not found or already deleted');
      }

      // Clear local storage
      localStorage.removeItem('cookie-preferences');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('lastBookingId');
      localStorage.removeItem('lastBookingToken');

      // Log successful deletion
      logSecurityEvent({
        type: 'DATA_ACCESS',
        action: 'DATA_DELETION_COMPLETED',
        resource: 'user_data',
        details: {
          userId: user.uid,
          bookingsDeleted: bookingsSnapshot.docs.length,
          includeAccount
        },
        severity: 'HIGH'
      });

      if (includeAccount) {
        // Delete the user account
        await user.delete();
        
        toast({
          title: "Account Deleted",
          description: "Your account and all associated data have been permanently deleted.",
        });
      } else {
        await signOut();
        
        toast({
          title: "Data Deleted",
          description: "Your data has been deleted. Your account remains active.",
        });
      }

      return true;
    } catch (error: any) {
      console.error('Data deletion failed:', error);
      
      logSecurityEvent({
        type: 'FAILED_ACCESS',
        action: 'DATA_DELETION_FAILED',
        resource: 'user_data',
        details: {
          userId: user.uid,
          error: error.message,
          includeAccount
        },
        severity: 'HIGH'
      });

      toast({
        title: "Deletion Failed",
        description: "Unable to delete your data. Please contact support.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteUserData,
    isDeleting,
  };
};

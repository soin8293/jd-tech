
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { decryptBookingPII } from '@/utils/dataEncryption';

export interface ExportableData {
  bookings: any[];
  profile: any;
  preferences: any;
  exportDate: string;
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const exportUserData = async (): Promise<ExportableData | null> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to export your data.",
        variant: "destructive",
      });
      return null;
    }

    setIsExporting(true);
    
    try {
      // Fetch user's bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', currentUser.uid)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Decrypt PII data for export
        return decryptBookingPII(data);
      });

      // Fetch user profile data
      const profile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        emailVerified: currentUser.emailVerified,
        createdAt: currentUser.metadata.creationTime,
        lastSignIn: currentUser.metadata.lastSignInTime,
      };

      // Get stored preferences
      const preferences = {
        cookieConsent: localStorage.getItem('cookie-preferences'),
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
      };

      const exportData: ExportableData = {
        bookings,
        profile,
        preferences,
        exportDate: new Date().toISOString(),
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Export Complete",
        description: "Your data has been downloaded as a JSON file.",
      });

      return exportData;
    } catch (error: any) {
      console.error('Data export failed:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export your data. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportUserData,
    isExporting,
  };
};

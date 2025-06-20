
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDataExport } from '@/hooks/useDataExport';
import { useDataDeletion } from '@/hooks/useDataDeletion';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Download, Trash2, Settings, Shield, Cookie } from 'lucide-react';

const PrivacyDashboard: React.FC = () => {
  const { exportUserData, isExporting } = useDataExport();
  const { deleteUserData, isDeleting } = useDataDeletion();
  const { resetConsent } = useCookieConsent();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDataExport = async () => {
    await exportUserData();
  };

  const handleDataDeletion = async (includeAccount: boolean) => {
    const success = await deleteUserData(includeAccount);
    if (success) {
      setShowDeleteDialog(false);
    }
  };

  const handleCookieReset = () => {
    resetConsent();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Privacy Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your privacy settings and data preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Your Data
            </CardTitle>
            <CardDescription>
              Download a copy of all your personal data stored in our system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your export will include booking history, profile information, and preferences.
            </p>
            <Button onClick={handleDataExport} disabled={isExporting} className="w-full">
              {isExporting ? 'Exporting...' : 'Download My Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Your Data
            </CardTitle>
            <CardDescription>
              Permanently remove your data from our system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Choose to delete just your data or your entire account.
            </p>
            
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete My Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Your Data</DialogTitle>
                  <DialogDescription>
                    Choose what you want to delete. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Delete Data Only</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Remove all your booking data and preferences, but keep your account active.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Delete Data Only
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all your booking data and preferences. 
                            Your account will remain active but all data will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDataDeletion(false)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Data'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="p-4 border rounded-lg border-red-200">
                    <h4 className="font-medium mb-2 text-red-700">Delete Entire Account</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete your account and all associated data.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and all associated data. 
                            You will not be able to recover your account or data after this action.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDataDeletion(true)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setShowDeleteDialog(false)} variant="outline">
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Cookie Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookie Preferences
            </CardTitle>
            <CardDescription>
              Manage your cookie and tracking preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your cookie preferences or reset your consent.
            </p>
            <Button onClick={handleCookieReset} variant="outline" className="w-full">
              Update Cookie Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Information
            </CardTitle>
            <CardDescription>
              Learn about how we protect your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Your data is encrypted at rest and in transit</p>
              <p>• We follow GDPR and CCPA compliance standards</p>
              <p>• Payment information is processed securely via Stripe</p>
              <p>• You can request data export or deletion at any time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyDashboard;

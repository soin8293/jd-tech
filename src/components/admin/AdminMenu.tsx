
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { UsersIcon, PlusCircle, MinusCircle, RefreshCw } from "lucide-react";

const AdminMenu: React.FC = () => {
  const { isAdmin, refreshUserClaims } = useAuth();
  const [email, setEmail] = useState("");
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInitAdminDialog, setShowInitAdminDialog] = useState(false);

  // Function to call the Cloud Function that manages admin roles
  const handleManageAdminRole = async (makeAdmin: boolean) => {
    if (!email) {
      toast({
        title: "Missing information",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const manageAdminRoleFunc = httpsCallable(functions, 'manageAdminRole');
      const result = await manageAdminRoleFunc({ email, makeAdmin });
      const responseData = result.data as { success: boolean; message: string };
      
      toast({
        title: makeAdmin ? "Admin Added" : "Admin Removed",
        description: responseData.message,
      });
      
      setEmail("");
      await refreshUserClaims();
    } catch (error: any) {
      console.error("Error managing admin role:", error);
      toast({
        title: "Operation Failed",
        description: error?.message || "Failed to manage admin role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitializeAdmin = async () => {
    setIsProcessing(true);
    try {
      const setInitialAdminFunc = httpsCallable(functions, 'setInitialAdmin');
      const result = await setInitialAdminFunc({});
      const responseData = result.data as { success: boolean; message: string };
      
      toast({
        title: "Initial Admin Set",
        description: responseData.message,
      });
      
      await refreshUserClaims();
      setShowInitAdminDialog(false);
    } catch (error: any) {
      console.error("Error setting initial admin:", error);
      toast({
        title: "Operation Failed",
        description: error?.message || "Failed to set initial admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage your hotel settings and content as an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/room-management">
              <Button variant="secondary" className="w-full">Manage Rooms</Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsManagingAdmins(true)}
            >
              Manage Admins
            </Button>
          </div>
        </CardContent>
      </Card>

      {isManagingAdmins && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Admins</CardTitle>
            <CardDescription>
              Add or remove admin privileges for users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">User Email</Label>
              <Input
                id="admin-email"
                placeholder="Enter user email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="sm:flex-1 w-full gap-1"
              onClick={() => handleManageAdminRole(true)}
              disabled={isProcessing}
            >
              <PlusCircle className="h-4 w-4" />
              Make Admin
            </Button>
            <Button
              variant="outline"
              className="sm:flex-1 w-full gap-1 text-destructive"
              onClick={() => handleManageAdminRole(false)}
              disabled={isProcessing}
            >
              <MinusCircle className="h-4 w-4" />
              Remove Admin
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setIsManagingAdmins(false)}
              disabled={isProcessing}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={showInitAdminDialog} onOpenChange={setShowInitAdminDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Initialize Admin
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initialize Admin Account</DialogTitle>
            <DialogDescription>
              This will set amirahcolorado@gmail.com as an admin. Only use this if you're having issues with initial admin setup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInitAdminDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitializeAdmin}
              disabled={isProcessing}
            >
              Initialize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenu;

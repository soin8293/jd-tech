
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import AdminList from "./AdminList";

interface AdminManageDialogProps {
  onClose: () => void;
  refreshUserClaims: () => Promise<void>;
}

const AdminManageDialog: React.FC<AdminManageDialogProps> = ({ 
  onClose,
  refreshUserClaims 
}) => {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  return (
    <div className="space-y-6">
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
            onClick={onClose}
            disabled={isProcessing}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
      
      <AdminList />
    </div>
  );
};

export default AdminManageDialog;

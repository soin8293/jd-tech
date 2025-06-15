import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { AdminRole } from "@/types/hotel.types";

interface AdminInviteDialogProps {
  onClose: () => void;
  refreshUserClaims: () => Promise<void>;
}

const AdminInviteDialog: React.FC<AdminInviteDialogProps> = ({ 
  onClose,
  refreshUserClaims 
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("moderator");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInviteAdmin = async () => {
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
      console.log(`Inviting ${email} as ${role}`);
      const inviteAdminFunc = httpsCallable(functions, 'inviteAdmin');
      const data = { email, role };
      console.log('Calling inviteAdmin with data:', data);

      const result = await inviteAdminFunc(data);
      console.log('Response from inviteAdmin:', result);

      const responseData = result.data as { 
        success: boolean; 
        message: string; 
        invitation: any; 
      };

      toast({
        title: "Invitation Sent",
        description: responseData.message,
      });

      // Copy invitation link to clipboard if available
      if (responseData.invitation?.invitationLink) {
        try {
          await navigator.clipboard.writeText(responseData.invitation.invitationLink);
          toast({
            title: "Invitation Link Copied",
            description: "The invitation link has been copied to your clipboard.",
          });
        } catch (error) {
          console.log("Could not copy to clipboard:", error);
        }
      }

      setEmail("");
      setRole("moderator");
      await refreshUserClaims();
    } catch (error: any) {
      console.error("Error inviting admin:", error);

      if (error?.code === 'functions/already-exists') {
        toast({
          title: "User Already Exists",
          description: error?.message || "This user is already an admin or has a pending invitation.",
          variant: "destructive",
        });
      } else if (error?.code === 'functions/permission-denied') {
        toast({
          title: "Permission Denied",
          description: error?.message || "You don't have permission to invite users with this role.",
          variant: "destructive",
        });
      } else if (error?.code === 'functions/resource-exhausted') {
        toast({
          title: "Admin Limit Reached",
          description: error?.message || "Maximum number of admins has been reached.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation Failed",
          description: error?.message || "Failed to send invitation. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const roleDescriptions = {
    super_admin: "Full system access including admin management",
    admin: "Manage rooms, bookings, and invite new admins",
    moderator: "Manage rooms and bookings only"
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1 py-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Admin
          </CardTitle>
          <CardDescription>
            Send an invitation to add a new administrator to the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-role">Admin Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AdminRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">
                  <div className="flex flex-col items-start">
                    <span>Moderator</span>
                    <span className="text-xs text-muted-foreground">
                      {roleDescriptions.moderator}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">
                      {roleDescriptions.admin}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex flex-col items-start">
                    <span>Super Admin</span>
                    <span className="text-xs text-muted-foreground">
                      {roleDescriptions.super_admin}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            className="flex-1"
            onClick={handleInviteAdmin}
            disabled={isProcessing}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Invitation
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminInviteDialog;

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { RefreshCw } from "lucide-react";

interface InitAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshUserClaims: () => Promise<void>;
}

const InitAdminDialog: React.FC<InitAdminDialogProps> = ({
  open,
  onOpenChange,
  refreshUserClaims
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
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
  );
};

export default InitAdminDialog;

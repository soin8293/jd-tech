
import React from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const InitializeAdmin = () => {
  const { toast } = useToast();
  const { refreshUserClaims } = useAuth();
  const [isInitializing, setIsInitializing] = React.useState(false);

  const handleInitializeAdmin = async () => {
    setIsInitializing(true);
    const functions = getFunctions();
    const setInitialAdminFunc = httpsCallable(functions, 'setInitialAdmin');

    try {
      await setInitialAdminFunc();
      await refreshUserClaims();
      
      toast({
        title: "Admin Initialized",
        description: "You have been granted admin privileges.",
      });
    } catch (error) {
      console.error("Error initializing admin:", error);
      toast({
        title: "Initialization Failed",
        description: "Could not initialize admin. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInitializeAdmin}
      disabled={isInitializing}
      className="gap-1"
    >
      <RefreshCw className={`h-4 w-4 ${isInitializing ? 'animate-spin' : ''}`} />
      Initialize Admin
    </Button>
  );
};

export default InitializeAdmin;

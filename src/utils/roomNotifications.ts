
import { toast } from "@/hooks/use-toast";

export const notifyLocalDataUse = (hasShownLocalDataToast: boolean, setHasShownLocalDataToast: (value: boolean) => void) => {
  if (!hasShownLocalDataToast) {
    toast({
      title: "Using Local Data",
      description: "Unable to access database due to permissions. Using local data for now.",
      variant: "default",
    });
    setHasShownLocalDataToast(true);
  }
};

export const notifyError = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
  });
};

export const notifySuccess = (title: string, description: string) => {
  toast({
    title,
    description,
  });
};

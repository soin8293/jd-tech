
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportModal = ({ open, onOpenChange }: SupportModalProps) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "supportRequests"), {
        userEmail: currentUser?.email,
        userId: currentUser?.uid,
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: "pending"
      });

      toast({
        title: "Success",
        description: "Your message has been sent. We'll get back to you soon!",
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="How can we help you?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;

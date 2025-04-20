
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { addNoteToBooking, addChargeToBooking, getBookingIssues } from "@/services/room/roomService";
import { BookingNote, ChargeRecord } from "@/types/hotel.types";

interface UseBookingIssuesProps {
  bookingId: string;
  userName?: string;
}

export const useBookingIssues = ({ bookingId, userName = "Staff" }: UseBookingIssuesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"general" | "issue" | "payment" | "damage">("general");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeReason, setChargeReason] = useState("");

  // Fetch booking issues
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['booking-issues', bookingId],
    queryFn: () => getBookingIssues(bookingId),
    enabled: !!bookingId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: ({ bookingId, note, createdBy, type }: {
      bookingId: string,
      note: string,
      createdBy: string,
      type: "general" | "issue" | "payment" | "damage"
    }) =>
      addNoteToBooking(bookingId, note, createdBy, type),
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been added to the booking",
      });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ['booking-issues', bookingId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Add charge mutation
  const addChargeMutation = useMutation({
    mutationFn: ({ bookingId, amount, reason, chargedBy }: {
      bookingId: string,
      amount: number,
      reason: string,
      chargedBy: string
    }) =>
      addChargeToBooking(bookingId, amount, reason, chargedBy),
    onSuccess: (transactionId) => {
      toast({
        title: "Charge initiated",
        description: `A charge has been initiated. Transaction ID: ${transactionId}`,
      });
      setChargeAmount("");
      setChargeReason("");
      queryClient.invalidateQueries({ queryKey: ['booking-issues', bookingId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add charge: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    addNoteMutation.mutate({
      bookingId,
      note: newNote,
      createdBy: userName,
      type: noteType
    });
  };

  const handleAddCharge = () => {
    const amount = parseFloat(chargeAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!chargeReason.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for the charge",
        variant: "destructive",
      });
      return;
    }

    addChargeMutation.mutate({
      bookingId,
      amount,
      reason: chargeReason,
      chargedBy: userName
    });
  };

  return {
    // Data
    notes: data?.notes || [],
    charges: data?.charges || [],
    isLoading,
    error,

    // State
    newNote,
    setNewNote,
    noteType,
    setNoteType,
    chargeAmount,
    setChargeAmount,
    chargeReason,
    setChargeReason,

    // Actions
    handleAddNote,
    handleAddCharge,
    refetch,

    // Status
    isAddingNote: addNoteMutation.isPending,
    isAddingCharge: addChargeMutation.isPending,
  };
};

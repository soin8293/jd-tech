
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  PencilIcon, 
  DollarSignIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CheckCircleIcon
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getBookingIssues, addNoteToBooking, addChargeToBooking } from "@/services/room/roomService";
import { BookingNote, ChargeRecord } from "@/types/hotel.types";

interface BookingIssueManagerProps {
  bookingId: string;
  userEmail?: string;
  userName?: string;
}

const BookingIssueManager: React.FC<BookingIssueManagerProps> = ({ 
  bookingId,
  userEmail,
  userName
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notes");
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
      refetch();
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
      refetch();
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
      createdBy: userName || "Staff",
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
      chargedBy: userName || "Staff"
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading booking data...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Error loading booking data: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
  
  const notes = data?.notes || [];
  const charges = data?.charges || [];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5" />
          Booking Issue Management
        </CardTitle>
        <CardDescription>
          Manage issues, notes, and additional charges for this booking
          {userEmail && <div className="mt-1 text-sm">Guest: {userEmail}</div>}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes & Issues</TabsTrigger>
            <TabsTrigger value="charges">Charges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add New Note</h3>
              
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant={noteType === "general" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setNoteType("general")}
                  className="col-span-1"
                >
                  General
                </Button>
                <Button 
                  variant={noteType === "issue" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setNoteType("issue")}
                  className="col-span-1"
                >
                  Issue
                </Button>
                <Button 
                  variant={noteType === "payment" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setNoteType("payment")}
                  className="col-span-1"
                >
                  Payment
                </Button>
                <Button 
                  variant={noteType === "damage" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setNoteType("damage")}
                  className="col-span-1"
                >
                  Damage
                </Button>
              </div>
              
              <Textarea 
                placeholder="Enter note details here..." 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px]"
              />
              
              <Button 
                onClick={handleAddNote} 
                disabled={addNoteMutation.isPending}
                className="w-full"
              >
                {addNoteMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Notes History</h3>
              
              {notes.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No notes have been added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: BookingNote, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md border ${
                        note.type === 'issue' 
                          ? 'border-amber-200 bg-amber-50' 
                          : note.type === 'damage' 
                          ? 'border-red-200 bg-red-50' 
                          : note.type === 'payment' 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {note.type === 'issue' 
                              ? 'Issue' 
                              : note.type === 'damage' 
                              ? 'Damage' 
                              : note.type === 'payment' 
                              ? 'Payment' 
                              : 'General'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.createdAt), "PPP p")}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          By: {note.createdBy}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="charges" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add New Charge</h3>
              
              <div className="space-y-2">
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="0.00" 
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Reason for the charge" 
                    value={chargeReason}
                    onChange={(e) => setChargeReason(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAddCharge} 
                disabled={addChargeMutation.isPending}
                className="w-full"
              >
                {addChargeMutation.isPending ? "Processing..." : "Add Charge"}
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Charge History</h3>
              
              {charges.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No charges have been added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {charges.map((charge: ChargeRecord, index: number) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-md border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">${charge.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(charge.date), "PPP")}
                          </p>
                        </div>
                        <Badge variant={
                          charge.status === 'completed' 
                            ? 'default' 
                            : charge.status === 'failed' 
                            ? 'destructive' 
                            : 'outline'
                        }>
                          {charge.status === 'completed' && <CheckCircleIcon className="mr-1 h-3 w-3" />}
                          {charge.status === 'failed' && <AlertTriangleIcon className="mr-1 h-3 w-3" />}
                          {charge.status === 'pending' && <ClockIcon className="mr-1 h-3 w-3" />}
                          {charge.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm">{charge.reason}</p>
                      
                      {charge.transactionId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Transaction ID: {charge.transactionId}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BookingIssueManager;

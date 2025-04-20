
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AdminList: React.FC = () => {
  const [admins, setAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { currentUser, isLoading: authLoading } = useAuth();

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      console.log("Fetching admin list...");
      const adminConfigRef = doc(db, 'config', 'admin');
      const adminConfigSnap = await getDoc(adminConfigRef);

      if (adminConfigSnap.exists()) {
        const data = adminConfigSnap.data();
        console.log("Admin data retrieved:", data);
        setAdmins(data.adminEmails || []);
        if (!data.adminEmails || data.adminEmails.length === 0) {
          setError(null); // Clear any previous error
        }
      } else {
        console.log("No admin document exists");
        setAdmins([]);
        setError("No administrators found.");
      }
    } catch (error: any) {
      console.error("Error fetching admins:", error);

      if (error?.code === 'permission-denied') {
        setPermissionDenied(true);
        setError("You don't have permission to view the admin list.");
      } else {
        setError("Failed to load administrator list");
        toast({
          title: "Error loading admins",
          description: "There was a problem loading the administrator list",
          variant: "destructive",
        });
      }
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAdmins();
    } else {
      setError(null); // Clear any previous error
      setAdmins([]);
      console.log("User not logged in, skipping admin fetch");
    }
    // Only refetch when currentUser changes & is present (avoid unnecessary fetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Current Administrators</CardTitle>
          <CardDescription>
            Users with full system access
          </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAdmins} disabled={isLoading || !currentUser}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {!currentUser ? (
          <div className="text-center py-4 text-muted-foreground">
            Please log in to view administrators
          </div>
        ) : permissionDenied ? (
          <div className="flex items-center justify-center gap-2 text-amber-600 py-4">
            <ShieldAlert className="h-4 w-4" />
            <span>Permission denied. You need to be authenticated as an admin to view this list.</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-amber-600 py-4">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : admins.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((email) => (
                  <TableRow key={email}>
                    <TableCell className="font-medium">{email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {isLoading ? "Loading admins..." : "No administrators found"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminList;


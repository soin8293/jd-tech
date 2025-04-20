
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminList: React.FC = () => {
  const [admins, setAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const adminConfigRef = doc(db, 'config', 'admin');
      const adminConfigSnap = await getDoc(adminConfigRef);
      
      if (adminConfigSnap.exists()) {
        const data = adminConfigSnap.data();
        setAdmins(data.adminEmails || []);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Current Administrators</CardTitle>
          <CardDescription>
            Users with full system access
          </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAdmins} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {admins.length > 0 ? (
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

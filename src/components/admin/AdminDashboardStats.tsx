
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminDashboardStatsProps {
  roomCount: number;
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ roomCount }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Overview</CardTitle>
        <CardDescription>
          Quick summary of your hotel system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Total Rooms</TableCell>
              <TableCell>{roomCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Admin Access</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardStats;

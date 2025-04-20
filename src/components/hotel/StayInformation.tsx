
import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const StayInformation: React.FC = () => {
  return (
    <div className="mt-6 p-6 bg-secondary/50 rounded-lg text-sm">
      <h3 className="font-medium mb-2">About Your Stay</h3>
      <Separator className="my-2" />
      <div className="space-y-1 mt-3 text-muted-foreground">
        <p>• Check-in from 3:00 PM</p>
        <p>• Check-out until 11:00 AM (Nigerian time)</p>
        <p>• Free cancellation up to 48 hours before arrival</p>
        <p>• Breakfast included with all bookings</p>
        <p>• Free WiFi throughout the property</p>
      </div>
    </div>
  );
};

export default StayInformation;

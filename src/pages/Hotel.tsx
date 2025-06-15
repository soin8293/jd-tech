import React from "react";
import HotelHeader from "@/components/hotel/HotelHeader";
import HotelBookingContent from "@/components/hotel/HotelBookingContent";
import NebulaBackground from "@/components/backgrounds/NebulaBackground";

const Hotel: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 relative">
      <NebulaBackground />
      <div className="relative z-10">
        <HotelHeader />
        <HotelBookingContent />
      </div>
    </div>
  );
};

export default Hotel;

import React from "react";
import HotelHeader from "@/components/hotel/HotelHeader";
import HotelBookingContent from "@/components/hotel/HotelBookingContent";

const Hotel: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 relative bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-600/10">
      <div className="relative z-10">
        <HotelHeader />
        <HotelBookingContent />
      </div>
    </div>
  );
};

export default Hotel;

import React from "react";
import HotelHeader from "@/components/hotel/HotelHeader";
import HotelBookingContent from "@/components/hotel/HotelBookingContent";
import LazyNebulaBackground from "@/components/lazy/LazyNebulaBackground";

const Hotel: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 relative">
      <LazyNebulaBackground />
      <div className="relative z-10">
        <HotelHeader />
        <HotelBookingContent />
      </div>
    </div>
  );
};

export default Hotel;

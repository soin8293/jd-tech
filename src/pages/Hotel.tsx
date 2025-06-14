import React from "react";
import HotelHeader from "@/components/hotel/HotelHeader";
import HotelBookingContent from "@/components/hotel/HotelBookingContent";

const Hotel: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 relative">
      {/* CSS-only nebula background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,204,255,0.1)_0%,transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(0,204,255,0.05)_0%,transparent_40%)] animate-pulse [animation-delay:1s]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,204,255,0.05)_0%,transparent_40%)] animate-pulse [animation-delay:2s]"></div>
      </div>
      <div className="relative z-10">
        <HotelHeader />
        <HotelBookingContent />
      </div>
    </div>
  );
};

export default Hotel;

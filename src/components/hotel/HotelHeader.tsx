
import React from "react";
import { cn } from "@/lib/utils";
import { hotelDetails } from "@/data/hotel.data";
import { Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HotelHeaderProps {
  className?: string;
}

const HotelHeader: React.FC<HotelHeaderProps> = ({ className }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "relative w-full overflow-hidden", 
      isMobile ? "h-[85vh] pb-32" : "h-[60vh] mb-0", 
      className
    )}>
      {/* Background matching landing page */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500">
          {/* Bottom Gradient for Text Readability */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-8 lg:px-20 pb-10 md:pb-16 lg:pb-20 text-white z-10">
        <div className={cn(
          "max-w-5xl animate-slide-up opacity-0 space-y-6", 
          isMobile ? "mb-32" : ""
        )} style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <div className="inline-flex items-center mb-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            <Star className="w-4 h-4 mr-1 text-yellow-400" />
            <span>{hotelDetails.rating}/5 — Premier Destination</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4 text-balance">
            Book a Room
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mb-8">
            {hotelDetails.description}
          </p>
          
          <div className="flex flex-wrap gap-2 text-sm mb-4">
            {hotelDetails.amenities.slice(0, 6).map((amenity, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelHeader;

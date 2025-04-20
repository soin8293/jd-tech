
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
    <div className={cn("relative w-full overflow-hidden", isMobile ? "h-[85vh] pb-32" : "h-[70vh]", className)}>
      {/* Background Image with Modernistic Sky Blue Gradient */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-sky-300 to-blue-200">
          <div 
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
              opacity: 0.8
            }}
          />
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 bg-repeat-space mix-blend-overlay" />
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/3"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))"
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-8 lg:px-20 pb-10 md:pb-16 lg:pb-20 text-white z-10">
        <div className={cn(
          "max-w-5xl animate-slide-up opacity-0",
          isMobile ? "mb-32" : ""
        )} style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          <div className="inline-flex items-center mb-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            <Star className="w-4 h-4 mr-1 text-yellow-400" />
            <span>{hotelDetails.rating}/5 — Premier Destination</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4 text-balance">
            {hotelDetails.name}
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

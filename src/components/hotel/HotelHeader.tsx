
import React from "react";
import { cn } from "@/lib/utils";
import { hotelDetails } from "@/data/hotel.data";
import { Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import GradientHero from "@/components/backgrounds/GradientHero";

interface HotelHeaderProps {
  className?: string;
}

// Header container with background and layout
const HeaderContainer = ({ children, className, isMobile }: { children: React.ReactNode, className?: string, isMobile: boolean }) => (
  <div className={cn(
    "overflow-hidden relative rounded-t-3xl", 
    isMobile ? "h-[85vh]" : "h-[60vh]", 
    className
  )}>
    {children}
  </div>
);

// Content wrapper with positioning and padding
const ContentWrapper = ({ children, isMobile }: { children: React.ReactNode, isMobile: boolean }) => (
  <div className={cn(
    "flex flex-col justify-end px-6 md:px-8 lg:px-20 text-white h-full relative z-10",
    isMobile ? "pb-4" : "pb-6 md:pb-8 lg:pb-10"
  )}>
    {children}
  </div>
);

// Main content box with background and rounded corners
const ContentBox = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="max-w-5xl animate-slide-up opacity-0 space-y-6 bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10 relative overflow-hidden" 
    style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
  >
    <GradientHero className="absolute inset-0 rounded-3xl" />
    {children}
  </div>
);

// Rating badge component
const RatingBadge = () => (
  <div className="inline-flex items-center mb-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm relative z-10">
    <Star className="w-4 h-4 mr-1 text-yellow-400" />
    <span>{hotelDetails.rating}/5 — Premier Destination</span>
  </div>
);

// Main title component
const MainTitle = () => (
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4 text-balance relative z-10">
    Book a Room
  </h1>
);

// Description component
const Description = () => (
  <p className="text-lg md:text-xl text-white/90 max-w-3xl mb-8 relative z-10">
    {hotelDetails.description}
  </p>
);

// Amenities list component
const AmenitiesList = () => (
  <div className="flex flex-wrap gap-2 text-sm mb-4 relative z-10">
    {hotelDetails.amenities.slice(0, 6).map((amenity, index) => (
      <span 
        key={index}
        className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm"
      >
        {amenity}
      </span>
    ))}
  </div>
);

const HotelHeader: React.FC<HotelHeaderProps> = ({ className }) => {
  const isMobile = useIsMobile();
  
  return (
    <HeaderContainer className={className} isMobile={isMobile}>
      <ContentWrapper isMobile={isMobile}>
        <ContentBox>
          <RatingBadge />
          <MainTitle />
          <Description />
          <AmenitiesList />
        </ContentBox>
      </ContentWrapper>
    </HeaderContainer>
  );
};

export default HotelHeader;

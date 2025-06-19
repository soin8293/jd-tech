
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

// Main content box with responsive flexbox layout and sizing
const ContentBox = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="book-card animate-slide-up opacity-0 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10 relative overflow-hidden" 
    style={{ 
      animationDelay: "0.3s", 
      animationFillMode: "forwards",
      minHeight: "clamp(24rem, 60vh, 38rem)",
      maxWidth: "90vw",
      width: "clamp(20rem, 80vw, 64rem)",
      display: "flex",
      flexDirection: "column",
      padding: "2rem",
      gap: "1.5rem"
    }}
  >
    <style jsx>{`
      @media (max-height: 600px) {
        .book-card {
          padding: 1.25rem 1rem !important;
          gap: 0.75rem !important;
        }
      }
    `}</style>
    <GradientHero className="absolute inset-0 rounded-3xl" />
    <div className="flex flex-col h-full relative z-10" style={{ gap: "1.5rem" }}>
      {children}
    </div>
  </div>
);

// Rating badge component
const RatingBadge = () => (
  <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full relative z-10 self-start"
       style={{ fontSize: "clamp(0.875rem, 2vw + 0.5rem, 1rem)" }}>
    <Star className="w-4 h-4 mr-1 text-yellow-400" />
    <span>{hotelDetails.rating}/5 — Premier Destination</span>
  </div>
);

// Main title component with responsive typography
const MainTitle = () => (
  <h1 className="font-light tracking-tight text-balance relative z-10"
      style={{ 
        fontSize: "clamp(2rem, 5vw + 1rem, 4.5rem)",
        lineHeight: "1.2",
        marginBottom: "1rem"
      }}>
    Book a Room
  </h1>
);

// Description component with responsive typography
const Description = () => (
  <p className="text-white/90 max-w-3xl relative z-10"
     style={{ 
       fontSize: "clamp(1rem, 2vw + 0.5rem, 1.25rem)",
       lineHeight: "1.4",
       marginBottom: "2rem"
     }}>
    {hotelDetails.description}
  </p>
);

// Amenities list component with responsive button-like styling
const AmenitiesList = () => (
  <div className="flex flex-col sm:flex-row gap-3 mt-auto relative z-10">
    {hotelDetails.amenities.slice(0, 6).map((amenity, index) => (
      <span 
        key={index}
        className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-center"
        style={{
          minHeight: "3rem",
          width: "clamp(8rem, 35%, 12rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(0.75rem, 1.5vw + 0.5rem, 0.875rem)",
          minWidth: "44px", // Accessibility tap target
          minHeight: "44px"
        }}
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

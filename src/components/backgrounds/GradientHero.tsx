import React from "react";

interface GradientHeroProps {
  className?: string;
  children?: React.ReactNode;
}

const GradientHero: React.FC<GradientHeroProps> = ({ className = "", children }) => {
  return (
    <div className={`relative w-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-600/20 opacity-20" />
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='60' height='60'%3e%3ccircle cx='30' cy='30' r='1' fill='%23ffffff' fill-opacity='0.1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e")`,
        opacity: 0.3
      }} />
      {/* Bottom Gradient for Text Readability */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GradientHero;
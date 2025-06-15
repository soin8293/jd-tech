import React from "react";

interface NebulaBackgroundProps {
  className?: string;
  starCount?: number;
}

const NebulaBackground: React.FC<NebulaBackgroundProps> = ({ 
  className = "",
  starCount = 200 
}) => {
  return (
    <div className={`fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden ${className}`}>
      {/* Main breathing nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,204,255,0.3)_0%,rgba(0,150,255,0.1)_40%,transparent_70%)] animate-[pulse_5s_ease-in-out_infinite]"></div>
      
      {/* Secondary nebula clouds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,204,255,0.15)_0%,transparent_50%)] animate-[pulse_7s_ease-in-out_infinite] [animation-delay:1s]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,204,255,0.15)_0%,transparent_50%)] animate-[pulse_6s_ease-in-out_infinite] [animation-delay:2s]"></div>
      
      {/* Micro-stars */}
      <div className="absolute inset-0 opacity-60">
        {Array.from({ length: starCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_4px_rgba(0,204,255,0.8)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NebulaBackground;
import React from "react";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Circle, Clock, Timer } from "lucide-react";
import { DocumentIntelPanel } from "@/components/dashboard/DocumentIntelPanel";

export default function CurriculumPage() {
  return (
    <div className="relative h-full">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-semibold tracking-widest text-st-text-muted uppercase mb-8">
          Live Curriculum State
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[400px] space-y-6 flex-shrink-0">
            {/* In Progress Card */}
            <Card className="bg-st-bg-elevated border-st-border overflow-hidden">
              <div className="p-5 border-b border-st-border/50">
                <p className="text-[10px] font-semibold tracking-wider text-st-accent uppercase mb-2">In Progress</p>
                <h3 className="text-lg font-medium text-st-text-primary">Systems Architecture</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-st-accent flex-shrink-0" />
                  <span className="text-sm text-st-text-secondary">Caching Layers</span>
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-st-text-muted flex-shrink-0" />
                  <span className="text-sm text-st-text-primary font-medium">Load Balancing (Current)</span>
                </div>
              </div>
            </Card>

            {/* Upcoming Sessions Card */}
            <Card className="bg-st-bg-card border-st-border p-5">
              <h3 className="text-sm font-medium text-st-text-secondary mb-4">Upcoming Sessions</h3>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-st-bg-elevated border border-st-border flex-shrink-0">
                  <span className="text-st-accent font-bold text-lg leading-none">26</span>
                  <span className="text-[9px] font-semibold text-st-text-muted uppercase mt-1">Oct</span>
                </div>
                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Database Sharding</h4>
                  <div className="flex items-center gap-1 text-xs text-st-text-muted">
                    <Clock className="w-3 h-3" />
                    <span>09:00 - 11:30</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Hardware Acceleration Week Banner */}
            <div className="relative rounded-xl overflow-hidden border border-st-border h-48 group cursor-pointer">
              {/* Fallback gradient if image not found */}
              <div className="absolute inset-0 bg-gradient-to-br from-st-bg-elevated to-black z-0"></div>
              
              {/* Abstract circuit pattern placeholder */}
              <svg className="absolute inset-0 w-full h-full opacity-30 z-0" xmlns="http://www.w3.org/2000/svg">
                <rect x="20%" y="30%" width="60%" height="40%" rx="4" fill="none" stroke="#D4A043" strokeWidth="1"/>
                <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#D4A043" strokeWidth="1"/>
                <line x1="0" y1="50%" x2="20%" y2="50%" stroke="#D4A043" strokeWidth="1"/>
                <line x1="80%" y1="50%" x2="100%" y2="50%" stroke="#D4A043" strokeWidth="1"/>
                <line x1="50%" y1="0" x2="50%" y2="30%" stroke="#D4A043" strokeWidth="1"/>
                <line x1="50%" y1="70%" x2="50%" y2="100%" stroke="#D4A043" strokeWidth="1"/>
              </svg>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
              
              <div className="absolute bottom-4 left-4 z-20">
                <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase">
                  Hardware Acceleration Week
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
             <DocumentIntelPanel />
          </div>
        </div>
      </div>

      {/* Floating Timer Widget */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-st-bg-elevated/90 backdrop-blur border border-st-border rounded-full py-2 px-4 shadow-xl">
         <div className="w-10 h-10 rounded-full bg-st-accent/10 flex items-center justify-center border border-st-accent/20">
           <Timer className="w-5 h-5 text-st-accent" />
         </div>
         <div className="flex flex-col pr-4">
           <span className="font-mono text-xl font-medium tracking-wider text-st-text-primary leading-none">02:45:12</span>
           <span className="text-[9px] font-bold tracking-widest text-st-text-muted uppercase mt-1">Active Deep Work</span>
         </div>
      </div>
    </div>
  );
}

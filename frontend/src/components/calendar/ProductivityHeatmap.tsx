"use client";

import React from "react";
import { format, subDays, startOfDay, getDay, isSameDay } from "date-fns";

interface HeatmapProps {
  events: { start: string | Date; [key: string]: unknown }[];
}

export function ProductivityHeatmap({ events }: HeatmapProps) {
  // Generate last 365 days
  const today = startOfDay(new Date());
  
  // We want to align the grid to weeks, so we calculate how many days to pad
  // so the very first column starts on a Sunday.
  const daysInYear = 365;
  const startDate = subDays(today, daysInYear - 1);
  const startDayOfWeek = getDay(startDate);
  
  // Create the exact grid of days
  const totalDays = daysInYear + startDayOfWeek;
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    if (i < startDayOfWeek) return null; // Padding days
    return subDays(today, totalDays - 1 - i);
  });

  const getDayIntensity = (date: Date) => {
    // Count events on this day
    const count = events.filter(e => isSameDay(new Date(e.start), date)).length;
    
    if (count === 0) return "bg-st-bg-elevated border border-st-border"; // 0 events
    if (count === 1) return "bg-st-accent/40 border border-st-accent/20"; // low
    if (count === 2) return "bg-st-accent/70 border border-st-accent/50"; // med
    return "bg-st-accent shadow-[0_0_8px_rgba(var(--st-accent-rgb),0.5)]"; // high
  };

  const getTooltip = (date: Date) => {
    const count = events.filter(e => isSameDay(new Date(e.start), date)).length;
    return `${count} session${count === 1 ? '' : 's'} on ${format(date, "MMM d, yyyy")}`;
  };

  const monthLabels: { name: string; index: number }[] = [];
  let currentMonth = -1;
  daysArray.forEach((date, i) => {
    if (date && date.getMonth() !== currentMonth && date.getDate() <= 14) {
      monthLabels.push({ name: format(date, "MMM"), index: i });
      currentMonth = date.getMonth();
    }
  });

  return (
    <div className="flex-1 bg-st-bg-primary rounded-xl shadow-sm border border-st-border p-8 min-h-[600px] overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-bold text-st-text-primary">Annual Productivity Activity</h3>
            <p className="text-st-text-secondary text-sm mt-1">365-day history of your deep work and sessions.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-st-text-secondary">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-st-bg-elevated border border-st-border" />
            <div className="w-3 h-3 rounded-sm bg-st-accent/40 border border-st-accent/20" />
            <div className="w-3 h-3 rounded-sm bg-st-accent/70 border border-st-accent/50" />
            <div className="w-3 h-3 rounded-sm bg-st-accent" />
            <span>More</span>
          </div>
        </div>

        <div className="relative">
          {/* Month Labels */}
          <div className="flex text-xs text-st-text-secondary mb-2 pl-8">
            {monthLabels.map((m, idx) => (
              <div 
                key={idx} 
                className="absolute"
                style={{ left: `${(Math.floor(m.index / 7) * 16) + 32}px` }}
              >
                {m.name}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 text-[10px] text-st-text-secondary pr-2 pt-5">
              <span className="h-3 leading-3">Mon</span>
              <span className="h-3 leading-3 mt-3">Wed</span>
              <span className="h-3 leading-3 mt-3">Fri</span>
            </div>

            {/* Grid */}
            <div className="flex gap-1 pt-1">
              {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, rowIndex) => {
                    const dayIndex = colIndex * 7 + rowIndex;
                    const date = daysArray[dayIndex];

                    if (!date) {
                      return <div key={rowIndex} className="w-3 h-3 rounded-sm opacity-0" />;
                    }

                    return (
                      <div
                        key={rowIndex}
                        title={getTooltip(date)}
                        className={`w-3 h-3 rounded-sm transition-colors cursor-help hover:ring-1 hover:ring-white ${getDayIntensity(date)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

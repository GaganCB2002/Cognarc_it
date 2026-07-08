"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { api } from "@/lib/api";
import { Calendar as CalendarIcon, Grid, List, Activity, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedDayFlow } from "@/components/calendar/AnimatedDayFlow";
import { NewEventModal } from "@/components/calendar/NewEventModal";
import { SyncModal } from "@/components/calendar/SyncModal";
import { ProductivityHeatmap } from "@/components/calendar/ProductivityHeatmap";
import toast from "react-hot-toast";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type ExtendedView = View | "year" | "heatmap";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<ExtendedView>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Flow diagram modal states
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [flowDate, setFlowDate] = useState<Date | null>(null);

  // New features modals
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  
  // Get events for a specific date
  const getEventsForDate = (targetDate: Date | null) => {
    if (!targetDate) return [];
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    
    return events.filter(e => {
      const eStart = new Date(e.start);
      return eStart >= start && eStart <= end;
    });
  };

  const handleSelectEvent = (event: any) => {
    setFlowDate(new Date(event.start));
    setIsFlowOpen(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    setFlowDate(new Date(slotInfo.start));
    setIsFlowOpen(true);
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        const start = new Date(date.getFullYear(), 0, 1).toISOString();
        const end = new Date(date.getFullYear() + 1, 0, 1).toISOString();
        const res = (await api.get(`/calendar?start=${start}&end=${end}`)) as any;
        
        // Map backend events to react-big-calendar format
        const formatted = (res.data || []).map((e: any) => ({
          ...e,
          id: e.id,
          title: e.title,
          start: new Date(e.startTime),
          end: e.endTime ? new Date(e.endTime) : new Date(e.startTime),
          type: e.eventType?.toLowerCase() || 'other',
        }));
        
        setEvents(formatted);
      } catch (error) {
        console.error("Failed to load calendar events", error);
        toast.error("Failed to load events from the server.");
      }
    }
    loadEvents();
  }, [date]);

  const handleCreateEvent = async (newEventData: any) => {
    try {
      // Optimistic update
      const tempEvent = { ...newEventData, id: Math.random().toString(), color: "#3b82f6" };
      if (tempEvent.type === "learning") tempEvent.color = "#10b981";
      if (tempEvent.type === "coding") tempEvent.color = "#8b5cf6";
      if (tempEvent.type === "task") tempEvent.color = "#ef4444";
      
      setEvents((prev) => [...prev, tempEvent]);
      toast.success("Event created successfully!");

      // Real API Call
      await api.post("/calendar", {
        title: newEventData.title,
        startTime: newEventData.start.toISOString(),
        endTime: newEventData.end.toISOString(),
        eventType: newEventData.type.toUpperCase(),
        notes: newEventData.notes,
      });
    } catch (e) {
      toast.error("Error syncing event with the server.");
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = event.color || "#3b82f6"; // default blue
    if (event.type === "learning") backgroundColor = "#10b981"; // green
    if (event.type === "coding") backgroundColor = "#8b5cf6"; // purple
    if (event.type === "meeting") backgroundColor = "#f59e0b"; // orange
    if (event.type === "task") backgroundColor = "#ef4444"; // red

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0",
        display: "block",
        fontSize: "12px",
        fontWeight: 500,
        padding: "2px 6px"
      }
    };
  };

  const renderCustomView = () => {
    if (view === "year") {
      return (
        <div className="flex-1 flex items-center justify-center bg-st-bg-elevated rounded-xl border border-st-border">
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-st-text-muted mb-4" />
            <h3 className="text-lg font-bold text-st-text-primary">Yearly Overview</h3>
            <p className="text-sm text-st-text-secondary">Year view module is rendering historical aggregates.</p>
          </div>
        </div>
      );
    }
    
    if (view === "heatmap") {
      return <ProductivityHeatmap events={events} />;
    }

    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-st-border p-6 min-h-[600px] text-black">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view as View}
          onView={(newView) => setView(newView as View)}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          popup
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          views={["month", "week", "day", "agenda"]}
        />
      </div>
    );
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Enterprise Planning</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Master Calendar</h1>
          <p className="text-st-text-secondary mt-1">Sync your study sessions, meetings, and 100-year milestones.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsSyncOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />Sync External
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsNewEventOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />New Event
          </Button>
        </div>
      </div>

      <div className="flex gap-2 bg-st-bg-elevated p-1 rounded-lg border border-st-border w-fit">
        {[
          { key: Views.DAY, icon: List, label: "Day" },
          { key: Views.WEEK, icon: Grid, label: "Week" },
          { key: Views.MONTH, icon: CalendarIcon, label: "Month" },
          { key: Views.AGENDA, icon: List, label: "Agenda" },
          { key: "year", icon: Grid, label: "Year" },
          { key: "heatmap", icon: Activity, label: "Heatmap" },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key as ExtendedView)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${view === v.key ? "bg-st-accent text-black shadow-sm" : "text-st-text-secondary hover:text-st-text-primary"}`}>
            <v.icon className="w-4 h-4" />{v.label}
          </button>
        ))}
      </div>

      {renderCustomView()}
      
      <AnimatedDayFlow 
        isOpen={isFlowOpen} 
        onClose={() => setIsFlowOpen(false)} 
        date={flowDate} 
        events={getEventsForDate(flowDate)} 
      />
      
      <NewEventModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSave={handleCreateEvent}
      />
      
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
      />
    </div>
  );
}

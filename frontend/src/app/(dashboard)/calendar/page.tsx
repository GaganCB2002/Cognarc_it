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

type CalendarEventItem = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  color?: string;
  notes?: string;
};

type CalendarEventRaw = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  eventType?: string;
  color?: string;
  notes?: string;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [view, setView] = useState<ExtendedView>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Flow diagram modal states
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [flowDate, setFlowDate] = useState<Date | null>(null);

  // New features modals
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
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
      const eEnd = new Date(e.end);
      return (eStart >= start && eStart <= end) || (eStart < start && eEnd >= start);
    });
  };

  const handleSelectEvent = (event: CalendarEventItem) => {
    setFlowDate(new Date(event.start));
    setIsFlowOpen(true);
  };

  const handleEditEvent = (event: CalendarEventItem) => {
    setEditingEvent(event);
    setIsNewEventOpen(true);
  };

  const handleCloseNewEvent = () => {
    setEditingEvent(null);
    setIsNewEventOpen(false);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setFlowDate(new Date(slotInfo.start));
    setIsFlowOpen(true);
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        const start = new Date(date.getFullYear(), 0, 1).toISOString();
        const end = new Date(date.getFullYear() + 1, 0, 1).toISOString();
        const res = await api.get<CalendarEventRaw[]>(`/calendar?start=${start}&end=${end}`);
        
        // Map backend events to react-big-calendar format
        const formatted = (res || []).map((e: CalendarEventRaw) => {
          const startDate = new Date(e.startTime || "");
          const endDate = e.endTime ? new Date(e.endTime) : new Date(startDate);
          return {
            id: e.id,
            title: e.title,
            start: startDate,
            end: endDate,
            type: e.eventType?.toLowerCase() || 'other',
            color: e.color,
            notes: e.notes,
          } as CalendarEventItem;
        });
        
        setEvents(formatted);
      } catch (error) {
        console.error("Failed to load calendar events", error);
        toast.error("Failed to load events from the server.");
      }
    }
    loadEvents();
  }, [date]);

  const getEventColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "learning": return "#10b981";
      case "coding": return "#8b5cf6";
      case "meeting": return "#f59e0b";
      case "task": return "#ef4444";
      default: return "#3b82f6";
    }
  };

  const handleCreateEvent = async (newEventData: { title: string; type: string; start: string | Date; end?: string | Date; notes?: string; color?: string }) => {
    try {
      const color = getEventColor(newEventData.type);
      const tempEvent: CalendarEventItem = { ...newEventData, id: crypto.randomUUID(), color, start: new Date(newEventData.start), end: newEventData.end ? new Date(newEventData.end) : new Date(newEventData.start) };

      setEvents((prev) => [...prev, tempEvent]);

      const startISO = typeof newEventData.start === 'string' ? newEventData.start : newEventData.start.toISOString();
      const endISO = newEventData.end ? (typeof newEventData.end === 'string' ? newEventData.end : newEventData.end.toISOString()) : startISO;

      const res = await api.post<{ id: string }>("/calendar", {
        title: newEventData.title,
        startTime: startISO,
        endTime: endISO,
        eventType: newEventData.type.toUpperCase(),
        color,
        notes: newEventData.notes,
      });

      setEvents((prev) => prev.map(e => e.id === tempEvent.id ? { ...e, id: res.id } : e));
      toast.success("Event created successfully!");
    } catch {
      toast.error("Error syncing event with the server.");
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: { title?: string; type?: string; start?: string | Date; end?: string | Date; notes?: string; color?: string }) => {
    try {
      const color = updates.color || getEventColor(updates.type || '');
      await api.put(`/calendar/${eventId}`, {
        title: updates.title || '',
        startTime: updates.start instanceof Date ? updates.start.toISOString() : new Date(updates.start || '').toISOString(),
        endTime: updates.end instanceof Date ? updates.end.toISOString() : new Date(updates.end || '').toISOString(),
        eventType: (updates.type || '').toUpperCase(),
        color,
        notes: updates.notes,
      });

      setEvents((prev) => prev.map(e => e.id === eventId ? { ...e, ...updates, color, start: new Date(updates.start || e.start), end: new Date(updates.end || e.end) } : e));
      toast.success("Event updated successfully!");
    } catch {
      toast.error("Error updating event.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/calendar/${eventId}`);
      setEvents((prev) => prev.filter(e => e.id !== eventId));
      toast.success("Event deleted successfully!");
    } catch {
      toast.error("Error deleting event.");
    }
  };

  const eventStyleGetter = (event: CalendarEventItem) => {
    const backgroundColor = event.color || getEventColor(event.type);

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

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    const isTomorrow = date.getDate() === tomorrow.getDate() &&
                       date.getMonth() === tomorrow.getMonth() &&
                       date.getFullYear() === tomorrow.getFullYear();

    if (isToday) {
      return {
        style: {
          backgroundColor: "rgba(204, 255, 0, 0.08)",
          color: "#ccff00",
        }
      };
    }

    if (isTomorrow) {
      return {
        style: {
          backgroundColor: "rgba(139, 92, 246, 0.08)",
        }
      };
    }

    return {};
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
      return <ProductivityHeatmap events={events.map(e => ({ start: e.start, count: 1 }))} />;
    }

    return (
      <div className="flex-1 bg-st-bg-card rounded-xl shadow-sm border border-st-border p-6 min-h-[600px] text-st-text-primary">
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
          dayPropGetter={dayPropGetter}
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
        <div className="flex gap-3 items-center">
          <div className="text-xs font-semibold font-mono text-st-accent bg-st-bg-elevated border border-st-border px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-st-accent animate-pulse" />
            {format(currentTime, "yyyy-MM-dd HH:mm:ss")}
          </div>
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
        onEdit={(event) => handleEditEvent(event as CalendarEventItem)}
        onDelete={handleDeleteEvent}
      />
      
      <NewEventModal
        isOpen={isNewEventOpen}
        onClose={handleCloseNewEvent}
        onSave={editingEvent ? (data) => handleUpdateEvent(editingEvent.id, data) : handleCreateEvent}
        onDelete={editingEvent ? () => { handleDeleteEvent(editingEvent.id); handleCloseNewEvent(); } : undefined}
        initialData={editingEvent ?? undefined}
      />
      
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
      />
    </div>
  );
}

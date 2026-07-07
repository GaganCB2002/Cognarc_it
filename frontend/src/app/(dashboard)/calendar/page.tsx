"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Mock fetching events from backend API (which is currently stubbed in Phase 1)
    const mockEvents = [
      {
        id: 1,
        title: "Deep Work Session (React)",
        start: new Date(new Date().setHours(10, 0, 0, 0)),
        end: new Date(new Date().setHours(12, 0, 0, 0)),
        type: "study",
      },
      {
        id: 2,
        title: "Backend Refactoring",
        start: new Date(new Date().setHours(14, 0, 0, 0)),
        end: new Date(new Date().setHours(16, 30, 0, 0)),
        type: "coding",
      },
      {
        id: 3,
        title: "Sprint Planning",
        start: new Date(new Date().setDate(new Date().getDate() + 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
        type: "meeting",
      }
    ];
    setEvents(mockEvents);
  }, []);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3b82f6"; // default blue
    if (event.type === "study") backgroundColor = "#10b981"; // green
    if (event.type === "coding") backgroundColor = "#8b5cf6"; // purple
    if (event.type === "meeting") backgroundColor = "#f59e0b"; // orange

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

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-st-text-primary">Master Calendar</h1>
          <p className="text-st-text-secondary mt-1">Sync your study sessions, meetings, and milestones.</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-st-bg-elevated border border-st-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Sync External
            </button>
            <button className="bg-st-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
              + New Event
            </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-st-border p-6 min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          popup
          selectable
          onSelectEvent={(event) => alert(`Selected Event: ${event.title}`)}
          onSelectSlot={(slotInfo) => console.log("Selected slot", slotInfo)}
          views={["month", "week", "day", "agenda"]}
        />
      </div>
    </div>
  );
}

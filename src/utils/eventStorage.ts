import { CalendarEvent } from '../types/event';

const STORAGE_KEY = 'calendar-events';

export const eventStorage = {
  getEvents: (): CalendarEvent[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveEvents: (events: CalendarEvent[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },

  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const events = eventStorage.getEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    events.push(newEvent);
    eventStorage.saveEvents(events);
    return newEvent;
  },

  updateEvent: (id: string, updates: Partial<CalendarEvent>): CalendarEvent | null => {
    const events = eventStorage.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    events[index] = {
      ...events[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    eventStorage.saveEvents(events);
    return events[index];
  },

  deleteEvent: (id: string): boolean => {
    const events = eventStorage.getEvents();
    const filteredEvents = events.filter(e => e.id !== id);
    if (filteredEvents.length === events.length) return false;
    eventStorage.saveEvents(filteredEvents);
    return true;
  },

  getEventsForDate: (date: string): CalendarEvent[] => {
    const events = eventStorage.getEvents();
    return events.filter(event => event.date === date);
  },

  getUpcomingEvents: (limit: number = 5): CalendarEvent[] => {
    const events = eventStorage.getEvents();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    return events
      .filter(event => {
        if (event.date > today) return true;
        if (event.date === today && event.time && event.time > currentTime) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time && !b.time) return 1;
        if (!a.time && b.time) return -1;
        return 0;
      })
      .slice(0, limit);
  }
};
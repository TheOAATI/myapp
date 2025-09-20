export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  endTime?: string; // HH:MM format
  color: string;
  category?: string;
  location?: string;
  reminder?: number; // minutes before event
  isAllDay: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  color: string;
  category: string;
  location: string;
  reminder: number;
  isAllDay: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
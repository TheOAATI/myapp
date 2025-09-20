import React from 'react';
import { CalendarEvent } from '../types/event';
import { JournalEntry } from '../types/journal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Clock, 
  MapPin, 
  BookOpen, 
  Edit, 
  AlertCircle,
  Flag,
  Calendar
} from 'lucide-react';

interface DayTimelineProps {
  selectedDate: string;
  events: CalendarEvent[];
  journalEntries?: JournalEntry[];
  onEditEvent: (event: CalendarEvent) => void;
  onEditJournal?: (journal: JournalEntry) => void;
  timezone?: string;
  getEventStyle?: (event: CalendarEvent) => string;
}

export function DayTimeline({ 
  selectedDate, 
  events = [], 
  journalEntries = [], 
  onEditEvent, 
  onEditJournal,
  timezone = 'UTC',
  getEventStyle
}: DayTimelineProps) {
  if (!selectedDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Day Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select a date to view timeline
          </p>
        </CardContent>
      </Card>
    );
  }

  const dayEvents = events.filter(event => event.date === selectedDate);
  const dayJournals = journalEntries.filter(journal => journal.date === selectedDate);

  // Generate time slots for the day (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const time24 = hour.toString().padStart(2, '0') + ':00';
    const time12 = hour === 0 ? '12:00 AM' : 
                   hour < 12 ? `${hour}:00 AM` : 
                   hour === 12 ? '12:00 PM' : 
                   `${hour - 12}:00 PM`;
    return { hour, time24, time12 };
  });

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter(event => {
      if (event.isAllDay) return hour === 0; // Show all-day events at midnight
      if (!event.time) return false;
      const eventHour = parseInt(event.time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 border-red-600';
      case 'high': return 'bg-orange-500 border-orange-600';
      case 'medium': return 'bg-yellow-500 border-yellow-600';
      case 'low': return 'bg-green-500 border-green-600';
      default: return 'bg-primary border-primary';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3" />;
      case 'high': return <Flag className="w-3 h-3" />;
      default: return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Day Timeline
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatDate(selectedDate)}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto scroll-smooth">
          {/* All-day events */}
          {dayEvents.filter(event => event.isAllDay).length > 0 && (
            <div className="p-4 border-b bg-muted/50">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                All Day
              </h4>
              <div className="space-y-2">
                {dayEvents.filter(event => event.isAllDay).map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded border-l-4 ${getPriorityColor(event.priority)} bg-card`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(event.priority)}
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        {event.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditEvent(event)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly timeline */}
          <div className="divide-y">
            {timeSlots.map(({ hour, time24, time12 }) => {
              const hourEvents = getEventsForHour(hour);
              const hourJournals = hour === 0 ? dayJournals : []; // Show journals at start of day
              
              return (
                <div key={hour} className="flex">
                  {/* Time column */}
                  <div className="w-20 p-2 text-xs text-muted-foreground border-r bg-muted/20 text-center">
                    <div>{time12.split(' ')[0]}</div>
                    <div className="text-xs opacity-70">{time12.split(' ')[1]}</div>
                  </div>
                  
                  {/* Content column */}
                  <div className="flex-1 p-2 min-h-[48px]">
                    {/* Events */}
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={`mb-2 p-2 rounded border-l-4 ${getPriorityColor(event.priority)} bg-card hover:bg-accent/50 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(event.priority)}
                              <span className="font-medium text-sm">{event.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(event.time)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {event.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              )}
                              {event.category && (
                                <Badge variant="outline" className="text-xs">
                                  {event.category}
                                </Badge>
                              )}
                              {event.priority && (
                                <Badge variant="secondary" className="text-xs">
                                  {event.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditEvent(event)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Journal entries (shown at start of day) */}
                    {hourJournals.map(journal => (
                      <div
                        key={journal.id}
                        className="mb-2 p-2 rounded border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-sm">{journal.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {journal.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {journal.mood && (
                                <Badge variant="outline" className="text-xs">
                                  {journal.mood}
                                </Badge>
                              )}
                              {journal.tags?.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {onEditJournal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditJournal(journal)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Empty state for hour */}
                    {hourEvents.length === 0 && hourJournals.length === 0 && (
                      <div className="text-xs text-muted-foreground/50 italic py-2">
                        {/* No content for this hour */}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarEvent } from '../types/event';
import { dateUtils } from '../utils/dateUtils';
import { Clock, MapPin, Edit, Trash2, Calendar } from 'lucide-react';

interface UpcomingEventsProps {
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  getEventStyle?: (event: CalendarEvent) => string;
}

export function UpcomingEvents({ events, onEditEvent, onDeleteEvent, getEventStyle }: UpcomingEventsProps) {
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  useEffect(() => {
    if (events.length > 0) {
      setNextEvent(events[0]);
    } else {
      setNextEvent(null);
    }
  }, [events]);

  useEffect(() => {
    if (!nextEvent) return;

    const updateTimer = () => {
      const timeUntil = dateUtils.getTimeUntilEventWithSeconds(nextEvent.date, nextEvent.time);
      setTimeUntilNext(timeUntil);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [nextEvent]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events</p>
            <p className="text-sm">Create your first event to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next Event Timer */}
      {nextEvent && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Next Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-medium">{nextEvent.title}</h3>
              <p className="text-sm text-muted-foreground">
                {dateUtils.formatDateTime(nextEvent.date, nextEvent.time)}
              </p>
            </div>
            {timeUntilNext !== 'Past event' && (
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-2xl font-mono font-bold text-primary">
                  {timeUntilNext}
                </div>
                <div className="text-xs text-muted-foreground">until event</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto scroll-smooth">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${getEventStyle ? getEventStyle(event) : ''}`}
            >
              <div
                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dateUtils.formatDateTime(event.date, event.time)}
                    </p>
                    
                    {event.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {event.location}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.category && (
                        <Badge variant="secondary" className="text-xs">
                          {event.category}
                        </Badge>
                      )}
                      {event.priority && (
                        <Badge 
                          variant={event.priority === 'urgent' ? 'destructive' : 'outline'} 
                          className="text-xs"
                        >
                          {event.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditEvent(event)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEvent(event.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
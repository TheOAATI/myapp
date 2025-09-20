import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarEvent } from '../types/event';
import { JournalEntry } from '../types/journal';
import { Graph } from '../types/graph';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as math from 'mathjs';
import { dateUtils } from '../utils/dateUtils';
import { Clock, MapPin, Edit, Trash2, Calendar, User, Bell, BookOpen, FileText } from 'lucide-react';

interface EventDetailsProps {
  events: CalendarEvent[];
  journalEntries?: JournalEntry[];
  selectedDate: string | null;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onEditJournal?: (journal: JournalEntry) => void;
  onCreateJournal?: () => void;
  onDeleteJournal?: (id: string) => void;
  graphs?: Graph[];
}

export function EventDetails({ events, journalEntries = [], selectedDate, onEditEvent, onDeleteEvent, onEditJournal, onCreateJournal, onDeleteJournal, graphs = [] }: EventDetailsProps) {
  if (!selectedDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a date to view events</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dayEvents = events.filter(event => event.date === selectedDate);
  const dayJournals = journalEntries.filter(journal => journal.date === selectedDate);
  const dayGraphs = graphs.filter(graph => graph.date === selectedDate);
  const totalItems = dayEvents.length + dayJournals.length + dayGraphs.length;

  if (totalItems === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {dateUtils.formatDate(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No events or journal entries on this date</p>
            <p className="text-sm">Click "Add Event" or "Add Journal" to create one!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort events by time
  const sortedEvents = dayEvents.sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {dateUtils.formatDate(selectedDate)}
          <div className="ml-auto flex items-center gap-2">
            {dayEvents.length > 0 && (
              <Badge variant="secondary">
                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {dayJournals.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                {dayJournals.length} journal{dayJournals.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto scroll-smooth">
        {/* Events */}
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {onCreateJournal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCreateJournal}
                    className="h-8 w-8 p-0"
                    title="Create Journal Entry"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditEvent(event)}
                  className="h-8 w-8 p-0"
                  title="Edit Event"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteEvent(event.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {event.isAllDay 
                    ? 'All day' 
                    : event.time 
                      ? event.endTime 
                        ? `${dateUtils.formatTime(event.time)} - ${dateUtils.formatTime(event.endTime)}`
                        : dateUtils.formatTime(event.time)
                      : 'No time set'
                  }
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              {event.category && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {event.category}
                  </Badge>
                </div>
              )}

              {event.reminder && event.reminder > 0 && (
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {event.reminder >= 1440 
                      ? `${Math.floor(event.reminder / 1440)} day${Math.floor(event.reminder / 1440) !== 1 ? 's' : ''} before`
                      : event.reminder >= 60 
                        ? `${Math.floor(event.reminder / 60)} hour${Math.floor(event.reminder / 60) !== 1 ? 's' : ''} before`
                        : `${event.reminder} minute${event.reminder !== 1 ? 's' : ''} before`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Journal Entries */}
        {dayJournals.map((journal) => (
          <div
            key={journal.id}
            className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors bg-amber-50/20 dark:bg-amber-950/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-4 h-4 rounded mt-0.5 flex-shrink-0 bg-amber-500 flex items-center justify-center">
                  <FileText className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg text-amber-800 dark:text-amber-200">{journal.title}</h3>
                  <div 
                    className="text-sm text-amber-700 dark:text-amber-300 mt-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: journal.content.replace(/&lt;[^&gt;]*&gt;/g, '').substring(0, 100) + '...' }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {onEditJournal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditJournal(journal)}
                    className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    title="Edit Journal Entry"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDeleteJournal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteJournal(journal.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete Journal Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
              <span>Journal Entry</span>
              <span className="text-amber-500">•</span>
              <span>Created {new Date(journal.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      {dayGraphs.length > 0 && (
        <>
          <h3 className="font-semibold mt-4">Graphs</h3>
          {dayGraphs.map((graph) => {
            const data = generateData(graph.equation);
            return (
              <div key={graph.id} className="border rounded-lg p-4 mt-2">
                <h4 className="font-medium">{graph.equation}</h4>
                <LineChart width={300} height={200} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="y" stroke="#8884d8" />
                </LineChart>
              </div>
            );
          })}
        </>
      )}
      </CardContent>
    </Card>
  );
}

const generateData = (eq: string) => {
  try {
    const compiled = math.compile(eq);
    const newData = [];
    for (let x = -10; x <= 10; x += 0.5) {
      const y = compiled.evaluate({ x });
      newData.push({ x, y });
    }
    return newData;
  } catch (error) {
    return [];
  }
};
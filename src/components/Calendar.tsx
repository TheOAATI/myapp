import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, Plus, BookOpen, BarChart } from 'lucide-react';
import { CalendarEvent } from '../types/event';
import { JournalEntry } from '../types/journal';
import { eventStorage } from '../utils/eventStorage';
import { dateUtils } from '../utils/dateUtils';
import { Graph } from '../types/graph';

interface CalendarProps {
  onSelectDate: (date: string) => void;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onAddJournal: () => void;
  onAddGraph: () => void;
  onEditJournal: (journal: JournalEntry) => void;
  selectedDate: string | null;
  events: CalendarEvent[];
  journalEntries: JournalEntry[];
  viewMode?: 'day' | 'week' | 'month' | 'year';
  weekStart?: number;
  getEventStyle?: (event: CalendarEvent) => string;
    graphs?: Graph[];
  onViewGraph?: (graph: Graph) => void;
}

export function Calendar({ 
  onSelectDate, 
  onAddEvent, 
  onEditEvent, 
  onAddJournal, 
  onAddGraph,
  onEditJournal, 
  selectedDate, 
  events, 
  journalEntries,
  graphs,
  onViewGraph,
  viewMode = 'month',
  weekStart = 0,
  getEventStyle
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setCalendarEvents(events);
  }, [events]);

  // Update current time every minute for the red line indicator
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime(); // Initial update
    
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = dateUtils.getDaysInMonth(year, month);
  const firstDayOfMonth = dateUtils.getFirstDayOfMonth(year, month);

  const previousPeriod = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
        break;
      case 'week':
        setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'year':
        setCurrentDate(new Date(year - 1, month));
        break;
      case 'month':
      default:
        setCurrentDate(new Date(year, month - 1));
        break;
    }
  };

  const nextPeriod = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        break;
      case 'week':
        setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
        break;
      case 'year':
        setCurrentDate(new Date(year + 1, month));
        break;
      case 'month':
      default:
        setCurrentDate(new Date(year, month + 1));
        break;
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const getJournalEntriesForDate = (day: number): JournalEntry[] => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return journalEntries.filter(entry => entry.date === dateStr);
};

const getGraphsForDate = (day: number): Graph[] => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return graphs?.filter(graph => graph.date === dateStr) || [];
};

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(dateStr);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent date selection when clicking event
    onEditEvent(event);
  };

  const handleJournalClick = (journal: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent date selection when clicking journal
    onEditJournal(journal);
  };

  // Calculate current time position as percentage of the day (0-100%)
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const percentageOfDay = (totalMinutes / (24 * 60)) * 100;
    return percentageOfDay;
  };

  const renderDayView = () => {
    const selectedDay = selectedDate ? new Date(selectedDate) : new Date();
    const dayEvents = calendarEvents.filter(event => event.date === selectedDate);
    const dayJournals = journalEntries.filter(entry => entry.date === selectedDate);
    
    const handleDayClick = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      onSelectDate(dateStr);
    };
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {dateUtils.formatDate(selectedDay)}
          </h3>
          {/* Current Time Display */}
          <div className="text-sm text-muted-foreground mt-1">
            Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
        <div className="relative grid grid-cols-1 gap-0 border rounded-lg overflow-hidden max-h-96 overflow-y-auto scroll-smooth">
          {hours.map((hour) => {
            const hourStr = hour.toString().padStart(2, '0');
            const hourEvents = dayEvents.filter(event => 
              event.time && event.time.startsWith(hourStr)
            );
            const hourJournals = dayJournals.filter(journal => 
              journal.time && journal.time.startsWith(hourStr)
            );
            const isCurrentHour = currentTime.getHours() === hour && dateUtils.isToday(selectedDate);

            return (
              <div key={hour} className={`relative flex border-b min-h-[60px] ${isCurrentHour ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                <div className="w-20 p-2 bg-muted border-r text-sm font-medium text-center flex flex-col justify-center">
                  <div>{hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</div>
                  <div className="text-xs text-muted-foreground">{hourStr}:00</div>
                </div>
                <div className="flex-1 p-2 space-y-1">
                  {/* Events */}
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-sm px-2 py-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity ${getEventStyle ? getEventStyle(event) : ''}`}
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{event.time} - {event.title}</span>
                        {event.priority === 'urgent' && (
                          <span className="w-2 h-2 bg-red-400 rounded-full ml-2"></span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Journal Entries */}
                  {hourJournals.map((journal) => (
                    <div
                      key={journal.id}
                      className="text-sm px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleJournalClick(journal, e)}
                    >
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{journal.time} - {journal.title}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Time Indicator Line */}
                  {isCurrentHour && dateUtils.isToday(selectedDate) && (
                    <div 
                      className="absolute left-20 right-0 h-0.5 bg-red-500 rounded-full shadow-lg z-10"
                      style={{ 
                        top: `${(currentTime.getMinutes() / 60) * 60 + 20}px`,
                      }}
                      title={`Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                      <div className="absolute -right-2 -top-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded text-nowrap">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = (dayOfWeek - weekStart + 7) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Week of {dateUtils.formatDate(weekDays[0])}
          </h3>
          {/* Current Time Display */}
          <div className="text-sm text-muted-foreground mt-1">
            Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px] relative">
            {/* Week header */}
            <div className="grid grid-cols-8 gap-0 border rounded-t-lg overflow-hidden">
              <div className="w-20 p-2 bg-muted border-r text-sm font-medium text-center">Time</div>
              {weekDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                const isToday = dateUtils.isToday(dateStr);
                return (
                  <div key={index} className={`p-2 bg-muted border-r text-sm font-medium text-center ${isToday ? 'bg-blue-100 dark:bg-blue-950/40' : ''}`}>
                    <div>{allWeekDays[day.getDay()].slice(0, 3)}</div>
                    <div className={`text-xs ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {/* Week body */}
            <div className="max-h-96 overflow-y-auto scroll-smooth border-x border-b rounded-b-lg">
              {hours.map((hour) => {
                const hourStr = hour.toString().padStart(2, '0');
                return (
                  <div key={hour} className="relative grid grid-cols-8 gap-0 border-b min-h-[50px]">
                    <div className="w-20 p-1 bg-muted border-r text-xs text-center flex flex-col justify-center">
                      <div>{hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</div>
                      <div className="text-xs text-muted-foreground">{hourStr}:00</div>
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const dayEvents = calendarEvents.filter(event => 
                        event.date === dateStr && event.time && event.time.startsWith(hourStr)
                      );
                      const dayJournals = journalEntries.filter(journal => 
                        journal.date === dateStr && journal.time && journal.time.startsWith(hourStr)
                      );
                      const isCurrentHour = currentTime.getHours() === hour && dateUtils.isToday(dateStr);

                      return (
                        <div key={dayIndex} className={`relative p-1 border-r text-xs space-y-1 ${isCurrentHour ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                          {/* Events */}
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
                              style={{ backgroundColor: event.color }}
                              onClick={(e) => handleEventClick(event, e)}
                              title={`${event.title} - ${event.time}`}
                            >
                              <span>{event.title}</span>
                              {event.priority === 'urgent' && (
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                              )}
                            </div>
                          ))}
                          
                          {/* Journal Entries */}
                          {dayJournals.map((journal) => (
                            <div
                              key={journal.id}
                              className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
                              onClick={(e) => handleJournalClick(journal, e)}
                              title={`Journal: ${journal.title} - ${journal.time}`}
                            >
                              <BookOpen className="w-2 h-2" />
                              <span>{journal.title}</span>
                            </div>
                          ))}
                          
                          {/* Current Time Indicator Line */}
                          {isCurrentHour && dateUtils.isToday(dateStr) && (
                            <div 
                              className="absolute left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-lg z-10"
                              style={{ 
                                top: `${(currentTime.getMinutes() / 60) * 50 + 10}px`,
                              }}
                              title={`Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

    // Previous month's trailing days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`prev-${i}`} className="h-24 p-1 text-muted-foreground">
          <div className="text-xs opacity-50">
            {new Date(year, month, -firstDayOfMonth + i + 1).getDate()}
          </div>
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = getEventsForDate(day);
      const dayJournals = getJournalEntriesForDate(day);
const dayGraphs = getGraphsForDate(day);
const totalItems = dayEvents.length + dayJournals.length + dayGraphs.length;
      const maxItems = window.innerWidth < 640 ? 2 : 3;
      const isSelected = selectedDate === dateStr;
      const isToday = dateUtils.isToday(dateStr);

      days.push(
        <div
          key={day}
          className={`h-16 sm:h-20 lg:h-24 p-1 border border-border cursor-pointer hover:bg-accent/50 transition-colors relative ${
            isSelected ? 'bg-primary/10 border-primary' : ''
          } ${isToday ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`text-xs mb-1 ${isToday ? 'font-medium text-blue-600 dark:text-blue-400' : ''}`}>
            {day}
          </div>
          <div className="space-y-0.5 max-h-full overflow-y-auto scroll-smooth">
            {/* Display events */}
            {dayEvents.slice(0, Math.min(maxItems, dayEvents.length)).map((event) => (
              <div
                key={event.id}
                className={`text-[10px] sm:text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${getEventStyle ? getEventStyle(event) : ''}`}
                style={{ backgroundColor: event.color }}
                title={`${event.title}${event.priority ? ` (${event.priority} priority)` : ''} - Click to edit`}
                onClick={(e) => handleEventClick(event, e)}
              >
                <span>{event.title}</span>
                {event.priority === 'urgent' && (
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                )}
              </div>
            ))}
            
            {/* Display journal entries */}
            {dayJournals.slice(0, Math.max(0, maxItems - dayEvents.length)).map((journal) => (
              <div
                key={journal.id}
                className="text-[10px] sm:text-xs px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
                title={`Journal: ${journal.title} - Click to edit`}
                onClick={(e) => handleJournalClick(journal, e)}
              >
                <BookOpen className="w-2 h-2" />
                <span>{journal.title}</span>
              </div>
            ))}
            
            {/* Display graphs */}
            {dayGraphs.slice(0, Math.max(0, maxItems - dayEvents.length - dayJournals.length)).map((graph) => (

              <div

                key={graph.id}

                className="text-[10px] sm:text-xs px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"

                title={`Graph: ${graph.equation}`}

                onClick={(e) => {

                  e.stopPropagation();

                  onViewGraph?.(graph);

                }}

              >

                <BarChart className="w-2 h-2" />

                <span>{graph.equation}</span>

              </div>

            ))}

            {totalItems > maxItems && (
              <div className="text-[10px] sm:text-xs text-muted-foreground px-1">
                +{totalItems - maxItems} more
              </div>
            )}
          </div>
          
          {/* Current Time Indicator - Red Line for Today */}
          {isToday && (
            <div 
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 shadow-lg"
              style={{ 
                top: `${8 + (getCurrentTimePosition() / 100) * (64 - 16)}px`, // Adjusted for responsive height
              }}
              title={`Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
              <div className="absolute -right-8 -top-3 px-1 py-0.5 bg-red-500 text-white text-xs rounded text-nowrap">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Next month's leading days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div key={`next-${day}`} className="h-24 p-1 text-muted-foreground">
          <div className="text-xs opacity-50">{day}</div>
        </div>
      );
    }

    return days;
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1);
      return {
        name: dateUtils.getMonthName(monthDate),
        daysInMonth: dateUtils.getDaysInMonth(year, i),
        firstDayOfMonth: dateUtils.getFirstDayOfMonth(year, i),
        index: i
      };
    });

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{year}</h3>
          {/* Current Time Display */}
          <div className="text-sm text-muted-foreground mt-1">
            Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto scroll-smooth">
          {months.map((monthInfo) => {
            const monthEvents = calendarEvents.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate.getFullYear() === year && eventDate.getMonth() === monthInfo.index;
            });
            const monthJournals = journalEntries.filter(journal => {
              const journalDate = new Date(journal.date);
              return journalDate.getFullYear() === year && journalDate.getMonth() === monthInfo.index;
            });

            return (
              <div key={monthInfo.index} className="border rounded-lg p-2 bg-card">
                <div className="text-center mb-2">
                  <h4 className="text-sm font-medium">{monthInfo.name}</h4>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="text-center text-muted-foreground p-0.5">
                      {day}
                    </div>
                  ))}
                  
                  {/* Render mini calendar days */}
                  {Array.from({ length: monthInfo.firstDayOfMonth }, (_, i) => (
                    <div key={`empty-${i}`} className="p-0.5"></div>
                  ))}
                  
                  {Array.from({ length: monthInfo.daysInMonth }, (_, day) => {
                    const dayNum = day + 1;
                    const dateStr = `${year}-${String(monthInfo.index + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayEvents = monthEvents.filter(event => event.date === dateStr);
                    const dayJournals = monthJournals.filter(journal => journal.date === dateStr);
                    const isToday = dateUtils.isToday(dateStr);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={dayNum}
                        className={`relative p-0.5 text-center cursor-pointer hover:bg-accent rounded transition-colors ${
                          isSelected ? 'bg-primary/20' : ''
                        } ${isToday ? 'bg-blue-100 dark:bg-blue-950/40 font-medium' : ''}`}
                        onClick={() => {
                          const clickedDate = new Date(year, monthInfo.index, dayNum);
                          setCurrentDate(clickedDate);
                          const dateStr = `${year}-${String(monthInfo.index + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          onSelectDate(dateStr);
                        }}
                      >
                        <div className={isToday ? 'text-blue-600 dark:text-blue-400' : ''}>
                          {dayNum}
                        </div>
                        <div className="flex gap-0.5 justify-center mt-0.5">
                          {dayEvents.length > 0 && (
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                          )}
                          {dayJournals.length > 0 && (
                            <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                          )}
                        </div>
                        {/* Current Time Indicator for Today */}
                        {isToday && (
                          <div className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarContent = () => {
    switch (viewMode) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'year':
        return renderYearView();
      case 'month':
      default:
        return (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[280px] grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
              {weekDays.map((day) => (
                <div key={day} className="bg-muted p-1 lg:p-2 text-center text-xs lg:text-sm font-medium border-r border-b min-h-[32px] flex items-center justify-center">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
              {renderMonthView()}
            </div>
          </div>
        );
    }
  };

  // Adjust week days based on weekStart setting
  const allWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays = [...allWeekDays.slice(weekStart), ...allWeekDays.slice(0, weekStart)];

  return (
    <div className="bg-card rounded-lg border p-3 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 lg:gap-4">
            <h2 className="text-lg lg:text-xl font-semibold">
              {viewMode === 'day' && selectedDate ? dateUtils.formatDate(new Date(selectedDate)) : ''}
              {viewMode === 'week' ? `Week of ${dateUtils.formatDate(currentDate)}` : ''}
              {viewMode === 'month' ? dateUtils.getMonthYear(currentDate) : ''}
              {viewMode === 'year' ? year.toString() : ''}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={previousPeriod}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={nextPeriod}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Current Time Display for Month View */}
          {viewMode === 'month' && (
            <div className="text-sm text-muted-foreground">
              Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button size="sm" onClick={onAddEvent}>
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Event</span>
          </Button>
          <Button size="sm" onClick={onAddGraph}>
            <BarChart className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add Graph</span>
            <span className="sm:hidden">Graph</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onAddJournal}>
            <BookOpen className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add Journal</span>
            <span className="sm:hidden">Journal</span>
          </Button>
        </div>
      </div>

      {renderCalendarContent()}
    </div>
  );
}
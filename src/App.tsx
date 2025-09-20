import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventForm } from './components/EventForm';
import { UpcomingEvents } from './components/UpcomingEvents';
import { EventDetails } from './components/EventDetails';
import { AuthForm } from './components/AuthForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Clock } from './components/Clock';
import { JournalForm } from './components/JournalForm';
import { SpecialDates } from './components/SpecialDates';
import { Settings } from './components/Settings';
import { CommandBar } from './components/CommandBar';
import { DayTimeline } from './components/DayTimeline';
import { Button } from './components/ui/button';
import { CalendarEvent, EventFormData } from './types/event';
import { JournalEntry, JournalFormData } from './types/journal';
import { eventStorage } from './utils/eventStorage';
import { supabase, apiClient } from './utils/supabase';
import { toast, Toaster } from "sonner@2.0.3";
import { LogOut, User, Cloud, Moon, Sun, BookOpen } from 'lucide-react';
import GraphForm from './components/GraphForm';
import { graphStorage } from './utils/graphStorage';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

import { AmbientSounds } from './components/AmbientSounds';

function CalendarApp() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isJournalFormOpen, setIsJournalFormOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [isGraphFormOpen, setIsGraphFormOpen] = useState(false);
  const [graphs, setGraphs] = useState<Graph[]>([]);

  const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null);

  // New state for expanded features
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [weekStart, setWeekStart] = useState(0); // 0 = Sunday
  const [timezone, setTimezone] = useState('UTC');
  const [widgets, setWidgets] = useState({
    clock: true,
    upcoming: true,
    specialDates: true,
    timeline: false
  });

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setSyncMode('cloud');
          await loadCloudEvents();
        } else {
          // Load local events if not authenticated
          const loadedEvents = eventStorage.getEvents();
          setEvents(loadedEvents);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        const loadedEvents = eventStorage.getEvents();
        setEvents(loadedEvents);
      } finally {
        setIsLoading(false);
      }
      await loadGraphs();
    };

    // Load journal entries from localStorage
    const loadJournalEntries = () => {
      try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
          setJournalEntries(JSON.parse(savedEntries));
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
      }
    };

    checkUser();
    loadJournalEntries();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setSyncMode('cloud');
        await loadCloudEvents();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSyncMode('local');
        const loadedEvents = eventStorage.getEvents();
        setEvents(loadedEvents);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load events from cloud
  const loadCloudEvents = async () => {
    try {
      const result = await apiClient.events.getEvents();
      setEvents(result.events || []);
      toast.success('Events synced from cloud');
    } catch (error) {
      console.error('Error loading cloud events:', error);
      // Fall back to local storage if cloud sync fails
      const localEvents = eventStorage.getEvents();
      setEvents(localEvents);
      setSyncMode('local');
      toast.error('Cloud sync unavailable, using local storage');
    }
  };

  // Update upcoming events when events change
  useEffect(() => {
    if (syncMode === 'cloud' && user) {
      const loadUpcoming = async () => {
        try {
          const result = await apiClient.events.getUpcomingEvents(10);
          setUpcomingEvents(result.events || []);
        } catch (error) {
          console.error('Error loading upcoming events from cloud:', error);
          // Fall back to calculating from current events
          const upcoming = events
            .filter(event => {
              const now = new Date();
              const today = now.toISOString().split('T')[0];
              const currentTime = now.toTimeString().slice(0, 5);
              if (event.date > today) return true;
              if (event.date === today && event.time && event.time > currentTime) return true;
              return false;
            })
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              if (a.time && b.time) return a.time.localeCompare(b.time);
              return 0;
            })
            .slice(0, 10);
          setUpcomingEvents(upcoming);
        }
      };
      loadUpcoming();
    } else {
      const upcoming = eventStorage.getUpcomingEvents(10);
      setUpcomingEvents(upcoming);
    }
  }, [events, syncMode, user]);

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      if (syncMode === 'cloud' && user) {
        try {
          const result = await apiClient.events.createEvent(data);
          setEvents(prev => [...prev, result.event]);
          toast.success('Event created and synced to cloud!');
        } catch (cloudError) {
          console.error('Cloud sync failed, falling back to local:', cloudError);
          // Fall back to local storage
          const newEvent = eventStorage.addEvent(data);
          setEvents(prev => [...prev, newEvent]);
          setSyncMode('local');
          toast.warning('Event created locally (cloud sync failed)');
        }
      } else {
        const newEvent = eventStorage.addEvent(data);
        setEvents(prev => [...prev, newEvent]);
        toast.success('Event created locally!');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleUpdateEvent = async (data: EventFormData) => {
    if (!editingEvent) return;
    
    try {
      if (syncMode === 'cloud' && user) {
        try {
          const result = await apiClient.events.updateEvent(editingEvent.id, data);
          setEvents(prev => prev.map(e => e.id === editingEvent.id ? result.event : e));
          toast.success('Event updated and synced to cloud!');
        } catch (cloudError) {
          console.error('Cloud sync failed, falling back to local:', cloudError);
          // Fall back to local storage
          const updatedEvent = eventStorage.updateEvent(editingEvent.id, data);
          if (updatedEvent) {
            setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
            setSyncMode('local');
            toast.warning('Event updated locally (cloud sync failed)');
          }
        }
      } else {
        const updatedEvent = eventStorage.updateEvent(editingEvent.id, data);
        if (updatedEvent) {
          setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
          toast.success('Event updated locally!');
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleAddGraph = () => {

  if (!selectedDate) {

    toast.error("Please select a date first.");

    return;

  }

  setIsGraphFormOpen(true);

};

const handleViewGraph = (graph: Graph) => {

  setSelectedGraph(graph);

  setIsGraphFormOpen(true);

};

  const loadGraphs = async () => {
    try {
      if (user) {
        const result = await apiClient.graphs.getGraphs();
        setGraphs(result.graphs || []);
        toast.success('Graphs synced from cloud');
      } else {
        setGraphs(graphStorage.getGraphs());
      }
    } catch (error) {
      console.error('Error loading graphs:', error);
      setGraphs(graphStorage.getGraphs());
      toast.error('Failed to load graphs, using local');
    }
  };

  const loadJournals = async () => {

    try {

      if (user) {

        const result = await apiClient.journals.getJournals();

        setJournalEntries(result.journals || []);

        toast.success('Journals synced from cloud');

      } else {

        const savedEntries = localStorage.getItem('journalEntries');

        if (savedEntries) {

          setJournalEntries(JSON.parse(savedEntries));

        }

      }

    } catch (error) {

      console.error('Error loading journals:', error);

      const savedEntries = localStorage.getItem('journalEntries');

      if (savedEntries) {

        setJournalEntries(JSON.parse(savedEntries));

      }

      toast.error('Failed to load journals from cloud, using local');

    }

  };

  const handleSaveGraph = async (data) => {
    const graphData = {
      equation: data.equation,
      date: data.date
    };

    try {
      let newGraph;
      if (syncMode === 'cloud' && user) {
        try {
          const result = await apiClient.graphs.createGraph(graphData);
          newGraph = result.graph;
          toast.success('Graph created and synced to cloud!');
        } catch (cloudError) {
          console.error('Cloud sync failed, falling back to local:', cloudError);
          newGraph = graphStorage.addGraph(graphData);
          setSyncMode('local');
          toast.warning('Graph created locally (cloud sync failed)');
        }
      } else {
        newGraph = graphStorage.addGraph(graphData);
        toast.success('Graph created locally!');
      }

      if (newGraph) {
        setGraphs(prev => [...prev, newGraph]);
        setIsGraphFormOpen(false);
      }
    } catch (error) {
      console.error('Error creating graph:', error);
      toast.error('Failed to create graph');
    }
  };

  const handleDeleteGraph = async (graphId: string) => {
    if (window.confirm('Are you sure you want to delete this graph?')) {
      try {
        if (syncMode === 'cloud' && user) {
          try {
            await apiClient.graphs.deleteGraph(graphId);
            setGraphs(prev => prev.filter(g => g.id !== graphId));
            toast.success('Graph deleted and synced to cloud!');
          } catch (cloudError) {
            console.error('Cloud sync failed, falling back to local:', cloudError);
            const success = graphStorage.deleteGraph(graphId);
            if (success) {
              setGraphs(prev => prev.filter(g => g.id !== graphId));
              setSyncMode('local');
              toast.warning('Graph deleted locally (cloud sync failed)');
            } else {
              toast.error('Failed to delete graph locally');
            }
          }
        } else {
          const success = graphStorage.deleteGraph(graphId);
          if (success) {
            setGraphs(prev => prev.filter(g => g.id !== graphId));
            toast.success('Graph deleted locally!');
          } else {
            toast.error('Failed to delete graph locally');
          }
        }
      } catch (error) {
        console.error('Error deleting graph:', error);
        toast.error('Failed to delete graph');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        if (syncMode === 'cloud' && user) {
          try {
            await apiClient.events.deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Event deleted and synced to cloud!');
          } catch (cloudError) {
            console.error('Cloud sync failed, falling back to local:', cloudError);
            // Fall back to local storage
            const success = eventStorage.deleteEvent(eventId);
            if (success) {
              setEvents(prev => prev.filter(e => e.id !== eventId));
              setSyncMode('local');
              toast.warning('Event deleted locally (cloud sync failed)');
            }
          }
        } else {
          const success = eventStorage.deleteEvent(eventId);
          if (success) {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Event deleted locally!');
          }
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setSelectedTime(null);
    setIsEventFormOpen(true);
  };

  const handleOpenJournal = () => {
    setEditingJournal(null);
    setIsJournalFormOpen(true);
  };

  const handleEditJournal = (journal: JournalEntry) => {
    setEditingJournal(journal);
    setIsJournalFormOpen(true);
  };

  const handleJournalSubmit = async (entry: JournalFormData) => {
    try {
      let addedEntry;
      if (user) {
        try {
          const result = await apiClient.journals.createJournal(entry);
          addedEntry = result.journal;
          toast.success('Journal created and synced to cloud!');
        } catch (cloudError) {
          console.error('Cloud sync failed, falling back to local:', cloudError);
          const newEntry: JournalEntry = {
            ...entry,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const updatedEntries = [...journalEntries, newEntry];
          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
          addedEntry = newEntry;
          setSyncMode('local');
          toast.warning('Journal created locally (cloud sync failed)');
        }
      } else {
        const newEntry: JournalEntry = {
          ...entry,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedEntries = [...journalEntries, newEntry];
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
        addedEntry = newEntry;
        toast.success('Journal created locally!');
      }
      if (addedEntry) {
        setJournalEntries(prev => [...prev, addedEntry]);
      }
    } catch (error) {
      console.error('Error creating journal:', error);
      toast.error('Failed to create journal');
    }
  };

  const handleJournalUpdate = async (id: string, entry: JournalFormData) => {
    try {
      let updatedSuccessfully = false;
      if (user) {
        try {
          await apiClient.journals.updateJournal(id, entry);
          toast.success('Journal updated and synced to cloud!');
          updatedSuccessfully = true;
        } catch (cloudError) {
          console.error('Cloud sync failed, falling back to local:', cloudError);
          const updatedEntries = journalEntries.map(journal => 
            journal.id === id 
              ? { ...journal, ...entry, updatedAt: new Date().toISOString() }
              : journal
          );
          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
          setJournalEntries(updatedEntries);
          setSyncMode('local');
          toast.warning('Journal updated locally (cloud sync failed)');
          return; // Since we already set state in fallback
        }
      } else {
        const updatedEntries = journalEntries.map(journal => 
          journal.id === id 
            ? { ...journal, ...entry, updatedAt: new Date().toISOString() }
            : journal
        );
        setJournalEntries(updatedEntries);
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
        toast.success('Journal updated locally!');
        return;
      }

      // Update state for cloud success
      if (updatedSuccessfully) {
        setJournalEntries(prev => prev.map(j => j.id === id ? { ...j, ...entry, updatedAt: new Date().toISOString() } : j));
      }
    } catch (error) {
      console.error('Error updating journal:', error);
      toast.error('Failed to update journal');
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        if (user) {
          try {
            await apiClient.journals.deleteJournal(id);
            toast.success('Journal deleted from cloud!');
          } catch (cloudError) {
            console.error('Cloud delete failed, falling back to local:', cloudError);
            const updatedEntries = journalEntries.filter(journal => journal.id !== id);
            localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
            setJournalEntries(updatedEntries);
            setSyncMode('local');
            toast.warning('Journal deleted locally (cloud sync failed)');
          }
        } else {
          const updatedEntries = journalEntries.filter(journal => journal.id !== id);
          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
          setJournalEntries(updatedEntries);
          toast.success('Journal deleted locally!');
        }
        setJournalEntries(prev => prev.filter(j => j.id !== id));
      } catch (error) {
        console.error('Error deleting journal:', error);
        toast.error('Failed to delete journal');
      }
    }
  };

  const handleCloseEventForm = () => {
    setIsEventFormOpen(false);
    setEditingEvent(null);
    setSelectedTime(null);
  };

  const handleCloseJournalForm = () => {
    setIsJournalFormOpen(false);
    setEditingJournal(null);
  };

  const handleFormSubmit = async (data: EventFormData) => {
    if (editingEvent) {
      await handleUpdateEvent(data);
    } else {
      await handleCreateEvent(data);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSyncMode('local');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  };

  const handleContinueWithoutAccount = () => {
    setIsLoading(false);
    setSyncMode('local');
    const loadedEvents = eventStorage.getEvents();
    setEvents(loadedEvents);
    toast.info('Using local storage mode');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Settings handlers
  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'year') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleWeekStartChange = (day: number) => {
    setWeekStart(day);
    localStorage.setItem('weekStart', day.toString());
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    localStorage.setItem('timezone', tz);
  };

  const handleWidgetToggle = (newWidgets: Record<string, boolean>) => {
    setWidgets(newWidgets);
    localStorage.setItem('widgets', JSON.stringify(newWidgets));
  };

  // Load settings on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode') as 'day' | 'week' | 'month' | 'year';
    const savedWeekStart = localStorage.getItem('weekStart');
    const savedTimezone = localStorage.getItem('timezone');
    const savedWidgets = localStorage.getItem('widgets');

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedWeekStart) setWeekStart(parseInt(savedWeekStart));
    if (savedTimezone) setTimezone(savedTimezone);
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading widget settings:', error);
      }
    }
  }, []);

  // Event style based on priority
  const getEventStyle = (event: CalendarEvent) => {
    const priorityStyles = {
      urgent: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
      high: 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      low: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    };
    
    return priorityStyles[event.priority || 'medium'];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold mb-2">Calendar Management</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Manage your events and stay organized with your personal calendar
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              {/* Command Bar */}
              <CommandBar
                events={events}
                journalEntries={journalEntries}
                onEventSelect={(event) => {
                  setSelectedDate(event.date);
                  setEditingEvent(event);
                  setIsEventFormOpen(true);
                }}
                onJournalSelect={(journal) => {
                  setSelectedDate(journal.date);
                  setEditingJournal(journal);
                  setIsJournalFormOpen(true);
                }}
                onCreateEvent={handleAddEvent}
                onCreateJournal={handleOpenJournal}
                  graphs={graphs}
                onToggleTheme={toggleDarkMode}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onSignOut={handleSignOut}
                isDarkMode={isDarkMode}
                isAuthenticated={!!user}
              />

              {widgets.clock && (
                <Clock 
                  timezone={timezone}
                  onTimeSelect={(time) => {
                    setSelectedTime(time);
                    if (selectedDate) {
                      setEditingEvent(null);
                      setIsEventFormOpen(true);
                      toast.info(`Selected time: ${time} for ${selectedDate}`);
                    } else {
                      toast.info(`Selected time: ${time} - Select a date first to create an event`);
                    }
                  }} 
                />
              )}
              <AmbientSounds />

              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <Cloud className="w-4 h-4 text-primary" />
                <span className="text-xs lg:text-sm font-medium text-primary">
                  {syncMode === 'cloud' ? 'Cloud Sync' : 'Local Only'}
                </span>
              </div>

              {/* Settings */}
              <Settings
                onBackgroundTextureChange={() => {}}
                onViewModeChange={handleViewModeChange}
                onWeekStartChange={handleWeekStartChange}
                onTimezoneChange={handleTimezoneChange}
                onWidgetToggle={handleWidgetToggle}
                viewMode={viewMode}
                weekStart={weekStart}
                timezone={timezone}
                widgets={widgets}
              />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleDarkMode}
                className="px-3"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              {user ? (
                <>
                  <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">{user?.user_metadata?.name || user?.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 lg:mr-2" />
                    <span className="hidden lg:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Guest User</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Main Calendar */}
          <div className="xl:col-span-3">
            <div className="overflow-x-auto">
              <Calendar
                events={events}
                journalEntries={journalEntries}
                graphs={graphs}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onAddEvent={handleAddEvent}
                onEditEvent={handleEditEvent}
                onAddJournal={handleOpenJournal}
                onAddGraph={handleAddGraph}

onViewGraph={handleViewGraph}
                onEditJournal={handleEditJournal}
                viewMode={viewMode}
                weekStart={weekStart}
                getEventStyle={getEventStyle}
              />
            </div>
            
            {/* Event Details for Selected Date */}
            <div className="mt-4 lg:mt-6">
              <EventDetails
                events={events}
                journalEntries={journalEntries}
                selectedDate={selectedDate}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onEditJournal={handleEditJournal}
                onCreateJournal={handleOpenJournal}
                onDeleteJournal={handleDeleteJournal}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4 lg:space-y-6">
            {widgets.upcoming && (
              <UpcomingEvents
                events={upcomingEvents}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                getEventStyle={getEventStyle}
              />
            )}

            {widgets.timeline && selectedDate && (
              <DayTimeline
                events={events || []}
                journalEntries={journalEntries}
                selectedDate={selectedDate}
                onEditEvent={handleEditEvent}
                onEditJournal={handleEditJournal}
                getEventStyle={getEventStyle}
              />
            )}

            {widgets.specialDates && <SpecialDates />}
          </div>
        </div>

        {/* Event Form Modal */}
        <EventForm
          isOpen={isEventFormOpen}
          onClose={handleCloseEventForm}
          onSubmit={handleFormSubmit}
          event={editingEvent}
          initialDate={selectedDate || undefined}
          initialTime={selectedTime || undefined}
        />

        {/* Journal Form Modal */}
        <JournalForm
          isOpen={isJournalFormOpen}
          onClose={handleCloseJournalForm}
          onSubmit={handleJournalSubmit}
          onUpdate={handleJournalUpdate}
          entry={editingJournal}
          initialDate={selectedDate || undefined}
        />

        <GraphForm
          open={isGraphFormOpen}
          onOpenChange={(open) => {
              setIsGraphFormOpen(open);
              if (!open) setSelectedGraph(null);
            }}
          onSave={handleSaveGraph}
          initialDate={selectedGraph ? new Date(selectedGraph.date) : selectedDate ? new Date(selectedDate) : undefined}
          initialGraph={selectedGraph}
          onDelete={handleDeleteGraph}
        />

        <Toaster />
        </div>
      </div>
    );
  }
  
  export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/*" element={
        <ErrorBoundary>
          <CalendarApp />
        </ErrorBoundary>
      } />
    </Routes>
  );
}

function handleAddGraph() {
  setIsGraphFormOpen(true);
}

function handleSaveGraph(data) {
  const newGraph = graphStorage.addGraph(data);
  setGraphs(prev => [...prev, newGraph]);
  setIsGraphFormOpen(false);
  toast.success('Graph saved!');
}
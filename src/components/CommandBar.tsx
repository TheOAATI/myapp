import React, { useState, useEffect, useMemo } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Search, 
  Calendar, 
  Clock, 
  Plus, 
  BookOpen, 
  Settings,
  Moon,
  Sun,
  User,
  LogOut,
  Cloud,
  Edit,
  Trash2,
  Eye,
  Palette
} from 'lucide-react';
import { CalendarEvent } from '../types/event';
import { JournalEntry } from '../types/journal';

interface CommandBarProps {
  events: CalendarEvent[];
  journalEntries: JournalEntry[];
  onEventSelect?: (event: CalendarEvent) => void;
  onJournalSelect?: (journal: JournalEntry) => void;
  onCreateEvent?: () => void;
  onCreateJournal?: () => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  isDarkMode?: boolean;
  isAuthenticated?: boolean;
}

export function CommandBar({
  events,
  journalEntries,
  onEventSelect,
  onJournalSelect,
  onCreateEvent,
  onCreateJournal,
  onToggleTheme,
  onOpenSettings,
  onSignOut,
  onDeleteEvent,
  onEditEvent,
  isDarkMode = false,
  isAuthenticated = false
}: CommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut to open command bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter and search results
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filteredEvents = events.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.category?.toLowerCase().includes(query)
    );

    const filteredJournals = journalEntries.filter(journal =>
      journal.title.toLowerCase().includes(query) ||
      journal.content.toLowerCase().includes(query) ||
      journal.mood?.toLowerCase().includes(query) ||
      journal.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    return { events: filteredEvents, journals: filteredJournals };
  }, [events, journalEntries, searchQuery]);

  const handleSelectEvent = (event: CalendarEvent) => {
    onEventSelect?.(event);
    setIsOpen(false);
  };

  const handleSelectJournal = (journal: JournalEntry) => {
    onJournalSelect?.(journal);
    setIsOpen(false);
  };

  const handleCreateEvent = () => {
    onCreateEvent?.();
    setIsOpen(false);
  };

  const handleCreateJournal = () => {
    onCreateJournal?.();
    setIsOpen(false);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="px-3 gap-2"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Search events, journals, or type a command..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={handleCreateEvent}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Event</span>
              <Badge variant="outline" className="ml-auto">Ctrl+E</Badge>
            </CommandItem>
            <CommandItem onSelect={handleCreateJournal}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Create Journal Entry</span>
              <Badge variant="outline" className="ml-auto">Ctrl+J</Badge>
            </CommandItem>
            <CommandItem onSelect={() => handleAction(onToggleTheme || (() => {}))}>
              {isDarkMode ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Toggle {isDarkMode ? 'Light' : 'Dark'} Mode</span>
              <Badge variant="outline" className="ml-auto">Ctrl+D</Badge>
            </CommandItem>
            <CommandItem onSelect={() => handleAction(onOpenSettings || (() => {}))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Open Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Events */}
          {searchResults.events.length > 0 && (
            <CommandGroup heading="Events">
              {searchResults.events.slice(0, 8).map((event) => (
                <CommandItem
                  key={event.id}
                  onSelect={() => handleSelectEvent(event)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{event.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(event.date)}</span>
                        {event.time && <span>{formatTime(event.time)}</span>}
                        {event.category && (
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent?.(event);
                        setIsOpen(false);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent?.(event.id);
                        setIsOpen(false);
                      }}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Journal Entries */}
          {searchResults.journals.length > 0 && (
            <CommandGroup heading="Journal Entries">
              {searchResults.journals.slice(0, 6).map((journal) => (
                <CommandItem
                  key={journal.id}
                  onSelect={() => handleSelectJournal(journal)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{journal.title}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(journal.date)}</span>
                      {journal.mood && (
                        <Badge variant="outline" className="text-xs">
                          {journal.mood}
                        </Badge>
                      )}
                      {journal.tags && journal.tags.length > 0 && (
                        <div className="flex gap-1">
                          {journal.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {journal.content.slice(0, 80)}...
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* System Actions */}
          {isAuthenticated && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem onSelect={() => handleAction(onSignOut || (() => {}))}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {/* No results but show suggestions */}
          {searchQuery && searchResults.events.length === 0 && searchResults.journals.length === 0 && (
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={handleCreateEvent}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create event for "{searchQuery}"</span>
              </CommandItem>
              <CommandItem onSelect={handleCreateJournal}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Create journal entry about "{searchQuery}"</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
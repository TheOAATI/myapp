import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, Calendar, MapPin, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { dateUtils } from '../utils/dateUtils';
import { toast } from "sonner@2.0.3";

interface SpecialDate {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'vacation' | 'religious' | 'personal' | 'cultural';
  description?: string;
  location?: string;
  isRecurring: boolean;
  color: string;
}

// Predefined special dates
const defaultSpecialDates: SpecialDate[] = [
  {
    id: 'ramadan-2025',
    title: 'Ramadan 2025',
    date: '2025-02-28',
    type: 'religious',
    description: 'Holy month of fasting for Muslims',
    isRecurring: true,
    color: '#10B981'
  },
  {
    id: 'eid-al-fitr-2025',
    title: 'Eid al-Fitr 2025',
    date: '2025-03-30',
    type: 'religious',
    description: 'Festival of Breaking the Fast',
    isRecurring: true,
    color: '#F59E0B'
  },
  {
    id: 'christmas-2025',
    title: 'Christmas Day',
    date: '2025-12-25',
    type: 'holiday',
    description: 'Christian holiday celebrating the birth of Jesus Christ',
    isRecurring: true,
    color: '#EF4444'
  },
  {
    id: 'new-year-2026',
    title: 'New Year\'s Day',
    date: '2026-01-01',
    type: 'holiday',
    description: 'First day of the year',
    isRecurring: true,
    color: '#8B5CF6'
  },
  {
    id: 'diwali-2025',
    title: 'Diwali 2025',
    date: '2025-10-20',
    type: 'religious',
    description: 'Hindu festival of lights',
    isRecurring: true,
    color: '#F97316'
  }
];

export function SpecialDates() {
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>(defaultSpecialDates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Partial<SpecialDate>>({
    type: 'personal',
    isRecurring: false,
    color: '#3B82F6'
  });

  // Load custom dates from localStorage
  useEffect(() => {
    const savedDates = localStorage.getItem('specialDates');
    if (savedDates) {
      try {
        const parsed = JSON.parse(savedDates);
        setSpecialDates([...defaultSpecialDates, ...parsed]);
      } catch (error) {
        console.error('Error loading special dates:', error);
      }
    }
  }, []);

  // Save custom dates to localStorage
  const saveCustomDates = (dates: SpecialDate[]) => {
    const customDates = dates.filter(date => !defaultSpecialDates.some(def => def.id === date.id));
    localStorage.setItem('specialDates', JSON.stringify(customDates));
  };

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUpcomingDates = (): SpecialDate[] => {
    const today = new Date().toISOString().split('T')[0];
    return specialDates
      .filter(date => date.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  };

  const handleAddDate = () => {
    if (!newDate.title || !newDate.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const dateToAdd: SpecialDate = {
      id: `custom-${Date.now()}`,
      title: newDate.title,
      date: newDate.date,
      type: newDate.type || 'personal',
      description: newDate.description,
      location: newDate.location,
      isRecurring: newDate.isRecurring || false,
      color: newDate.color || '#3B82F6'
    };

    const updatedDates = [...specialDates, dateToAdd];
    setSpecialDates(updatedDates);
    saveCustomDates(updatedDates);
    
    setIsDialogOpen(false);
    setNewDate({
      type: 'personal',
      isRecurring: false,
      color: '#3B82F6'
    });
    
    toast.success('Special date added successfully!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday': return '🎉';
      case 'vacation': return '✈️';
      case 'religious': return '🕌';
      case 'cultural': return '🎭';
      default: return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'vacation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'religious': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cultural': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const upcomingDates = getUpcomingDates();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Special Dates
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Date
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Special Date</DialogTitle>
                <DialogDescription>
                  Add a special date, holiday, vacation, or cultural event to track upcoming occasions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newDate.title || ''}
                    onChange={(e) => setNewDate({ ...newDate, title: e.target.value })}
                    placeholder="e.g., Summer Vacation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDate.date || ''}
                    onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newDate.type} onValueChange={(value) => setNewDate({ ...newDate, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="religious">Religious</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDate.description || ''}
                    onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newDate.location || ''}
                    onChange={(e) => setNewDate({ ...newDate, location: e.target.value })}
                    placeholder="e.g., Paris, France"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="color"
                      type="color"
                      value={newDate.color}
                      onChange={(e) => setNewDate({ ...newDate, color: e.target.value })}
                      className="w-10 h-8 rounded border border-border"
                    />
                    <span className="text-sm text-muted-foreground">Choose a color for this date</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDate}>
                    Add Date
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming special dates
          </p>
        ) : (
          upcomingDates.map((specialDate) => {
            const daysUntil = getDaysUntil(specialDate.date);
            const isToday = daysUntil === 0;
            const isPast = daysUntil < 0;
            
            return (
              <div
                key={specialDate.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/50 transition-colors"
                style={{ borderLeftColor: specialDate.color, borderLeftWidth: '3px' }}
              >
                <div className="text-lg mt-0.5">
                  {getTypeIcon(specialDate.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">
                        {specialDate.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {dateUtils.formatDate(specialDate.date)}
                      </p>
                      {specialDate.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {specialDate.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={getTypeColor(specialDate.type)} variant="secondary">
                        {specialDate.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isToday ? 'Today!' : 
                         isPast ? 'Past' :
                         daysUntil === 1 ? 'Tomorrow' :
                         `${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                  {specialDate.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {specialDate.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {upcomingDates.length > 0 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Showing next {upcomingDates.length} upcoming dates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
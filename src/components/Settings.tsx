import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Monitor, 
  Calendar,
  Clock,
  Eye,
  Hash,
  Grid,
  Waves
} from 'lucide-react';

interface SettingsProps {
  onBackgroundTextureChange?: (texture: string, intensity: number) => void;
  onViewModeChange?: (mode: 'day' | 'week' | 'month' | 'year') => void;
  onWeekStartChange?: (day: number) => void;
  onTimezoneChange?: (timezone: string) => void;
  onWidgetToggle?: (widgets: Record<string, boolean>) => void;
  viewMode?: 'day' | 'week' | 'month' | 'year';
  weekStart?: number;
  timezone?: string;
  widgets?: Record<string, boolean>;
}

const backgroundTextures = [
  { id: 'none', name: 'None', icon: Monitor },
  { id: 'grain', name: 'Film Grain', icon: Hash },
  { id: 'noise', name: 'Digital Noise', icon: Grid },
  { id: 'paper', name: 'Paper Texture', icon: Hash },
  { id: 'fabric', name: 'Fabric Weave', icon: Waves },
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'America/Chicago',
  'America/Denver',
];

const weekDays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function Settings({
  onBackgroundTextureChange,
  onViewModeChange,
  onWeekStartChange,
  onTimezoneChange,
  onWidgetToggle,
  viewMode = 'month',
  weekStart = 0,
  timezone = 'UTC',
  widgets = {}
}: SettingsProps) {
  const [selectedTexture, setSelectedTexture] = useState('none');
  const [textureIntensity, setTextureIntensity] = useState(20);

  // Initialize settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.backgroundTexture) {
          setSelectedTexture(settings.backgroundTexture);
          applyBackgroundTexture(settings.backgroundTexture, settings.textureIntensity || 20);
        }
        if (settings.textureIntensity) {
          setTextureIntensity(settings.textureIntensity);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const saveSettings = (newSettings: any) => {
    const currentSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const updatedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
  };

  const applyBackgroundTexture = (texture: string, intensity: number) => {
    const body = document.body;
    
    // Remove existing texture classes
    body.classList.remove('texture-grain', 'texture-noise', 'texture-paper', 'texture-fabric');
    
    if (texture !== 'none') {
      body.classList.add(`texture-${texture}`);
      body.style.setProperty('--texture-intensity', `${intensity}%`);
    } else {
      body.style.removeProperty('--texture-intensity');
    }
  };

  const handleTextureChange = (texture: string) => {
    setSelectedTexture(texture);
    applyBackgroundTexture(texture, textureIntensity);
    saveSettings({ backgroundTexture: texture });
    onBackgroundTextureChange?.(texture, textureIntensity);
  };

  const handleIntensityChange = (values: number[]) => {
    const intensity = values[0];
    setTextureIntensity(intensity);
    applyBackgroundTexture(selectedTexture, intensity);
    saveSettings({ textureIntensity: intensity });
    onBackgroundTextureChange?.(selectedTexture, intensity);
  };

  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'year') => {
    onViewModeChange?.(mode);
  };

  const handleWeekStartChange = (day: number) => {
    onWeekStartChange?.(day);
  };

  const handleTimezoneChange = (tz: string) => {
    onTimezoneChange?.(tz);
  };

  const availableWidgets = [
    { id: 'clock', name: 'Clock', icon: Clock },
    { id: 'upcoming', name: 'Upcoming Events', icon: Calendar },
    { id: 'specialDates', name: 'Special Dates', icon: Calendar },
    { id: 'timeline', name: 'Day Timeline', icon: Calendar },
  ];

  const toggleWidget = (widgetId: string) => {
    const newWidgets = { ...widgets, [widgetId]: !widgets[widgetId] };
    onWidgetToggle?.(newWidgets);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="px-3">
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          App Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Background Texture Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Background Texture
            <Badge variant="outline" className="ml-auto text-xs">
              {backgroundTextures.find(t => t.id === selectedTexture)?.name}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="p-2 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texture Style</label>
                <div className="grid grid-cols-1 gap-1">
                  {backgroundTextures.map((texture) => {
                    const Icon = texture.icon;
                    return (
                      <button
                        key={texture.id}
                        onClick={() => handleTextureChange(texture.id)}
                        className={`flex items-center gap-2 w-full p-2 text-left text-sm rounded hover:bg-accent ${
                          selectedTexture === texture.id ? 'bg-accent' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{texture.name}</span>
                        {selectedTexture === texture.id && (
                          <Badge variant="default" className="ml-auto text-xs">Active</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {selectedTexture !== 'none' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intensity: {textureIntensity}%</label>
                  <Slider
                    value={[textureIntensity]}
                    onValueChange={handleIntensityChange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* View Mode Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Calendar View
            <Badge variant="outline" className="ml-auto text-xs">
              {viewMode.toUpperCase()}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {['day', 'week', 'month', 'year'].map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => handleViewModeChange(mode as any)}
                className={viewMode === mode ? 'bg-accent' : ''}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                {viewMode === mode && <Badge variant="default" className="ml-auto text-xs">Active</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Week Start Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week Starts On
            <Badge variant="outline" className="ml-auto text-xs">
              {weekDays.find(d => d.value === weekStart)?.label.slice(0, 3)}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {weekDays.map((day) => (
              <DropdownMenuItem
                key={day.value}
                onClick={() => handleWeekStartChange(day.value)}
                className={weekStart === day.value ? 'bg-accent' : ''}
              >
                {day.label}
                {weekStart === day.value && <Badge variant="default" className="ml-auto text-xs">Active</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Timezone Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timezone
            <Badge variant="outline" className="ml-auto text-xs">
              {timezone.split('/')[1] || timezone}
            </Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
            {timezones.map((tz) => (
              <DropdownMenuItem
                key={tz}
                onClick={() => handleTimezoneChange(tz)}
                className={timezone === tz ? 'bg-accent' : ''}
              >
                {tz}
                {timezone === tz && <Badge variant="default" className="ml-auto text-xs">Active</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Widget Toggles */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Sidebar Widgets
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {availableWidgets.map((widget) => {
              const Icon = widget.icon;
              const isEnabled = widgets[widget.id] !== false; // Default to enabled
              return (
                <DropdownMenuItem
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {widget.name}
                  </div>
                  <Badge variant={isEnabled ? "default" : "outline"} className="text-xs">
                    {isEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
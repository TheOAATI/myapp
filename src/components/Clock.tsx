import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { FullScreenClock } from './FullScreenClock';
import { Maximize2, Globe } from 'lucide-react';

interface ClockProps {
  onTimeSelect?: (time: string) => void;
  timezone?: string;
}

export function Clock({ onTimeSelect, timezone = 'UTC' }: ClockProps) {
  const [time, setTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Convert time to selected timezone
      if (timezone && timezone !== 'UTC') {
        try {
          // Create a date in the target timezone
          const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
          setTime(timeInTimezone);
        } catch (error) {
          // Fallback to UTC if timezone is invalid
          console.warn('Invalid timezone:', timezone, 'falling back to UTC');
          setTime(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
        }
      } else if (timezone === 'UTC') {
        // Convert to UTC
        setTime(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
      } else {
        // Use local time
        setTime(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles for each hand
  const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  // Generate hour options
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  // Generate minute options
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString().padStart(2, '0'),
    label: i.toString().padStart(2, '0')
  }));

  const handleTimeSelect = () => {
    if (onTimeSelect) {
      // Convert to 24-hour format
      let hour24 = parseInt(selectedHour);
      if (selectedPeriod === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (selectedPeriod === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute}`;
      onTimeSelect(timeString);
    }
    setIsOpen(false);
  };

  const handleCurrentTime = () => {
    const now = new Date();
    const currentHour24 = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (onTimeSelect) {
      const timeString = `${currentHour24.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      onTimeSelect(timeString);
    }
    setIsOpen(false);
  };

  const handleClockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail === 2) { // Double click
      setIsFullScreenOpen(true);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-12 h-12 hover:scale-110 transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full">
          {/* Clock face */}
          <div className="w-full h-full rounded-full bg-gray-800 dark:bg-white border border-gray-600 dark:border-gray-200 shadow-sm relative overflow-hidden">
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-2 bg-gray-200 dark:bg-gray-800"
                style={{
                  top: '2px',
                  left: '50%',
                  transformOrigin: '50% 22px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30" />
            
            {/* Hour hand */}
            <div
              className="absolute top-1/2 left-1/2 bg-gray-200 dark:bg-gray-800 rounded-full origin-bottom z-20"
              style={{
                width: '2px',
                height: '14px',
                transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
            
            {/* Minute hand */}
            <div
              className="absolute top-1/2 left-1/2 bg-gray-200 dark:bg-gray-800 rounded-full origin-bottom z-20"
              style={{
                width: '1.5px',
                height: '18px',
                transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
            
            {/* Second hand */}
            <div
              className="absolute top-1/2 left-1/2 origin-bottom z-10"
              style={{
                transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
                transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {/* Second hand with red color and distinctive shape */}
              <div className="relative">
                {/* Main red line */}
                <div 
                  className="bg-red-500 rounded-full"
                  style={{
                    width: '1px',
                    height: '20px',
                  }}
                />
                {/* Red circle at the end */}
                <div 
                  className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"
                  style={{
                    transform: 'translateY(-18px)',
                  }}
                />
              </div>
            </div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium">Select Time</h4>
            <p className="text-sm text-muted-foreground">Choose a time for your event</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hour</label>
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Minute</label>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCurrentTime} className="flex-1">
              Current Time
            </Button>
            <Button onClick={handleTimeSelect} size="sm" className="flex-1">
              Select Time
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullScreenOpen(true)}
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Full Screen Clock
            </Button>
          </div>
        </div>
      </PopoverContent>
      </Popover>

      <FullScreenClock
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        onTimeSelect={onTimeSelect}
        timezone={timezone}
      />
    </>
  );
}
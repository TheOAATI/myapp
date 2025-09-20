import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Palette, Watch, Timer } from 'lucide-react';

interface FullScreenClockProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect?: (time: string) => void;
  timezone?: string;
}

type WatchFace = 'analog' | 'digital' | 'minimal' | 'classic';
type Theme = 'default' | 'neon' | 'wooden' | 'metallic' | 'rainbow';

export function FullScreenClock({ isOpen, onClose, onTimeSelect, timezone = 'UTC' }: FullScreenClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [watchFace, setWatchFace] = useState<WatchFace>('analog');
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Convert time to selected timezone
      if (timezone && timezone !== 'UTC') {
        try {
          const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
          setCurrentTime(timeInTimezone);
        } catch (error) {
          console.warn('Invalid timezone:', timezone, 'falling back to UTC');
          setCurrentTime(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
        }
      } else if (timezone === 'UTC') {
        setCurrentTime(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
      } else {
        setCurrentTime(now);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatTimeNoSeconds = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTimeClick = () => {
    if (onTimeSelect) {
      onTimeSelect(formatTimeNoSeconds(currentTime));
      onClose();
    }
  };

  const getThemeStyles = (theme: Theme) => {
    switch (theme) {
      case 'neon':
        return {
          background: 'linear-gradient(45deg, #0f0f23, #1a1a3e)',
          clockFace: 'bg-black border-4 border-cyan-400 shadow-[0_0_30px_cyan]',
          hands: 'drop-shadow-[0_0_8px_cyan]',
          markers: 'bg-cyan-400 shadow-[0_0_4px_cyan]',
          text: 'text-cyan-400 drop-shadow-[0_0_8px_cyan]',
          glow: true
        };
      case 'wooden':
        return {
          background: 'linear-gradient(45deg, #8B4513, #A0522D)',
          clockFace: 'bg-amber-900 border-4 border-amber-700 shadow-inner',
          hands: '',
          markers: 'bg-amber-100',
          text: 'text-amber-100',
          glow: false
        };
      case 'metallic':
        return {
          background: 'linear-gradient(45deg, #2C3E50, #34495E)',
          clockFace: 'bg-slate-800 border-4 border-slate-500 shadow-xl',
          hands: '',
          markers: 'bg-slate-300',
          text: 'text-slate-300',
          glow: false
        };
      case 'rainbow':
        return {
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)',
          clockFace: 'bg-white border-4 border-transparent bg-gradient-to-r from-pink-500 to-violet-500 shadow-xl',
          hands: '',
          markers: 'bg-gradient-to-r from-pink-500 to-violet-500',
          text: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500',
          glow: false
        };
      default:
        return {
          background: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900',
          clockFace: 'bg-gray-800 dark:bg-white border border-gray-600 dark:border-gray-200',
          hands: '',
          markers: 'bg-gray-200 dark:bg-gray-800',
          text: 'text-gray-200 dark:text-gray-800',
          glow: false
        };
    }
  };

  const themeStyles = getThemeStyles(theme);

  const renderAnalogClock = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;

    return (
      <div 
        className={`relative w-80 h-80 rounded-full ${themeStyles.clockFace} cursor-pointer transition-transform hover:scale-105`}
        onClick={handleTimeClick}
        style={theme === 'neon' || theme === 'rainbow' ? { 
          background: theme === 'rainbow' ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)' : undefined 
        } : {}}
      >
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-8 ${themeStyles.markers} ${themeStyles.glow ? 'animate-pulse' : ''}`}
            style={{
              top: '8px',
              left: '50%',
              transformOrigin: '50% 152px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          />
        ))}
        
        {/* Center dot */}
        <div className={`absolute top-1/2 left-1/2 w-4 h-4 ${themeStyles.markers} rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30`} />
        
        {/* Hour hand */}
        <div
          className={`absolute top-1/2 left-1/2 ${themeStyles.markers} rounded-full origin-bottom z-20 ${themeStyles.hands}`}
          style={{
            width: '6px',
            height: '80px',
            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        />
        
        {/* Minute hand */}
        <div
          className={`absolute top-1/2 left-1/2 ${themeStyles.markers} rounded-full origin-bottom z-20 ${themeStyles.hands}`}
          style={{
            width: '4px',
            height: '110px',
            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        />
        
        {/* Second hand */}
        <div
          className={`absolute top-1/2 left-1/2 bg-red-500 rounded-full origin-bottom z-20`}
          style={{
            width: '2px',
            height: '120px',
            transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    );
  };

  const renderDigitalClock = () => {
    return (
      <div 
        className={`text-8xl font-mono ${themeStyles.text} cursor-pointer transition-transform hover:scale-105 text-center p-8 rounded-2xl bg-black/20 backdrop-blur-sm`}
        onClick={handleTimeClick}
      >
        {formatTime(currentTime)}
        <div className="text-2xl mt-4 opacity-75">
          {currentTime.toLocaleDateString()}
        </div>
      </div>
    );
  };

  const renderMinimalClock = () => {
    return (
      <div 
        className={`text-6xl font-light ${themeStyles.text} cursor-pointer transition-transform hover:scale-105 text-center`}
        onClick={handleTimeClick}
      >
        <div className="flex items-center justify-center space-x-2">
          <span>{currentTime.getHours().toString().padStart(2, '0')}</span>
          <span className="animate-pulse">:</span>
          <span>{currentTime.getMinutes().toString().padStart(2, '0')}</span>
          <span className="animate-pulse">:</span>
          <span className="text-4xl">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
        </div>
        <div className="text-lg mt-4 opacity-60">
          {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    );
  };

  const renderClassicClock = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;

    return (
      <div 
        className={`relative w-96 h-96 rounded-full border-8 border-amber-700 bg-amber-50 cursor-pointer transition-transform hover:scale-105 shadow-2xl`}
        onClick={handleTimeClick}
        style={{ 
          background: 'radial-gradient(circle, #FFF8DC, #F5DEB3)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3), 0 0 50px rgba(0,0,0,0.3)'
        }}
      >
        {/* Roman numerals */}
        {['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((numeral, i) => (
          <div
            key={i}
            className="absolute text-2xl font-serif text-amber-800"
            style={{
              top: '20px',
              left: '50%',
              transformOrigin: '50% 172px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          >
            <span style={{ transform: `rotate(-${i * 30}deg)`, display: 'inline-block' }}>
              {numeral}
            </span>
          </div>
        ))}
        
        {/* Center ornament */}
        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-amber-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30 border-2 border-amber-700" />
        
        {/* Hour hand */}
        <div
          className="absolute top-1/2 left-1/2 bg-amber-800 rounded-full origin-bottom z-20"
          style={{
            width: '8px',
            height: '100px',
            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        />
        
        {/* Minute hand */}
        <div
          className="absolute top-1/2 left-1/2 bg-amber-800 rounded-full origin-bottom z-20"
          style={{
            width: '6px',
            height: '140px',
            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        />
        
        {/* Second hand */}
        <div
          className="absolute top-1/2 left-1/2 bg-red-600 rounded-full origin-bottom z-20"
          style={{
            width: '2px',
            height: '150px',
            transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
    );
  };

  const renderClock = () => {
    switch (watchFace) {
      case 'digital':
        return renderDigitalClock();
      case 'minimal':
        return renderMinimalClock();
      case 'classic':
        return renderClassicClock();
      default:
        return renderAnalogClock();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Full Screen Clock</DialogTitle>
          <DialogDescription>
            Interactive clock display with multiple watch faces and themes. Use the controls to customize appearance and select time.
          </DialogDescription>
        </DialogHeader>
        <div 
          className={`w-full h-full flex flex-col ${themeStyles.background} relative`}
          style={theme === 'neon' ? { background: themeStyles.background } : 
                 theme === 'rainbow' ? { background: themeStyles.background } : {}}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h2 className={`text-2xl font-semibold ${themeStyles.text}`}>Full Screen Clock</h2>
              <Badge variant="outline" className={`${themeStyles.text} border-current`}>
                {formatTime(currentTime)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`${themeStyles.text} hover:bg-white/10`}
              aria-label="Close full screen clock"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Clock Display */}
          <div className="flex-1 flex items-center justify-center p-8">
            {renderClock()}
          </div>

          {/* Controls */}
          <div className="p-6 bg-black/20 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Watch Face Selection */}
              <div className="flex items-center gap-2">
                <Watch className={`w-4 h-4 ${themeStyles.text}`} />
                <span className={`text-sm ${themeStyles.text}`}>Face:</span>
                <div className="flex gap-1">
                  {(['analog', 'digital', 'minimal', 'classic'] as WatchFace[]).map((face) => (
                    <Button
                      key={face}
                      variant={watchFace === face ? "default" : "outline"}
                      size="sm"
                      onClick={() => setWatchFace(face)}
                      className={watchFace !== face ? `${themeStyles.text} border-current hover:bg-white/10` : ''}
                    >
                      {face.charAt(0).toUpperCase() + face.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="flex items-center gap-2">
                <Palette className={`w-4 h-4 ${themeStyles.text}`} />
                <span className={`text-sm ${themeStyles.text}`}>Theme:</span>
                <div className="flex gap-1">
                  {(['default', 'neon', 'wooden', 'metallic', 'rainbow'] as Theme[]).map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(t)}
                      className={theme !== t ? `${themeStyles.text} border-current hover:bg-white/10` : ''}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Select Button */}
              {onTimeSelect && (
                <Button
                  onClick={handleTimeClick}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Use Current Time
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Music, Play, Pause } from 'lucide-react';

const sounds = [
  { name: 'Water', file: 'amb1.mp3' },
  { name: 'White Noise', file: 'amb2.mp3' },
  { name: 'Wind', file: 'amb3.mp3' },
];

export function AmbientSounds() {
  const [isOpen, setIsOpen] = useState(false);
  const audioRefs = useRef(sounds.map(() => new Audio()));
  const [volumes, setVolumes] = useState(sounds.map(() => 50));
  const [playing, setPlaying] = useState(sounds.map(() => false));

  const togglePlay = (index: number) => {
    const audio = audioRefs.current[index];
    audio.src = new URL(`../ambient/${sounds[index].file}`, import.meta.url).href;
    audio.loop = true;
    audio.volume = volumes[index] / 100;

    if (playing[index]) {
      audio.pause();
    } else {
      audio.play().catch(error => console.error('Error playing audio:', error));
    }

    setPlaying(prev => prev.map((p, i) => i === index ? !p : p));
  };

  const changeVolume = (index: number, value: number) => {
    const audio = audioRefs.current[index];
    audio.volume = value / 100;
    setVolumes(prev => prev.map((v, i) => i === index ? value : v));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto">
          <Music className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          {sounds.map((sound, index) => (
            <div key={sound.name} className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => togglePlay(index)}
              >
                {playing[index] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <span className="w-24">{sound.name}</span>
              <Slider 
                value={[volumes[index]]} 
                onValueChange={(val) => changeVolume(index, val[0])} 
                max={100} 
                step={1} 
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
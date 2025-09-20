export const dateUtils = {
  formatDate: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  },

  getMonthName: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long'
    });
  },

  formatTime: (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  },

  formatDateTime: (date: string, time?: string): string => {
    const formattedDate = dateUtils.formatDate(date);
    if (!time) return formattedDate;
    return `${formattedDate} at ${dateUtils.formatTime(time)}`;
  },

  getMonthYear: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  },

  getDaysInMonth: (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  },

  getFirstDayOfMonth: (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  },

  isToday: (date: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  },

  getTimeUntilEvent: (date: string, time?: string): string => {
    const now = new Date();
    let eventDateTime: Date;

    if (time) {
      eventDateTime = new Date(`${date}T${time}:00`);
    } else {
      eventDateTime = new Date(`${date}T00:00:00`);
    }

    const diff = eventDateTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Past event';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  getTimeUntilEventWithSeconds: (date: string, time?: string): string => {
    const now = new Date();
    let eventDateTime: Date;

    if (time) {
      eventDateTime = new Date(`${date}T${time}:00`);
    } else {
      eventDateTime = new Date(`${date}T00:00:00`);
    }

    const diff = eventDateTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Past event';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
};
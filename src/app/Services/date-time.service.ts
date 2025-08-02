import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService { 
  private readonly defaultTimezone = 'Africa/Johannesburg';

  constructor() {}

  toDate(value: string | number | Date): Date | null {
    //console.log('[toDate] Received value:', value);

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      //console.log('[toDate] Parsed from timestamp:', date);
      return date;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  normalizeDate(value: string | number | Date): Date {
    const date = this.toDate(value);
    if (date) return date;

    const now = new Date();
    //console.warn('[normalizeDate] Using current date:', now);
    return now;
  }

  formatDate(
    value: string | number | Date,
    format: 'dd-mm-yyyy' | 'mysql' | 'full' = 'dd-mm-yyyy',
    timezone: string = this.defaultTimezone
  ): string {
    const date = this.normalizeDate(value);
    //console.log(`[formatDate] Formatting with timezone: ${timezone}`);

    const pad = (n: number) => (n < 10 ? '0' + n : n);

    const tzDate = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const parts: Record<string, string> = {};
    tzDate.forEach(p => {
      if (p.type !== 'literal') parts[p.type] = p.value;
    });

    const year = parts['year'];
    const month = parts['month'];
    const day = parts['day'];
    const hours = parts['hour'];
    const minutes = parts['minute'];
    const seconds = parts['second'];

    switch (format) {
      case 'dd-mm-yyyy':
        return `${day}-${month}-${year}`;
      case 'mysql':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      case 'full':
        const fullDate = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date);
        return `${fullDate} ${hours}:${minutes}:${seconds}`;
      default:
        return date.toISOString();
    }
  }

  formatPartial(
    value: string | number | Date,
    part: 'time' | 'date' = 'date',
    timezone: string = this.defaultTimezone
  ): string {
    const date = this.normalizeDate(value);
    const pad = (n: number) => (n < 10 ? '0' + n : n);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const result: Record<string, string> = {};
    parts.forEach(p => {
      if (p.type !== 'literal') result[p.type] = p.value;
    });

    if (part === 'date') {
      return `${result['year']}-${result['month']}-${result['day']}`;
    }

    // Return formatted time string when part is 'time'
    return `${result['hour']}:${result['minute']}:${result['second']}`;

    
  }
}

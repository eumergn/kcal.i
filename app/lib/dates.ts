export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() - day); // Sunday-start week
  return d;
}

export type WeekDay = {
  offset: number;
  date: Date;
  letter: string;
  dateNum: number;
  isToday: boolean;
  enabled: boolean;
};

/**
 * One Sun-Sat week, `weekOffset` weeks away from the current week - shared by every
 * place in the app that shows a day strip (Home, the streak popover), so they all
 * agree on the same week boundaries and cell shape.
 */
export function buildWeekDays(today: Date, weekOffset: number, minDayOffset = -Infinity): WeekDay[] {
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const offset = Math.round((date.getTime() - today.getTime()) / 86400000);
    return {
      offset,
      date,
      letter: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: date.getDate(),
      isToday: offset === 0,
      enabled: offset >= minDayOffset,
    };
  });
}

export type MonthDay = {
  offset: number;
  date: Date;
  dateNum: number;
  isToday: boolean;
  enabled: boolean;
};

/** Every day of the current calendar month (no leading/trailing padding from adjacent months). */
export function buildMonthDays(today: Date, minDayOffset = -Infinity): MonthDay[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const offset = Math.round((date.getTime() - today.getTime()) / 86400000);
    return {
      offset,
      date,
      dateNum: i + 1,
      isToday: offset === 0,
      enabled: offset >= minDayOffset,
    };
  });
}

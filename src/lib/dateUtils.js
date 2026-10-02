// IST Timezone Utilities (GMT +5:30 / Asia/Kolkata)

export const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Returns current date string in IST as 'YYYY-MM-DD'
 */
export function getTodayIST() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Returns current time string in IST as 'HH:mm:ss'
 */
export function getCurrentISTTime() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE_IST,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  return formatter.format(new Date());
}

/**
 * Calculates milliseconds remaining until 12:00:00 AM midnight IST
 */
export function getMillisUntilMidnightIST() {
  const now = new Date();
  // Get current IST time representation
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_IST,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = istFormatter.formatToParts(now);
  const partMap = {};
  parts.forEach(p => partMap[p.type] = p.value);
  
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  const secondsPassedToday = hour * 3600 + minute * 60 + second;
  const totalSecondsInDay = 86400;
  const secondsLeft = totalSecondsInDay - secondsPassedToday;
  
  return Math.max(0, secondsLeft * 1000);
}

/**
 * Format countdown from milliseconds into "Xh Ym Zs"
 */
export function formatCountdown(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Formats a date string 'YYYY-MM-DD' into readable label e.g., 'Friday, 2 Oct 2026'
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct date in UTC to avoid local timezone offset skewing the day
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Offsets a date string 'YYYY-MM-DD' by deltaDays (+1 or -1)
 */
export function offsetDateString(dateStr, deltaDays) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays, 12, 0, 0));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Returns year and month for a given date or current IST date: { year: 2026, month: 10 }
 */
export function getYearMonth(dateStr) {
  const target = dateStr || getTodayIST();
  const [year, month] = target.split('-').map(Number);
  return { year, month };
}

/**
 * Returns array of all date strings 'YYYY-MM-DD' in a given month
 */
export function getAllDaysInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    days.push(`${year}-${monthStr}-${dayStr}`);
  }
  return days;
}

/**
 * Returns readable Month name e.g., "October 2026"
 */
export function getMonthLabel(year, month) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

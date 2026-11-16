// ===== SHARED — client & server rendum use pannum =====
// Dates ellam "YYYY-MM-DD" text-ah store aagum. Timezone confusion varaama UTC-la calculate.

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value) {
  if (!DATE_REGEX.test(value || '')) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Start date + N months − 1 day. Example: 2027-01-01 + 11 months → 2027-11-30
export function calcEndDate(startDate, months) {
  const m = Number(months);
  if (!isValidDateString(startDate) || !Number.isInteger(m) || m < 1) return '';

  const [y, mo, day] = startDate.split('-').map(Number);
  const targetMonth = mo - 1 + m;
  // Andha month-la evlo naal irukko adha thaandaama (e.g. 31 Jan + 1 month → 28/29 Feb)
  const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(y, targetMonth, Math.min(day, lastDay)));
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

// "2027-11-30" → "30 Nov 2027"
export function formatDate(value) {
  if (!value) return '';
  const dateOnly = value.length === 10;
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : 'Asia/Kolkata',
  }).format(date);
}

// Inniku date "YYYY-MM-DD" (India time)
export function todayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

// 15000 → "₹15,000" (Indian format)
export function formatRupees(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// 5 → "5th", 1 → "1st", 22 → "22nd"
export function ordinal(n) {
  const v = Number(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const mod = v % 100;
  return `${v}${s[(mod - 20) % 10] || s[mod] || s[0]}`;
}

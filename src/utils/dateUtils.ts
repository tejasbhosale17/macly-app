export function getTodayDateString(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  for (let i = 0; i < n; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(toDateString(d));
  }

  return dates;
}

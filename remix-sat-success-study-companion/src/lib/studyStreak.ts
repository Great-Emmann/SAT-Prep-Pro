// One streak day is earned by completing study activity, not by opening the app.
export type StudyStreak = { streak: number; lastActivityDate: string };

export function localStudyDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function previousStudyDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

export function advanceStudyStreak(
  current: StudyStreak,
  activityDate: string = localStudyDate()
): StudyStreak {
  if (current.lastActivityDate === activityDate) {
    return { streak: Math.max(1, current.streak || 0), lastActivityDate: activityDate };
  }
  // Never go backwards if another device has already logged a later date.
  if (current.lastActivityDate && current.lastActivityDate > activityDate) return current;
  return {
    streak: current.lastActivityDate === previousStudyDate(activityDate)
      ? Math.max(0, current.streak || 0) + 1
      : 1,
    lastActivityDate: activityDate
  };
}

export function activeStudyStreak(current: StudyStreak, today: string = localStudyDate()): number {
  return current.lastActivityDate === today || current.lastActivityDate === previousStudyDate(today)
    ? Math.max(0, current.streak || 0)
    : 0;
}

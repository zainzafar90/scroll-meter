export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + delta));
}

// totalsByDate: dateKey → total miles that day (absent = zero activity).
// Today is special: crossing goal removes today from the count but does NOT
// break the prior run ("decrement live"). Only PAST over-goal days break.
export function computeStreak(
  totalsByDate: Map<string, number>,
  today: string,
  goalMi: number,
): number {
  if (totalsByDate.size === 0) return 0;
  let minKey = today;
  for (const k of totalsByDate.keys()) if (k < minKey) minKey = k;

  let streak = 0;
  let cursor = today;
  let isToday = true;
  while (cursor >= minKey) {
    // YYYY-MM-DD compares chronologically
    const total = totalsByDate.get(cursor);
    if (isToday) {
      // today contributes 1 only if qualifying; over-goal/zero contributes 0 but never breaks
      if (total !== undefined && total > 0 && total < goalMi) streak++;
    } else {
      if (total !== undefined && total >= goalMi) break; // past over-goal breaks
      if (total !== undefined && total > 0 && total < goalMi) streak++; // qualifying day
      // zero/absent past day → neutral bridge
    }
    cursor = addDays(cursor, -1);
    isToday = false;
  }
  return streak;
}

// Longest historical run of consecutive "under-limit" days (0 < total < goal),
// walking the full calendar range. Mirrors computeStreak's rules WITHOUT the
// today-special case: a day at/over the limit breaks the run; zero/absent days
// are neutral bridges (don't extend, don't break).
export function longestStreak(
  totalsByDate: Map<string, number>,
  goalMi: number,
): number {
  if (totalsByDate.size === 0) return 0;
  let minKey = "9999-99-99";
  let maxKey = "0000-00-00";
  for (const k of totalsByDate.keys()) {
    if (k < minKey) minKey = k;
    if (k > maxKey) maxKey = k;
  }
  let best = 0;
  let run = 0;
  let cursor = minKey;
  while (cursor <= maxKey) {
    const total = totalsByDate.get(cursor);
    if (total !== undefined && total >= goalMi) {
      run = 0; // at/over the limit breaks
    } else if (total !== undefined && total > 0) {
      run++; // qualifying day
      if (run > best) best = run;
    }
    // zero/absent → neutral bridge: run unchanged
    cursor = addDays(cursor, 1);
  }
  return best;
}

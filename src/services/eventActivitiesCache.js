function getCacheKey(year) {
  return `event_activities_cache:${year}`;
}

export function readCachedEventActivities(year) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(year));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.saturday) && Array.isArray(parsed.sunday)) {
      return parsed;
    }
  } catch (err) {
    // Ignore invalid cache payloads.
  }

  return null;
}

export function writeCachedEventActivities(year, activities) {
  if (typeof window === 'undefined' || !window.localStorage || !activities) {
    return false;
  }

  try {
    window.localStorage.setItem(getCacheKey(year), JSON.stringify(activities));
    return true;
  } catch (err) {
    return false;
  }
}

export function groupActivitiesByDay(activities) {
  const saturday = activities?.filter((activity) => activity.day === 'saturday') || [];
  const sunday = activities?.filter((activity) => activity.day === 'sunday') || [];

  return { saturday, sunday };
}

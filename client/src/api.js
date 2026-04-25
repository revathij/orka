const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function getEventTimeline(eventId) {
  const response = await fetch(`${apiBaseUrl}/api/events/${eventId}/timeline`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to load event timeline");
  }

  return response.json();
}

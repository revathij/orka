const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }

  return response.json();
}

export function getEvents() {
  return request("/api/events");
}

export function createEvent(event) {
  return request("/api/events", {
    method: "POST",
    body: JSON.stringify(event)
  });
}

export function getEventTimeline(eventId) {
  return request(`/api/events/${eventId}/timeline`);
}

export function createBooking(eventId, booking) {
  return request(`/api/events/${eventId}/bookings`, {
    method: "POST",
    body: JSON.stringify(booking)
  });
}

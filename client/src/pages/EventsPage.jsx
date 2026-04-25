import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createEvent, deleteEvent, getEvents } from "../api.js";

const initialForm = {
  name: "",
  startsAt: "",
  location: "",
  description: ""
};

function formatDate(value) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", error: null });
  const [submitState, setSubmitState] = useState({ status: "idle", error: null });

  async function loadEvents() {
    setState({ status: "loading", error: null });

    try {
      const data = await getEvents();
      setEvents(data.events);
      setState({ status: "success", error: null });
    } catch (error) {
      setState({ status: "error", error: error.message });
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "saving", error: null });

    try {
      await createEvent({
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null
      });
      setForm(initialForm);
      setSubmitState({ status: "idle", error: null });
      await loadEvents();
    } catch (error) {
      setSubmitState({ status: "error", error: error.message });
    }
  }

  async function handleDeleteEvent(eventId) {
    setSubmitState({ status: "saving", error: null });

    try {
      await deleteEvent(eventId);
      setSubmitState({ status: "idle", error: null });
      await loadEvents();
    } catch (error) {
      setSubmitState({ status: "error", error: error.message });
    }
  }

  return (
    <main className="timeline-page">
      <section className="timeline-header" aria-labelledby="events-title">
        <p className="eyebrow">Orka</p>
        <h1 id="events-title">Events</h1>
        <p>Create an event, then add vendor services to build its timeline.</p>
        <div className="header-links">
          <Link to="/vendors">Manage vendors</Link>
        </div>
      </section>

      <section className="panel" aria-labelledby="create-event-title">
        <h2 id="create-event-title">Create event</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Event name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Wedding, conference, launch party"
            />
          </label>
          <label>
            Starts at
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
            />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Venue or city"
            />
          </label>
          <label className="form-grid__wide">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Short planning note"
              rows="3"
            />
          </label>
          {submitState.status === "error" ? <p className="form-error">{submitState.error}</p> : null}
          <button type="submit" disabled={submitState.status === "saving"}>
            {submitState.status === "saving" ? "Creating..." : "Create event"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="event-list-title">
        <h2 id="event-list-title">Event list</h2>
        {state.status === "loading" ? <p>Loading events...</p> : null}
        {state.status === "error" ? <p className="form-error">{state.error}</p> : null}
        {state.status === "success" && events.length === 0 ? (
          <p>No events yet. Create one to start building a timeline.</p>
        ) : null}
        {events.length > 0 ? (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event.id}>
                <div>
                  <h3>{event.name}</h3>
                  <p>{formatDate(event.startsAt)}</p>
                  {event.location ? <p>{event.location}</p> : null}
                </div>
                <div className="header-links">
                  <Link to={`/events/${event.id}/timeline`}>View timeline</Link>
                  <button type="button" onClick={() => handleDeleteEvent(event.id)}>Delete event</button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

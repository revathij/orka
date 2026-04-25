import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createEvent,
  createServiceType,
  deleteEvent,
  deleteServiceType,
  getEvents,
  getServiceTypes
} from "../api.js";

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
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeName, setServiceTypeName] = useState("");
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", error: null });
  const [submitState, setSubmitState] = useState({ status: "idle", error: null });
  const [serviceTypeState, setServiceTypeState] = useState({ status: "idle", error: null });

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

  async function loadServiceTypes() {
    try {
      const data = await getServiceTypes();
      setServiceTypes(data.serviceTypes);
    } catch (error) {
      setServiceTypeState({ status: "error", error: error.message });
    }
  }

  useEffect(() => {
    loadEvents();
    loadServiceTypes();
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

  async function handleServiceTypeSubmit(event) {
    event.preventDefault();
    setServiceTypeState({ status: "saving", error: null });

    try {
      await createServiceType({ name: serviceTypeName });
      setServiceTypeName("");
      setServiceTypeState({ status: "idle", error: null });
      await loadServiceTypes();
    } catch (error) {
      setServiceTypeState({ status: "error", error: error.message });
    }
  }

  async function handleDeleteServiceType(serviceTypeId) {
    setServiceTypeState({ status: "saving", error: null });

    try {
      await deleteServiceType(serviceTypeId);
      setServiceTypeState({ status: "idle", error: null });
      await loadServiceTypes();
    } catch (error) {
      setServiceTypeState({ status: "error", error: error.message });
    }
  }

  return (
    <main className="timeline-page home-page">
      <section className="timeline-header home-hero" aria-labelledby="events-title">
        <div className="home-hero__copy">
          <p className="eyebrow">Orka Event OS</p>
          <h1 id="events-title">Create Stunning Events With Faster Vendor Planning</h1>
          <p>
            Run your event operations from one elegant workspace. Set up events, manage service types, and
            orchestrate vendors with clear timelines.
          </p>
          <div className="header-links">
            <Link to="/vendors">Manage vendors</Link>
          </div>
        </div>
        <div className="home-hero__stats" aria-label="Orka highlights">
          <article>
            <h3>{events.length}</h3>
            <p>Events</p>
          </article>
          <article>
            <h3>{serviceTypes.length}</h3>
            <p>Service Types</p>
          </article>
          <article>
            <h3>4</h3>
            <p>Timeline Statuses</p>
          </article>
        </div>
      </section>

      <section className="home-trust-strip" aria-label="Why teams choose Orka">
        <p>Fast setup</p>
        <p>Clean orchestration timeline</p>
        <p>Vendor-first workflow</p>
        <p>Built for event teams</p>
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

      <section className="panel" aria-labelledby="service-type-title">
        <h2 id="service-type-title">Manage service types</h2>
        <form className="form-grid" onSubmit={handleServiceTypeSubmit}>
          <label>
            Service type name
            <input
              required
              value={serviceTypeName}
              onChange={(event) => setServiceTypeName(event.target.value)}
              placeholder="Makeup, Lighting, Venue Setup"
            />
          </label>
          {serviceTypeState.status === "error" ? <p className="form-error">{serviceTypeState.error}</p> : null}
          <button type="submit" disabled={serviceTypeState.status === "saving"}>
            {serviceTypeState.status === "saving" ? "Adding..." : "Add service type"}
          </button>
        </form>
        {serviceTypes.length > 0 ? (
          <ul className="event-list">
            {serviceTypes.map((type) => (
              <li key={type.id}>
                <div>
                  <h3>{type.name}</h3>
                </div>
                <button type="button" onClick={() => handleDeleteServiceType(type.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : null}
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

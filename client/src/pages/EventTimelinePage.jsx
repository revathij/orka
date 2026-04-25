import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createBooking, getEventTimeline } from "../api.js";
import EventTimeline from "../components/EventTimeline.jsx";

const initialBooking = {
  vendorName: "",
  serviceType: "",
  scheduledTime: "",
  status: "planned"
};

export default function EventTimelinePage() {
  const { eventId } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [booking, setBooking] = useState(initialBooking);
  const [submitState, setSubmitState] = useState({ status: "idle", error: null });

  async function loadTimeline() {
    setState({ status: "loading", data: null, error: null });

    try {
      const data = await getEventTimeline(eventId);
      setState({ status: "success", data, error: null });
    } catch (error) {
      setState({ status: "error", data: null, error: error.message });
    }
  }

  useEffect(() => {
    let isCurrent = true;

    setState({ status: "loading", data: null, error: null });

    getEventTimeline(eventId)
      .then((data) => {
        if (isCurrent) {
          setState({ status: "success", data, error: null });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setState({ status: "error", data: null, error: error.message });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [eventId]);

  async function handleBookingSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "saving", error: null });

    try {
      await createBooking(eventId, {
        ...booking,
        scheduledTime: new Date(booking.scheduledTime).toISOString()
      });
      setBooking(initialBooking);
      setSubmitState({ status: "idle", error: null });
      await loadTimeline();
    } catch (error) {
      setSubmitState({ status: "error", error: error.message });
    }
  }

  if (state.status === "loading") {
    return <main className="page-state">Loading timeline...</main>;
  }

  if (state.status === "error") {
    return (
      <main className="page-state page-state--error">
        <p>We could not load this timeline.</p>
        <strong>{state.error}</strong>
      </main>
    );
  }

  return (
    <EventTimeline event={state.data.event} timeline={state.data.timeline}>
      <section className="panel" aria-labelledby="add-service-title">
        <h2 id="add-service-title">Add vendor service</h2>
        <form className="form-grid" onSubmit={handleBookingSubmit}>
          <label>
            Vendor name
            <input
              required
              value={booking.vendorName}
              onChange={(event) => setBooking({ ...booking, vendorName: event.target.value })}
              placeholder="Bloom Florals"
            />
          </label>
          <label>
            Service type
            <input
              required
              value={booking.serviceType}
              onChange={(event) => setBooking({ ...booking, serviceType: event.target.value })}
              placeholder="Floral setup"
            />
          </label>
          <label>
            Scheduled time
            <input
              required
              type="datetime-local"
              value={booking.scheduledTime}
              onChange={(event) => setBooking({ ...booking, scheduledTime: event.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={booking.status}
              onChange={(event) => setBooking({ ...booking, status: event.target.value })}
            >
              <option value="planned">Planned</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          {submitState.status === "error" ? <p className="form-error">{submitState.error}</p> : null}
          <button type="submit" disabled={submitState.status === "saving"}>
            {submitState.status === "saving" ? "Adding..." : "Add service"}
          </button>
        </form>
      </section>
    </EventTimeline>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createBooking, getEventTimeline, getVendors } from "../api.js";
import EventTimeline from "../components/EventTimeline.jsx";

const initialBooking = {
  vendorId: "",
  serviceType: "",
  scheduledTime: "",
  status: "planned"
};

export default function EventTimelinePage() {
  const { eventId } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [vendorsState, setVendorsState] = useState({ status: "loading", data: [], error: null });
  const [booking, setBooking] = useState(initialBooking);
  const [submitState, setSubmitState] = useState({ status: "idle", error: null });

  async function loadTimeline() {
    const data = await getEventTimeline(eventId);
    setState({ status: "success", data, error: null });
  }

  async function loadVendors(serviceType) {
    setVendorsState((current) => ({ ...current, status: "loading", error: null }));

    try {
      const data = await getVendors(serviceType || undefined);
      setVendorsState({ status: "success", data: data.vendors, error: null });
    } catch (error) {
      setVendorsState({ status: "error", data: [], error: error.message });
    }
  }

  useEffect(() => {
    let isCurrent = true;

    setState({ status: "loading", data: null, error: null });

    Promise.all([getEventTimeline(eventId), getVendors()])
      .then(([timelineData, vendorData]) => {
        if (isCurrent) {
          setState({ status: "success", data: timelineData, error: null });
          setVendorsState({ status: "success", data: vendorData.vendors, error: null });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setState({ status: "error", data: null, error: error.message });
          setVendorsState({ status: "error", data: [], error: error.message });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!booking.serviceType) {
      return;
    }

    loadVendors(booking.serviceType);
  }, [booking.serviceType]);

  const selectedVendor = useMemo(
    () => vendorsState.data.find((vendor) => vendor.id === booking.vendorId) || null,
    [vendorsState.data, booking.vendorId]
  );

  async function handleBookingSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "saving", error: null });

    try {
      await createBooking(eventId, {
        vendorId: booking.vendorId,
        serviceType: booking.serviceType,
        scheduledTime: new Date(booking.scheduledTime).toISOString(),
        status: booking.status
      });
      setBooking(initialBooking);
      setSubmitState({ status: "idle", error: null });
      await loadTimeline();
      await loadVendors();
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
        <div className="panel-header">
          <h2 id="add-service-title">Add vendor service</h2>
          <Link to="/vendors">Manage vendors</Link>
        </div>
        <form className="form-grid" onSubmit={handleBookingSubmit}>
          <label>
            Service type
            <input
              required
              value={booking.serviceType}
              onChange={(event) => {
                const serviceType = event.target.value;
                setBooking({ ...booking, serviceType, vendorId: "" });
              }}
              placeholder="Photography, Catering, Decor"
            />
          </label>
          <label>
            Vendor
            <select
              required
              value={booking.vendorId}
              onChange={(event) => setBooking({ ...booking, vendorId: event.target.value })}
            >
              <option value="">Select a vendor</option>
              {vendorsState.data.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}{vendor.serviceType ? ` (${vendor.serviceType})` : ""}
                </option>
              ))}
            </select>
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
          {selectedVendor ? <p className="form-hint">Selected vendor: {selectedVendor.name}</p> : null}
          {vendorsState.status === "error" ? <p className="form-error">{vendorsState.error}</p> : null}
          {submitState.status === "error" ? <p className="form-error">{submitState.error}</p> : null}
          <button type="submit" disabled={submitState.status === "saving"}>
            {submitState.status === "saving" ? "Adding..." : "Add service"}
          </button>
        </form>
      </section>
    </EventTimeline>
  );
}


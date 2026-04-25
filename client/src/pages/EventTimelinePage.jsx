import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventTimeline } from "../api.js";
import EventTimeline from "../components/EventTimeline.jsx";

export default function EventTimelinePage() {
  const { eventId } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: null });

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

  return <EventTimeline event={state.data.event} timeline={state.data.timeline} />;
}

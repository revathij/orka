const statusLabels = {
  planned: "Planned",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled"
};

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function EventTimeline({ event, timeline }) {
  return (
    <main className="timeline-page">
      <section className="timeline-header" aria-labelledby="timeline-title">
        <p className="eyebrow">Orka timeline</p>
        <h1 id="timeline-title">{event.name}</h1>
        <p>Vendor services in the order they are scheduled.</p>
      </section>

      {timeline.length === 0 ? (
        <section className="empty-state">
          <h2>No services scheduled yet</h2>
          <p>This event does not have any vendor bookings on the timeline.</p>
        </section>
      ) : (
        <ol className="timeline-list" aria-label={`${event.name} services`}>
          {timeline.map((item) => (
            <li className="timeline-item" key={item.id}>
              <time dateTime={item.scheduledTime}>{formatTime(item.scheduledTime)}</time>
              <div>
                <h2>{item.vendorName}</h2>
                <p>{item.serviceType}</p>
              </div>
              <span className={`status status--${item.status}`}>
                {statusLabels[item.status] || item.status}
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

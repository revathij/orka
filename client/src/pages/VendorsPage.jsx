import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createServiceType, createVendor, getServiceTypes, getVendors } from "../api.js";

const initialForm = {
  name: "",
  serviceType: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
  photoUrl: ""
};

function initials(name) {
  return name
    .split(" ")
    .map((token) => token[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTypeName, setServiceTypeName] = useState("");
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", error: null });
  const [submitState, setSubmitState] = useState({ status: "idle", error: null });
  const [serviceTypeState, setServiceTypeState] = useState({ status: "idle", error: null });

  const previewImage = useMemo(() => form.photoUrl || null, [form.photoUrl]);

  async function loadAll() {
    setState({ status: "loading", error: null });

    try {
      const [vendorsData, typesData] = await Promise.all([getVendors(), getServiceTypes()]);
      setVendors(vendorsData.vendors);
      setServiceTypes(typesData.serviceTypes);
      setState({ status: "success", error: null });
    } catch (error) {
      setState({ status: "error", error: error.message });
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({ ...current, photoUrl: "" }));
      return;
    }

    try {
      const photoUrl = await toDataUrl(file);
      setForm((current) => ({ ...current, photoUrl }));
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
      const typesData = await getServiceTypes();
      setServiceTypes(typesData.serviceTypes);
    } catch (error) {
      setServiceTypeState({ status: "error", error: error.message });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "saving", error: null });

    try {
      await createVendor(form);
      setForm(initialForm);
      setSubmitState({ status: "idle", error: null });
      await loadAll();
    } catch (error) {
      setSubmitState({ status: "error", error: error.message });
    }
  }

  return (
    <main className="timeline-page page-shell">
      <section className="timeline-header hero-card" aria-labelledby="vendors-title">
        <p className="eyebrow">Orka</p>
        <h1 id="vendors-title">Vendor Studio</h1>
        <p>Upload vendor profiles once, then assign them to event stages in seconds.</p>
        <div className="header-links">
          <Link to="/">Back to events</Link>
        </div>
      </section>

      <section className="panel" aria-labelledby="service-type-title">
        <h2 id="service-type-title">Service type stage</h2>
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
      </section>

      <section className="panel" aria-labelledby="create-vendor-title">
        <h2 id="create-vendor-title">Add vendor</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Vendor name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Blue Hour Photography"
            />
          </label>
          <label>
            Service type
            <select
              required
              value={form.serviceType}
              onChange={(event) => setForm({ ...form, serviceType: event.target.value })}
            >
              <option value="">Select service type</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </label>
          <label>
            Contact name
            <input
              value={form.contactName}
              onChange={(event) => setForm({ ...form, contactName: event.target.value })}
              placeholder="Priya Menon"
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+65 9000 0000"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="vendor@example.com"
            />
          </label>
          <label>
            Vendor photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          <label className="form-grid__wide">
            Notes
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Optional notes, package details, constraints"
            />
          </label>
          {previewImage ? (
            <div className="photo-preview">
              <img src={previewImage} alt="Vendor preview" />
            </div>
          ) : null}
          {submitState.status === "error" ? <p className="form-error">{submitState.error}</p> : null}
          <button type="submit" disabled={submitState.status === "saving"}>
            {submitState.status === "saving" ? "Saving..." : "Save vendor"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="vendor-list-title">
        <h2 id="vendor-list-title">Vendor catalog</h2>
        {state.status === "loading" ? <p>Loading vendors...</p> : null}
        {state.status === "error" ? <p className="form-error">{state.error}</p> : null}
        {state.status === "success" && vendors.length === 0 ? <p>No vendors yet.</p> : null}
        {vendors.length > 0 ? (
          <ul className="vendor-grid">
            {vendors.map((vendor) => (
              <li key={vendor.id} className="vendor-card">
                {vendor.photoUrl ? (
                  <img src={vendor.photoUrl} alt={`${vendor.name} profile`} className="vendor-photo" />
                ) : (
                  <div className="vendor-photo vendor-photo--fallback">{initials(vendor.name)}</div>
                )}
                <div>
                  <h3>{vendor.name}</h3>
                  <p className="vendor-chip">{vendor.serviceType}</p>
                  {vendor.contactName ? <p>Contact: {vendor.contactName}</p> : null}
                  {vendor.email ? <p>{vendor.email}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

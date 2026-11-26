import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { AREA_LABELS, RENTAL_CATEGORIES, SERVICE_TYPES } from "../labels.js";

const blank = {
  name: "",
  phone: "",
  notes: "",
  area: "CAR_SALE",
  sale: { vehicleId: "", preferredMake: "", preferredModel: "", yearFrom: "", yearTo: "", budgetOmr: "" },
  rental: { vehicleId: "", preferredMake: "", preferredModel: "", category: "", startDate: "", durationDays: "1" },
  service: { vehicleId: "", plateNumber: "", make: "", model: "", serviceType: "Periodic service", scheduledDate: "", complaint: "" },
};

export default function NewLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [vehicles, setVehicles] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const purpose = form.area === "CAR_SALE" ? "SALE" : form.area === "CAR_RENTAL" ? "RENTAL" : "";
    api(`/api/vehicles${purpose ? `?purpose=${purpose}` : ""}`)
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, [form.area]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setNested(group, key, value) {
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});
    const payload = {
      name: form.name,
      phone: form.phone,
      notes: form.notes,
      area: form.area,
    };
    if (form.area === "CAR_SALE") payload.sale = form.sale;
    if (form.area === "CAR_RENTAL") payload.rental = form.rental;
    if (form.area === "CAR_SERVICE") payload.service = form.service;
    try {
      const lead = await api("/api/leads", { method: "POST", body: payload });
      navigate(`/leads/${lead.id}`);
    } catch (error) {
      setErrors(error.fields || {});
      setMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <>
      <header className="top">
        <div>
          <h1>New lead</h1>
          <p className="muted">Country Oman · City Muscat · Currency OMR. A new enquiry stays open until it is followed up, converted, or cancelled.</p>
        </div>
      </header>
      <form className="card" onSubmit={submit}>
        <div className="choice">
          {Object.entries(AREA_LABELS).map(([id, label]) => (
            <button key={id} type="button" className={form.area === id ? "choice-card active" : "choice-card"} onClick={() => setField("area", id)}>
              {label}
            </button>
          ))}
        </div>
        {errors.area && <p className="error">{errors.area}</p>}

        <div className="form-grid">
          <label>Name<input value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
          <label>Phone<input value={form.phone} placeholder="9xxxxxxx" onChange={(event) => setField("phone", event.target.value)} /></label>
          <label>Location<input value="Muscat, Oman" readOnly /></label>
        </div>
        <FieldError errors={errors} name="name" />
        <FieldError errors={errors} name="phone" />

        {form.area === "CAR_SALE" && (
          <Interest title="Car they want to buy">
            <div className="form-grid">
              <label className="span-2">Specific car
                <select value={form.sale.vehicleId} onChange={(event) => setNested("sale", "vehicleId", event.target.value)}>
                  <option value="">No specific car yet</option>
                  {vehicles.map((car) => <option key={car.id} value={car.id}>{car.label}{car.salePriceOmr != null ? ` · OMR ${Number(car.salePriceOmr).toFixed(3)}` : ""}</option>)}
                </select>
              </label>
              <label>Budget (OMR)<input value={form.sale.budgetOmr} inputMode="decimal" onChange={(event) => setNested("sale", "budgetOmr", event.target.value)} /></label>
              <label>Preferred make<input value={form.sale.preferredMake} onChange={(event) => setNested("sale", "preferredMake", event.target.value)} /></label>
              <label>Preferred model<input value={form.sale.preferredModel} onChange={(event) => setNested("sale", "preferredModel", event.target.value)} /></label>
              <label>Year from<input value={form.sale.yearFrom} onChange={(event) => setNested("sale", "yearFrom", event.target.value)} /></label>
              <label>Year to<input value={form.sale.yearTo} onChange={(event) => setNested("sale", "yearTo", event.target.value)} /></label>
            </div>
          </Interest>
        )}

        {form.area === "CAR_RENTAL" && (
          <Interest title="Car they want to rent">
            <div className="form-grid">
              <label className="span-2">Specific car
                <select value={form.rental.vehicleId} onChange={(event) => setNested("rental", "vehicleId", event.target.value)}>
                  <option value="">Use preferences instead</option>
                  {vehicles.map((car) => <option key={car.id} value={car.id}>{car.label}{car.dailyRateOmr != null ? ` · OMR ${Number(car.dailyRateOmr).toFixed(3)} / day` : ""}</option>)}
                </select>
              </label>
              <label>Category
                <select value={form.rental.category} onChange={(event) => setNested("rental", "category", event.target.value)}>
                  <option value="">Any</option>
                  {RENTAL_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Preferred make<input value={form.rental.preferredMake} onChange={(event) => setNested("rental", "preferredMake", event.target.value)} /></label>
              <label>Preferred model<input value={form.rental.preferredModel} onChange={(event) => setNested("rental", "preferredModel", event.target.value)} /></label>
              <label>Start date<input type="date" value={form.rental.startDate} onChange={(event) => setNested("rental", "startDate", event.target.value)} /></label>
              <label>Duration (days)<input type="number" min="1" max="365" value={form.rental.durationDays} onChange={(event) => setNested("rental", "durationDays", event.target.value)} /></label>
              <label>Pickup<input value="Muscat" readOnly /></label>
            </div>
          </Interest>
        )}

        {form.area === "CAR_SERVICE" && (
          <Interest title="Workshop enquiry">
            <div className="form-grid">
              <label className="span-2">Fleet car, if it is ours
                <select value={form.service.vehicleId} onChange={(event) => setNested("service", "vehicleId", event.target.value)}>
                  <option value="">Customer’s own car</option>
                  {vehicles.map((car) => <option key={car.id} value={car.id}>{car.label}</option>)}
                </select>
              </label>
              <label>Plate number<input value={form.service.plateNumber} onChange={(event) => setNested("service", "plateNumber", event.target.value)} /></label>
              <label>Make<input value={form.service.make} onChange={(event) => setNested("service", "make", event.target.value)} /></label>
              <label>Model<input value={form.service.model} onChange={(event) => setNested("service", "model", event.target.value)} /></label>
              <label>Service
                <select value={form.service.serviceType} onChange={(event) => setNested("service", "serviceType", event.target.value)}>
                  {SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Scheduled date<input type="date" value={form.service.scheduledDate} onChange={(event) => setNested("service", "scheduledDate", event.target.value)} /></label>
              <label className="span-3">What they asked about
                <input value={form.service.complaint} onChange={(event) => setNested("service", "complaint", event.target.value)} />
              </label>
            </div>
          </Interest>
        )}

        <label className="notes">Notes
          <textarea rows="3" value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
        </label>
        <FieldError errors={errors} names={["preference", "vehicleId", "budgetOmr", "yearFrom", "yearTo", "startDate", "durationDays", "category", "plateNumber", "serviceType", "scheduledDate"]} />
        {message && <p className="error">{message}</p>}
        <div className="actions">
          <button className="btn success" disabled={saving} type="submit">{saving ? "Saving…" : "Save enquiry"}</button>
        </div>
      </form>
    </>
  );
}

function Interest({ title, children }) {
  return (
    <section className="interest">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function FieldError({ errors, name, names }) {
  const keys = names || [name];
  const text = keys.map((key) => errors[key]).find(Boolean);
  if (!text) return null;
  return <p className="error">{text}</p>;
}

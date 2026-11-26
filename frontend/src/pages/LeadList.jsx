import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import LeadTable from "../components/LeadTable.jsx";
import { AREA_LABELS, STATUS_LABELS } from "../labels.js";

export default function LeadList() {
  const [params, setParams] = useSearchParams();
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const status = params.get("status") || "";
  const area = params.get("area") || "";
  const q = params.get("q") || "";

  useEffect(() => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (area) query.set("area", area);
    if (q) query.set("q", q);
    setError("");
    api(`/api/leads?${query.toString()}`)
      .then(setLeads)
      .catch((err) => setError(err.message));
  }, [status, area, q]);

  function update(next) {
    const merged = { status, area, q, ...next };
    const cleaned = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value) cleaned[key] = value;
    });
    setParams(cleaned);
  }

  return (
    <>
      <header className="top">
        <div>
          <h1>All leads</h1>
          <p className="muted">Every Muscat enquiry, including ones that became business and ones that were cancelled.</p>
        </div>
      </header>
      <article className="card filters">
        <label>
          Search
          <input value={q} placeholder="Name, phone, or MAS-LD number" onChange={(event) => update({ q: event.target.value })} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => update({ status: event.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label>
          Area of interest
          <select value={area} onChange={(event) => update({ area: event.target.value })}>
            <option value="">Sale, rental, and service</option>
            {Object.entries(AREA_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </article>
      <article className="card">
        {error && <p className="error">{error}</p>}
        {leads == null && !error ? <p className="empty">Loading leads…</p> : null}
        {leads && <LeadTable leads={leads} empty="No leads match this filter." />}
      </article>
    </>
  );
}

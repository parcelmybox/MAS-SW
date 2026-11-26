import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import StatusPill from "../components/StatusPill.jsx";
import { addDays, formatDate, formatOmr, formatWhen } from "../format.js";
import { AREA_LABELS, EVENT_LABELS, STATUS_LABELS } from "../labels.js";

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [error, setError] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    return api(`/api/leads/${id}`).then(setLead).catch((err) => setError(err.message));
  }

  useEffect(() => {
    setLead(null);
    setError("");
    load();
  }, [id]);

  async function run(path, body) {
    setBusy(true);
    setError("");
    try {
      const updated = await api(path, { method: "POST", body });
      setLead(updated);
      setFollowNote("");
      setReason("");
    } catch (err) {
      setError(err.fields?.followUpDate || err.fields?.reason || err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !lead) {
    return <article className="card"><h1>Lead</h1><p className="error">{error}</p><Link to="/leads">Back to all leads</Link></article>;
  }
  if (!lead) return <p className="empty">Loading lead…</p>;

  const open = lead.status === "NEW_ENQUIRY" || lead.status === "FOLLOW_UP";

  return (
    <>
      <header className="top">
        <div>
          <p className="muted"><Link to="/leads">All leads</Link> · {lead.reference}</p>
          <h1>{lead.name}</h1>
          <p className="muted">{lead.phoneDisplay} · {lead.city}, {lead.country} · {lead.currency}</p>
        </div>
        <StatusPill status={lead.status} />
      </header>

      <div className="split">
        <div className="stack">
          <article className="card">
            <h2>{AREA_LABELS[lead.area]}</h2>
            <p>{lead.summary}</p>
            {lead.sale && <SaleFacts sale={lead.sale} />}
            {lead.rental && <RentalFacts rental={lead.rental} />}
            {lead.service && <ServiceFacts service={lead.service} />}
            {lead.notes && <p className="note">{lead.notes}</p>}
          </article>

          {lead.business && (
            <article className="card success-card">
              <h2>Real business</h2>
              <p><b>{lead.business.reference}</b> · customer {lead.customer.reference}</p>
              <p>{lead.business.summary}</p>
              <p className="muted">Opened {formatWhen(lead.business.openedAt)} · {lead.customer.name}</p>
            </article>
          )}

          {lead.status === "CANCELLED" && (
            <article className="card">
              <h2>Cancelled</h2>
              <p>{lead.cancelReason}</p>
              <p className="muted">{formatWhen(lead.cancelledAt)}</p>
            </article>
          )}

          <article className="card">
            <h2>History</h2>
            <ul className="timeline">
              {lead.events.map((event) => (
                <li key={event.id}>
                  <b>{EVENT_LABELS[event.type] || event.type}</b>
                  <span>{formatWhen(event.createdAt)}</span>
                  {event.toStatus && <span>{STATUS_LABELS[event.toStatus]}</span>}
                  {event.followUpDate && <span>Follow-up {formatDate(event.followUpDate)}</span>}
                  {event.note && <p>{event.note}</p>}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className="stack">
          <article className="card">
            <h2>Next step</h2>
            {open ? (
              <>
                <p>This enquiry can be followed up, turned into a customer, or cancelled.</p>
                <label>Follow-up date
                  <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
                </label>
                <label>Note
                  <textarea rows="2" value={followNote} onChange={(event) => setFollowNote(event.target.value)} />
                </label>
                <div className="actions">
                  <button className="btn warn" disabled={busy} type="button" onClick={() => run(`/api/leads/${lead.id}/follow-up`, { date: followUpDate, note: followNote })}>
                    Save follow-up
                  </button>
                </div>
                <div className="actions">
                  <button className="btn success" disabled={busy} type="button" onClick={() => run(`/api/leads/${lead.id}/convert`, { note: "Converted from the lead screen." })}>
                    Convert to business
                  </button>
                </div>
                <label>Cancel reason
                  <textarea rows="2" value={reason} onChange={(event) => setReason(event.target.value)} />
                </label>
                <div className="actions">
                  <button className="btn danger" disabled={busy} type="button" onClick={() => run(`/api/leads/${lead.id}/cancel`, { reason })}>
                    Cancel enquiry
                  </button>
                </div>
              </>
            ) : (
              <p>This lead is {STATUS_LABELS[lead.status].toLowerCase()} and stays as a record.</p>
            )}
            {error && <p className="error">{error}</p>}
          </article>
        </aside>
      </div>
    </>
  );
}

function SaleFacts({ sale }) {
  return (
    <dl className="facts">
      <Fact label="Car" value={sale.vehicle ? `${sale.vehicle.make} ${sale.vehicle.model} · ${sale.vehicle.plateNumber}` : "Preference only"} />
      <Fact label="Asking / list price" value={sale.vehicle?.salePriceOmr != null ? formatOmr(sale.vehicle.salePriceOmr) : "—"} />
      <Fact label="Make" value={sale.preferredMake} />
      <Fact label="Model" value={sale.preferredModel} />
      <Fact label="Years" value={sale.yearFrom || sale.yearTo ? `${sale.yearFrom || "—"} to ${sale.yearTo || "—"}` : null} />
      <Fact label="Budget" value={sale.budgetOmr != null ? formatOmr(sale.budgetOmr) : null} />
    </dl>
  );
}

function RentalFacts({ rental }) {
  const end = rental.startDate ? addDays(rental.startDate, rental.durationDays) : null;
  return (
    <dl className="facts">
      <Fact label="Car" value={rental.vehicle ? `${rental.vehicle.make} ${rental.vehicle.model} · ${rental.vehicle.plateNumber}` : rental.category || "Preference"} />
      <Fact label="Daily rate" value={rental.vehicle?.dailyRateOmr != null ? formatOmr(rental.vehicle.dailyRateOmr) : null} />
      <Fact label="Start" value={formatDate(rental.startDate)} />
      <Fact label="Duration" value={`${rental.durationDays} days`} />
      <Fact label="Return" value={formatDate(end)} />
      <Fact label="Pickup" value={rental.pickupArea} />
      <Fact label="Preference" value={[rental.preferredMake, rental.preferredModel, rental.category].filter(Boolean).join(" ")} />
    </dl>
  );
}

function ServiceFacts({ service }) {
  return (
    <dl className="facts">
      <Fact label="Car" value={[service.make, service.model].filter(Boolean).join(" ") || "—"} />
      <Fact label="Plate" value={service.plateNumber} />
      <Fact label="Service" value={service.serviceType} />
      <Fact label="Scheduled" value={formatDate(service.scheduledDate)} />
      <Fact label="Request" value={service.complaint} />
    </dl>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

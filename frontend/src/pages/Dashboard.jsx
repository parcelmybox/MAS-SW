import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import LeadTable from "../components/LeadTable.jsx";
import { AREA_LABELS } from "../labels.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard").then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <p className="empty">Loading the leads dashboard…</p>;

  const { counts } = data;
  return (
    <>
      <header className="top">
        <div>
          <h1>Leads dashboard</h1>
          <p className="muted">Muscat, Oman · currency OMR · sale, rental, and workshop enquiries</p>
        </div>
        <Link className="btn primary" to="/leads/new">New lead</Link>
      </header>

      <section className="grid">
        <Kpi label="All leads" value={counts.total} to="/leads" />
        <Kpi label="New enquiries" value={counts.newEnquiry} to="/leads?status=NEW_ENQUIRY" />
        <Kpi label="Waiting on follow-up" value={counts.followUp} to="/follow-ups" hint={counts.overdue ? `${counts.overdue} overdue` : "None overdue"} />
        <Kpi label="Became real business" value={counts.converted} to="/leads?status=CONVERTED" hint={`${data.conversionRate}% of all leads`} />
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Turned into business</h2>
          <p className="big-rate">{data.conversionRate}%</p>
          <p>
            {counts.converted} of {counts.total} leads are now customers with a sale, rental, or service file.
            {counts.cancelled ? ` ${counts.cancelled} were cancelled.` : ""}
          </p>
          <div className="bars">
            {data.byArea.map((row) => (
              <div key={row.area}>
                <div className="bar-label">
                  <span>{AREA_LABELS[row.area]}</span>
                  <span>{row.converted} of {row.total} · {row.rate}%</span>
                </div>
                <div className="bar"><span style={{ width: `${row.rate}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>How a lead moves</h2>
          <ol className="flow">
            <li><b>New enquiry</b> — name, phone, and sale, rental, or repair interest.</li>
            <li><b>Follow-up</b> — a date is set. The follow-up list is sorted by that date.</li>
            <li><b>Converted to business</b> — the person becomes a customer and a business file is opened.</li>
            <li><b>Cancelled</b> — the enquiry stops, with a reason.</li>
          </ol>
          <p className="note">Due today: {counts.dueToday}. Overdue: {counts.overdue}.</p>
        </article>
      </section>

      <article className="card">
        <div className="section-head">
          <h2>Latest leads</h2>
          <Link to="/leads">View all</Link>
        </div>
        <LeadTable leads={data.recent} empty="No leads have been recorded." />
      </article>
    </>
  );
}

function Kpi({ label, value, hint, to }) {
  return (
    <Link className="card kpi" to={to}>
      <span>{label}</span>
      <b>{value}</b>
      {hint && <small>{hint}</small>}
    </Link>
  );
}

function ErrorState({ message }) {
  return (
    <article className="card">
      <h1>Leads dashboard</h1>
      <p>{message}</p>
      <p className="note">Start PostgreSQL and the API, then refresh this page.</p>
    </article>
  );
}

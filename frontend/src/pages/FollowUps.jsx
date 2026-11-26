import { useEffect, useState } from "react";
import { api } from "../api.js";
import LeadTable from "../components/LeadTable.jsx";

export default function FollowUps() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/leads/follow-ups").then(setLeads).catch((err) => setError(err.message));
  }, []);

  const overdue = leads?.filter((lead) => lead.dueState === "overdue").length || 0;

  return (
    <>
      <header className="top">
        <div>
          <h1>Follow-ups</h1>
          <p className="muted">Sorted by follow-up date, earliest first. Overdue calls stay at the top.</p>
        </div>
      </header>
      <article className="card">
        {error && <p className="error">{error}</p>}
        {leads == null && !error ? <p className="empty">Loading follow-ups…</p> : null}
        {leads && (
          <>
            <p className="note">{leads.length} follow-ups. {overdue} overdue.</p>
            <LeadTable leads={leads} empty="No follow-ups are scheduled." />
          </>
        )}
      </article>
    </>
  );
}

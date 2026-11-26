import { Link } from "react-router-dom";
import { AREA_LABELS } from "../labels.js";
import { formatDate } from "../format.js";
import StatusPill from "./StatusPill.jsx";

export default function LeadTable({ leads, empty }) {
  if (!leads.length) {
    return <p className="empty">{empty || "No leads yet."}</p>;
  }
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Interest</th>
            <th>Details</th>
            <th>Status</th>
            <th>Follow-up</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className={lead.dueState === "overdue" ? "overdue" : undefined}>
              <td>{lead.reference}</td>
              <td>{lead.name}</td>
              <td>{lead.phoneDisplay}</td>
              <td>{AREA_LABELS[lead.area]}</td>
              <td>{lead.summary}</td>
              <td><StatusPill status={lead.status} /></td>
              <td>
                {formatDate(lead.followUpDate)}
                {lead.dueState === "overdue" && <span className="due overdue-tag">Overdue</span>}
                {lead.dueState === "today" && <span className="due today-tag">Today</span>}
              </td>
              <td><Link className="btn light" to={`/leads/${lead.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/leads", label: "All leads", end: true },
  { to: "/follow-ups", label: "Follow-ups" },
  { to: "/leads/new", label: "New lead" },
];

export default function Layout() {
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          MAS
          <small>Sales, rental and workshop · Muscat</small>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? "active" : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

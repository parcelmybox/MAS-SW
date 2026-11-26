import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FollowUps from "./pages/FollowUps.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import LeadList from "./pages/LeadList.jsx";
import NewLead from "./pages/NewLead.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/new" element={<NewLead />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="follow-ups" element={<FollowUps />} />
      </Route>
    </Routes>
  );
}

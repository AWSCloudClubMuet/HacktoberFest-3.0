import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { EmptyState } from './components/ui.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Camps } from './pages/Camps.jsx';
import { CampDetail } from './pages/CampDetail.jsx';
import { Needs } from './pages/Needs.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { Dispatches } from './pages/Dispatches.jsx';
import { Donations } from './pages/Donations.jsx';
import { Volunteers } from './pages/Volunteers.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="camps" element={<Camps />} />
        <Route path="camps/:id" element={<CampDetail />} />
        <Route path="needs" element={<Needs />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="dispatches" element={<Dispatches />} />
        <Route path="donations" element={<Donations />} />
        <Route path="volunteers" element={<Volunteers />} />
        <Route
          path="*"
          element={
            <EmptyState icon="alert" title="Page not found" action={<Link to="/" className="text-brand-700 underline">Back to the dashboard</Link>} />
          }
        />
      </Route>
    </Routes>
  );
}

import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Demo from './pages/Demo.jsx';
import Home from './pages/Home.jsx';
import GigDetails from './pages/GigDetails.jsx';
import CreateGig from './pages/CreateGig.jsx';
import MyGigs from './pages/MyGigs.jsx';
import MyApplications from './pages/MyApplications.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/demo" element={<Demo />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/gigs/new" element={<CreateGig />} />
          <Route path="/gigs/:id" element={<GigDetails />} />
          <Route path="/my-gigs" element={<MyGigs />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

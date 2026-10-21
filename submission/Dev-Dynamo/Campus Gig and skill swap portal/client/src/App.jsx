import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateGig from './pages/CreateGig';
import GigDetail from './pages/GigDetail';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';
export default function App() {
  return (<>
    <Navbar />
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGig />} />
        <Route path="/gigs/:id" element={<GigDetail />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Routes>
    </main>
  </>);
}

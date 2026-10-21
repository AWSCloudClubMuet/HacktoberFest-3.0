import { Routes, Route, Link } from 'react-router-dom';
import { useUser } from './UserContext';
import Home from './pages/Home';
import GigDetail from './pages/GigDetail';
import PostGig from './pages/PostGig';
import Profile from './pages/Profile';
import MyApplications from './pages/MyApplications';

export default function App() {
  const { users, currentUser, switchUser } = useUser();

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="brand">Campus Gig</Link>
        <div className="links">
          <Link to="/">Browse</Link>
          <Link to="/post">Post Gig</Link>
          <Link to="/applications">My Applications</Link>
          <Link to={currentUser ? `/profile/${currentUser.id}` : '/'}>My Profile</Link>
        </div>
        <select value={currentUser?.id || ''} onChange={(e) => switchUser(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route path="/post" element={<PostGig />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/applications" element={<MyApplications />} />
          <Route path="*" element={<p>This page is coming soon.</p>} />
        </Routes>
      </main>
    </>
  );
}
import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
export default function Navbar() {
  const { users, currentId, switchUser } = useUser();
  return (
    <header className="nav">
      <NavLink to="/" className="brand">SkillSwap</NavLink>
      <nav>
        <NavLink to="/" end>Browse gigs</NavLink>
        <NavLink to="/create">Post a gig</NavLink>
        <NavLink to="/applications">My applications</NavLink>
        <NavLink to={`/profile/${currentId}`}>My profile</NavLink>
      </nav>
      <label className="who">Acting as
        <select value={currentId} onChange={e => switchUser(+e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </label>
    </header>
  );
}

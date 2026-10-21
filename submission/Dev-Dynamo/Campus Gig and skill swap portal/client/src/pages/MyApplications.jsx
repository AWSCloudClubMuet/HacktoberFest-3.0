import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { useUser } from '../context/UserContext';
import Badge from '../components/Badge';
export default function MyApplications() {
  const { currentId } = useUser(), [apps, setApps] = useState([]);
  useEffect(() => { api.applications({ applicant_id: currentId }).then(setApps); }, [currentId]);
  return (<>
    <h1>My applications</h1>
    {!apps.length && <p className="empty">You have not applied to any gigs yet. <Link to="/">Browse gigs</Link></p>}
    {apps.map(a => (
      <Link key={a.id} to={`/gigs/${a.gig_id}`} className="panel item">
        <div><b>{a.gig.title}</b> <Badge value={a.gig.status} /><p>{a.message}</p></div>
        <Badge value={a.status} />
      </Link>
    ))}
  </>);
}

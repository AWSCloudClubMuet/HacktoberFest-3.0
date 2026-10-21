import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useUser } from '../context/UserContext';
export default function CreateGig() {
  const { currentId } = useUser(), nav = useNavigate(), [err, setErr] = useState('');
  const [f, setF] = useState({ title: '', description: '', type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: '', deadline: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    try { const g = await api.createGig({ ...f, user_id: currentId }); nav(`/gigs/${g.id}`); } catch (x) { setErr(x.message); }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <h1>Post a gig</h1>
      <label>Title<input value={f.title} onChange={set('title')} required /></label>
      <label>Description<textarea rows="4" value={f.description} onChange={set('description')} required /></label>
      <div className="two">
        <label>I am<select value={f.type} onChange={set('type')}><option>Requesting</option><option>Offering</option></select></label>
        <label>Category<select value={f.category} onChange={set('category')}>{['Programming', 'Design', 'Writing', 'Tutoring'].map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Payment<select value={f.payment_type} onChange={set('payment_type')}><option>Paid</option><option>SkillSwap</option><option>Free</option></select></label>
        {f.payment_type === 'Paid' && <label>Budget (Rs)<input type="number" min="1" value={f.budget} onChange={set('budget')} required /></label>}
        <label>Deadline<input type="date" value={f.deadline} onChange={set('deadline')} required /></label>
      </div>
      {err && <p className="error">{err}</p>}
      <button>Publish gig</button>
    </form>
  );
}

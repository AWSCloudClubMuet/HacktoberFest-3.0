import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../UserContext';

const initial = {
  title: '',
  description: '',
  type: 'Offering',
  category: 'Programming',
  payment_type: 'Paid',
  budget: '',
  deadline: '',
};

export default function PostGig() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const today = new Date().toISOString().slice(0, 10);

  function validate() {
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters.';
    if (form.payment_type === 'Paid' && !(Number(form.budget) > 0)) return 'Please enter a budget for a paid gig.';
    if (!form.deadline) return 'Please choose a deadline.';
    if (form.deadline < today) return 'Deadline cannot be in the past.';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setError('');
    setSaving(true);
    try {
      const gig = await api.createGig({
        ...form,
        user_id: currentUser.id,
        budget: form.payment_type === 'Paid' ? Number(form.budget) : null,
      });
      navigate(`/gigs/${gig.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (!currentUser) return <p>Loading...</p>;

  return (
    <>
      <h2>Post a Gig</h2>
      <p>
        Posting as <b>{currentUser.name}</b>
      </p>

      <form className="card" onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Title
          <input style={{ width: '100%' }} value={form.title} onChange={set('title')} placeholder="e.g. Logo design for my club" />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            style={{ width: '100%' }}
            value={form.description}
            onChange={set('description')}
            placeholder="Describe what you offer or need"
          />
        </label>

        <div className="filters" style={{ marginBottom: 0 }}>
          <label>
            Type
            <br />
            <select value={form.type} onChange={set('type')}>
              <option>Offering</option>
              <option>Requesting</option>
            </select>
          </label>

          <label>
            Category
            <br />
            <select value={form.category} onChange={set('category')}>
              <option>Programming</option>
              <option>Design</option>
              <option>Writing</option>
              <option>Tutoring</option>
            </select>
          </label>

          <label>
            Payment type
            <br />
            <select value={form.payment_type} onChange={set('payment_type')}>
              <option value="Paid">Paid</option>
              <option value="SkillSwap">Skill Swap</option>
              <option value="Free">Free</option>
            </select>
          </label>

          {form.payment_type === 'Paid' && (
            <label>
              Budget (Rs.)
              <br />
              <input type="number" min="1" value={form.budget} onChange={set('budget')} />
            </label>
          )}

          <label>
            Deadline
            <br />
            <input type="date" min={today} value={form.deadline} onChange={set('deadline')} />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div>
          <button type="submit" disabled={saving}>
            {saving ? 'Posting...' : 'Post gig'}
          </button>
        </div>
      </form>
    </>
  );
}
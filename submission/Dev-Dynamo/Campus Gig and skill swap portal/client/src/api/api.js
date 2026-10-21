const BASE = 'http://localhost:5000';
async function req(path, method = 'GET', body) {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const qs = o => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)); return p.toString() ? '?' + p : ''; };
export const api = {
  users: () => req('/users'),
  user: id => req(`/users/${id}`),
  gigs: f => req('/gigs' + qs(f || {})),
  gig: id => req(`/gigs/${id}`),
  createGig: b => req('/gigs', 'POST', b),
  updateGig: (id, b) => req(`/gigs/${id}`, 'PATCH', b),
  applications: f => req('/applications' + qs(f)),
  apply: b => req('/applications', 'POST', b),
  decide: (id, b) => req(`/applications/${id}`, 'PATCH', b),
  reviews: f => req('/reviews' + qs(f)),
  review: b => req('/reviews', 'POST', b),
};

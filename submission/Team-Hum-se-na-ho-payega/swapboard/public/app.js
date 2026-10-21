(() => {
  'use strict';

  /* ---------- state + helpers ---------- */
  const S = { me: Number(localStorage.getItem('swapboard_me')) || 1, users: [], timer: null };
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const CATS = ['Programming', 'Design', 'Writing', 'Tutoring'];
  const PAYS = [['Paid', 'Paid'], ['SkillSwap', 'Skill swap'], ['Free', 'Free']];

  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-User-Id': String(S.me) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'Something went wrong.'); e.details = data.details || {}; throw e; }
    return data;
  }
  function toast(msg, bad) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : '');
    t.textContent = msg;
    $('#toasts').append(t);
    setTimeout(() => t.remove(), 3800);
  }

  const money = (n) => 'Rs ' + Number(n).toLocaleString('en-US');
  const payText = (g) => (g.payment_type === 'Paid' ? money(g.budget) : g.payment_type === 'SkillSwap' ? 'Skill swap' : 'Free');
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const dayDiff = (d) => Math.round((Date.parse(d) - Date.parse(todayStr())) / 864e5);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  function dueText(g) {
    const d = dayDiff(g.deadline);
    if (g.status === 'Expired') return `Expired ${plural(-d, 'day')} ago`;
    if (g.status === 'Completed' || g.status === 'Cancelled') return `Deadline was ${niceDate(g.deadline)}`;
    if (d < 0) return 'Past due';
    return d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due in ${d} days`;
  }
  const niceDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  function ago(iso) {
    const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
    if (m < 60) return `${Math.max(m, 1)} min ago`;
    const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
    return plural(Math.round(h / 24), 'day') + ' ago';
  }
  const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const av = (u, lg) => `<span class="av c${u.id % 6}${lg ? ' lg' : ''}" aria-hidden="true">${esc(initials(u.name))}</span>`;
  const rating = (u) => (u.avg_rating == null ? '<span class="stars" style="opacity:.55">New</span>' : `<span class="stars" title="${u.review_count} reviews">★ ${u.avg_rating.toFixed(1)}</span>`);
  const badge = (s) => `<span class="badge ${s.replace(' ', '')}">${esc(s)}</span>`;
  const kindLabel = (g) => (g.type === 'Offering' ? 'Offering' : 'Wanted');
  const radios = (name, opts, cur, cls = 'pills') => `<div class="${cls}">${opts.map(([v, l], i) => `<input type="radio" name="${name}" id="${name}-${i}" value="${esc(v)}"${String(cur) === String(v) ? ' checked' : ''}><label for="${name}-${i}">${esc(l)}</label>`).join('')}</div>`;

  function setErrors(form, details) {
    form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = details[el.dataset.err] || ''; });
    const first = Object.keys(details)[0];
    const f = first && form.querySelector(`[name="${first}"]`);
    if (f) f.focus();
  }
  const formData = (f) => Object.fromEntries(new FormData(f).entries());
  async function submit(form, fn) {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; setErrors(form, {});
    try { await fn(formData(form)); }
    catch (e) { setErrors(form, e.details || {}); toast(e.message, true); }
    finally { btn.disabled = false; }
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const h = location.hash || '#/';
    const cur = (m) => (m.test(h) ? ' aria-current="page"' : '');
    $('#top').innerHTML = `
      <a class="brand" href="#/"><span class="mark" aria-hidden="true"></span>swapboard</a>
      <nav class="nav" aria-label="Main">
        <a href="#/"${cur(/^#\/$|^#\/gig\//)}>The board</a>
        <a href="#/post"${cur(/^#\/post/)}>Post a gig</a>
        <a href="#/desk"${cur(/^#\/desk/)}>My desk</a>
      </nav>
      <div class="who">
        <label for="as">Acting as</label>
        <select id="as">${S.users.map((u) => `<option value="${u.id}"${u.id === S.me ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
        <a href="#/join" class="btn ghost sm">New profile</a>
      </div>`;
    $('#as').addEventListener('change', (e) => { S.me = Number(e.target.value); localStorage.setItem('swapboard_me', S.me); route(); });
  }

  /* ---------- board ---------- */
  function noteHTML(g) {
    const tilt = [-0.8, 0.5, -0.3, 0.9, -0.55, 0.3][g.id % 6];
    const stamp = { Expired: '', Cancelled: '', 'In Progress': 'live', Completed: 'done' }[g.status];
    return `<a class="note ${g.category}${g.status !== 'Open' ? ' dim' : ''}" href="#/gig/${g.id}" style="--tilt:${tilt}deg">
      <span class="pin"></span>
      ${g.status !== 'Open' ? `<span class="stamp ${stamp}">${esc(g.status)}</span>` : ''}
      <div class="note-top"><span class="kind ${g.type}">${kindLabel(g)}</span><span>${g.category}</span></div>
      <h3>${esc(g.title)}</h3>
      <p class="desc">${esc(g.description)}</p>
      <div class="foot2"><span class="price">${payText(g)}</span><span class="due">${dueText(g)}</span></div>
      <div class="by">${av(g.owner)}<span>${esc(g.owner.name)}</span><span class="rate">${rating(g.owner)}</span></div>
    </a>`;
  }

  async function viewBoard() {
    app.innerHTML = `
      <section class="lede">
        <div><h1>Somebody on campus needs exactly what you’re good at.</h1>
          <p>Offer a skill, ask for a hand, and build a track record one finished gig at a time. Pay in cash, swap skills, or just help out.</p></div>
        <div class="cta">
          <button class="btn" data-quick="Offering" type="button">I need a hand</button>
          <button class="btn ghost" data-quick="Requesting" type="button">I can lend a hand</button>
        </div>
      </section>
      <div class="board">
        <form class="filters" id="ff" role="search" aria-label="Filter gigs">
          <h2>Narrow it down</h2>
          <label class="field"><span>Search</span><input type="search" name="q" placeholder="react, logo, calculus"></label>
          <fieldset><legend>Looking for</legend>${radios('type', [['', 'Anything'], ['Offering', 'Offers'], ['Requesting', 'Requests']], '')}</fieldset>
          <fieldset><legend>Category</legend>${radios('category', [['', 'All'], ...CATS.map((c) => [c, c])], '')}</fieldset>
          <fieldset><legend>Payment</legend>${radios('payment_type', [['', 'Any'], ...PAYS], '')}</fieldset>
          <fieldset><legend>Budget in Rs <span class="hint">(paid gigs)</span></legend>
            <div class="two"><input type="number" min="0" name="min_budget" placeholder="From" aria-label="Minimum budget"><input type="number" min="0" name="max_budget" placeholder="Up to" aria-label="Maximum budget"></div></fieldset>
          <label class="field"><span>Status</span><select name="status"><option value="Open">Open gigs</option><option value="">Everything</option><option>In Progress</option><option>Completed</option><option>Expired</option><option>Cancelled</option></select></label>
          <label class="field"><span>Sort by</span><select name="sort"><option value="newest">Newest first</option><option value="deadline">Closest deadline</option><option value="budget_high">Highest budget</option><option value="budget_low">Lowest budget</option></select></label>
          <button class="btn ghost sm" type="reset">Clear filters</button>
        </form>
        <section aria-live="polite"><div class="resbar"><span id="count">Loading…</span></div><div class="grid" id="grid"></div></section>
      </div>`;
    const form = $('#ff');
    const run = async () => {
      const f = formData(form);
      try {
        const gigs = await api('/gigs?' + qs(f));
        $('#count').textContent = gigs.length ? `${plural(gigs.length, 'note')} on the board` : 'Nothing matches';
        $('#grid').innerHTML = gigs.length ? gigs.map(noteHTML).join('') :
          `<div class="empty"><h3>No gigs match those filters</h3><p>Loosen the budget range or clear the search. Or post the gig you wish existed.</p><p style="margin-top:14px"><a class="btn" href="#/post">Post a gig</a></p></div>`;
      } catch (e) { toast(e.message, true); }
    };
    form.addEventListener('input', () => { clearTimeout(S.timer); S.timer = setTimeout(run, 180); });
    form.addEventListener('reset', () => setTimeout(run, 0));
    app.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
      form.querySelector(`input[name="type"][value="${b.dataset.quick}"]`).checked = true; run(); $('#grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    run();
  }

  /* ---------- gig detail ---------- */
  async function viewGig(id) {
    const [g, apps, reviews] = await Promise.all([api('/gigs/' + id), api('/applications?gig_id=' + id), api('/reviews?gig_id=' + id)]);
    const isOwner = g.user_id === S.me;
    const mine = apps.find((a) => a.applicant_id === S.me);
    const isWorker = g.accepted_applicant_id === S.me;
    const reviewed = reviews.some((r) => r.reviewer_id === S.me);
    const other = isOwner ? g.accepted_applicant : g.owner;

    let panel;
    if (isOwner) {
      const acts = { Open: [['Cancelled', 'Cancel this gig', 'danger']], Expired: [['Cancelled', 'Cancel this gig', 'danger']], 'In Progress': [['Completed', 'Mark as completed', 'ok'], ['Cancelled', 'Cancel this gig', 'danger']] }[g.status] || [];
      panel = `<h2>This is your gig</h2><p>${{
        Open: `${plural(apps.length, 'application')} so far. Accept one and the gig moves to In Progress.`,
        'In Progress': `${esc(g.accepted_applicant?.name || 'Your applicant')} is on it. Mark it completed when the work is done.`,
        Completed: 'All done. Leave a review below to wrap it up.',
        Expired: 'The deadline passed with nobody accepted. You can cancel it or post it again.',
        Cancelled: 'This gig was cancelled.',
      }[g.status]}</p>${acts.map(([s, l, c]) => `<button class="btn ${c}" data-status="${s}" type="button">${l}</button>`).join('')}`;
    } else if (mine) {
      panel = `<h2>Your application</h2><p>${badge(mine.status)}</p><p style="margin-top:10px">${esc(mine.message)}</p>`;
    } else if (g.status === 'Open') {
      panel = `<h2>${g.type === 'Offering' ? 'Ask for this' : 'Offer your help'}</h2>
        <form data-form="apply" novalidate><label class="field"><span class="vh">Message</span><textarea name="message" placeholder="Say what you’ll bring and when you can start." maxlength="500"></textarea><span class="err" data-err="message"></span></label>
        <button class="btn" type="submit">Send application</button></form>`;
    } else {
      panel = `<h2>Closed to applications</h2><p>This gig is ${esc(g.status.toLowerCase())}.</p>`;
    }

    const appsHTML = isOwner ? `<section class="section"><h2>Applications</h2>${apps.length ? apps.map((a) => `
      <div class="row"><div class="head">${av(a.applicant)}<a href="#/profile/${a.applicant.id}"><b>${esc(a.applicant.name)}</b></a>${rating(a.applicant)}<span style="color:var(--muted)">${esc(a.applicant.major)}</span><span style="margin-left:auto">${badge(a.status)}</span></div>
      <blockquote>${esc(a.message)}</blockquote>
      ${a.status === 'Pending' && g.status === 'Open' ? `<div class="acts"><button class="btn sm ok" data-app="${a.id}" data-to="Accepted" type="button">Accept</button><button class="btn sm danger" data-app="${a.id}" data-to="Rejected" type="button">Reject</button></div>` : ''}</div>`).join('')
      : '<div class="empty">No applications yet. Share the link with someone who’d be a fit.</div>'}</section>` : '';

    const canReview = g.status === 'Completed' && (isOwner || isWorker) && !reviewed && other;
    const reviewsHTML = g.status === 'Completed' ? `<section class="section"><h2>Reviews</h2>
      ${reviews.map((r) => `<div class="row"><div class="head">${av(r.reviewer)}<b>${esc(r.reviewer.name)}</b><span>rated ${esc(r.reviewee.name)}</span><span class="stars" style="margin-left:auto">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div><blockquote>${esc(r.comment)}</blockquote></div>`).join('')}
      ${canReview ? `<form class="sheet" data-form="review" novalidate><h3 style="margin-bottom:14px">Review ${esc(other.name)}</h3>
        <fieldset><legend>Rating</legend><div class="rate-pick">${[1, 2, 3, 4, 5].map((n) => `<input type="radio" name="rating" id="rt${n}" value="${n}"><label for="rt${n}">${n}</label>`).join('')}</div><span class="err" data-err="rating"></span></fieldset>
        <label class="field"><span>Comment</span><textarea name="comment" maxlength="500" placeholder="How was it to work together?"></textarea><span class="err" data-err="comment"></span></label>
        <button class="btn" type="submit">Post review</button></form>`
        : (!reviews.length ? '<div class="empty">No reviews yet.</div>' : '')}</section>` : '';

    app.innerHTML = `<a class="crumb" href="#/">Back to the board</a>
      <div class="detail"><div>
        <article class="sheet tint ${g.category}">
          <div class="note-top"><span class="kind ${g.type}">${kindLabel(g)}</span><span>${g.category}</span><span style="margin-left:auto">${badge(g.status)}</span></div>
          <h1>${esc(g.title)}</h1><p class="body">${esc(g.description)}</p>
          <dl class="facts"><div><dt>Payment</dt><dd>${payText(g)}</dd></div><div><dt>Deadline</dt><dd>${niceDate(g.deadline)}</dd></div><div><dt>Status</dt><dd>${dueText(g)}</dd></div><div><dt>Posted</dt><dd>${ago(g.created_at)}</dd></div></dl>
        </article>${appsHTML}${reviewsHTML}</div>
        <aside class="side">
          <div class="panel"><a class="person" href="#/profile/${g.owner.id}">${av(g.owner, false)}<span><b>${esc(g.owner.name)}</b><small>${esc(g.owner.major)}, ${rating(g.owner)}</small></span></a></div>
          <div class="panel" id="panel">${panel}</div>
        </aside></div>`;

    app.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.status === 'Cancelled' && !confirm('Cancel this gig? Pending applicants will be rejected.')) return;
      try { await api('/gigs/' + id, { method: 'PATCH', body: { status: b.dataset.status } }); toast(b.dataset.status === 'Completed' ? 'Gig marked as completed.' : 'Gig cancelled.'); viewGig(id); }
      catch (e) { toast(e.message, true); }
    }));
    app.querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', async () => {
      try { await api('/applications/' + b.dataset.app, { method: 'PATCH', body: { status: b.dataset.to } }); toast(b.dataset.to === 'Accepted' ? 'Applicant accepted. The gig is now In Progress.' : 'Application rejected.'); viewGig(id); }
      catch (e) { toast(e.message, true); }
    }));
    const af = $('[data-form="apply"]');
    if (af) af.addEventListener('submit', (e) => { e.preventDefault(); submit(af, async (d) => { await api('/applications', { method: 'POST', body: { gig_id: g.id, message: d.message } }); toast('Application sent.'); viewGig(id); }); });
    const rf = $('[data-form="review"]');
    if (rf) rf.addEventListener('submit', (e) => { e.preventDefault(); submit(rf, async (d) => { await api('/reviews', { method: 'POST', body: { gig_id: g.id, rating: d.rating, comment: d.comment } }); toast('Review posted.'); await loadUsers(); viewGig(id); }); });
  }

  /* ---------- post a gig ---------- */
  function viewPost() {
    const min = todayStr();
    app.innerHTML = `<div class="formwrap"><h1>Post a gig</h1><p style="color:var(--muted)">Offer what you do well, or ask for what you need. You’ll pick who gets the job.</p>
      <form class="sheet" data-form="post" data-pay="Paid" novalidate>
        <fieldset><legend>What are you posting?</legend><div class="kinds">
          <div><input type="radio" name="type" id="k1" value="Offering" checked><label for="k1">I’m offering a skill<small>Others apply to work with you</small></label></div>
          <div><input type="radio" name="type" id="k2" value="Requesting"><label for="k2">I need a hand<small>Others apply to help you</small></label></div></div><span class="err" data-err="type"></span></fieldset>
        <label class="field"><span>Title</span><input name="title" maxlength="100" placeholder="e.g. Poster design for the film society"><span class="err" data-err="title"></span></label>
        <label class="field"><span>Description</span><textarea name="description" maxlength="1000" placeholder="What’s involved, what you expect, anything applicants should know."></textarea><span class="err" data-err="description"></span></label>
        <fieldset><legend>Category</legend>${radios('category', CATS.map((c) => [c, c]), 'Programming')}<span class="err" data-err="category"></span></fieldset>
        <fieldset><legend>Payment</legend>${radios('payment_type', PAYS, 'Paid')}<span class="err" data-err="payment_type"></span></fieldset>
        <div class="two"><label class="field budget"><span>Budget in Rs</span><input type="number" name="budget" min="1" placeholder="2500"><span class="err" data-err="budget"></span></label>
          <label class="field"><span>Deadline</span><input type="date" name="deadline" min="${min}"><span class="err" data-err="deadline"></span></label></div>
        <button class="btn" type="submit">Publish gig</button></form></div>`;
    const f = $('[data-form="post"]');
    f.addEventListener('change', (e) => { if (e.target.name === 'payment_type') f.dataset.pay = e.target.value; });
    f.addEventListener('submit', (e) => { e.preventDefault(); submit(f, async (d) => { const g = await api('/gigs', { method: 'POST', body: d }); toast('Gig published.'); location.hash = '#/gig/' + g.id; }); });
  }

  /* ---------- my desk ---------- */
  async function viewDesk() {
    const [mine, apps, done, myReviews] = await Promise.all([api('/gigs?user_id=' + S.me), api('/applications'), api('/gigs?status=Completed'), api('/reviews?reviewer_id=' + S.me)]);
    const myApps = apps.filter((a) => a.applicant_id === S.me);
    const pending = mine.map((g) => ({ g, n: apps.filter((a) => a.gig_id === g.id && a.status === 'Pending').length })).filter((x) => x.n && x.g.status === 'Open');
    const toReview = done.filter((g) => (g.user_id === S.me || g.accepted_applicant_id === S.me) && !myReviews.some((r) => r.gig_id === g.id));
    const attn = [...pending.map(({ g, n }) => `<li><a href="#/gig/${g.id}">${esc(g.title)}</a> has ${plural(n, 'applicant')} waiting</li>`), ...toReview.map((g) => `<li><a href="#/gig/${g.id}">${esc(g.title)}</a> is finished. Leave your review</li>`)];
    const user = S.users.find((u) => u.id === S.me);
    app.innerHTML = `<h1 style="margin-bottom:22px">${esc(user.name.split(' ')[0])}’s desk</h1>
      ${attn.length ? `<div class="attn"><h2>Waiting on you</h2><ul>${attn.join('')}</ul></div>` : ''}
      <div class="cols"><section><h2 style="margin-bottom:14px">Gigs I posted</h2>${mine.length ? mine.map((g) => `<a class="mini" href="#/gig/${g.id}"><span><b>${esc(g.title)}</b><small>${payText(g)}, ${dueText(g)}</small></span>${badge(g.status)}</a>`).join('') : '<div class="empty">Nothing posted yet. <a href="#/post">Post your first gig</a>.</div>'}</section>
      <section><h2 style="margin-bottom:14px">My applications</h2>${myApps.length ? myApps.map((a) => `<a class="mini" href="#/gig/${a.gig_id}"><span><b>${esc(a.gig.title)}</b><small>Applied ${ago(a.created_at)}</small></span>${badge(a.status)}</a>`).join('') : '<div class="empty">You haven’t applied to anything. <a href="#/">Browse the board</a>.</div>'}</section></div>`;
  }

  /* ---------- profile ---------- */
  async function viewProfile(id) {
    const [u, gigs, reviews] = await Promise.all([api('/users/' + id), api('/gigs?user_id=' + id), api('/reviews?user_id=' + id)]);
    const st = u.stats;
    app.innerHTML = `<a class="crumb" href="#/">Back to the board</a>
      <div class="profile-head">${av(u, true)}<div><h1>${esc(u.name)}</h1><p style="color:var(--muted);margin-top:6px">${esc(u.major)}, semester ${u.semester}</p><p class="bio">${esc(u.bio)}</p>
        <div class="tags">${u.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div></div></div>
      <div class="stats"><div class="stat"><b>${st.gigs_posted}</b><span>Gigs posted</span></div><div class="stat"><b>${st.gigs_completed}</b><span>Gigs completed</span></div>
        <div class="stat"><b>${st.avg_rating == null ? '–' : '★ ' + st.avg_rating.toFixed(1)}</b><span>Average rating</span></div><div class="stat"><b>${st.review_count}</b><span>Reviews received</span></div></div>
      <div class="cols section"><section><h2 style="margin-bottom:14px">Gigs posted</h2>${gigs.length ? gigs.map((g) => `<a class="mini" href="#/gig/${g.id}"><span><b>${esc(g.title)}</b><small>${kindLabel(g)}, ${g.category}, ${payText(g)}</small></span>${badge(g.status)}</a>`).join('') : '<div class="empty">No gigs yet.</div>'}</section>
      <section><h2 style="margin-bottom:14px">What people say</h2>${reviews.length ? reviews.map((r) => `<div class="row"><div class="head">${av(r.reviewer)}<a href="#/profile/${r.reviewer.id}"><b>${esc(r.reviewer.name)}</b></a><span class="stars" style="margin-left:auto">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div><blockquote>${esc(r.comment)}</blockquote><small style="color:var(--muted)">On “${esc(r.gig_title)}”</small></div>`).join('') : '<div class="empty">No reviews yet. They appear after a gig is completed.</div>'}</section></div>`;
  }

  /* ---------- join ---------- */
  function viewJoin() {
    app.innerHTML = `<div class="formwrap"><h1>Create your profile</h1><p style="color:var(--muted)">One profile works for both sides: post gigs, apply to others, and collect reviews.</p>
      <form class="sheet" data-form="join" novalidate>
        <label class="field"><span>Full name</span><input name="name" maxlength="60"><span class="err" data-err="name"></span></label>
        <div class="two"><label class="field"><span>Major</span><input name="major" maxlength="60"><span class="err" data-err="major"></span></label>
          <label class="field"><span>Semester</span><input type="number" name="semester" min="1" max="12"><span class="err" data-err="semester"></span></label></div>
        <label class="field"><span>Skills <span class="hint">separated by commas</span></span><input name="skills" placeholder="Figma, Python, Essay editing"><span class="err" data-err="skills"></span></label>
        <label class="field"><span>Short bio</span><textarea name="bio" maxlength="300" style="min-height:80px"></textarea><span class="err" data-err="bio"></span></label>
        <button class="btn" type="submit">Create profile</button></form></div>`;
    const f = $('[data-form="join"]');
    f.addEventListener('submit', (e) => { e.preventDefault(); submit(f, async (d) => {
      const u = await api('/users', { method: 'POST', body: d });
      S.me = u.id; localStorage.setItem('swapboard_me', u.id); await loadUsers(); toast(`Welcome, ${u.name.split(' ')[0]}.`); location.hash = '#/profile/' + u.id;
    }); });
  }

  /* ---------- router ---------- */
  const routes = [[/^#\/$/, viewBoard], [/^#\/gig\/(\d+)$/, viewGig], [/^#\/post$/, viewPost], [/^#\/desk$/, viewDesk], [/^#\/profile\/(\d+)$/, viewProfile], [/^#\/join$/, viewJoin]];
  async function route() {
    const h = location.hash || '#/';
    renderHeader();
    for (const [re, fn] of routes) {
      const m = h.match(re);
      if (!m) continue;
      app.innerHTML = '<div class="loading">Loading…</div>';
      try { await fn(...m.slice(1)); } catch (e) { app.innerHTML = `<div class="empty"><h3>Couldn’t load this page</h3><p>${esc(e.message)}</p><p style="margin-top:14px"><a class="btn" href="#/">Back to the board</a></p></div>`; }
      window.scrollTo(0, 0); app.focus({ preventScroll: true });
      return;
    }
    app.innerHTML = '<div class="empty"><h3>Page not found</h3><p><a href="#/">Back to the board</a></p></div>';
  }
  async function loadUsers() { S.users = await api('/users'); if (!S.users.some((u) => u.id === S.me)) S.me = S.users[0]?.id || 1; }

  $('#reset-db').addEventListener('click', async () => {
    if (!confirm('Reset all data back to the seeded demo?')) return;
    await api('/reset', { method: 'POST' }); await loadUsers(); toast('Demo data restored.'); location.hash = '#/'; route();
  });
  window.addEventListener('hashchange', route);
  loadUsers().then(route).catch(() => { app.innerHTML = '<div class="empty"><h3>Can’t reach the server</h3><p>Start it with <code>npm start</code> and refresh.</p></div>'; });
})();

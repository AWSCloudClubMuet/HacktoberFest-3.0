// End-to-end API tests over real HTTP. Each test starts the API on a random port with its
// own temporary copy of the seed data, so tests are independent and never touch db.json.
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, gigInput, NOW, DAY_MS } from './helpers.js';

let api;
beforeEach(async () => { api = await startServer(); });
afterEach(async () => { await api.close(); });

const get = (url, as) => api.request('GET', url, { as });
const post = (url, as, body) => api.request('POST', url, { as, body });
const patch = (url, as, body) => api.request('PATCH', url, { as, body });
const ids = (list) => list.map((x) => x.id).sort();

describe('gig creation', () => {
  test('creates a valid gig owned by the acting user', async () => {
    const res = await post('/gigs', 'u2', gigInput({ title: '  Need a Django mentor  ' }));
    assert.equal(res.status, 201);
    assert.equal(res.body.id, 'g29');
    assert.equal(res.body.user_id, 'u2');
    assert.equal(res.body.title, 'Need a Django mentor');
    assert.equal(res.body.status, 'Open');
    assert.equal(res.body.accepted_applicant_id, null);
    assert.equal(res.body.owner.name, 'Bilal Ahmed');
    const list = await get('/gigs?q=django');
    assert.deepEqual(ids(list.body), ['g29']);
  });

  test('returns every invalid field at once', async () => {
    const res = await post('/gigs', 'u2', { title: 'Hi', payment_type: 'Paid', deadline: '2020-01-01' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    for (const field of ['title', 'description', 'type', 'category', 'budget', 'deadline']) {
      assert.ok(res.body.error.fields[field], `missing error for ${field}`);
    }
  });

  test('stores no budget for Skill Swap and Free gigs, and rejects one if sent', async () => {
    const free = await post('/gigs', 'u2', gigInput({ payment_type: 'Free', budget: null }));
    assert.equal(free.status, 201);
    assert.equal(free.body.budget, null);
    const bad = await post('/gigs', 'u2', gigInput({ payment_type: 'SkillSwap', budget: 1000 }));
    assert.equal(bad.status, 400);
    assert.ok(bad.body.error.fields.budget);
  });

  test('requires an acting user and refuses to post as someone else', async () => {
    assert.equal((await post('/gigs', undefined, gigInput())).status, 401);
    assert.equal((await post('/gigs', 'u999', gigInput())).body.error.code, 'UNKNOWN_USER');
    const spoof = await post('/gigs', 'u2', gigInput({ user_id: 'u1' }));
    assert.equal(spoof.status, 403);
  });
});

describe('discovery', () => {
  test('lists all seeded gigs with owners and computed statuses', async () => {
    const res = await get('/gigs');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 28);
    const g15 = res.body.find((g) => g.id === 'g15');
    assert.equal(g15.status, 'Expired');
    assert.equal(g15.owner.id, 'u6');
  });

  test('searches titles and descriptions', async () => {
    const res = await get('/gigs?q=flask');
    assert.deepEqual(ids(res.body), ['g5']);
    const desc = await get('/gigs?q=grasshopper'); // only in g28's description
    assert.deepEqual(ids(desc.body), ['g28']);
  });

  test('combines category, type, payment type, budget range and status filters', async () => {
    const res = await get('/gigs?category=Design&type=Requesting&payment_type=Paid&min_budget=1000&max_budget=6000');
    assert.deepEqual(ids(res.body), ['g15', 'g4']);
    const open = await get('/gigs?category=Design&type=Requesting&payment_type=Paid&min_budget=1000&max_budget=6000&status=Open');
    assert.deepEqual(ids(open.body), []);
    const swaps = await get('/gigs?payment_type=skillswap&status=open');
    assert.deepEqual(ids(swaps.body), ['g1', 'g24']);
  });

  test('a budget range excludes gigs without a budget', async () => {
    const res = await get('/gigs?min_budget=0');
    assert.ok(res.body.length > 0);
    assert.ok(res.body.every((g) => g.payment_type === 'Paid' && typeof g.budget === 'number'));
  });

  test('sorts by budget', async () => {
    const res = await get('/gigs?payment_type=Paid&sort=budget_desc');
    const budgets = res.body.map((g) => g.budget);
    assert.deepEqual(budgets, [...budgets].sort((a, b) => b - a));
    assert.equal(res.body[0].id, 'g7');
  });

  test('rejects invalid filters with a helpful message', async () => {
    const res = await get('/gigs?category=Cooking&sort=random');
    assert.equal(res.status, 400);
    assert.match(res.body.error.fields.category, /Programming, Design, Writing, Tutoring/);
    assert.ok(res.body.error.fields.sort);
  });
});

describe('applications', () => {
  test('applies with a message and shows up in "my applications"', async () => {
    const res = await post('/applications', 'u4', { gig_id: 'g1', message: 'I would love to design this logo for you.' });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'Pending');
    assert.equal(res.body.applicant_id, 'u4');
    const mine = await get('/applications?applicant_id=u4', 'u4');
    assert.ok(mine.body.some((a) => a.id === res.body.id && a.gig.title.includes('StudySync')));
  });

  test('cannot apply to your own gig', async () => {
    const res = await post('/applications', 'u1', { gig_id: 'g1', message: 'Applying to my own gig?' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'OWN_GIG');
  });

  test('cannot apply twice to the same gig', async () => {
    const res = await post('/applications', 'u3', { gig_id: 'g1', message: 'Applying a second time.' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'DUPLICATE_APPLICATION');
  });

  test('cannot apply to expired, in-progress, completed or cancelled gigs', async () => {
    for (const gigId of ['g15', 'g4', 'g9', 'g20']) {
      const res = await post('/applications', 'u10', { gig_id: gigId, message: 'Is this still available?' });
      assert.equal(res.status, 409, gigId);
      assert.equal(res.body.error.code, 'GIG_CLOSED', gigId);
    }
  });

  test('validates the message and the gig id', async () => {
    assert.equal((await post('/applications', 'u4', { gig_id: 'g1', message: 'Hi' })).status, 400);
    assert.equal((await post('/applications', 'u4', { gig_id: 'nope', message: 'Hello, can I help?' })).status, 404);
  });

  test('applications are private to the applicant and the gig owner', async () => {
    const owner = await get('/gigs/g1', 'u1');
    assert.deepEqual(ids(owner.body.applications), ['a1', 'a2', 'a3']);
    const applicant = await get('/gigs/g1', 'u3');
    assert.deepEqual(ids(applicant.body.applications), ['a1']);
    assert.equal(applicant.body.viewer.can_apply.code, 'DUPLICATE_APPLICATION');
    const stranger = await get('/gigs/g1', 'u5');
    assert.deepEqual(stranger.body.applications, []);
    assert.equal(stranger.body.application_count, 3);
    const list = await get('/applications?gig_id=g1', 'u5');
    assert.deepEqual(list.body, []);
    assert.equal((await get('/applications')).status, 401);
  });
});

describe('deadline expiry', () => {
  test('an open gig expires when its deadline passes and can be reopened by extending it', async () => {
    const created = await post('/gigs', 'u2', gigInput({ deadline: new Date(NOW + 2 * DAY_MS).toISOString() }));
    const id = created.body.id;
    api.clock.now = NOW + 3 * DAY_MS;

    assert.equal((await get(`/gigs/${id}`)).body.status, 'Expired');
    assert.ok((await get('/gigs?status=Expired')).body.some((g) => g.id === id));
    const apply = await post('/applications', 'u4', { gig_id: id, message: 'Hope it is not too late!' });
    assert.equal(apply.body.error.code, 'GIG_CLOSED');

    const extended = await patch(`/gigs/${id}`, 'u2', { deadline: new Date(NOW + 10 * DAY_MS).toISOString() });
    assert.equal(extended.status, 200);
    assert.equal(extended.body.status, 'Open');
    assert.equal((await post('/applications', 'u4', { gig_id: id, message: 'Great, applying now.' })).status, 201);
  });
});

describe('owner-only actions', () => {
  test('only the owner can change status, edit, or decide applications', async () => {
    const status = await patch('/gigs/g4', 'u6', { status: 'Completed' });
    assert.equal(status.status, 403);
    assert.equal(status.body.error.code, 'NOT_OWNER');
    assert.equal((await patch('/gigs/g1', 'u2', { title: 'Hijacked title here' })).status, 403);
    const decide = await patch('/applications/a1', 'u3', { status: 'Accepted' });
    assert.equal(decide.status, 403);
    assert.equal((await get('/gigs/g1')).body.status, 'Open');
  });

  test('only you can edit your profile', async () => {
    assert.equal((await patch('/users/u1', 'u2', { bio: 'Hacked' })).status, 403);
    const ok = await patch('/users/u1', 'u1', { bio: 'Updated bio', skills: ['React', 'Figma'] });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body.skills, ['React', 'Figma']);
  });

  test('system-managed fields cannot be set directly', async () => {
    const res = await patch('/gigs/g1', 'u1', { accepted_applicant_id: 'u3' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.accepted_applicant_id);
    assert.equal((await get('/gigs/g1')).body.accepted_applicant_id, null);
  });
});

describe('accepting an applicant', () => {
  test('moves the gig to In Progress and rejects the other pending applicants', async () => {
    const res = await patch('/applications/a2', 'u1', { status: 'Accepted' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'Accepted');
    assert.deepEqual(res.body.auto_rejected_ids.sort(), ['a1', 'a3']);

    const gig = (await get('/gigs/g1', 'u1')).body;
    assert.equal(gig.status, 'In Progress');
    assert.equal(gig.accepted_applicant_id, 'u11');
    const statuses = Object.fromEntries(gig.applications.map((a) => [a.id, a.status]));
    assert.deepEqual(statuses, { a1: 'Rejected', a2: 'Accepted', a3: 'Rejected' });
  });

  test('closes the gig to new applications and further acceptances', async () => {
    await patch('/applications/a2', 'u1', { status: 'Accepted' });
    const late = await post('/applications', 'u4', { gig_id: 'g1', message: 'Can I still apply?' });
    assert.equal(late.body.error.code, 'GIG_CLOSED');
    const second = await patch('/applications/a1', 'u1', { status: 'Accepted' });
    assert.equal(second.status, 409);
  });

  test('two simultaneous acceptances leave exactly one accepted applicant', async () => {
    const results = await Promise.all([
      patch('/applications/a1', 'u1', { status: 'Accepted' }),
      patch('/applications/a2', 'u1', { status: 'Accepted' }),
      patch('/applications/a3', 'u1', { status: 'Accepted' }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409, 409]);
    const apps = (await get('/applications?gig_id=g1', 'u1')).body;
    assert.equal(apps.filter((a) => a.status === 'Accepted').length, 1);
    assert.equal(apps.filter((a) => a.status === 'Rejected').length, 2);
  });

  test('rejecting one applicant leaves the gig open', async () => {
    const res = await patch('/applications/a3', 'u1', { status: 'Rejected' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.auto_rejected_ids, []);
    assert.equal((await get('/gigs/g1')).body.status, 'Open');
    assert.equal((await patch('/applications/a3', 'u1', { status: 'Accepted' })).body.error.code, 'INVALID_TRANSITION');
  });

  test('cannot accept on an expired gig', async () => {
    const res = await patch('/applications/a39', 'u6', { status: 'Accepted' });
    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /expired/i);
  });

  test('validates the decision', async () => {
    assert.equal((await patch('/applications/a1', 'u1', { status: 'Maybe' })).status, 400);
    assert.equal((await patch('/applications/a999', 'u1', { status: 'Accepted' })).status, 404);
  });
});

describe('status transitions', () => {
  test('Open cannot jump to Completed or In Progress', async () => {
    assert.equal((await patch('/gigs/g1', 'u1', { status: 'Completed' })).body.error.code, 'INVALID_TRANSITION');
    const direct = await patch('/gigs/g1', 'u1', { status: 'In Progress' });
    assert.equal(direct.status, 409);
    assert.match(direct.body.error.message, /Accept an applicant/);
  });

  test('In Progress can be completed, and completed gigs are final', async () => {
    const done = await patch('/gigs/g4', 'u1', { status: 'Completed' });
    assert.equal(done.status, 200);
    assert.equal(done.body.status, 'Completed');
    assert.ok(done.body.completed_at);
    assert.equal((await patch('/gigs/g4', 'u1', { status: 'Cancelled' })).status, 409);
    assert.equal((await patch('/gigs/g4', 'u1', { status: 'Open' })).status, 409);
  });

  test('cancelling an open gig rejects its pending applications', async () => {
    const res = await patch('/gigs/g2', 'u1', { status: 'Cancelled' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.auto_rejected_ids.sort(), ['a4', 'a5']);
    assert.equal((await post('/applications', 'u3', { gig_id: 'g2', message: 'Is this still on?' })).status, 409);
  });

  test('rejects unknown statuses and mixed updates', async () => {
    assert.equal((await patch('/gigs/g1', 'u1', { status: 'Paused' })).status, 400);
    assert.equal((await patch('/gigs/g1', 'u1', { status: 'Expired' })).status, 409);
    assert.equal((await patch('/gigs/g1', 'u1', { status: 'Cancelled', title: 'New title here' })).status, 400);
    assert.equal((await patch('/gigs/g1', 'u1', {})).status, 400);
  });

  test('only open gigs can be edited', async () => {
    const res = await patch('/gigs/g4', 'u1', { title: 'Renamed in progress gig' });
    assert.equal(res.status, 409);
  });

  test('switching an edited gig to Free drops its budget', async () => {
    const res = await patch('/gigs/g2', 'u1', { payment_type: 'Free' });
    assert.equal(res.status, 200);
    assert.equal(res.body.budget, null);
  });
});

describe('reviews and reputation', () => {
  const review = (as, body) => post('/reviews', as, body);

  test('participants review each other after completion and ratings are recalculated', async () => {
    const before = (await get('/users/u7')).body;
    assert.equal(before.average_rating, 5);
    assert.equal(before.review_count, 1);

    const res = await review('u1', { gig_id: 'g3', rating: 3, comment: 'Good proofreading, a little slow.' });
    assert.equal(res.status, 201);
    assert.equal(res.body.reviewee_id, 'u7');
    assert.equal(res.body.reviewee.average_rating, 4);

    const after = (await get('/users/u7')).body;
    assert.equal(after.average_rating, 4);
    assert.equal(after.review_count, 2);
    assert.ok(after.reviews_received.some((r) => r.id === res.body.id));
  });

  test('the full workflow: accept, complete, then both sides review', async () => {
    await patch('/applications/a1', 'u1', { status: 'Accepted' });
    assert.equal((await review('u1', { gig_id: 'g1', rating: 5, comment: 'Lovely logo work!' })).body.error.code, 'GIG_NOT_COMPLETED');
    await patch('/gigs/g1', 'u1', { status: 'Completed' });
    assert.equal((await review('u1', { gig_id: 'g1', rating: 5, comment: 'Lovely logo work!' })).status, 201);
    assert.equal((await review('u3', { gig_id: 'g1', rating: 4, comment: 'Clear brief, quick replies.' })).status, 201);
    const ayesha = (await get('/users/u1')).body;
    assert.equal(ayesha.review_count, 3);
    assert.equal(ayesha.average_rating, 4.7);
  });

  test('blocks reviews before completion, from outsiders, and duplicates', async () => {
    assert.equal((await review('u1', { gig_id: 'g4', rating: 5, comment: 'Not done yet!' })).body.error.code, 'GIG_NOT_COMPLETED');
    const outsider = await review('u2', { gig_id: 'g3', rating: 1, comment: 'I was never involved.' });
    assert.equal(outsider.status, 403);
    assert.equal(outsider.body.error.code, 'NOT_PARTICIPANT');
    const duplicate = await review('u7', { gig_id: 'g3', rating: 4, comment: 'Second review attempt.' });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'ALREADY_REVIEWED');
  });

  test('validates rating and comment', async () => {
    for (const rating of [0, 6, 4.5]) {
      const res = await review('u1', { gig_id: 'g3', rating, comment: 'Valid comment here.' });
      assert.equal(res.status, 400, `rating ${rating}`);
      assert.ok(res.body.error.fields.rating);
    }
    assert.ok((await review('u1', { gig_id: 'g3', rating: 5, comment: '' })).body.error.fields.comment);
    assert.equal((await review('u1', { gig_id: 'g3', rating: 5, comment: 'Great!', reviewee_id: 'u2' })).status, 400);
  });

  test('average ratings cannot be set by hand', async () => {
    const res = await patch('/users/u1', 'u1', { average_rating: 1 });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.average_rating);
    assert.equal((await get('/users/u1')).body.average_rating, 5);
  });
});

describe('persistence and errors', () => {
  test('changes survive an API restart', async () => {
    const { file } = api;
    const created = await post('/gigs', 'u5', gigInput({ title: 'Persistent gig title' }));
    await patch('/applications/a2', 'u1', { status: 'Accepted' });
    await api.request('GET', '/health');

    const restarted = await startServer({ dbFile: file });
    try {
      assert.equal((await restarted.request('GET', `/gigs/${created.body.id}`)).body.title, 'Persistent gig title');
      assert.equal((await restarted.request('GET', '/gigs/g1')).body.status, 'In Progress');
    } finally {
      await restarted.close();
    }
  });

  test('a rejected write changes nothing', async () => {
    const before = (await get('/gigs')).body.length;
    await post('/gigs', 'u2', gigInput({ budget: -5 }));
    assert.equal((await get('/gigs')).body.length, before);
  });

  test('returns JSON errors for unknown routes, missing records and bad bodies', async () => {
    const route = await get('/nope');
    assert.equal(route.status, 404);
    assert.equal(route.body.error.code, 'NOT_FOUND');
    assert.equal((await get('/gigs/g999')).status, 404);
    assert.equal((await get('/users/u999')).status, 404);
    const badJson = await api.request('POST', '/gigs', { as: 'u1', rawBody: '{"title":' });
    assert.equal(badJson.status, 400);
    assert.equal(badJson.body.error.code, 'INVALID_JSON');
    const array = await api.request('POST', '/gigs', { as: 'u1', body: [1, 2] });
    assert.equal(array.status, 400);
  });
});

describe('dashboard', () => {
  test('summarises what needs the user attention', async () => {
    const res = await get('/dashboard', 'u1');
    assert.equal(res.status, 200);
    const kinds = res.body.attention.map((item) => `${item.kind}:${item.gig.id}`).sort();
    assert.deepEqual(kinds, ['complete_gig:g4', 'leave_review:g3', 'review_applicants:g1', 'review_applicants:g2']);
    assert.ok(res.body.recommended.every((g) => g.user_id !== 'u1' && g.status === 'Open' && g.id !== 'g5'));
    assert.equal(res.body.stats.pending_applications, 1);
    assert.equal((await get('/dashboard')).status, 401);
  });
});

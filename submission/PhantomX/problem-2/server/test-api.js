import fs from 'fs';
import os from 'os';
import path from 'path';

const tempFile = path.join(os.tmpdir(), `campus-gig-${process.pid}.json`);
process.env.DATA_PATH = tempFile;

const { writeSeed } = await import('./seed.js');
const { createApp } = await import('./index.js');

writeSeed();
const app = createApp();
const server = await new Promise((resolve) => {
  const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
});
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const failures = [];

function check(condition, message, extra) {
  if (condition) {
    console.log(`ok  ${message}`);
    return;
  }
  const detail = extra === undefined ? '' : ` ${JSON.stringify(extra)}`;
  console.error(`FAIL ${message}${detail}`);
  failures.push(message);
}

async function api(method, urlPath, { user, body } = {}) {
  const response = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(user ? { 'x-user-id': user } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

try {
  const gigsRes = await api('GET', '/gigs');
  check(gigsRes.status === 200 && Array.isArray(gigsRes.data), 'lists gigs', gigsRes);
  const gigs = gigsRes.data || [];
  check(gigs.some((gig) => gig.status === 'Expired'), 'Open gigs past their deadline are returned as Expired');
  check(gigs.some((gig) => gig.status === 'Open'), 'seed includes an Open gig with a future deadline');

  const filtered = await api('GET', '/gigs?category=Programming&type=Offering&payment_type=Paid&min=100&max=200');
  check(
    filtered.status === 200
    && filtered.data.length > 0
    && filtered.data.every((gig) => (
      gig.category === 'Programming'
      && gig.type === 'Offering'
      && gig.payment_type === 'Paid'
      && gig.budget >= 100
      && gig.budget <= 200
    )),
    'filters combine with AND',
    filtered.data,
  );

  const searched = await api('GET', '/gigs?q=react');
  check(
    searched.status === 200
    && searched.data.length > 0
    && searched.data.every((gig) => `${gig.title} ${gig.description}`.toLowerCase().includes('react')),
    'q searches title and description',
  );

  const users = (await api('GET', '/users')).data || [];
  const existingApps = (await api('GET', '/applications')).data || [];
  const openGigs = gigs.filter((gig) => gig.status === 'Open');
  let chosen = null;
  for (const gig of openGigs) {
    const eligible = users.filter((user) => (
      user.id !== gig.user_id
      && !existingApps.some((application) => application.gig_id === gig.id && application.applicant_id === user.id)
    ));
    if (eligible.length >= 2) {
      chosen = { gig, a: eligible[0].id, b: eligible[1].id };
      break;
    }
  }
  check(Boolean(chosen), 'found an Open gig with two students who have not applied');
  if (!chosen) throw new Error('Cannot continue without an Open gig');

  const { gig, a, b } = chosen;
  const own = await api('POST', '/applications', {
    user: gig.user_id,
    body: { gig_id: gig.id, message: 'I will do my own gig.' },
  });
  check(own.status === 403, 'applying to your own gig is forbidden', own);

  const first = await api('POST', '/applications', {
    user: a,
    body: { gig_id: gig.id, message: 'I can help this week.' },
  });
  check(first.status === 201 && first.data.status === 'Pending', 'first application is created', first);
  if (first.status !== 201) throw new Error('Cannot continue without the first application');

  const duplicate = await api('POST', '/applications', {
    user: a,
    body: { gig_id: gig.id, message: 'Applying a second time.' },
  });
  check(duplicate.status === 409, 'duplicate application conflicts', duplicate);

  const second = await api('POST', '/applications', {
    user: b,
    body: { gig_id: gig.id, message: 'I can also help.' },
  });
  check(second.status === 201, 'second applicant can apply', second);
  if (second.status !== 201) throw new Error('Cannot continue without the second application');

  const before = await api('GET', `/applications?gig_id=${gig.id}`);
  const pendingBefore = before.data.filter((application) => application.status === 'Pending').map((application) => application.id);

  const accepted = await api('PATCH', `/applications/${first.data.id}`, {
    user: gig.user_id,
    body: { status: 'Accepted' },
  });
  check(accepted.status === 200 && accepted.data.status === 'Accepted', 'owner accepts one applicant', accepted);

  const afterGig = await api('GET', `/gigs/${gig.id}`);
  check(afterGig.data.status === 'In Progress', 'accept moves the gig to In Progress', afterGig.data);
  check(afterGig.data.accepted_applicant_id === a, 'accepted_applicant_id matches the accepted applicant', afterGig.data);

  const afterApps = await api('GET', `/applications?gig_id=${gig.id}`);
  const acceptedRows = afterApps.data.filter((application) => application.status === 'Accepted');
  check(acceptedRows.length === 1 && acceptedRows[0].applicant_id === a, 'exactly one application is Accepted', afterApps.data);
  for (const id of pendingBefore) {
    if (id === first.data.id) continue;
    const row = afterApps.data.find((application) => application.id === id);
    check(row && row.status === 'Rejected', `pending application ${id} was rejected`, row);
  }

  const fresh = users.find((user) => (
    user.id !== gig.user_id
    && user.id !== a
    && user.id !== b
    && !existingApps.some((application) => application.gig_id === gig.id && application.applicant_id === user.id)
  ));
  const late = await api('POST', '/applications', {
    user: fresh.id,
    body: { gig_id: gig.id, message: 'Is this still open?' },
  });
  check(late.status === 409, 'accepted gig is closed to new applications', late);

  const otherOpen = openGigs.find((item) => item.id !== gig.id);
  const completedEarly = await api('PATCH', `/gigs/${otherOpen.id}`, {
    user: otherOpen.user_id,
    body: { status: 'Completed' },
  });
  check(completedEarly.status === 409, 'completing a gig from Open fails', completedEarly);

  const completed = gigs.find((item) => item.status === 'Completed');
  const reviewList = await api('GET', `/reviews?reviewee_id=${completed.accepted_applicant_id}`);
  const existingReview = reviewList.data.find((review) => review.gig_id === completed.id);
  check(Boolean(existingReview), 'completed gig already has a review of the accepted applicant');
  const duplicateReview = await api('POST', '/reviews', {
    user: existingReview.reviewer_id,
    body: {
      gig_id: completed.id,
      reviewee_id: existingReview.reviewee_id,
      rating: 5,
      comment: 'Posting this review again.',
    },
  });
  check(duplicateReview.status === 409, 'duplicate review conflicts', duplicateReview);

  const profile = await api('GET', `/users/${existingReview.reviewee_id}`);
  const received = await api('GET', `/reviews?reviewee_id=${existingReview.reviewee_id}`);
  const expectedAverage = Math.round(
    (received.data.reduce((sum, review) => sum + review.rating, 0) / received.data.length) * 10,
  ) / 10;
  check(profile.data.average_rating === expectedAverage, 'average_rating is computed from reviews', {
    expected: expectedAverage,
    actual: profile.data.average_rating,
  });
  check(typeof profile.data.gigs_posted === 'number' && typeof profile.data.gigs_completed === 'number', 'profile includes gig counts', profile.data);

  const stored = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
  check(
    stored.users.every((user) => user.average_rating === undefined && user.gigs_posted === undefined),
    'average rating is not stored on the user',
  );
} catch (error) {
  console.error(error);
  failures.push(error.message);
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempFile, { force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');

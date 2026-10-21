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

const sessions = new Map();
let defaultToken = '';
let usersById = new Map();

async function api(method, urlPath, { user, token, body, anonymous = false } = {}) {
  let auth;
  if (!anonymous) {
    if (user) auth = await tokenFor(user);
    else auth = token || defaultToken;
  }
  const response = await fetch(`${base}${urlPath}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function tokenFor(userId) {
  if (sessions.has(userId)) return sessions.get(userId);
  const account = usersById.get(userId);
  const res = await api('POST', '/auth/login', {
    body: { email: account.email, password: 'Demo@1234' },
  });
  if (res.status !== 200) throw new Error(`Could not log in ${account.email}`);
  sessions.set(userId, res.data.token);
  return res.data.token;
}

try {
  const missingToken = await api('GET', '/gigs');
  check(missingToken.status === 401, 'a request without a token is rejected', missingToken);

  const missingName = await api('POST', '/auth/signup', {
    anonymous: true,
    body: { email: 'new.student@campus.edu', password: 'Demo@1234', major: 'Art', semester: 2 },
  });
  check(missingName.status === 400, 'signup requires a name', missingName);

  const badEmail = await api('POST', '/auth/signup', {
    anonymous: true,
    body: { name: 'New Student', email: 'not-an-email', password: 'Demo@1234', major: 'Art', semester: 2 },
  });
  check(badEmail.status === 400, 'signup rejects an invalid email', badEmail);

  const shortPassword = await api('POST', '/auth/signup', {
    anonymous: true,
    body: { name: 'New Student', email: 'new.student@campus.edu', password: 'short', major: 'Art', semester: 2 },
  });
  check(shortPassword.status === 400, 'signup rejects a short password', shortPassword);

  const duplicateEmail = await api('POST', '/auth/signup', {
    anonymous: true,
    body: { name: 'Aisha Copy', email: 'Aisha.Khan@Campus.edu', password: 'Demo@1234', major: 'Art', semester: 2 },
  });
  check(duplicateEmail.status === 409, 'signup rejects a duplicate email', duplicateEmail);

  const wrongPassword = await api('POST', '/auth/login', {
    anonymous: true,
    body: { email: 'aisha.khan@campus.edu', password: 'wrong-password' },
  });
  check(
    wrongPassword.status === 401 && wrongPassword.data.error === 'Invalid email or password',
    'wrong password is rejected',
    wrongPassword,
  );

  const login = await api('POST', '/auth/login', {
    anonymous: true,
    body: { email: 'aisha.khan@campus.edu', password: 'Demo@1234' },
  });
  check(
    login.status === 200 && login.data.token && login.data.user && login.data.user.password_hash === undefined,
    'login returns a token and omits password_hash',
    login.data && login.data.user,
  );
  if (login.status !== 200) throw new Error('Cannot continue without a token');
  defaultToken = login.data.token;

  const me = await api('GET', '/auth/me');
  check(me.status === 200 && me.data.id === 'u01' && me.data.password_hash === undefined, 'auth me returns the current user', me.data);

  const signedUp = await api('POST', '/auth/signup', {
    anonymous: true,
    body: {
      name: 'New Student',
      email: 'new.student@campus.edu',
      password: 'Demo@1234',
      major: 'Art',
      semester: 2,
    },
  });
  check(
    signedUp.status === 201 && signedUp.data.token && signedUp.data.user.email === 'new.student@campus.edu' && signedUp.data.user.password_hash === undefined,
    'signup creates a user and returns a token',
    signedUp.data && signedUp.data.user,
  );

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
  check(users.every((user) => user.password_hash === undefined && user.email), 'user list hides password hashes', users[0]);
  usersById = new Map(users.map((user) => [user.id, user]));
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

  const swapGig = openGigs.find((item) => item.id !== gig.id && item.payment_type === 'SkillSwap');
  const outsiders = swapGig
    ? users.filter((user) => (
      user.id !== swapGig.user_id
      && !existingApps.some((application) => application.gig_id === swapGig.id && application.applicant_id === user.id)
    ))
    : [];
  check(outsiders.length >= 2, 'found a SkillSwap gig with two students who have not applied');
  if (swapGig && outsiders.length >= 2) {
    const detailed = await api('POST', '/applications', {
      user: outsiders[0].id,
      body: {
        gig_id: swapGig.id,
        message: 'I can take this skill swap next week.',
        availability: 'Friday afternoon',
        portfolio_link: 'https://example.com/work',
        swap_offer: 'An hour of grammar coaching',
      },
    });
    check(
      detailed.status === 201
      && detailed.data.availability === 'Friday afternoon'
      && detailed.data.portfolio_link === 'https://example.com/work'
      && detailed.data.swap_offer === 'An hour of grammar coaching',
      'optional application fields are stored and returned',
      detailed,
    );
    const badUrl = await api('POST', '/applications', {
      user: outsiders[1].id,
      body: {
        gig_id: swapGig.id,
        message: 'Checking the portfolio link rules.',
        portfolio_link: 'not a url',
      },
    });
    check(badUrl.status === 400, 'portfolio_link must be a valid URL', badUrl);
  }

  const noteGig = openGigs.find((item) => item.id !== gig.id && item.id !== swapGig?.id);
  const noteApp = noteGig && existingApps.find((application) => application.gig_id === noteGig.id && application.status === 'Pending');
  if (noteGig && noteApp) {
    const tooLong = await api('PATCH', `/applications/${noteApp.id}`, {
      user: noteGig.user_id,
      body: { status: 'Rejected', rejection_note: 'x'.repeat(201) },
    });
    check(tooLong.status === 400, 'rejection_note is limited to 200 characters', tooLong);
    const noted = await api('PATCH', `/applications/${noteApp.id}`, {
      user: noteGig.user_id,
      body: { status: 'Rejected', rejection_note: 'Thanks for applying. The timing is tight.' },
    });
    check(
      noted.status === 200 && noted.data.status === 'Rejected' && noted.data.rejection_note === 'Thanks for applying. The timing is tight.',
      'owner can store an optional rejection note',
      noted,
    );
  }

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

  const chatGig = gigs.find((item) => item.status === 'In Progress' && item.accepted_applicant_id);
  const outsider = users.find((user) => user.id !== chatGig.user_id && user.id !== chatGig.accepted_applicant_id);
  const deniedRead = await api('GET', `/gigs/${chatGig.id}/messages`, { user: outsider.id });
  check(deniedRead.status === 403, 'outsider cannot read chat', deniedRead);
  const deniedSend = await api('POST', `/gigs/${chatGig.id}/messages`, {
    user: outsider.id,
    body: { text: 'Hello from outside the gig.' },
  });
  check(deniedSend.status === 403, 'outsider cannot send chat', deniedSend);
  const sent = await api('POST', `/gigs/${chatGig.id}/messages`, {
    user: chatGig.user_id,
    body: { text: 'See you at the walkthrough.' },
  });
  const thread = await api('GET', `/gigs/${chatGig.id}/messages`, { user: chatGig.accepted_applicant_id });
  check(
    sent.status === 201
      && sent.data.text === 'See you at the walkthrough.'
      && thread.status === 200
      && thread.data.some((message) => message.id === sent.data.id && message.sender_id === chatGig.user_id),
    'participant can send and read chat',
    { sent, thread: thread.status },
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

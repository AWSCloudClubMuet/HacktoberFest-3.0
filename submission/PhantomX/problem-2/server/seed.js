import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataFile } from './store.js';

const DAY = 24 * 60 * 60 * 1000;

function iso(daysFromNow) {
  return new Date(Date.now() + daysFromNow * DAY).toISOString();
}

const users = [
  { id: 'u01', name: 'Aisha Khan', major: 'Computer Science', semester: 6, bio: 'Full-stack student who tutors intro courses.', skills: ['JavaScript', 'React', 'Tutoring'] },
  { id: 'u02', name: 'Bilal Ahmed', major: 'Graphic Design', semester: 4, bio: 'Brand and poster designer for campus events.', skills: ['Figma', 'Illustration', 'Branding'] },
  { id: 'u03', name: 'Chen Wei', major: 'Computer Science', semester: 5, bio: 'Backend student who likes debugging sessions.', skills: ['Python', 'APIs', 'Debugging'] },
  { id: 'u04', name: 'Dua Malik', major: 'English', semester: 3, bio: 'Edits essays, resumes, and lab reports.', skills: ['Editing', 'Creative Writing', 'Proofreading'] },
  { id: 'u05', name: 'Ethan Brooks', major: 'Mathematics', semester: 7, bio: 'Calculus and statistics tutor.', skills: ['Calculus', 'Statistics', 'Tutoring'] },
  { id: 'u06', name: 'Fatima Noor', major: 'Visual Design', semester: 2, bio: 'Makes UI layouts and slide decks.', skills: ['UI Design', 'Canva', 'Figma'] },
  { id: 'u07', name: 'George Patel', major: 'Computer Science', semester: 8, bio: 'Looking for project partners on web apps.', skills: ['JavaScript', 'Node.js', 'Writing'] },
  { id: 'u08', name: 'Hina Shah', major: 'Biology', semester: 4, bio: 'Builds study guides and cleans up lab writeups.', skills: ['Biology', 'Tutoring', 'Editing'] },
  { id: 'u09', name: 'Imran Qureshi', major: 'Media Studies', semester: 6, bio: 'Writes short scripts, captions, and outlines.', skills: ['Writing', 'Video', 'Storytelling'] },
  { id: 'u10', name: 'Julia Santos', major: 'Computer Science', semester: 3, bio: 'Frontend practice partner for HTML and CSS.', skills: ['HTML', 'CSS', 'JavaScript'] },
  { id: 'u11', name: 'Kamran Ali', major: 'Business', semester: 5, bio: 'Helps with cover letters and case notes.', skills: ['Writing', 'Presentations', 'Research'] },
  { id: 'u12', name: 'Lena Ortiz', major: 'Fine Arts', semester: 4, bio: 'Poster concepts and design critiques.', skills: ['Design', 'Drawing', 'Tutoring'] },
];

// deadlineDays is relative to now. Open rows with a negative deadline surface as Expired.
const gigRows = [
  ['g01', 'u01', 'React office hours', 'Weekly help with React components, props, and debugging student projects.', 'Offering', 'Programming', 'Paid', 150, 30, 'Open', null],
  ['g02', 'u02', 'Need a club poster', 'Design a print-ready poster for the design club showcase next month.', 'Requesting', 'Design', 'Paid', 80, 21, 'Open', null],
  ['g03', 'u03', 'Proofread your README', 'I will proofread a project README and suggest clearer setup steps.', 'Offering', 'Writing', 'Free', null, 18, 'Open', null],
  ['g04', 'u04', 'Swap essay edit for grammar coaching', 'I will edit a short essay if you coach me through grammar rules for an hour.', 'Requesting', 'Tutoring', 'SkillSwap', null, 25, 'Open', null],
  ['g05', 'u05', 'Python script for lab data', 'Need a Python script that cleans a CSV and plots two columns.', 'Requesting', 'Programming', 'Paid', 200, 40, 'Open', null],
  ['g06', 'u06', 'Slide deck critique for a logo', 'I will critique your slide deck if you sketch a simple logo concept in return.', 'Offering', 'Design', 'SkillSwap', null, 16, 'Open', null],
  ['g07', 'u07', 'Look over my project abstract', 'Need a second pair of eyes on a 250-word project abstract. No pay.', 'Requesting', 'Writing', 'Free', null, 12, 'Open', null],
  ['g08', 'u08', 'Intro biology study session', 'One-hour session covering cell structure before the midterm.', 'Offering', 'Tutoring', 'Paid', 45, 28, 'Open', null],
  ['g09', 'u09', 'Pair on a small JavaScript bug', 'Sit with me for an hour and we will trace a JavaScript bug in your page.', 'Offering', 'Programming', 'Free', null, 14, 'Open', null],
  ['g10', 'u10', 'Landing page mock', 'Need a Figma mock for a one-page student portfolio landing page.', 'Requesting', 'Design', 'Paid', 120, 35, 'Open', null],
  ['g11', 'u11', 'Cover letter help for a resume review', 'I will draft your cover letter if you review my one-page resume.', 'Offering', 'Writing', 'SkillSwap', null, 19, 'Open', null],
  ['g12', 'u12', 'Practice explaining color theory', 'I want a classmate to quiz me on color theory before a critique. Free.', 'Requesting', 'Tutoring', 'Free', null, 22, 'Open', null],
  ['g13', 'u01', 'Logo sketch session', 'A paid hour of logo sketches. The deadline has already passed.', 'Offering', 'Design', 'Paid', 60, -10, 'Open', null],
  ['g14', 'u02', 'Caption swap that expired', 'Trade social captions for a poster tweak. This request is past its deadline.', 'Requesting', 'Writing', 'SkillSwap', null, -6, 'Open', null],
  ['g15', 'u03', 'Python office hour', 'Free Python help hour. The date has passed.', 'Offering', 'Tutoring', 'Free', null, -12, 'Open', null],
  ['g16', 'u04', 'Debug my form handler', 'Paid help debugging a form handler. The deadline has passed.', 'Requesting', 'Programming', 'Paid', 90, -3, 'Open', null],
  ['g17', 'u05', 'Node API walkthrough', 'Live walkthrough of a small Express API for a class project.', 'Offering', 'Programming', 'Paid', 100, 15, 'In Progress', 'u06'],
  ['g18', 'u06', 'Feedback on a poster layout', 'Need layout feedback on a campus event poster. No payment.', 'Requesting', 'Design', 'Free', null, 9, 'In Progress', 'u01'],
  ['g19', 'u07', 'Edit a lab report for notes', 'I will edit your lab report if you share your study notes.', 'Offering', 'Writing', 'SkillSwap', null, 11, 'In Progress', 'u08'],
  ['g20', 'u08', 'Stats problem set help', 'Need help finishing a statistics problem set before Friday.', 'Requesting', 'Tutoring', 'Paid', 55, 8, 'In Progress', 'u05'],
  ['g21', 'u09', 'Fix the quiz app', 'Paid fix for a quiz app that failed two test cases.', 'Requesting', 'Programming', 'Paid', 180, -2, 'Completed', 'u01'],
  ['g22', 'u10', 'Portfolio thumbnail set', 'I made a set of portfolio thumbnails for a classmate.', 'Offering', 'Design', 'Free', null, -4, 'Completed', 'u02'],
  ['g23', 'u11', 'Case note edit swap', 'Swapped a case-note edit for a resume pass.', 'Requesting', 'Writing', 'SkillSwap', null, -8, 'Completed', 'u04'],
  ['g24', 'u12', 'Design critique session', 'Paid critique session covering composition and hierarchy.', 'Offering', 'Tutoring', 'Paid', 75, -1, 'Completed', 'u08'],
  ['g25', 'u01', 'Abstract rewrite', 'Rewrote a project abstract for clarity. No payment.', 'Offering', 'Writing', 'Free', null, -7, 'Completed', 'u11'],
  ['g26', 'u03', 'Icon set for a club', 'Cancelled icon-set gig for the robotics club.', 'Offering', 'Design', 'Paid', 40, 5, 'Cancelled', null],
  ['g27', 'u04', 'Poem proofread', 'Cancelled request for a short poem proofread.', 'Requesting', 'Writing', 'Free', null, 6, 'Cancelled', null],
];

const gigs = gigRows.map(([id, user_id, title, description, type, category, payment_type, budget, deadlineDays, status, accepted_applicant_id]) => ({
  id,
  user_id,
  title,
  description,
  type,
  category,
  payment_type,
  budget,
  deadline: iso(deadlineDays),
  status,
  accepted_applicant_id,
  created_at: iso(deadlineDays < 0 ? deadlineDays - 5 : -12),
}));

const gigById = new Map(gigs.map((gig) => [gig.id, gig]));

function createdAfter(gigId, daysAfter) {
  const gig = gigById.get(gigId);
  return new Date(new Date(gig.created_at).getTime() + daysAfter * DAY).toISOString();
}

const applicationRows = [
  ['a01', 'g01', 'u02', 'I can help with React components this week.', 'Pending'],
  ['a02', 'g01', 'u03', 'Happy to debug alongside you.', 'Pending'],
  ['a03', 'g02', 'u01', 'I have made event posters in Figma.', 'Pending'],
  ['a04', 'g02', 'u05', 'I can handle layout if the brief is clear.', 'Pending'],
  ['a05', 'g03', 'u04', 'Send me the README and I will mark it up.', 'Pending'],
  ['a06', 'g03', 'u06', 'I can clean up the wording.', 'Pending'],
  ['a07', 'g03', 'u07', 'I write docs for my own projects.', 'Pending'],
  ['a08', 'g04', 'u08', 'I can coach grammar for an hour.', 'Pending'],
  ['a09', 'g04', 'u09', 'A swap works for me this weekend.', 'Pending'],
  ['a10', 'g05', 'u10', 'I can write the Python and the plot.', 'Pending'],
  ['a11', 'g05', 'u12', 'CSV cleanup is something I can do.', 'Pending'],
  ['a12', 'g06', 'u11', 'I will sketch a logo if you review my deck.', 'Pending'],
  ['a13', 'g07', 'u12', 'I can read the abstract today.', 'Pending'],
  ['a14', 'g08', 'u01', 'I would like the biology session.', 'Pending'],
  ['a15', 'g09', 'u03', 'Let us trace the bug together.', 'Pending'],
  ['a16', 'g10', 'u06', 'I can deliver a Figma mock.', 'Pending'],
  ['a17', 'g13', 'u05', 'I wanted the logo hour before the deadline.', 'Pending'],
  ['a18', 'g14', 'u08', 'I can still trade captions.', 'Pending'],
  ['a19', 'g17', 'u06', 'I need the Express walkthrough.', 'Accepted'],
  ['a20', 'g17', 'u07', 'I can join the API session too.', 'Rejected'],
  ['a21', 'g18', 'u01', 'I can give poster feedback tomorrow.', 'Accepted'],
  ['a22', 'g19', 'u08', 'I will trade notes for the edit.', 'Accepted'],
  ['a23', 'g19', 'u09', 'I can share notes as well.', 'Rejected'],
  ['a24', 'g20', 'u05', 'I can finish the stats set with you.', 'Accepted'],
  ['a25', 'g21', 'u01', 'I can fix the quiz test cases.', 'Accepted'],
  ['a26', 'g22', 'u02', 'I would like those thumbnails.', 'Accepted'],
  ['a27', 'g22', 'u06', 'I can take the thumbnail set.', 'Rejected'],
  ['a28', 'g23', 'u04', 'I will edit the case note.', 'Accepted'],
  ['a29', 'g24', 'u08', 'Please sign me up for the critique.', 'Accepted'],
  ['a30', 'g25', 'u11', 'Please rewrite my abstract.', 'Accepted'],
  ['a31', 'g26', 'u05', 'I was interested in the icons.', 'Rejected'],
  ['a32', 'g26', 'u12', 'I can use an icon set.', 'Rejected'],
  ['a33', 'g27', 'u07', 'I can proofread the poem.', 'Rejected'],
];

const applications = applicationRows.map(([id, gig_id, applicant_id, message, status]) => ({
  id,
  gig_id,
  applicant_id,
  message,
  status,
  created_at: createdAfter(gig_id, 1),
}));

const reviewRows = [
  ['r01', 'g21', 'u09', 'u01', 5, 'Clear debugging help and the quiz tests passed.'],
  ['r02', 'g21', 'u01', 'u09', 4, 'Well scoped request and quick feedback.'],
  ['r03', 'g22', 'u10', 'u02', 5, 'Sharp poster thumbnails and fast turnaround.'],
  ['r04', 'g22', 'u02', 'u10', 3, 'Good brief, with a few late replies.'],
  ['r05', 'g23', 'u11', 'u04', 4, 'Careful edit and useful notes on the case writeup.'],
  ['r06', 'g23', 'u04', 'u11', 5, 'Fair swap and easy to work with.'],
  ['r07', 'g24', 'u12', 'u08', 5, 'Great study of the composition problems.'],
  ['r08', 'g24', 'u08', 'u12', 4, 'Clear expectations for the critique session.'],
  ['r09', 'g25', 'u01', 'u11', 5, 'Helpful abstract edits and a clear ask.'],
];

const reviews = reviewRows.map(([id, gig_id, reviewer_id, reviewee_id, rating, comment]) => ({
  id,
  gig_id,
  reviewer_id,
  reviewee_id,
  rating,
  comment,
  created_at: createdAfter(gig_id, 2),
}));

function assertSeed(data) {
  const fail = (message) => {
    throw new Error(`Seed check failed: ${message}`);
  };
  const { users: seededUsers, gigs: seededGigs, applications: seededApps, reviews: seededReviews } = data;

  if (seededUsers.length < 12) fail(`expected at least 12 users, got ${seededUsers.length}`);
  if (seededGigs.length < 25) fail(`expected at least 25 gigs, got ${seededGigs.length}`);
  if (seededApps.length < 20) fail(`expected at least 20 applications, got ${seededApps.length}`);
  if (seededReviews.length < 8) fail(`expected at least 8 reviews, got ${seededReviews.length}`);

  const unique = (items, label) => {
    const ids = new Set();
    for (const item of items) {
      if (ids.has(item.id)) fail(`duplicate ${label} id ${item.id}`);
      ids.add(item.id);
    }
  };
  unique(seededUsers, 'user');
  unique(seededGigs, 'gig');
  unique(seededApps, 'application');
  unique(seededReviews, 'review');

  const userIds = new Set(seededUsers.map((user) => user.id));
  for (const category of ['Programming', 'Design', 'Writing', 'Tutoring']) {
    if (!seededGigs.some((gig) => gig.category === category)) fail(`missing category ${category}`);
  }
  if (!seededGigs.some((gig) => gig.type === 'Offering') || !seededGigs.some((gig) => gig.type === 'Requesting')) {
    fail('gigs must include Offering and Requesting');
  }
  for (const payment of ['Paid', 'SkillSwap', 'Free']) {
    if (!seededGigs.some((gig) => gig.payment_type === payment)) fail(`missing payment type ${payment}`);
  }

  const now = Date.now();
  const effective = new Set(seededGigs.map((gig) => (
    gig.status === 'Open' && new Date(gig.deadline).getTime() < now ? 'Expired' : gig.status
  )));
  for (const status of ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled']) {
    if (!effective.has(status)) fail(`missing effective status ${status}`);
  }
  if (!seededGigs.some((gig) => gig.status === 'Open' && new Date(gig.deadline).getTime() >= now)) {
    fail('need an Open gig with a future deadline');
  }
  if (!seededGigs.some((gig) => gig.status === 'Open' && new Date(gig.deadline).getTime() < now)) {
    fail('need an Open gig with a past deadline');
  }

  const gigsById = new Map(seededGigs.map((gig) => [gig.id, gig]));
  const pair = new Set();
  const appsByGig = new Map();
  for (const app of seededApps) {
    const gig = gigsById.get(app.gig_id);
    if (!gig) fail(`application ${app.id} references missing gig ${app.gig_id}`);
    if (!userIds.has(app.applicant_id)) fail(`application ${app.id} references missing user`);
    if (app.applicant_id === gig.user_id) fail(`application ${app.id} is from the gig owner`);
    const key = `${app.gig_id}:${app.applicant_id}`;
    if (pair.has(key)) fail(`duplicate application ${key}`);
    pair.add(key);
    if (!appsByGig.has(app.gig_id)) appsByGig.set(app.gig_id, []);
    appsByGig.get(app.gig_id).push(app);
  }

  for (const gig of seededGigs) {
    if (gig.payment_type === 'Paid') {
      if (typeof gig.budget !== 'number' || gig.budget <= 0) fail(`paid gig ${gig.id} needs a budget greater than 0`);
    } else if (gig.budget !== null) {
      fail(`gig ${gig.id} budget must be null`);
    }
    const apps = appsByGig.get(gig.id) || [];
    const accepted = apps.filter((app) => app.status === 'Accepted');
    if (gig.status === 'In Progress' || gig.status === 'Completed') {
      if (!gig.accepted_applicant_id) fail(`gig ${gig.id} is missing accepted_applicant_id`);
      if (accepted.length !== 1) fail(`gig ${gig.id} should have exactly one accepted application`);
      if (accepted[0].applicant_id !== gig.accepted_applicant_id) fail(`gig ${gig.id} accepted applicant does not match`);
      if (apps.some((app) => app.status === 'Pending')) fail(`gig ${gig.id} still has a pending application`);
    } else if (gig.accepted_applicant_id || accepted.length > 0) {
      fail(`gig ${gig.id} should not have an accepted applicant`);
    }
    if (gig.status === 'Cancelled' && apps.some((app) => app.status === 'Pending' || app.status === 'Accepted')) {
      fail(`cancelled gig ${gig.id} still has an open application`);
    }
  }

  for (const status of ['Pending', 'Accepted', 'Rejected']) {
    if (!seededApps.some((app) => app.status === status)) fail(`missing application status ${status}`);
  }

  const reviewKeys = new Set();
  for (const review of seededReviews) {
    const gig = gigsById.get(review.gig_id);
    if (!gig) fail(`review ${review.id} references missing gig`);
    if (gig.status !== 'Completed') fail(`review ${review.id} is not on a completed gig`);
    if (review.reviewer_id === review.reviewee_id) fail(`review ${review.id} is a self review`);
    const owner = gig.user_id;
    const applicant = gig.accepted_applicant_id;
    const parties = new Set([owner, applicant]);
    if (!parties.has(review.reviewer_id) || !parties.has(review.reviewee_id)) {
      fail(`review ${review.id} is not between the owner and accepted applicant`);
    }
    const expectedReviewee = review.reviewer_id === owner ? applicant : owner;
    if (review.reviewee_id !== expectedReviewee) fail(`review ${review.id} reviewee is not the other participant`);
    if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) fail(`review ${review.id} rating is out of range`);
    if (typeof review.comment !== 'string' || review.comment.trim() === '') fail(`review ${review.id} needs a comment`);
    const key = `${review.gig_id}:${review.reviewer_id}`;
    if (reviewKeys.has(key)) fail(`duplicate review ${key}`);
    reviewKeys.add(key);
  }
}

export function buildData() {
  return { users, gigs, applications, reviews };
}

export function writeSeed() {
  const data = buildData();
  assertSeed(data);
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invoked === fileURLToPath(import.meta.url)) {
  const data = writeSeed();
  console.log(`Seeded ${data.users.length} users, ${data.gigs.length} gigs, ${data.applications.length} applications, ${data.reviews.length} reviews`);
  console.log(`Wrote ${dataFile()}`);
}

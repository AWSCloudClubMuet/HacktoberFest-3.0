'use strict';
// Deterministic seed data: 12 users, 25 gigs, 22 applications, 8 reviews.
// Dates are relative to "today" so Open/Expired gigs always make sense.
const ENUMS = {
  types: ['Offering', 'Requesting'],
  categories: ['Programming', 'Design', 'Writing', 'Tutoring'],
  payment_types: ['Paid', 'SkillSwap', 'Free'],
  gig_statuses: ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'],
  application_statuses: ['Pending', 'Accepted', 'Rejected'],
};

const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const ago = (n) => new Date(Date.now() - n * 864e5 - 36e5).toISOString();

function buildSeed() {
  const U = (id, name, major, semester, bio, skills) => ({ id, name, major, semester, bio, skills });
  const users = [
    U(1, 'Ayesha Khan', 'Computer Science', 6, 'Full-stack tinkerer. I like shipping small things that actually get used.', ['React', 'Node.js', 'Python', 'Git']),
    U(2, 'Hamza Siddiqui', 'Software Engineering', 4, 'Mobile dev and part-time UI nerd. Happy to trade design for backend help.', ['Flutter', 'Firebase', 'UI Prototyping']),
    U(3, 'Maryam Tariq', 'Media Sciences', 5, 'Brand identity and layout. I sketch on paper first, always.', ['Figma', 'Illustrator', 'Branding', 'Layout']),
    U(4, 'Bilal Ahmed', 'Electrical Engineering', 7, 'Circuits, microcontrollers, and explaining both without a single slide.', ['Arduino', 'C++', 'Circuit Analysis', 'Physics']),
    U(5, 'Zainab Malik', 'English Literature', 3, 'I edit essays until they sound like you on a good day.', ['Copywriting', 'Editing', 'Essays', 'Proofreading']),
    U(6, 'Usman Raza', 'Business Administration', 6, 'Finance student running a small thrift venture on campus.', ['Excel', 'Pitch Decks', 'Finance']),
    U(7, 'Sana Farooqui', 'Computer Science', 8, 'Final year. Teaching assistant for data structures two semesters running.', ['Algorithms', 'Python', 'Java', 'Tutoring']),
    U(8, 'Daniyal Shah', 'Architecture', 5, 'Turns floor plans into renders people want to walk through.', ['Blender', 'Photoshop', '3D Modeling', 'SketchUp']),
    U(9, 'Hira Baig', 'Psychology', 4, 'Research methods, APA, and a lot of coffee.', ['Research Writing', 'SPSS', 'APA', 'Literature Review']),
    U(10, 'Taha Hussain', 'Data Science', 6, 'SQL by day, gradient descent by night.', ['SQL', 'Tableau', 'Machine Learning', 'Python']),
    U(11, 'Rida Nasir', 'Mass Communication', 2, 'Short-form video editor. Reels, recaps, and event highlights.', ['Premiere Pro', 'Video Editing', 'Reels']),
    U(12, 'Faizan Qureshi', 'Mathematics', 7, 'Calculus, linear algebra, and LaTeX evangelism.', ['Calculus', 'Linear Algebra', 'LaTeX']),
  ];

  const G = (id, user_id, type, category, payment_type, budget, title, description, dl, status, accepted_applicant_id = null) => ({
    id, user_id, title, description, type, category, payment_type, budget, deadline: day(dl), status,
    accepted_applicant_id, created_at: ago(((id * 7) % 13) + 2),
  });
  const gigs = [
    G(1, 1, 'Offering', 'Programming', 'Paid', 3000, 'Landing page in React, delivered in 3 days', 'I will build a responsive single-page site for your society, club or side project. Includes deployment on a free host and a short handover note.', 14, 'Open'),
    G(2, 2, 'Requesting', 'Programming', 'Paid', 5000, 'Flutter developer for our society event app', 'The debating society needs a simple app: event list, RSVP and push reminders. Firebase is already set up, we just need someone to wire the screens.', 10, 'Open'),
    G(3, 3, 'Offering', 'Design', 'Paid', 2500, 'Logo and mini brand kit for your society', 'Logo, colour palette, two typefaces and a one-page usage guide. Two rounds of revisions included.', 12, 'Open'),
    G(4, 5, 'Requesting', 'Design', 'SkillSwap', null, 'Poster for the literary fest, I will edit your report in return', 'Need an A3 poster and a square Instagram version. In exchange I will do a full edit of any report up to 25 pages.', 7, 'Open'),
    G(5, 7, 'Offering', 'Tutoring', 'Free', null, 'Weekly data structures problem-solving circle', 'Every Thursday evening we work through two interview-style problems together. All levels welcome, bring a laptop.', 20, 'Open'),
    G(6, 6, 'Requesting', 'Writing', 'Paid', 1500, 'Proofread my FYP proposal (20 pages)', 'Looking for someone with a sharp eye for grammar and structure. Business writing, APA references.', 5, 'Open'),
    G(7, 4, 'Offering', 'Tutoring', 'Paid', 800, 'Circuit analysis tutoring, per session', 'One hour on KVL, KCL, Thevenin and the topics that always show up in the midterm. Past papers provided.', 9, 'Open'),
    G(8, 9, 'Requesting', 'Programming', 'SkillSwap', null, 'Clean a survey dataset in Python, I will teach you APA', 'About 400 rows of messy survey data. I can walk you through APA formatting and stats reporting in exchange.', 8, 'Open'),
    G(9, 10, 'Offering', 'Programming', 'Paid', 4000, 'Dashboard in Tableau and SQL for your project data', 'Bring a dataset, leave with an interactive dashboard and the queries behind it.', 15, 'Open'),
    G(10, 11, 'Offering', 'Design', 'Paid', 2000, 'Instagram reel edits (30 to 60 seconds)', 'Cuts, captions, music sync and colour correction. Send raw clips, get a polished reel in two days.', 6, 'Open'),
    G(11, 12, 'Offering', 'Tutoring', 'Paid', 700, 'Calculus II exam prep, two-hour crash sessions', 'Integration techniques, series and convergence. Small groups of up to three get a discount.', 4, 'Open'),
    G(12, 8, 'Requesting', 'Design', 'Paid', 3500, '2D floor plans to 3D renders', 'Five residential plans need clean, lit renders for my studio portfolio. Reference moodboard provided.', 11, 'Open'),
    G(13, 2, 'Offering', 'Programming', 'SkillSwap', null, 'UI prototyping in exchange for backend help', 'I will prototype your app in Figma. Looking for someone who can help me with Express and PostgreSQL.', 13, 'Open'),
    G(14, 1, 'Requesting', 'Tutoring', 'Paid', 1000, 'Linear algebra help before the midterm', 'Eigenvalues and vector spaces are not clicking. Two sessions would do it.', -3, 'Open'),
    G(15, 5, 'Offering', 'Writing', 'Paid', 1200, 'Editing and rewrite for scholarship essays', 'Structure, voice and polish for personal statements. Turnaround within 48 hours.', -6, 'Open'),
    G(16, 3, 'Requesting', 'Writing', 'Free', null, 'Brand copy tester wanted, feedback welcome', 'Reading through some taglines and an about page and telling me what lands and what does not.', -2, 'Open'),
    G(17, 6, 'Requesting', 'Design', 'Paid', 3000, 'Pitch deck redesign for a business plan competition', 'Ten slides, clean and credible. Content is final, it just needs to look the part.', 2, 'In Progress', 3),
    G(18, 7, 'Requesting', 'Programming', 'Paid', 6000, 'REST API for a hostel complaint system', 'Node or Python, auth, CRUD and a status workflow. Documentation required.', 6, 'In Progress', 1),
    G(19, 9, 'Offering', 'Writing', 'SkillSwap', null, 'Literature review help for psychology majors', 'I will help you structure and write a lit review. Looking for a good proofreader in return.', 5, 'In Progress', 5),
    G(20, 10, 'Requesting', 'Tutoring', 'Paid', 900, 'Explain gradient descent with worked examples', 'One focused session with numeric examples I can redo on my own.', -5, 'Completed', 7),
    G(21, 3, 'Requesting', 'Programming', 'Paid', 3500, 'Portfolio website build', 'A fast, accessible portfolio with a project gallery and contact form.', -8, 'Completed', 2),
    G(22, 5, 'Requesting', 'Design', 'Paid', 1800, 'Cover and layout for the department magazine', 'Front cover plus a repeatable two-column layout for inside pages.', -10, 'Completed', 3),
    G(23, 1, 'Offering', 'Tutoring', 'Free', null, 'Intro to Git and GitHub workshop', 'Branches, commits, pull requests and how not to break main. One evening, hands-on.', -4, 'Completed', 11),
    G(24, 12, 'Requesting', 'Writing', 'Paid', 1000, 'LaTeX template formatting for a thesis', 'Need my thesis moved into the university template, including references and figures.', -12, 'Completed', 9),
    G(25, 4, 'Requesting', 'Programming', 'Paid', 2000, 'Arduino serial plotter in Python', 'Plot live sensor data from serial. Cancelled, we found an existing library.', 10, 'Cancelled'),
  ];

  const A = (id, gig_id, applicant_id, message, status, d) => ({ id, gig_id, applicant_id, message, status, created_at: ago(d) });
  const applications = [
    A(1, 1, 6, 'I need a simple page for my thrift store. Can we start this week?', 'Pending', 3),
    A(2, 1, 11, 'Would love a portfolio page for my reels. Flexible on timing.', 'Pending', 2),
    A(3, 2, 1, 'I have shipped two Flutter apps with Firebase. Happy to share the repos.', 'Pending', 2),
    A(4, 2, 7, 'Can do the RSVP flow and reminders. Quick call to scope it?', 'Pending', 1),
    A(5, 3, 5, 'Our lit society needs a mark. I can pay and proofread your copy too.', 'Pending', 4),
    A(6, 3, 12, 'Looking for a logo for a maths club. Sent a brief by message.', 'Rejected', 5),
    A(7, 4, 3, 'Love this brief. I can do both formats by Friday.', 'Pending', 1),
    A(8, 4, 8, 'I can do a poster with a bit of 3D lettering. Swap works for me.', 'Pending', 2),
    A(9, 6, 5, 'Proofreading is my thing. I can turn it around in two days.', 'Pending', 1),
    A(10, 6, 9, 'APA is practically a hobby. Happy to take this on.', 'Pending', 1),
    A(11, 12, 3, 'I can do clean lighting and layout. Can I see the moodboard?', 'Pending', 2),
    A(12, 17, 3, 'I redesign decks for fun. Can start tonight.', 'Accepted', 6),
    A(13, 17, 8, 'I can deliver a minimal deck with custom icons.', 'Rejected', 6),
    A(14, 18, 1, 'I have built a similar status workflow before. Details in my profile.', 'Accepted', 9),
    A(15, 18, 2, 'I can build this with Express and SQLite.', 'Rejected', 9),
    A(16, 18, 10, 'I can do the API with strong typing and docs.', 'Rejected', 8),
    A(17, 19, 5, 'I would love help with my lit review. I will proofread in return.', 'Accepted', 5),
    A(18, 20, 7, 'Happy to explain it with a spreadsheet and a tiny Python demo.', 'Accepted', 9),
    A(19, 21, 2, 'I can build this in plain HTML and CSS, fast and accessible.', 'Accepted', 12),
    A(20, 22, 3, 'Magazine layout is my favourite thing. Let us do it.', 'Accepted', 13),
    A(21, 23, 11, 'I want to finally understand pull requests. Count me in.', 'Accepted', 7),
    A(22, 24, 9, 'I know the university LaTeX template well.', 'Accepted', 14),
  ];

  const R = (id, gig_id, reviewer_id, reviewee_id, rating, comment) => ({ id, gig_id, reviewer_id, reviewee_id, rating, comment, created_at: ago(2) });
  const reviews = [
    R(1, 20, 10, 7, 5, 'Patient and clear. The spreadsheet demo made it click.'),
    R(2, 20, 7, 10, 5, 'Came prepared with good questions. Great session.'),
    R(3, 21, 3, 2, 4, 'Clean build and good communication. Slightly late on the contact form.'),
    R(4, 21, 2, 3, 5, 'Clear brief, quick feedback, paid on time.'),
    R(5, 22, 5, 3, 5, 'The cover got compliments from the whole department.'),
    R(6, 22, 3, 5, 4, 'Nice to work with. Feedback came in batches, which slowed things a little.'),
    R(7, 23, 1, 11, 5, 'Asked all the right questions and was pushing branches by the end.'),
    R(8, 24, 12, 9, 4, 'Thesis looks great. Needed one extra round on the references.'),
  ];

  return { users, gigs, applications, reviews };
}

module.exports = { buildSeed, ENUMS };

if (require.main === module && process.argv.includes('--write')) {
  const fs = require('fs'), path = require('path');
  const file = path.join(__dirname, '..', 'data', 'db.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const s = buildSeed();
  fs.writeFileSync(file, JSON.stringify(s, null, 2));
  console.log(`Seeded ${s.users.length} users, ${s.gigs.length} gigs, ${s.applications.length} applications, ${s.reviews.length} reviews -> data/db.json`);
}

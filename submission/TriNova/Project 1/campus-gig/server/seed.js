import { saveDb } from './db.js';

const users = [
  { id: 'u1', name: 'Ayesha Khan', major: 'Computer Science', semester: 5, bio: 'Web developer who loves React.', skills: ['React', 'JavaScript', 'Node.js'] },
  { id: 'u2', name: 'Hamza Ali', major: 'Software Engineering', semester: 6, bio: 'Android and Java tutor.', skills: ['Java', 'Android', 'Tutoring'] },
  { id: 'u3', name: 'Fatima Noor', major: 'Design', semester: 4, bio: 'Graphic designer for posters and logos.', skills: ['Photoshop', 'Illustrator', 'Branding'] },
  { id: 'u4', name: 'Usman Raza', major: 'Computer Science', semester: 7, bio: 'Backend and database projects.', skills: ['Python', 'SQL', 'Django'] },
  { id: 'u5', name: 'Sana Malik', major: 'English', semester: 3, bio: 'Content writer and proofreader.', skills: ['Writing', 'Editing', 'Proofreading'] },
  { id: 'u6', name: 'Bilal Ahmed', major: 'Electrical Engineering', semester: 5, bio: 'Math and physics tutor.', skills: ['Mathematics', 'Physics', 'Tutoring'] },
  { id: 'u7', name: 'Zainab Shah', major: 'Computer Science', semester: 3, bio: 'Learning UI/UX, love Figma.', skills: ['Figma', 'UI/UX', 'HTML/CSS'] },
  { id: 'u8', name: 'Ali Hassan', major: 'Business', semester: 6, bio: 'Video editor and presentation maker.', skills: ['Video Editing', 'PowerPoint', 'Canva'] },
  { id: 'u9', name: 'Mariam Iqbal', major: 'Software Engineering', semester: 4, bio: 'Flutter and mobile app builder.', skills: ['Flutter', 'Dart', 'Firebase'] },
  { id: 'u10', name: 'Daniyal Sheikh', major: 'Computer Science', semester: 8, bio: 'DSA and C++ mentor.', skills: ['C++', 'DSA', 'Tutoring'] },
  { id: 'u11', name: 'Hira Baig', major: 'Mass Communication', semester: 5, bio: 'Copywriting and social media content.', skills: ['Copywriting', 'Social Media', 'Writing'] },
  { id: 'u12', name: 'Saad Memon', major: 'Computer Science', semester: 2, bio: 'Beginner developer looking for guidance.', skills: ['HTML/CSS', 'JavaScript'] },
];

const g = (id, user_id, title, description, type, category, payment_type, budget, deadline, status, accepted_applicant_id = null) => ({
  id, user_id, title, description, type, category, payment_type, budget, deadline, status, accepted_applicant_id, created_at: '2026-10-01',
});

const gigs = [
  // Open (12)
  g('g1', 'u1', 'React landing page development', 'I will build a responsive React landing page for your club or project.', 'Offering', 'Programming', 'Paid', 3000, '2026-11-15', 'Open'),
  g('g2', 'u2', 'Java OOP tutoring sessions', 'One-on-one Java and OOP help with practice problems.', 'Offering', 'Tutoring', 'Paid', 1500, '2026-11-20', 'Open'),
  g('g3', 'u3', 'Logo and poster design', 'Custom logo or event poster in 2 revisions.', 'Offering', 'Design', 'Paid', 2000, '2026-11-10', 'Open'),
  g('g4', 'u4', 'Need REST API in Express', 'Looking for someone to build a simple REST API with CRUD routes.', 'Requesting', 'Programming', 'Paid', 5000, '2026-11-25', 'Open'),
  g('g5', 'u5', 'Free proofreading for assignments', 'I will proofread and fix grammar in your reports.', 'Offering', 'Writing', 'Free', null, '2026-12-01', 'Open'),
  g('g6', 'u6', 'Math tutoring in exchange for design help', 'I teach calculus, you help me with a poster.', 'Offering', 'Tutoring', 'SkillSwap', null, '2026-11-18', 'Open'),
  g('g7', 'u7', 'Need a logo, can teach HTML/CSS', 'Swap: you design a logo, I teach you HTML and CSS basics.', 'Requesting', 'Design', 'SkillSwap', null, '2026-11-22', 'Open'),
  g('g8', 'u8', 'Video editing for reels', 'Short reels and promo video editing with captions.', 'Offering', 'Design', 'Paid', 1800, '2026-11-30', 'Open'),
  g('g9', 'u9', 'Help debugging Flutter app', 'Need a quick pair of eyes on a Flutter state bug.', 'Requesting', 'Programming', 'Free', null, '2026-11-12', 'Open'),
  g('g10', 'u10', 'Free DSA doubt sessions', 'Weekly DSA and C++ doubt-clearing sessions.', 'Offering', 'Tutoring', 'Free', null, '2026-12-05', 'Open'),
  g('g11', 'u11', 'Blog posts for club website', 'Need 3 short blog posts for our club website.', 'Requesting', 'Writing', 'Paid', 1000, '2026-11-28', 'Open'),
  g('g12', 'u12', 'Need a JavaScript tutor', 'Beginner looking for help with JS basics and DOM.', 'Requesting', 'Tutoring', 'Paid', 800, '2026-11-16', 'Open'),
  // In Progress (5)
  g('g13', 'u1', 'Club banner design', 'Need a banner for our tech club event.', 'Requesting', 'Design', 'Paid', 2500, '2026-11-05', 'In Progress', 'u3'),
  g('g14', 'u4', 'Database design for UI mockups', 'I design your database, you make UI mockups.', 'Offering', 'Programming', 'SkillSwap', null, '2026-11-08', 'In Progress', 'u7'),
  g('g15', 'u2', 'Project report editing', 'Need my final report edited and formatted.', 'Requesting', 'Writing', 'Paid', 1200, '2026-11-03', 'In Progress', 'u5'),
  g('g16', 'u9', 'Firebase crash course', 'Quick course on Firebase auth and database.', 'Offering', 'Tutoring', 'Paid', 1000, '2026-11-09', 'In Progress', 'u12'),
  g('g17', 'u10', 'Build a quiz web app', 'Need a simple quiz app with score tracking.', 'Requesting', 'Programming', 'Paid', 3500, '2026-11-14', 'In Progress', 'u1'),
  // Completed (5)
  g('g18', 'u3', 'Business card design', 'Business card design with print-ready files.', 'Offering', 'Design', 'Paid', 1500, '2026-10-10', 'Completed', 'u8'),
  g('g19', 'u5', 'Resume writing help', 'Helped polish a student resume.', 'Offering', 'Writing', 'Free', null, '2026-10-05', 'Completed', 'u12'),
  g('g20', 'u6', 'Chemistry tutoring', 'Need help preparing for a chemistry quiz.', 'Requesting', 'Tutoring', 'Paid', 700, '2026-10-12', 'Completed', 'u11'),
  g('g21', 'u1', 'Portfolio website', 'Personal portfolio website using React.', 'Offering', 'Programming', 'Paid', 2000, '2026-10-15', 'Completed', 'u9'),
  g('g22', 'u8', 'Thumbnail design for video edit', 'Swap: thumbnails for video editing help.', 'Requesting', 'Design', 'SkillSwap', null, '2026-10-08', 'Completed', 'u3'),
  // Expired (2) and Cancelled (1)
  g('g23', 'u7', 'Fix CSS bugs', 'Need help fixing layout bugs on my site.', 'Requesting', 'Programming', 'Paid', 1500, '2026-09-30', 'Expired'),
  g('g24', 'u11', 'Caption writing', 'Writing captions for social media posts.', 'Offering', 'Writing', 'Paid', 600, '2026-10-01', 'Expired'),
  g('g25', 'u4', 'Linear algebra revision', 'Need revision help before midterms.', 'Requesting', 'Tutoring', 'Free', null, '2026-11-02', 'Cancelled'),
];

const a = (id, gig_id, applicant_id, message, status) => ({
  id, gig_id, applicant_id, message, status, created_at: '2026-10-05',
});

const applications = [
  // Accepted (10), one for each In Progress / Completed gig
  a('a1', 'g13', 'u3', 'I can design this banner in 2 days.', 'Accepted'),
  a('a2', 'g14', 'u7', 'I would love to make the UI mockups.', 'Accepted'),
  a('a3', 'g15', 'u5', 'I have edited many reports before.', 'Accepted'),
  a('a4', 'g16', 'u12', 'I want to learn Firebase, please accept me.', 'Accepted'),
  a('a5', 'g17', 'u1', 'I can build this quiz app in React.', 'Accepted'),
  a('a6', 'g18', 'u8', 'I need business cards for my startup.', 'Accepted'),
  a('a7', 'g19', 'u12', 'My resume needs help, thank you!', 'Accepted'),
  a('a8', 'g20', 'u11', 'I can teach chemistry basics clearly.', 'Accepted'),
  a('a9', 'g21', 'u9', 'I need a portfolio for internships.', 'Accepted'),
  a('a10', 'g22', 'u3', 'I can make eye-catching thumbnails.', 'Accepted'),
  // Rejected (4)
  a('a11', 'g13', 'u7', 'I can also design banners.', 'Rejected'),
  a('a12', 'g15', 'u11', 'I can edit your report quickly.', 'Rejected'),
  a('a13', 'g17', 'u4', 'I can build the backend part.', 'Rejected'),
  a('a14', 'g21', 'u12', 'I would like a portfolio too.', 'Rejected'),
  // Pending (6) on Open gigs
  a('a15', 'g1', 'u12', 'I need a landing page for my club.', 'Pending'),
  a('a16', 'g1', 'u7', 'Can we adjust the design together?', 'Pending'),
  a('a17', 'g4', 'u9', 'I can build the Express API.', 'Pending'),
  a('a18', 'g9', 'u1', 'Happy to help with your Flutter bug.', 'Pending'),
  a('a19', 'g11', 'u5', 'I write blog posts regularly.', 'Pending'),
  a('a20', 'g12', 'u10', 'I can teach you JavaScript basics.', 'Pending'),
];

const reviews = [
  { id: 'r1', gig_id: 'g18', reviewer_id: 'u3', reviewee_id: 'u8', rating: 5, comment: 'Clear feedback and paid on time.' },
  { id: 'r2', gig_id: 'g18', reviewer_id: 'u8', reviewee_id: 'u3', rating: 4, comment: 'Great design, small delay in delivery.' },
  { id: 'r3', gig_id: 'g19', reviewer_id: 'u5', reviewee_id: 'u12', rating: 4, comment: 'Polite and open to suggestions.' },
  { id: 'r4', gig_id: 'g19', reviewer_id: 'u12', reviewee_id: 'u5', rating: 5, comment: 'My resume looks amazing now.' },
  { id: 'r5', gig_id: 'g20', reviewer_id: 'u6', reviewee_id: 'u11', rating: 5, comment: 'Very attentive student.' },
  { id: 'r6', gig_id: 'g20', reviewer_id: 'u11', reviewee_id: 'u6', rating: 4, comment: 'Explained difficult topics well.' },
  { id: 'r7', gig_id: 'g21', reviewer_id: 'u1', reviewee_id: 'u9', rating: 5, comment: 'Smooth and professional.' },
  { id: 'r8', gig_id: 'g22', reviewer_id: 'u3', reviewee_id: 'u8', rating: 4, comment: 'Good video editing help.' },
];

saveDb({ users, gigs, applications, reviews });
console.log('Seeded:', users.length, 'users,', gigs.length, 'gigs,', applications.length, 'applications,', reviews.length, 'reviews');
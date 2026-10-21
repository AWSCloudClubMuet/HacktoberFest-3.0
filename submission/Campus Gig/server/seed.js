// Demo data: 12 students, 28 gigs, 43 applications and 11 reviews.
// Dates are relative to "now" when the database is created, so open gigs stay open and
// expired gigs stay expired however long after the hackathon the demo runs.
// The data is internally consistent: every In Progress / Completed gig has exactly one
// Accepted application, and reviews exist only on Completed gigs, from its two participants.

import { DAY_MS } from '../shared/constants.js';

const users = [
  ['u1', 'Ayesha Siddiqui', 'Software Engineering', 6, 'Full-stack developer who loves turning messy ideas into clean web apps. Happy to swap code help for design tips.', ['React', 'JavaScript', 'Node.js', 'UI Design']],
  ['u2', 'Bilal Ahmed', 'Computer Systems Engineering', 7, 'ML enthusiast. I tutor Python and help classmates turn data into something useful.', ['Python', 'Machine Learning', 'Pandas', 'SQL']],
  ['u3', 'Fatima Memon', 'Architecture', 5, 'Architecture student with a soft spot for brand identities, posters and hand-drawn illustration.', ['Graphic Design', 'Illustration', 'Branding', 'Adobe Illustrator']],
  ['u4', 'Hamza Qureshi', 'Electrical Engineering', 4, 'I explain circuits the way I wish they had been explained to me.', ['Circuit Analysis', 'MATLAB', 'Arduino', 'Physics']],
  ['u5', 'Zainab Shaikh', 'Software Engineering', 8, 'Final-year SE student. I edit reports, theses and READMEs until they read well.', ['Technical Writing', 'Editing', 'Documentation', 'React']],
  ['u6', 'Usman Khan', 'Telecommunication Engineering', 3, 'Society events videographer. Reels, aftermovies and promo edits.', ['Video Editing', 'Premiere Pro', 'Photography', 'Motion Graphics']],
  ['u7', 'Sana Baloch', 'Industrial Engineering & Management', 6, 'Writer and editor for the campus magazine. Proofreading is my cardio.', ['Content Writing', 'Proofreading', 'Copywriting', 'Public Speaking']],
  ['u8', 'Ali Raza', 'Mechanical Engineering', 5, 'CAD nerd. I tutor engineering drawing and calculus for juniors.', ['AutoCAD', 'SolidWorks', 'Engineering Drawing', 'Calculus']],
  ['u9', 'Hira Junejo', 'Computer Systems Engineering', 2, 'Second-semester coder building my portfolio one project at a time.', ['C++', 'Java', 'Data Structures', 'HTML/CSS']],
  ['u10', 'Danish Abro', 'Civil Engineering', 7, 'Spreadsheets, charts and lab reports. I make numbers presentable.', ['Excel', 'Data Visualization', 'Report Writing', 'Surveying']],
  ['u11', 'Mariam Soomro', 'Software Engineering', 4, 'Product design lover: Figma prototypes, app screens and pitch decks.', ['UI/UX Design', 'Figma', 'Prototyping', 'Canva']],
  ['u12', 'Faisal Chandio', 'Electronic Engineering', 6, 'I build Flutter apps for societies and small businesses on campus.', ['Flutter', 'Firebase', 'Dart', 'Mobile Apps']],
];

// [id, owner, type, category, payment, budget, title, description, created, deadline, status, accepted, decided, completed]
// Day offsets are relative to now (negative = in the past). "Open" gigs with a past deadline read as Expired.
const gigs = [
  ['g1', 'u1', 'Requesting', 'Design', 'SkillSwap', null, 'Logo and brand kit for my FYP app "StudySync"',
    "StudySync is the study-planner app for my final-year project. I need a clean logo, a small colour palette and an app icon that work in both light and dark mode. In exchange I'll build or fix a React website for you.",
    -3, 10, 'Open'],
  ['g2', 'u1', 'Offering', 'Tutoring', 'Paid', 1500, 'React & JavaScript crash course (2 sessions)',
    "Two 90-minute sessions in the library lab covering modern JavaScript, React components, state and hooks. You'll leave with a small working app. Ideal for 2nd to 4th semester students starting web development.",
    -6, 20, 'Open'],
  ['g3', 'u1', 'Requesting', 'Writing', 'Free', null, 'Proofread my FYP proposal (12 pages)',
    'Looking for someone with a sharp eye to proofread my final-year project proposal for grammar, flow and IEEE-style references before I submit it to my supervisor.',
    -24, -10, 'Completed', 'u7', -22, -13],
  ['g4', 'u1', 'Requesting', 'Design', 'Paid', 6000, 'Product demo video for StudySync',
    "Need a 60 to 90 second demo video of my app with captions, smooth transitions and background music for the FYP showcase. I'll provide the screen recordings and the script.",
    -9, 6, 'In Progress', 'u6', -7],
  ['g5', 'u2', 'Requesting', 'Programming', 'Paid', 5000, 'Help building a Flask API for my ML model',
    "I've trained a crop-disease classifier in Python and need a small Flask REST API around it: an image upload endpoint, input validation and basic documentation, so my teammate's mobile app can call it.",
    -2, 9, 'Open'],
  ['g6', 'u9', 'Requesting', 'Programming', 'Free', null, 'Code review for my C++ linked list project',
    "My linked list and stack implementation works but feels messy. I'd love a senior to review the code, point out memory leaks and suggest a cleaner structure. A 30 to 45 minute call is enough.",
    -1, 4, 'Open'],
  ['g7', 'u12', 'Offering', 'Programming', 'Paid', 15000, "I'll build your society's Flutter app",
    'I build cross-platform Flutter apps with Firebase login, event listings and push notifications. Perfect for societies that want their own app for members. Includes help publishing on Android.',
    -5, 25, 'Open'],
  ['g8', 'u10', 'Requesting', 'Programming', 'Paid', 7000, 'Web dashboard for our survey data',
    'Our civil engineering survey collected 400+ responses in Google Sheets. We need a small web dashboard with filters and charts that the department can open in any browser.',
    -12, 8, 'In Progress', 'u1', -10],
  ['g9', 'u4', 'Requesting', 'Programming', 'Paid', 6000, 'Website for the IEEE student branch event',
    'Single-page website for our IEEE student branch tech week: schedule, speakers, registration link and a countdown. It must look good on phones because most people open it from WhatsApp.',
    -30, -14, 'Completed', 'u1', -28, -16],
  ['g10', 'u5', 'Requesting', 'Programming', 'Paid', 4000, 'Personal portfolio website (React)',
    'Need a fast, minimal portfolio site to showcase my writing samples and projects, with a contact form and a downloadable CV. React preferred, hosted on GitHub Pages or Netlify.',
    -26, -8, 'Completed', 'u9', -24, -11],
  ['g11', 'u10', 'Offering', 'Writing', 'Paid', 800, 'Lab report formatting and charts',
    "I'll format your lab report to your department's template: headings, numbered figures, clean Excel charts and a consistent reference list. Send me your draft and get it back within two days.",
    -1, 6, 'Open'],
  ['g12', 'u11', 'Offering', 'Design', 'Paid', 3500, 'Figma UI kit and app screens for your startup idea',
    "I'll design up to 6 polished app screens in Figma with a reusable component kit (buttons, inputs, cards) and a clickable prototype you can use in pitches or hand over to developers.",
    -4, 18, 'Open'],
  ['g13', 'u3', 'Offering', 'Design', 'Paid', 1200, 'Event posters for your society, 24-hour turnaround',
    'Eye-catching posters and Instagram posts for society events, seminars and competitions. You get print-ready A3 plus social media sizes, with one round of revisions included.',
    -7, 14, 'Open'],
  ['g14', 'u7', 'Requesting', 'Design', 'SkillSwap', null, 'Cover illustration for the campus magazine',
    "Our autumn issue needs an original cover illustration on the theme 'Hidden corners of campus'. In return I'll proofread and polish your portfolio or statement of purpose.",
    -21, -5, 'Completed', 'u3', -19, -9],
  ['g15', 'u6', 'Requesting', 'Design', 'Paid', 2000, 'Thumbnail and banner set for my YouTube channel',
    'I run a tech-reviews channel and need a consistent thumbnail template (editable in Canva or Photoshop) plus a matching channel banner and profile picture.',
    -15, -3, 'Open'],
  ['g16', 'u5', 'Offering', 'Writing', 'Paid', 2500, 'Thesis chapter editing (APA and IEEE formatting)',
    'Careful editing of thesis chapters: grammar, clarity, consistent terminology and APA or IEEE citation formatting. Up to 15 pages per order, returned with tracked changes.',
    -8, 21, 'Open'],
  ['g17', 'u10', 'Requesting', 'Writing', 'Free', null, 'Proofread my lab report before submission',
    'Fluid mechanics lab report, around 8 pages. Need a quick check for grammar and clarity before submission. Happy to return the favour with Excel or chart help.',
    -10, -2, 'Open'],
  ['g18', 'u8', 'Requesting', 'Writing', 'SkillSwap', null, 'Help writing the report for our SolidWorks project',
    "Our team designed a gearbox in SolidWorks and now needs a well-structured technical report: introduction, methodology, results and discussion. In return I'll teach you SolidWorks basics.",
    -11, 5, 'In Progress', 'u5', -9],
  ['g19', 'u7', 'Offering', 'Writing', 'Free', null, "Copywriting for your society's social media",
    "I'm building my portfolio, so I'm writing captions, event announcements and short bios for society pages for free. Send me your society's tone and upcoming events and I'll draft a week of posts.",
    -4, 16, 'Open'],
  ['g20', 'u2', 'Requesting', 'Writing', 'Paid', 1800, 'README and docs for my open-source tool',
    'My Python CLI tool for cleaning CSV datasets needs a proper README, an installation guide and three usage examples so other students can use it.',
    -13, 3, 'Cancelled', null, -6],
  ['g21', 'u4', 'Offering', 'Tutoring', 'Paid', 2500, 'Circuit Analysis tutoring before midterms',
    'Three two-hour sessions on nodal and mesh analysis, Thevenin and Norton equivalents, and RC/RL transients, with past-paper practice. One-on-one or in a small group.',
    -2, 7, 'Open'],
  ['g22', 'u8', 'Offering', 'Tutoring', 'Free', null, 'Engineering drawing crash sessions',
    "Free sessions for juniors struggling with orthographic projections, sectional views and dimensioning. Bring your drawing kit and we'll work through past papers together.",
    -28, -12, 'Completed', 'u9', -27, -13],
  ['g23', 'u9', 'Requesting', 'Tutoring', 'Paid', 3000, 'Need a calculus tutor for 3 weeks',
    "I'm struggling with integration techniques and series. Looking for a patient tutor for two sessions a week until the final exam. Evenings after 5 pm work best for me.",
    -14, 7, 'In Progress', 'u8', -12],
  ['g24', 'u2', 'Offering', 'Tutoring', 'SkillSwap', null, 'Python for beginners weekend workshop',
    "A hands-on Saturday workshop covering Python basics: variables, loops, functions and a mini data project. In exchange, I'd love someone to teach me Figma or poster design.",
    -3, 11, 'Open'],
  ['g25', 'u11', 'Requesting', 'Tutoring', 'Free', null, 'Need a Data Structures tutor',
    'Looking for help understanding trees, heaps and graph traversal before my DSA quiz. Two short sessions would be enough.',
    -16, -5, 'Open'],
  ['g26', 'u12', 'Requesting', 'Tutoring', 'Free', null, 'Signals and Systems study group',
    'Looking for someone strong in Fourier and Laplace transforms to lead a small study group of four students before the mid-semester exam.',
    -18, -4, 'Cancelled', null, -9],
  ['g27', 'u6', 'Offering', 'Tutoring', 'SkillSwap', null, 'Learn Premiere Pro in 3 sessions',
    "I'll teach the editing workflow I use for event aftermovies: cuts, transitions, colour correction, captions and export settings. In exchange, help me write my channel's About page.",
    -25, -6, 'Completed', 'u5', -23, -7],
  ['g28', 'u3', 'Requesting', 'Programming', 'SkillSwap', null, 'Python help for my parametric design scripts',
    "I'm using Python inside Rhino and Grasshopper for parametric facade patterns and keep getting stuck. I need someone to help me structure the scripts. I'll design a poster or logo for you in return.",
    -10, 9, 'In Progress', 'u2', -8],
];

// [id, gig, applicant, status, created, message]. Decided applications take their gig's decision time.
const applications = [
  ['a1', 'g1', 'u3', 'Pending', -2.6, "Hi Ayesha! Branding is my favourite kind of project. I'd sketch three logo directions first, then refine one into a mini brand kit. A portfolio website would be a perfect swap."],
  ['a2', 'g1', 'u11', 'Pending', -2.1, "I've designed app icons for two campus startups. I can deliver the logo, palette and icon set in Figma within a week. A React site for my design portfolio would be a great swap!"],
  ['a3', 'g1', 'u6', 'Pending', -1.2, "I mostly do video, but I've made logos for my channel and two society events. Happy to give it a shot."],
  ['a4', 'g2', 'u9', 'Pending', -5.1, "I'm in my 2nd semester and want to learn React properly for my semester project. Saturdays work best for me."],
  ['a5', 'g2', 'u10', 'Pending', -3.4, 'I want to build a small dashboard for my survey project. Are the sessions okay for someone who only knows HTML?'],
  ['a6', 'g5', 'u1', 'Pending', -1.5, "I've built several Node and Flask APIs. I can wrap your model in a /predict endpoint, add validation and write short API docs. I can start this weekend."],
  ['a7', 'g5', 'u12', 'Pending', -0.8, "I can build the Flask API and also help connect it to your teammate's mobile app, since I work with Flutter."],
  ['a8', 'g6', 'u2', 'Pending', -0.6, 'Happy to review it! I was a DSA lab assistant last semester. Send me the repo link.'],
  ['a9', 'g7', 'u7', 'Pending', -3.9, 'Our campus magazine wants a simple app to publish issues and event notices. Could we discuss scope and timeline?'],
  ['a10', 'g12', 'u12', 'Pending', -2.7, "I'm building a Flutter app for a campus food delivery idea and need polished screens. Would love to work with you."],
  ['a11', 'g13', 'u10', 'Pending', -5.5, "Need posters for our civil engineering society's seminar next week. Can you do both A3 and Instagram sizes?"],
  ['a12', 'g16', 'u8', 'Pending', -6.2, "My thesis literature review needs IEEE formatting help. It's about 12 pages. Is that within scope?"],
  ['a13', 'g16', 'u4', 'Pending', -4.8, "I'd like two chapters edited for clarity and APA formatting. Could you start next week?"],
  ['a14', 'g19', 'u6', 'Pending', -3.1, 'Our photography club needs captions for an upcoming exhibition. Would love your help!'],
  ['a15', 'g19', 'u12', 'Pending', -1.9, "Could you write a short announcement for our mobile dev society's launch event?"],
  ['a16', 'g21', 'u9', 'Pending', -1.7, "My circuits midterm is in two weeks and I'm lost on Thevenin equivalents. Do you have space for one more?"],
  ['a17', 'g21', 'u8', 'Pending', -0.9, "I'd like to brush up on RC transients before the midterm. Group sessions work for me."],
  ['a18', 'g24', 'u11', 'Pending', -2.4, "I'd love to join, and I can definitely teach you Figma in return!"],
  ['a19', 'g24', 'u3', 'Pending', -1.1, 'I need Python for my parametric design work. I can teach poster design in exchange.'],
  ['a20', 'g4', 'u6', 'Accepted', -8.2, 'I edit event aftermovies for three societies. I can deliver a polished demo with captions and music within five days.'],
  ['a21', 'g4', 'u3', 'Rejected', -8.0, 'I can storyboard the demo and animate it using your screenshots.'],
  ['a22', 'g8', 'u1', 'Accepted', -11.3, 'I can build this with React and a lightweight chart library, reading straight from your Google Sheets export. I will share progress every two days.'],
  ['a23', 'g8', 'u9', 'Rejected', -10.8, "I'd like to try this as a learning project. I know HTML, CSS and some JavaScript."],
  ['a24', 'g18', 'u5', 'Accepted', -10.4, "Technical reports are my thing, and I'd love to learn SolidWorks basics in exchange."],
  ['a25', 'g18', 'u7', 'Rejected', -9.9, 'I can help structure and proofread your report.'],
  ['a26', 'g23', 'u8', 'Accepted', -13.2, 'I tutor calculus for juniors every semester. Tuesday and Thursday evenings work for me.'],
  ['a27', 'g23', 'u4', 'Rejected', -12.7, 'I can help with integration and series, mostly on weekends.'],
  ['a28', 'g28', 'u2', 'Accepted', -9.3, "Python is my main language and I've used it with Rhino before. Happy to swap for a logo!"],
  ['a29', 'g28', 'u12', 'Rejected', -8.9, 'I can help you structure your scripts. I am available most evenings.'],
  ['a30', 'g3', 'u7', 'Accepted', -23.4, 'I proofread for the campus magazine every week. I can return tracked changes within two days.'],
  ['a31', 'g9', 'u1', 'Accepted', -29.2, 'I can build a fast, mobile-first event site with a live countdown and schedule, delivered within a week.'],
  ['a32', 'g9', 'u12', 'Rejected', -28.6, 'I can build it with Flutter Web, including a registration form.'],
  ['a33', 'g10', 'u9', 'Accepted', -25.1, "I'd love to build this to grow my own portfolio too. I know React basics and learn fast."],
  ['a34', 'g10', 'u1', 'Rejected', -24.7, 'I can build a polished React portfolio with a contact form and deploy it on Netlify.'],
  ['a35', 'g14', 'u3', 'Accepted', -20.3, 'This theme is perfect for me, I sketch campus corners all the time! Happy to swap for a proofread of my portfolio statement.'],
  ['a36', 'g22', 'u9', 'Accepted', -27.6, "Engineering drawing is my weakest subject. I'd be grateful for the help!"],
  ['a37', 'g22', 'u10', 'Rejected', -27.3, 'Could I join for the sectional views session?'],
  ['a38', 'g27', 'u5', 'Accepted', -24.2, "I've always wanted to learn video editing. Happy to write your About page in return."],
  ['a39', 'g15', 'u11', 'Pending', -12.5, 'I can design a thumbnail template in Canva so you can edit it yourself for every video.'],
  ['a40', 'g25', 'u2', 'Pending', -14.1, 'I can explain trees and graph traversal with visual examples. I am free this week.'],
  ['a41', 'g20', 'u5', 'Rejected', -12.1, 'Documentation is my specialty. I can write the README with examples in two days.'],
  ['a42', 'g20', 'u7', 'Rejected', -10.4, 'Happy to help with clear, beginner-friendly docs.'],
  ['a43', 'g26', 'u4', 'Rejected', -16.8, "Signals is my strongest subject. I'd be glad to lead the study group."],
];

// [id, gig, reviewer, reviewee, rating, created, comment]
const reviews = [
  ['r1', 'g3', 'u7', 'u1', 5, -12.5, "Ayesha's brief was crystal clear and she answered every question quickly. Lovely to work with."],
  ['r2', 'g9', 'u4', 'u1', 5, -15.2, 'Delivered the event site two days early and it looked great on phones. Highly recommended!'],
  ['r3', 'g9', 'u1', 'u4', 4, -15.0, 'Clear requirements and fair payment. Feedback on drafts came a little late, but it was helpful.'],
  ['r4', 'g10', 'u5', 'u9', 4, -10.3, 'Solid work for a second-semester student. Needed a couple of revisions on the mobile layout.'],
  ['r5', 'g10', 'u9', 'u5', 5, -10.1, 'Zainab gave detailed, kind feedback and paid on time. A great first client!'],
  ['r6', 'g14', 'u7', 'u3', 5, -8.4, 'The cover illustration was stunning. Everyone at the magazine loved it.'],
  ['r7', 'g14', 'u3', 'u7', 5, -8.0, 'Sana proofread my portfolio statement in return and was incredibly thorough.'],
  ['r8', 'g22', 'u9', 'u8', 4, -12.6, 'Ali explains orthographic projection really well. Sessions sometimes ran a bit late.'],
  ['r9', 'g22', 'u8', 'u9', 5, -12.2, 'Hira came prepared to every session and asked great questions.'],
  ['r10', 'g27', 'u5', 'u6', 5, -6.3, 'Learned the Premiere basics in three sessions. Patient and very practical.'],
  ['r11', 'g27', 'u6', 'u5', 4, -6.1, 'Zainab was a quick learner and wrote a great About page for my channel in return.'],
];

export function buildSeedData(now = Date.now()) {
  // Rounded to the minute so the generated file is easy to read.
  const at = (days) => new Date(Math.round((now + days * DAY_MS) / 60000) * 60000).toISOString();
  const gigById = new Map();

  const gigRecords = gigs.map(([id, user_id, type, category, payment_type, budget, title, description,
    created, deadline, status, accepted = null, decided = null, completed = null]) => {
    const gig = {
      id, user_id, title, description, type, category, payment_type, budget,
      deadline: at(deadline),
      status,
      accepted_applicant_id: accepted,
      created_at: at(created),
      updated_at: at(completed ?? decided ?? created),
      completed_at: completed === null ? null : at(completed),
    };
    gigById.set(id, { gig, decided });
    return gig;
  });

  const applicationRecords = applications.map(([id, gig_id, applicant_id, status, created, message]) => {
    const { decided } = gigById.get(gig_id);
    return {
      id, gig_id, applicant_id, message, status,
      created_at: at(created),
      updated_at: at(status === 'Pending' ? created : decided),
    };
  });

  const reviewRecords = reviews.map(([id, gig_id, reviewer_id, reviewee_id, rating, created, comment]) => ({
    id, gig_id, reviewer_id, reviewee_id, rating, comment, created_at: at(created),
  }));

  return {
    users: users.map(([id, name, major, semester, bio, skills]) => ({ id, name, major, semester, bio, skills })),
    gigs: gigRecords,
    applications: applicationRecords,
    reviews: reviewRecords,
  };
}

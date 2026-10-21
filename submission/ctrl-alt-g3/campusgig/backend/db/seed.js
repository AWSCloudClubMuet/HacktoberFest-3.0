import { reset } from "./db.js";

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const isoDate = (d) => d.toISOString().slice(0, 10);

// ---------- USERS (12) ----------
const users = [
  [1, "Ayesha Khan", "Software Engineering", 5, "Full-stack dev who loves React and Node.", ["React", "Node.js", "MongoDB"]],
  [2, "Hamza Ali", "Computer Systems", 3, "UI/UX hobbyist, Figma all day.", ["Figma", "UI Design", "Illustrator"]],
  [3, "Sara Memon", "Software Engineering", 7, "Teaching assistant for programming courses.", ["Python", "Java", "Tutoring", "DSA"]],
  [4, "Bilal Ahmed", "Telecommunication", 4, "Writes technical blogs and reports.", ["Technical Writing", "Proofreading"]],
  [5, "Fatima Noor", "Software Engineering", 5, "Frontend developer and hackathon regular.", ["React", "TypeScript", "CSS"]],
  [6, "Usman Raza", "Software Engineering", 3, "Backend dev, Python and Flask.", ["Python", "Flask", "SQL"]],
  [7, "Zainab Shah", "Electronics", 6, "Math and physics tutor.", ["Calculus", "Physics", "Tutoring"]],
  [8, "Danish Qureshi", "Computer Systems", 4, "Poster and branding designer.", ["Photoshop", "Canva", "Branding"]],
  [9, "Maryam Siddiqui", "Software Engineering", 6, "Video editor and content creator.", ["Premiere Pro", "After Effects", "Editing"]],
  [10, "Ali Hassan", "Software Engineering", 8, "Backend engineer, APIs and databases.", ["Node.js", "Express", "PostgreSQL", "Java"]],
  [11, "Hira Baloch", "Industrial Engineering", 2, "Learning DSA, great at linear algebra.", ["Linear Algebra", "Excel", "Tutoring"]],
  [12, "Saad Lashari", "English Linguistics", 5, "Copywriter and resume reviewer.", ["Copywriting", "Resume Writing", "Editing"]],
].map(([id, name, major, semester, bio, skills]) => ({ id, name, major, semester, bio, skills }));

// ---------- GIGS (28) ----------
// [owner, title, description, type, category, payment, budget, deadlineDaysFromNow, status, acceptedApplicantId]
const gigRows = [
  // Open, future deadline (1-12)
  [1, "Build a personal portfolio website", "Need a clean responsive portfolio with 4 pages.", "Requesting", "Programming", "Paid", 8000, 10, "Open", null],
  [2, "Logo design for our society", "Need a modern logo for the Robotics Society.", "Requesting", "Design", "Paid", 3000, 7, "Open", null],
  [3, "Python tutoring for beginners", "Weekly sessions covering basics to OOP.", "Offering", "Tutoring", "Paid", 1000, 20, "Open", null],
  [4, "Proofreading for final year reports", "I will proofread and fix grammar in your reports.", "Offering", "Writing", "Free", null, 15, "Open", null],
  [5, "Help with a React state bug", "Stuck on a state management issue, can swap CSS help.", "Requesting", "Programming", "SkillSwap", null, 5, "Open", null],
  [6, "Poster design for your event", "Eye-catching posters delivered in 48 hours.", "Offering", "Design", "Paid", 2000, 12, "Open", null],
  [7, "Calculus tutoring sessions", "Will teach calculus in exchange for coding help.", "Offering", "Tutoring", "SkillSwap", null, 30, "Open", null],
  [8, "Blog writing for tech club", "Need 3 blog posts on campus tech events.", "Requesting", "Writing", "Paid", 1500, 9, "Open", null],
  [9, "Video editing for event reel", "I can edit your event footage into a highlight reel.", "Offering", "Design", "Paid", 4000, 14, "Open", null],
  [10, "Debug your Node.js API", "Free help finding bugs in Express APIs.", "Offering", "Programming", "Free", null, 6, "Open", null],
  [11, "Looking for a DSA study partner", "Will trade linear algebra help for DSA practice.", "Requesting", "Tutoring", "SkillSwap", null, 25, "Open", null],
  [12, "Resume writing and review", "Professional resume rewrite for internships.", "Offering", "Writing", "Paid", 500, 18, "Open", null],
  // Open, deadline passed -> displays as Expired (13-16)
  [1, "Fix CSS layout on my site", "Layout breaks on mobile screens.", "Requesting", "Programming", "Paid", 1200, -3, "Open", null],
  [3, "Banner design for department fest", "Need a banner for the stage.", "Requesting", "Design", "Free", null, -5, "Open", null],
  [5, "Essay editing needed", "Looking for someone to polish my essay.", "Requesting", "Writing", "SkillSwap", null, -2, "Open", null],
  [7, "Physics tutor needed", "Need help before the midterm.", "Requesting", "Tutoring", "Paid", 800, -7, "Open", null],
  // In Progress (17-20)
  [2, "Mobile app UI mockups", "Design 6 screens for a student app.", "Requesting", "Design", "Paid", 5000, 8, "In Progress", 4],
  [6, "Build a Flask REST API", "Simple CRUD API with auth.", "Requesting", "Programming", "Paid", 6000, 11, "In Progress", 8],
  [9, "Edit my technical article", "Polish a 2000-word article on web dev.", "Requesting", "Writing", "SkillSwap", null, 4, "In Progress", 10],
  [11, "Linear algebra tutoring", "Free weekly sessions on matrices.", "Offering", "Tutoring", "Free", null, 7, "In Progress", 3],
  // Completed (21-26)
  [1, "Landing page for the fest", "Single landing page with registration form.", "Requesting", "Programming", "Paid", 7000, -4, "Completed", 5],
  [4, "Poster for a seminar", "A3 poster for the networking seminar.", "Requesting", "Design", "Paid", 2500, -6, "Completed", 6],
  [8, "Newsletter copywriting", "Write the monthly society newsletter.", "Requesting", "Writing", "SkillSwap", null, -3, "Completed", 12],
  [10, "Intro to Java tutoring", "Free beginner Java sessions.", "Offering", "Tutoring", "Free", null, -8, "Completed", 2],
  [12, "Help with chatbot project", "Need guidance building a simple chatbot.", "Requesting", "Programming", "SkillSwap", null, -5, "Completed", 3],
  [3, "Presentation slide design", "Design slides for a final presentation.", "Requesting", "Design", "Paid", 1800, -2, "Completed", 9],
  // Cancelled (27-28)
  [5, "Game dev partner wanted", "Looking for a partner for a small 2D game.", "Requesting", "Programming", "SkillSwap", null, 12, "Cancelled", null],
  [7, "Thesis formatting help", "Need formatting done in LaTeX.", "Requesting", "Writing", "Paid", 2000, 3, "Cancelled", null],
];

const gigs = gigRows.map(
  ([user_id, title, description, type, category, payment_type, budget, dl, status, accepted_applicant_id], i) => ({
    id: i + 1,
    user_id,
    title,
    description,
    type,
    category,
    payment_type,
    budget,
    deadline: isoDate(daysFromNow(dl)),
    status,
    accepted_applicant_id,
    created_at: daysFromNow(-20 + (i % 5)).toISOString(),
  })
);

// ---------- APPLICATIONS (23) ----------
// [gigId, applicantId, status, message]
const appRows = [
  [1, 2, "Pending", "I can build this with React in a week."],
  [1, 5, "Pending", "Happy to take this, I have similar portfolio work."],
  [2, 6, "Pending", "Can share my design samples."],
  [2, 9, "Pending", "I can do a logo with animation too."],
  [3, 1, "Pending", "Interested in weekly sessions."],
  [5, 10, "Pending", "Can fix this quickly, send me the repo."],
  [8, 4, "Pending", "I write technical blogs regularly."],
  [17, 4, "Accepted", "I can handle the mockups."],
  [17, 7, "Rejected", "Would love to help."],
  [18, 8, "Accepted", "I know Flask well."],
  [18, 5, "Rejected", "I can do this in 3 days."],
  [19, 10, "Accepted", "Glad to edit your article."],
  [19, 12, "Rejected", "I edit professionally."],
  [20, 3, "Accepted", "I need help with matrices."],
  [21, 5, "Accepted", "I have built several landing pages."],
  [21, 11, "Rejected", "I can help with this."],
  [22, 6, "Accepted", "I can design the poster today."],
  [23, 12, "Accepted", "Copywriting is my strength."],
  [23, 4, "Rejected", "I can write this too."],
  [24, 2, "Accepted", "I want to learn Java basics."],
  [25, 3, "Accepted", "I have built chatbots before."],
  [25, 7, "Rejected", "Can help with the logic part."],
  [26, 9, "Accepted", "I design slides all the time."],
];

const applications = appRows.map(([gig_id, applicant_id, status, message], i) => ({
  id: i + 1,
  gig_id,
  applicant_id,
  message,
  status,
  created_at: daysFromNow(-(1 + (i % 6))).toISOString(),
}));

// ---------- REVIEWS (9) ----------
// [gigId, reviewerId, rating, comment]; reviewee is derived (the other party)
const reviewRows = [
  [21, 1, 5, "Delivered a great landing page on time."],
  [21, 5, 5, "Clear requirements and fast replies."],
  [22, 4, 4, "Good poster, minor revisions needed."],
  [22, 6, 5, "Pleasant to work with."],
  [23, 8, 5, "Excellent writing, loved the tone."],
  [23, 12, 4, "Smooth collaboration."],
  [24, 10, 5, "Eager learner, great sessions."],
  [24, 2, 5, "Very patient and clear teacher."],
  [25, 12, 4, "Helped me finish my chatbot."],
];

const reviews = reviewRows.map(([gig_id, reviewer_id, rating, comment], i) => {
  const gig = gigs.find((g) => g.id === gig_id);
  const reviewee_id = reviewer_id === gig.user_id ? gig.accepted_applicant_id : gig.user_id;
  return { id: i + 1, gig_id, reviewer_id, reviewee_id, rating, comment };
});

// ---------- SANITY CHECKS ----------
for (const g of gigs) {
  if (["In Progress", "Completed"].includes(g.status)) {
    const ok = applications.some(
      (a) => a.gig_id === g.id && a.applicant_id === g.accepted_applicant_id && a.status === "Accepted"
    );
    if (!ok) throw new Error(`Gig ${g.id} has no matching Accepted application`);
  }
}
for (const a of applications) {
  const g = gigs.find((x) => x.id === a.gig_id);
  if (g.user_id === a.applicant_id) throw new Error(`Application ${a.id} is on own gig`);
}
for (const r of reviews) {
  const g = gigs.find((x) => x.id === r.gig_id);
  if (g.status !== "Completed") throw new Error(`Review ${r.id} is on non-completed gig`);
}

reset({ users, gigs, applications, reviews });

console.log(
  `Seeded: ${users.length} users, ${gigs.length} gigs, ${applications.length} applications, ${reviews.length} reviews`
);
import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabase } from "../config/supabaseClient.js";
import { hashPasswordSync } from "../lib/password.js";

export const DEMO_PASSWORD = "Campus@123";

const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@campus.edu`;

const id = (prefix, number) => `${prefix}0000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const userId = (number) => id("0", number);
const gigId = (number) => id("1", number);
const applicationId = (number) => id("2", number);
const reviewId = (number) => id("3", number);

function datePlus(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const users = [
  ["Ayesha Khan", "Computer Science", 5, "Full-stack developer and React mentor.", ["React", "Node.js", "UI Design"]],
  ["Bilal Ahmed", "Software Engineering", 4, "Backend developer who enjoys APIs.", ["Express", "PostgreSQL", "Python"]],
  ["Hira Malik", "Graphic Design", 6, "Brand and interface designer.", ["Figma", "Illustrator", "Branding"]],
  ["Omar Farooq", "English Literature", 3, "Writer and careful technical editor.", ["Writing", "Editing", "Research"]],
  ["Sara Ali", "Mathematics", 7, "Peer tutor for calculus and statistics.", ["Calculus", "Statistics", "Tutoring"]],
  ["Hamza Iqbal", "Computer Science", 2, "Learning mobile and web development.", ["JavaScript", "Flutter", "Git"]],
  ["Maham Noor", "Media Studies", 5, "Video editor and social content creator.", ["Premiere Pro", "Copywriting", "Canva"]],
  ["Zain Raza", "Electrical Engineering", 6, "Embedded systems student and physics tutor.", ["C++", "Arduino", "Physics"]],
  ["Fatima Zahra", "Business Administration", 4, "Presentation designer and event planner.", ["PowerPoint", "Research", "Planning"]],
  ["Daniyal Shah", "Data Science", 5, "Data analyst focused on clear visual stories.", ["Python", "SQL", "Data Visualization"]],
  ["Mehak Tariq", "Psychology", 3, "Research assistant and academic writer.", ["Research", "APA", "Proofreading"]],
  ["Usman Javed", "Physics", 8, "Final-year student and experienced tutor.", ["Physics", "LaTeX", "Tutoring"]],
].map(([name, major, semester, bio, skills], index) => ({
  id: userId(index + 1),
  name,
  email: emailFor(name),
  password_hash: hashPasswordSync(DEMO_PASSWORD),
  major,
  semester,
  bio,
  skills,
}));

const gigTemplates = [
  [1, "React dashboard debugging", "Fix responsive charts and filter state in a student dashboard.", "Requesting", "Programming", "Paid", 3500, 12, "Open", null],
  [2, "Portfolio code review", "I will review a React portfolio and suggest practical improvements.", "Offering", "Programming", "SkillSwap", null, 10, "Open", null],
  [3, "Society event logo", "Design a clean logo and social avatar for a campus society event.", "Requesting", "Design", "Paid", 2500, 8, "Open", null],
  [4, "Poster design help", "I can create a polished poster for a student event this week.", "Offering", "Design", "Free", null, 6, "Open", null],
  [5, "Personal statement edit", "Review and edit a scholarship personal statement for clarity.", "Requesting", "Writing", "Paid", 1800, 9, "Open", null],
  [6, "Research proofreading", "I offer proofreading for short academic reports and proposals.", "Offering", "Writing", "SkillSwap", null, 14, "Open", null],
  [7, "Calculus exam preparation", "Need two focused sessions on integration and applications.", "Requesting", "Tutoring", "Paid", 2000, 7, "Open", null],
  [8, "Introductory physics tutoring", "I can help first-year students with mechanics problems.", "Offering", "Tutoring", "Free", null, 11, "Open", null],
  [9, "Expired Python script help", "Need assistance cleaning a small data processing script.", "Requesting", "Programming", "Paid", 1500, -4, "Open", null],
  [10, "Expired cover design offer", "Offering a book cover concept in exchange for writing help.", "Offering", "Design", "SkillSwap", null, -2, "Open", null],
  [11, "Build society registration form", "Create a responsive registration form with validation.", "Requesting", "Programming", "Paid", 5000, 15, "In Progress", 2],
  [12, "Campus map illustration", "Illustrate a friendly campus map for new students.", "Requesting", "Design", "Paid", 4500, 18, "In Progress", 3],
  [13, "Edit club constitution", "Improve the structure and wording of a club constitution.", "Requesting", "Writing", "SkillSwap", null, 16, "In Progress", 4],
  [14, "Statistics tutoring exchange", "Teach hypothesis testing in exchange for design help.", "Requesting", "Tutoring", "SkillSwap", null, 13, "In Progress", 5],
  [15, "API integration assistance", "Connect an Express API to a student React project.", "Requesting", "Programming", "Paid", 6000, -10, "Completed", 6],
  [16, "Hackathon banner design", "Create web and social banners for a campus hackathon.", "Requesting", "Design", "Paid", 4000, -12, "Completed", 7],
  [17, "Blog article rewrite", "Rewrite a society announcement as a clear blog article.", "Requesting", "Writing", "Paid", 2200, -8, "Completed", 8],
  [18, "Linear algebra tutoring", "Provide two sessions covering vectors and matrices.", "Requesting", "Tutoring", "Paid", 3000, -7, "Completed", 9],
  [19, "Landing page accessibility review", "Audit a landing page for keyboard and screen-reader issues.", "Requesting", "Programming", "SkillSwap", null, -6, "Completed", 10],
  [20, "Thesis abstract editing", "Edit a short thesis abstract for grammar and structure.", "Requesting", "Writing", "Free", null, -5, "Completed", 11],
  [21, "Cancelled mobile prototype", "Build a small mobile prototype for an abandoned event idea.", "Requesting", "Programming", "Paid", 5000, 20, "Cancelled", null],
  [22, "Cancelled mascot sketches", "Sketch mascot directions for a society campaign.", "Requesting", "Design", "SkillSwap", null, 20, "Cancelled", null],
  [23, "Cancelled newsletter edit", "Edit the October society newsletter draft.", "Requesting", "Writing", "Free", null, 20, "Cancelled", null],
  [24, "Cancelled chemistry tutoring", "Provide introductory chemistry revision sessions.", "Requesting", "Tutoring", "Paid", 2000, 20, "Cancelled", null],
  [25, "Cancelled Figma workshop", "Offer a beginner Figma workshop for society members.", "Offering", "Design", "Free", null, 20, "Cancelled", null],
];

export const gigs = gigTemplates.map(([number, title, description, type, category, paymentType, budget, days, status, accepted]) => ({
  id: gigId(number),
  user_id: userId(((number - 1) % 12) + 1),
  title,
  description,
  type,
  category,
  payment_type: paymentType,
  budget,
  deadline: datePlus(days),
  status,
  accepted_applicant_id: accepted ? userId(accepted) : null,
  created_at: new Date(Date.now() - (26 - number) * 3_600_000).toISOString(),
}));

const applicationPlan = [
  [1, 2, "Pending"], [1, 3, "Pending"], [2, 4, "Pending"],
  [11, 2, "Accepted"], [11, 3, "Rejected"], [11, 4, "Rejected"],
  [12, 3, "Accepted"], [12, 4, "Rejected"],
  [13, 4, "Accepted"], [13, 5, "Rejected"],
  [14, 5, "Accepted"], [14, 6, "Rejected"],
  [15, 6, "Accepted"], [15, 7, "Rejected"], [15, 8, "Rejected"],
  [16, 7, "Accepted"], [16, 8, "Rejected"],
  [17, 8, "Accepted"], [17, 9, "Rejected"],
  [18, 9, "Accepted"], [18, 10, "Rejected"],
  [19, 10, "Accepted"], [19, 11, "Rejected"],
  [20, 11, "Accepted"], [20, 12, "Rejected"],
];

export const applications = applicationPlan.map(([gig, applicant, status], index) => ({
  id: applicationId(index + 1),
  gig_id: gigId(gig),
  applicant_id: userId(applicant),
  message: `Application for gig ${gig}: I have relevant experience and can meet the deadline.`,
  status,
  created_at: new Date(Date.now() - (applicationPlan.length - index) * 1_800_000).toISOString(),
}));

export const reviews = [
  [15, 3, 6, 5, "Clear communication and excellent delivery."],
  [15, 6, 3, 4, "The requirements were clear and feedback was quick."],
  [16, 4, 7, 5, "Creative work delivered ahead of schedule."],
  [16, 7, 4, 4, "Organized collaboration and helpful feedback."],
  [17, 5, 8, 2, "The result needed more revision than expected."],
  [17, 8, 5, 4, "Constructive feedback and a fair timeline."],
  [18, 6, 9, 5, "Patient tutor with very clear explanations."],
  [18, 9, 6, 3, "Good student, though scheduling was difficult."],
].map(([gig, reviewer, reviewee, rating, comment], index) => ({
  id: reviewId(index + 1),
  gig_id: gigId(gig),
  reviewer_id: userId(reviewer),
  reviewee_id: userId(reviewee),
  rating,
  comment,
}));

async function removeAll(db, table) {
  const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

async function insertAll(db, table, rows) {
  const { error } = await db.from(table).insert(rows);
  if (error) throw error;
}

async function seed() {
  const db = getSupabase();
  await removeAll(db, "reviews");
  await removeAll(db, "applications");
  await removeAll(db, "gigs");
  await removeAll(db, "users");

  await insertAll(db, "users", users);
  await insertAll(db, "gigs", gigs);
  await insertAll(db, "applications", applications);
  await insertAll(db, "reviews", reviews);

  console.log(`Seeded ${users.length} users, ${gigs.length} gigs, ${applications.length} applications, and ${reviews.length} reviews.`);
  console.log(`Demo login: ${users[0].email} / ${DEMO_PASSWORD}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectRun) {
  seed().catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  });
}

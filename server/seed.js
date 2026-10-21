// Seed data: 12 users, 25 gigs, 20 applications, 8 reviews.
// Deadlines are day-offsets from "today" so Open/Expired demo states are
// always correct whenever the seed runs.
import { query } from './db.js'

const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const USERS = [
  [1, 'Emma Rodriguez', 'Computer Science', 6, 'Third-year CS student who loves building small, useful web apps and helping first-years get started.', ['React', 'TypeScript', 'Git', 'Peer Tutoring'], 'emma@campusloop.edu'],
  [2, 'Maya Chen', 'Computer Science', 6, 'CS junior into data and clean interfaces. Happy to trade Python help for design feedback.', ['Python', 'Data Analysis', 'HTML/CSS'], 'maya@campusloop.edu'],
  [3, 'Jordan Lee', 'Design', 8, 'Final-year design student. Portfolio in branding and product illustration.', ['Figma', 'Branding', 'Illustration'], 'jordan@campusloop.edu'],
  [4, 'Sam Rivera', 'Sociology', 4, 'Sophomore who writes for the campus paper and proofreads everything in sight.', ['Academic Writing', 'Research', 'Editing'], 'sam@campusloop.edu'],
  [5, 'Noah Williams', 'Mathematics', 8, 'Senior maths student running informal study groups before every midterm.', ['Calculus', 'Statistics', 'LaTeX'], 'noah@campusloop.edu'],
  [6, 'Aisha Patel', 'Media Studies', 6, 'Media studies junior shooting events for campus societies.', ['Photography', 'Social Media', 'Canva'], 'aisha@campusloop.edu'],
  [7, 'Leo Martin', 'Film', 8, 'Film senior editing shorts and society recap videos.', ['Video Editing', 'Premiere Pro', 'Motion Graphics'], 'leo@campusloop.edu'],
  [8, 'Priya Nair', 'Biology', 6, 'Biology junior, lab demonstrator, and APA-formatting perfectionist.', ['Lab Reports', 'Research', 'APA Formatting'], 'priya@campusloop.edu'],
  [9, 'Daniel Kim', 'Computer Science', 4, 'CS sophomore focused on Java and algorithms. Debugging is my love language.', ['Java', 'Algorithms', 'Git'], 'daniel@campusloop.edu'],
  [10, 'Sofia Garcia', 'English', 8, 'English senior offering essay feedback; also a fluent Spanish conversation partner.', ['Creative Writing', 'Proofreading', 'Spanish'], 'sofia@campusloop.edu'],
  [11, 'Omar Farouk', 'Electrical Engineering', 6, 'EE junior who actually enjoys signals and MATLAB.', ['Circuit Analysis', 'MATLAB', 'Soldering'], 'omar@campusloop.edu'],
  [12, 'Lily Zhang', 'Psychology', 4, 'Psychology sophomore, stats-anxious but SPSS-confident.', ['Statistics', 'SPSS', 'Note-taking'], 'lily@campusloop.edu'],
]

// id, user_id, title, description, type, category, payment_type, budget, deadlineOffset, status, accepted_applicant_id
export const GIGS = [
  [1, 2, 'Build a portfolio website', 'Looking for a developer to help me create a clean portfolio site before internship applications.', 'Requesting', 'Programming', 'Paid', 175, 3, 'Open', null],
  [2, 3, 'Intro to Figma workshop', 'I can walk you through the basics of Figma, components, and a simple design system.', 'Offering', 'Design', 'Free', null, 1, 'Open', null],
  [3, 4, 'Proofread my research paper', 'Need a second pair of eyes on a 12-page sociology paper. Happy to trade for design help.', 'Requesting', 'Writing', 'SkillSwap', null, 5, 'Open', null],
  [4, 5, 'Calculus II study buddy', 'Hosting weekly study sessions for the upcoming midterm. All levels welcome.', 'Offering', 'Tutoring', 'Free', null, 7, 'Open', null],
  [5, 6, 'Design a club event poster', 'Our cultural club needs a bold poster for our spring showcase.', 'Requesting', 'Design', 'Paid', 85, 8, 'Open', null],
  [6, 7, 'Edit short-form videos', 'Offering quick, polished edits for student creators and campus orgs.', 'Offering', 'Design', 'Paid', 40, 14, 'In Progress', 6],
  [7, 1, 'Debug my React capstone app', 'My capstone dashboard crashes on the reports page and I cannot find why. Need a fresh pair of eyes this week.', 'Requesting', 'Programming', 'Paid', 120, 6, 'Open', null],
  [8, 1, 'Intro to Git & GitHub session', 'Running a one-hour beginner session on branches, pull requests, and not fearing the command line.', 'Offering', 'Programming', 'Free', null, 10, 'Open', null],
  [9, 9, 'Help with data structures revision', 'Struggling with trees and graphs before the midterm. Will trade Java debugging help in return.', 'Requesting', 'Tutoring', 'SkillSwap', null, 4, 'Open', null],
  [10, 10, 'Essay feedback and proofreading', 'Offering detailed feedback on essays and personal statements — structure, flow, and the small stuff.', 'Offering', 'Writing', 'Free', null, 9, 'Open', null],
  [11, 8, 'Format my thesis references (APA)', 'About 60 references need consistent APA 7 formatting. Tedious but straightforward.', 'Requesting', 'Writing', 'Paid', 60, 2, 'Open', null],
  [12, 11, 'MATLAB help for signals coursework', 'Offering worked-example sessions for convolution and FFT coursework questions.', 'Offering', 'Tutoring', 'Paid', 25, 12, 'Open', null],
  [13, 12, 'SPSS help for psych stats assignment', 'Need someone to sanity-check my SPSS output and write-up before submission.', 'Requesting', 'Tutoring', 'Paid', 45, 5, 'Open', null],
  [14, 2, 'Python for data analysis tutoring', 'Offering two sessions on pandas and plotting for your coursework datasets. Swap for design help welcome.', 'Offering', 'Programming', 'SkillSwap', null, 11, 'Open', null],
  [15, 3, 'Landing page for my design portfolio', 'I have the Figma file ready — need a developer to build a responsive one-page site from it.', 'Requesting', 'Programming', 'Paid', 200, 15, 'Open', null],
  [16, 5, 'Proofread my scholarship statement', 'One-page personal statement that needs a careful proofread.', 'Requesting', 'Writing', 'SkillSwap', null, -3, 'Open', null],
  [17, 6, 'Free headshot retouching', 'Offering light retouching for LinkedIn headshots this week only.', 'Offering', 'Design', 'Free', null, -6, 'Open', null],
  [18, 4, 'Resume and cover letter writing', 'Offering resume rewrites for internship applications, with two revision rounds.', 'Offering', 'Writing', 'Paid', 30, 13, 'Open', null],
  [19, 7, 'Script for a short documentary', 'Need a writer to turn interview transcripts into a tight 8-minute documentary script.', 'Requesting', 'Writing', 'Paid', 90, 7, 'In Progress', 10],
  [20, 1, 'Logo for the coding club', 'Needed a simple, friendly logo for our coding club rebrand.', 'Requesting', 'Design', 'Paid', 70, -10, 'Completed', 3],
  [21, 9, 'One-hour Java debugging help', 'Offered a focused debugging hour for stuck coursework code.', 'Offering', 'Programming', 'Paid', 50, -8, 'Completed', 1],
  [22, 12, 'Statistics exam prep sessions', 'Wanted weekly stats prep with someone patient. Two sessions, all materials provided.', 'Requesting', 'Tutoring', 'Free', null, -12, 'Completed', 5],
  [23, 8, 'Biology lab report help', 'Offered help structuring lab reports and interpreting results sections.', 'Offering', 'Tutoring', 'Paid', 35, -7, 'Completed', 2],
  [24, 11, 'Poster for robotics demo day', 'Was looking for a poster design for our robotics demo. Event postponed, so this gig is cancelled.', 'Requesting', 'Design', 'Paid', 150, 18, 'Cancelled', null],
  [25, 1, 'Peer mentoring for first-year CS students', 'Offered weekly mentoring for first-years: study habits, tooling, and surviving your first semester.', 'Offering', 'Tutoring', 'Free', null, -20, 'Completed', 9],
]

// gig_id, applicant_id, message, status
export const APPLICATIONS = [
  [6, 6, 'I run the film society socials and need weekly recap edits — your style is exactly what we want.', 'Accepted'],
  [19, 10, 'I have written two short film scripts and can turn transcripts into a tight narrative.', 'Accepted'],
  [20, 3, 'Branding is my final-year focus — I would love to do the coding club logo.', 'Accepted'],
  [21, 1, 'I am stuck on a NullPointerException in my Java coursework and have the failing code ready to share.', 'Accepted'],
  [22, 5, 'Happy to run the prep sessions — I have taught stats to first-years for two years.', 'Accepted'],
  [23, 2, 'My lab reports keep losing marks on the results section; I would really value your help.', 'Accepted'],
  [25, 9, 'As a sophomore I wish I had this last year — keen to help first-years settle in.', 'Accepted'],
  [20, 6, 'I can do a clean logo set in Canva with all the export formats you need.', 'Rejected'],
  [21, 11, 'Not a Java expert but I debug circuits all day, how different can it be?', 'Rejected'],
  [6, 10, 'I write scripts, not edits, but I would love to learn alongside you.', 'Rejected'],
  [7, 9, 'I have built three React dashboards for coursework and I am good at chasing down crashes.', 'Pending'],
  [7, 8, 'Not a React dev, but I am methodical — happy to pair-debug and document what we find.', 'Pending'],
  [1, 1, 'I build React sites for fun and I am free this weekend to get your portfolio live.', 'Pending'],
  [1, 9, 'Portfolio sites are my favourite weekend project — I can start Friday.', 'Pending'],
  [3, 10, 'English senior here; I proofread for the campus paper and can turn this around in two days.', 'Pending'],
  [11, 4, 'I format references for the sociology journal club — APA is my party trick.', 'Pending'],
  [13, 8, 'I use SPSS in my biology stats module and can check your output line by line.', 'Pending'],
  [5, 3, 'Poster design is my thing — I did the spring showcase poster last year too.', 'Pending'],
  [15, 1, 'Your Figma-to-code handoff sounds perfect; I can build it responsively in a week.', 'Pending'],
  [9, 12, 'I am revising the same topics — let us swap notes and quiz each other.', 'Pending'],
]

// gig_id, reviewer_id, reviewee_id, rating, comment
export const REVIEWS = [
  [20, 1, 3, 5, 'Jordan nailed the logo in two days and gave us three strong options to pick from.'],
  [20, 3, 1, 5, 'Clear brief, quick feedback, and paid on time. A model client.'],
  [21, 9, 1, 4, 'Emma arrived with the failing code ready and asked great questions throughout.'],
  [21, 1, 9, 5, 'Daniel found the bug in twenty minutes and explained it so I will not repeat it.'],
  [22, 12, 5, 5, 'Noah made statistics finally click. The prep sessions were calm and super organised.'],
  [22, 5, 12, 4, 'Lily came prepared to every session and shared materials ahead of time.'],
  [23, 8, 2, 5, 'Maya explained her results section so clearly it made my feedback easy to give.'],
  [23, 2, 8, 4, 'Priya gave great source material and responded to drafts the same day.'],
]

export async function seedIfEmpty() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM users')
  if (rows[0].count > 0) return false

  for (const u of USERS) {
    await query('INSERT INTO users (id, name, major, semester, bio, skills, email) VALUES ($1,$2,$3,$4,$5,$6,$7)', u)
  }
  for (const g of GIGS) {
    const [id, userId, title, description, type, category, paymentType, budget, offset, status, accepted] = g
    await query(
      'INSERT INTO gigs (id, user_id, title, description, type, category, payment_type, budget, deadline, status, accepted_applicant_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [id, userId, title, description, type, category, paymentType, budget, day(offset), status, accepted],
    )
  }
  for (const [gigId, applicantId, message, status] of APPLICATIONS) {
    await query('INSERT INTO applications (gig_id, applicant_id, message, status) VALUES ($1,$2,$3,$4)', [gigId, applicantId, message, status])
  }
  for (const [gigId, reviewerId, revieweeId, rating, comment] of REVIEWS) {
    await query('INSERT INTO reviews (gig_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)', [gigId, reviewerId, revieweeId, rating, comment])
  }
  // Keep serial sequences ahead of the explicit ids (real Postgres + PGlite).
  await query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")
  await query("SELECT setval('gigs_id_seq', (SELECT MAX(id) FROM gigs))")
  await query("SELECT setval('applications_id_seq', (SELECT MAX(id) FROM applications))")
  await query("SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews))")
  return true
}

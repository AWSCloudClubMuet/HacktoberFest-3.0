const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const ts = (n) => new Date(Date.now() + n * 864e5).toISOString();

export function seed() {
  const users = [
    [1, 'Ayesha Khan', 'Computer Science', 5, 'Full-stack dev who loves hackathons.', ['React', 'Node.js', 'Python']],
    [2, 'Bilal Ahmed', 'Software Engineering', 3, 'Backend and databases.', ['SQL', 'Flask', 'Docker']],
    [3, 'Sara Malik', 'Design', 4, 'UI/UX designer.', ['Figma', 'Illustrator', 'Branding']],
    [4, 'Hamza Ali', 'English Literature', 6, 'Writer and editor.', ['Essay Writing', 'Proofreading', 'Blogging']],
    [5, 'Fatima Noor', 'Mathematics', 5, 'Calculus and stats tutor.', ['Calculus', 'Statistics', 'DSA']],
    [6, 'Usman Tariq', 'Computer Science', 2, 'Learning web development.', ['HTML', 'CSS', 'JavaScript']],
    [7, 'Zainab Raza', 'Business', 4, 'Marketing and copywriting.', ['Copywriting', 'Canva', 'Social Media']],
    [8, 'Ali Hassan', 'Electrical Engineering', 6, 'Physics tutor and tinkerer.', ['Physics', 'Arduino', 'Python']],
    [9, 'Hira Siddiqui', 'Media Studies', 3, 'Video and poster design.', ['Photoshop', 'Premiere Pro', 'Poster Design']],
    [10, 'Omar Farooq', 'Computer Science', 7, 'Bots and automation.', ['Python', 'Discord.js', 'Web Scraping']],
    [11, 'Mehwish Iqbal', 'Linguistics', 4, 'Urdu/English translator.', ['Translation', 'Urdu', 'Editing']],
    [12, 'Danish Yousuf', 'Software Engineering', 8, 'JS mentor.', ['JavaScript', 'TypeScript', 'Vue']],
    [13, 'Rabia Anwar', 'Education', 5, 'Peer tutor for maths and study skills.', ['Algebra', 'Study Skills', 'Presentation']],
    [14, 'Kamran Shah', 'Marketing', 6, 'Content writer and social media planner.', ['Content Writing', 'SEO', 'Canva']],
  ].map(([id, name, major, semester, bio, skills]) => ({ id, name, major, semester, bio, skills }));

  // [owner, title, type, category, payment, budget, deadlineDays, status, acceptedApplicant, description]
  const rows = [
    [1, 'Build a React landing page for club', 'Requesting', 'Programming', 'Paid', 150, 10, 'Open', null, 'Need a responsive landing page for the coding club with 4 sections.'],
    [2, 'Logo design for photography society', 'Requesting', 'Design', 'Paid', 80, 7, 'Open', null, 'Minimal logo with two colour variations and SVG export.'],
    [3, 'Python tutoring for beginners', 'Offering', 'Tutoring', 'Paid', 20, 30, 'Open', null, 'One-hour sessions covering basics, loops and functions.'],
    [4, 'Free essay proofreading', 'Offering', 'Writing', 'Free', null, 20, 'Open', null, 'I will proofread essays up to 1500 words for grammar and flow.'],
    [5, 'Figma lessons for DSA help', 'Offering', 'Design', 'SkillSwap', null, 15, 'Open', null, 'Will teach Figma basics; looking for help understanding recursion and trees.'],
    [6, 'Need help with SQL assignment', 'Requesting', 'Tutoring', 'Paid', 30, -3, 'Open', null, 'Joins and subqueries assignment, need a one-hour walkthrough.'],
    [7, 'Poster design for tech fest', 'Requesting', 'Design', 'Paid', 60, 5, 'In Progress', 2, 'A3 poster for the annual tech fest, source files required.'],
    [8, 'Debug my Flask API', 'Requesting', 'Programming', 'Paid', 40, 4, 'In Progress', 3, 'Endpoints return 500 on POST, need someone to debug.'],
    [9, 'Blog article on campus life', 'Requesting', 'Writing', 'Paid', 25, 6, 'In Progress', 4, '800-word article for the student newsletter.'],
    [10, 'Calculus revision sessions', 'Offering', 'Tutoring', 'Paid', 15, -10, 'Completed', 5, 'Midterm revision, limits to integrals.'],
    [11, 'Resume writing help', 'Offering', 'Writing', 'Free', null, -8, 'Completed', 6, 'I will help polish your CV and cover letter.'],
    [12, 'Portfolio website build', 'Requesting', 'Programming', 'Paid', 120, -6, 'Completed', 7, 'Simple personal portfolio with contact form.'],
    [1, 'Instagram post templates', 'Requesting', 'Design', 'SkillSwap', null, -5, 'Completed', 8, 'Three Canva templates in exchange for coding help.'],
    [2, 'Physics tutoring', 'Offering', 'Tutoring', 'Paid', 18, -4, 'Completed', 9, 'Mechanics and waves for first-year students.'],
    [3, 'Write product descriptions', 'Requesting', 'Writing', 'Paid', 35, -3, 'Completed', 10, 'Ten product descriptions for a small online shop.'],
    [4, 'Build a Discord bot', 'Requesting', 'Programming', 'Paid', 90, -2, 'Completed', 11, 'Moderation bot with slash commands.'],
    [5, 'Slide deck redesign', 'Requesting', 'Design', 'Free', null, -1, 'Completed', 12, 'Redesign a 15-slide pitch deck.'],
    [6, 'Mobile app prototype', 'Requesting', 'Programming', 'Paid', 200, 12, 'Cancelled', null, 'Cancelled due to change of plans.'],
    [7, 'Creative writing workshop', 'Offering', 'Writing', 'Free', null, 14, 'Cancelled', null, 'Weekly workshop, cancelled for lack of time.'],
    [8, 'JavaScript mentoring', 'Offering', 'Programming', 'SkillSwap', null, 25, 'Open', null, 'Will mentor JS in exchange for design feedback.'],
    [9, 'Poster for blood drive', 'Requesting', 'Design', 'Free', null, -1, 'Open', null, 'Volunteer poster, deadline already passed.'],
    [10, 'Statistics tutoring', 'Offering', 'Tutoring', 'Paid', 22, 18, 'Open', null, 'Probability, distributions and hypothesis testing.'],
    [11, 'Translate notes Urdu to English', 'Requesting', 'Writing', 'Paid', 20, 9, 'Open', null, 'Ten pages of lecture notes to translate.'],
    [12, 'Web scraping script', 'Offering', 'Programming', 'Paid', 50, 21, 'Open', null, 'Custom Python scraper that exports to CSV.'],
    [1, 'Brand colour palette consult', 'Offering', 'Design', 'Paid', 30, 16, 'Open', null, '30-minute consult to pick a brand palette.'],
    [13, 'Algebra study group sessions', 'Offering', 'Tutoring', 'Paid', 12, 14, 'Open', null, 'Small group sessions on algebra and exam technique.'],
    [14, 'Newsletter copy for society', 'Requesting', 'Writing', 'Paid', 45, -2, 'Completed', 13, 'Four short newsletter pieces for the debating society.'],
    [14, 'Help building a portfolio site', 'Requesting', 'Programming', 'SkillSwap', null, 11, 'Open', null, 'Will trade content writing and SEO help for a simple portfolio site.'],
  ];

  const gigs = rows.map(([user_id, title, type, category, payment_type, budget, d, status, acc, description], i) => ({
    id: i + 1, user_id, title, description, type, category, payment_type, budget,
    deadline: day(d), status, accepted_applicant_id: acc, created_at: ts(-20 + i),
  }));

  // Accepted application for every In Progress / Completed gig (one per In Progress / Completed gig)
  const applications = gigs
    .filter((g) => g.accepted_applicant_id)
    .map((g, i) => ({
      id: i + 1, gig_id: g.id, applicant_id: g.accepted_applicant_id,
      message: 'I have the right skills for this, happy to start right away!',
      status: 'Accepted', created_at: ts(-15 + i),
    }));
  [
    [7, 3, 'Rejected'], [10, 6, 'Rejected'], [13, 9, 'Rejected'],
    [1, 2, 'Pending'], [1, 3, 'Pending'], [2, 4, 'Pending'],
    [3, 5, 'Pending'], [5, 1, 'Pending'], [20, 2, 'Pending'],
    [26, 14, 'Pending'], [28, 13, 'Pending'],
  ].forEach(([gig_id, applicant_id, status], i) =>
    applications.push({ id: applications.length + 1, gig_id, applicant_id, status, message: 'Interested! I can deliver this within the deadline.', created_at: ts(-5 + i) }));

  // [gig, reviewer, reviewee, rating, comment]
  const reviews = [
    [10, 10, 5, 5, 'Great tutor, very patient.'], [10, 5, 10, 4, 'Clear requirements and prompt payment.'],
    [11, 11, 6, 5, 'Fast and thorough.'], [11, 6, 11, 5, 'Really helpful feedback on my CV.'],
    [12, 12, 7, 4, 'Good work, minor revisions needed.'], [13, 1, 8, 5, 'Templates looked amazing.'],
    [14, 2, 9, 3, 'Okay session, started late.'], [15, 10, 3, 4, 'Well written descriptions.'],
    [27, 14, 13, 5, 'Delivered early and the copy was great.'], [27, 13, 14, 4, 'Clear brief and quick feedback.'],
  ].map(([gig_id, reviewer_id, reviewee_id, rating, comment], i) => ({ id: i + 1, gig_id, reviewer_id, reviewee_id, rating, comment }));

  return { users, gigs, applications, reviews };
}
/**
 * Campus Gig & SkillSwap Portal - Seed Data
 * 
 * Strict Milestone 5 Requirements:
 * - At least 12 users
 * - At least 25 gigs (spanning Programming, Design, Writing, Tutoring; Offering/Requesting; all statuses)
 * - At least 20 applications (Pending, Accepted, Rejected)
 * - At least 8 reviews (ratings 1-5, comments)
 */

export const INITIAL_USERS = [
  {
    id: "usr_1",
    name: "Ayesha Khan",
    major: "Computer Science",
    semester: "6th",
    bio: "Full-stack developer obsessed with React, Node.js, and clean UI/UX. Always excited to build cool campus projects.",
    skills: ["React", "Node.js", "Python", "TypeScript", "TailwindCSS"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_2",
    name: "Bilal Ahmed",
    major: "Software Engineering",
    semester: "7th",
    bio: "Java & Spring Boot enthusiast. Competitive programmer and backend systems architect.",
    skills: ["Java", "Spring Boot", "Data Structures", "SQL", "Docker"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_3",
    name: "Zainab Fatima",
    major: "Digital Media Arts & Design",
    semester: "5th",
    bio: "Visual designer crafting brand identities, poster designs, and Figma prototypes for student clubs.",
    skills: ["Figma", "UI/UX", "Adobe Illustrator", "Photoshop", "Branding"],
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_4",
    name: "Hamza Tariq",
    major: "Electrical Engineering",
    semester: "8th",
    bio: "Hardware tinkerer, IoT enthusiast, and calculus tutor. Passionate about embedded systems and robotics.",
    skills: ["Embedded C", "Arduino", "Calculus", "Circuit Analysis", "MATLAB"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_5",
    name: "Mariam Azeem",
    major: "Computer Science",
    semester: "6th",
    bio: "Machine learning researcher and Python geek. Loves building NLP pipelines and mentoring juniors.",
    skills: ["Python", "TensorFlow", "Data Analysis", "PyTorch", "Research Writing"],
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_6",
    name: "Danish Ali",
    major: "English & Linguistics",
    semester: "4th",
    bio: "Content writer, essay editor, and debater. I help students polish their conference papers and personal statements.",
    skills: ["Academic Writing", "Proofreading", "Creative Writing", "SEO", "Copywriting"],
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_7",
    name: "Sara Qureshi",
    major: "Business Administration",
    semester: "5th",
    bio: "Marketing strategist and pitch deck designer. Ready to exchange pitch deck reviews for web development help.",
    skills: ["Pitch Decks", "Financial Modeling", "Market Research", "Public Speaking"],
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_8",
    name: "Usman Raza",
    major: "Mathematics & Statistics",
    semester: "7th",
    bio: "Stats geek offering tutoring in Linear Algebra, Probability, and R programming. Looking for app design help.",
    skills: ["Statistics", "Linear Algebra", "R", "Probability", "Calculus"],
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_9",
    name: "Hira Noor",
    major: "Software Engineering",
    semester: "3rd",
    bio: "Mobile app developer building Flutter apps. Curious learner always looking for challenging freelance gigs.",
    skills: ["Flutter", "Dart", "Firebase", "Mobile UI", "Git"],
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_10",
    name: "Fahad Mustafa",
    major: "Computer Systems Engineering",
    semester: "6th",
    bio: "Linux sysadmin and cybersecurity enthusiast. I configure secure cloud servers and troubleshoot network labs.",
    skills: ["Linux", "Bash", "Cybersecurity", "Networking", "AWS"],
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_11",
    name: "Fatima Zahra",
    major: "Architecture & Industrial Design",
    semester: "7th",
    bio: "3D modeler and CAD specialist. Creates stunning product renders and architectural mockups.",
    skills: ["Blender", "AutoCAD", "3D Modeling", "SketchUp", "Photoshop"],
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_12",
    name: "Taha Siddiqui",
    major: "Data Science",
    semester: "4th",
    bio: "Data visualization specialist. Tableau & PowerBI pro ready to exchange dashboards for algorithm tutoring.",
    skills: ["Python", "Pandas", "Tableau", "SQL", "Data Scraping"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"
  }
];

// Helper to calculate realistic dates (current year 2026)
const now = new Date("2026-10-21T10:00:00");
const daysFromNow = (days) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const INITIAL_GIGS = [
  // 1. Programming - Offering - Paid (Open)
  {
    id: "gig_1",
    user_id: "usr_1",
    title: "build react landing page for final year project",
    description: "I will build a clean landing page for your final year project or campus startup in React. Nothing fancy, just working components and tailwind.",
    type: "Offering",
    category: "Programming",
    payment_type: "Paid",
    budget: 60,
    deadline: daysFromNow(14),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-3)
  },
  // 2. Programming - Requesting - Paid (In Progress)
  {
    id: "gig_2",
    user_id: "usr_7",
    title: "need help w/ my java loop bug, due fri",
    description: "stuck on an infinite loop in my 2D array traversal for assignment 3. will pay $15 for someone to hop on a quick call and point out what I'm doing wrong.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 15,
    deadline: daysFromNow(4),
    status: "In Progress",
    accepted_applicant_id: "usr_2",
    created_at: daysFromNow(-5)
  },
  // 3. Design - Offering - SkillSwap (Open)
  {
    id: "gig_3",
    user_id: "usr_3",
    title: "Complete Mobile App UI/UX Prototype in Figma",
    description: "Offering clean, modern Figma wireframes and interactive prototypes for your project. Looking to swap for backend API tutoring.",
    type: "Offering",
    category: "Design",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(12),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-2)
  },
  // 4. Tutoring - Offering - Free (Open)
  {
    id: "gig_4",
    user_id: "usr_8",
    title: "Free Weekly Midterm Prep: Linear Algebra & Matrices",
    description: "Hosting a 2-hour free crash course and Q&A session covering vector spaces, eigenvalues, and transformations for 2nd/3rd semester students.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: daysFromNow(7),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-1)
  },
  // 5. Writing - Requesting - Paid (Open)
  {
    id: "gig_5",
    user_id: "usr_4",
    title: "Proofreading & Formatting for IEEE Robotics Paper",
    description: "Need an experienced technical writer to proofread a 6-page draft paper for conference formatting, grammar, and IEEE citation style.",
    type: "Requesting",
    category: "Writing",
    payment_type: "Paid",
    budget: 35,
    deadline: daysFromNow(6),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-4)
  },
  // 6. Programming - Requesting - SkillSwap (Open)
  {
    id: "gig_6",
    user_id: "usr_11",
    title: "Help Deploying WebGL 3D Portfolio to AWS S3/CloudFront",
    description: "Need someone familiar with AWS or Vercel to help deploy my portfolio with custom domain and SSL. Can offer a 3D avatar model in exchange!",
    type: "Requesting",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(10),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-2)
  },
  // 7. Design - Requesting - Paid (Completed)
  {
    id: "gig_7",
    user_id: "usr_2",
    title: "Modern Logo & Icon Pack for Terminal Dev Tool",
    description: "Need a sleek vector logo and app icon for my open-source CLI utility. Needs dark mode and transparent SVG formats.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 50,
    deadline: daysFromNow(-4),
    status: "Completed",
    accepted_applicant_id: "usr_3",
    created_at: daysFromNow(-15)
  },
  // 8. Tutoring - Requesting - Paid (Completed)
  {
    id: "gig_8",
    user_id: "usr_9",
    title: "1-on-1 Tutoring: Advanced Data Structures & Graph Algorithms",
    description: "Struggling with Dijkstra, Bellman-Ford, and Segment Trees. Looking for 3 sessions of problem solving and practice questions.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 40,
    deadline: daysFromNow(-2),
    status: "Completed",
    accepted_applicant_id: "usr_2",
    created_at: daysFromNow(-12)
  },
  // 9. Writing - Offering - SkillSwap (Open)
  {
    id: "gig_9",
    user_id: "usr_6",
    title: "Resume & LinkedIn Profile Review for Tech Internships",
    description: "I will rewrite and optimize your software engineering resume for ATS screening. Looking to swap for a quick web scrap script in Python.",
    type: "Offering",
    category: "Writing",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(15),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-1)
  },
  // 10. Design - Offering - Paid (Open)
  {
    id: "gig_10",
    user_id: "usr_3",
    title: "Custom Event Posters & Social Media Kits for Campus Clubs",
    description: "Designing energetic, aesthetic event flyers and Instagram carousel graphics for your upcoming hackathons or musical nights.",
    type: "Offering",
    category: "Design",
    payment_type: "Paid",
    budget: 25,
    deadline: daysFromNow(9),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-3)
  },
  // 11. Programming - Offering - Paid (Completed)
  {
    id: "gig_11",
    user_id: "usr_5",
    title: "Python Data Analysis & Data Cleaning Scripting",
    description: "Will write automated Pandas scripts to clean survey data, run statistical tests, and generate publication-ready plots.",
    type: "Offering",
    category: "Programming",
    payment_type: "Paid",
    budget: 50,
    deadline: daysFromNow(-8),
    status: "Completed",
    accepted_applicant_id: "usr_12",
    created_at: daysFromNow(-20)
  },
  // 12. Tutoring - Offering - Paid (In Progress)
  {
    id: "gig_12",
    user_id: "usr_4",
    title: "Calculus III & Differential Equations Midterm Tutoring",
    description: "Experienced teaching assistant offering intensive numerical problem-solving sessions for upcoming midterms.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 30,
    deadline: daysFromNow(5),
    status: "In Progress",
    accepted_applicant_id: "usr_7",
    created_at: daysFromNow(-6)
  },
  // 13. Writing - Offering - Free (Open)
  {
    id: "gig_13",
    user_id: "usr_6",
    title: "Free Peer Feedback on Statement of Purpose (SOP)",
    description: "Applying for Fulbright or Erasmus Mundus? I will give constructive feedback on your personal statement drafts for free.",
    type: "Offering",
    category: "Writing",
    payment_type: "Free",
    budget: null,
    deadline: daysFromNow(20),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-1)
  },
  // 14. Programming - Requesting - Paid (Expired)
  {
    id: "gig_14",
    user_id: "usr_10",
    title: "Configure Docker Compose for Microservices Lab Assignment",
    description: "Needed assistance setting up Redis, PostgreSQL, and Express containers with networking for last week's lab submission.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 20,
    deadline: daysFromNow(-3), // Past deadline while Open -> Expired!
    status: "Expired",
    accepted_applicant_id: null,
    created_at: daysFromNow(-10)
  },
  // 15. Design - Requesting - SkillSwap (Cancelled)
  {
    id: "gig_15",
    user_id: "usr_1",
    title: "3D Character Rigging for Campus Indie Game",
    description: "Looking for a 3D artist to rig a low-poly mascot. Project was postponed by the department so gig is cancelled.",
    type: "Requesting",
    category: "Design",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(5),
    status: "Cancelled",
    accepted_applicant_id: null,
    created_at: daysFromNow(-8)
  },
  // 16. Programming - Offering - SkillSwap (In Progress)
  {
    id: "gig_16",
    user_id: "usr_9",
    title: "Cross-Platform Mobile Prototype in Flutter",
    description: "Building an iOS/Android app starter kit for your course project in exchange for UI design guidance.",
    type: "Offering",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(8),
    status: "In Progress",
    accepted_applicant_id: "usr_3",
    created_at: daysFromNow(-4)
  },
  // 17. Tutoring - Requesting - Free (Open)
  {
    id: "gig_17",
    user_id: "usr_3",
    title: "Looking for a Study Buddy for Intro to Artificial Intelligence",
    description: "Looking for someone to go through Minimax search and A* search assignments together in the library.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: daysFromNow(11),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-2)
  },
  // 18. Writing - Requesting - Paid (Completed)
  {
    id: "gig_18",
    user_id: "usr_7",
    title: "Business Plan Summary & Executive Presentation Pitch",
    description: "Need a crisp 2-page executive summary and pitch deck copy for the Hult Prize campus pitch round.",
    type: "Requesting",
    category: "Writing",
    payment_type: "Paid",
    budget: 55,
    deadline: daysFromNow(-6),
    status: "Completed",
    accepted_applicant_id: "usr_6",
    created_at: daysFromNow(-18)
  },
  // 19. Programming - Offering - Paid (Open)
  {
    id: "gig_19",
    user_id: "usr_10",
    title: "Bash Scripting & Linux Server Hardening Consultation",
    description: "I will write custom shell scripts for backup automation, cron scheduling, and firewall configuration.",
    type: "Offering",
    category: "Programming",
    payment_type: "Paid",
    budget: 35,
    deadline: daysFromNow(18),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-3)
  },
  // 20. Design - Offering - Paid (Completed)
  {
    id: "gig_20",
    user_id: "usr_11",
    title: "Architectural 3D Floorplan & Isometric Room Renders",
    description: "Photorealistic 3D interior renders using Blender for student projects and interior design portfolios.",
    type: "Offering",
    category: "Design",
    payment_type: "Paid",
    budget: 70,
    deadline: daysFromNow(-10),
    status: "Completed",
    accepted_applicant_id: "usr_5",
    created_at: daysFromNow(-25)
  },
  // 21. Tutoring - Offering - Paid (Open)
  {
    id: "gig_21",
    user_id: "usr_2",
    title: "Java OOP & Design Patterns Crash Course",
    description: "Master Polymorphism, Singleton, Factory, and SOLID principles before your software design exam.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 35,
    deadline: daysFromNow(16),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-1)
  },
  // 22. Programming - Requesting - Paid (Open)
  {
    id: "gig_22",
    user_id: "usr_12",
    title: "Scrape E-Commerce Price Data for ML Thesis",
    description: "Need an asynchronous BeautifulSoup or Scrapy script to collect product prices and reviews into CSV format.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 40,
    deadline: daysFromNow(8),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-2)
  },
  // 23. Writing - Offering - Paid (Open)
  {
    id: "gig_23",
    user_id: "usr_6",
    title: "Technical Documentation & API Reference Writing",
    description: "I will write clear, readable Markdown documentation, Postman guides, and README files for your open source tools.",
    type: "Offering",
    category: "Writing",
    payment_type: "Paid",
    budget: 30,
    deadline: daysFromNow(22),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-4)
  },
  // 24. Tutoring - Requesting - SkillSwap (Open)
  {
    id: "gig_24",
    user_id: "usr_5",
    title: "Need Help Understanding Computer Architecture & MIPS Assembly",
    description: "Looking for an EE or CE senior to explain pipelining and cache memory. Can teach PyTorch or ML in exchange!",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "SkillSwap",
    budget: null,
    deadline: daysFromNow(13),
    status: "Open",
    accepted_applicant_id: null,
    created_at: daysFromNow(-1)
  },
  // 25. Design - Requesting - Free (Expired)
  {
    id: "gig_25",
    user_id: "usr_8",
    title: "Quick Infographic for Math Club Pi Day Noticeboard",
    description: "Needed a simple visual graphic for Pi Day bulletin board last month.",
    type: "Requesting",
    category: "Design",
    payment_type: "Free",
    budget: null,
    deadline: daysFromNow(-14), // Past deadline -> Expired!
    status: "Expired",
    accepted_applicant_id: null,
    created_at: daysFromNow(-28)
  }
];

export const INITIAL_APPLICATIONS = [
  // Applications to Gig 2 (In Progress - usr_2 accepted, usr_1 & usr_9 rejected)
  {
    id: "app_1",
    gig_id: "gig_2",
    applicant_id: "usr_2",
    message: "Hey! I have strong backend experience in Python and Flask sessions. I can fix these connection bugs within 24 hours.",
    status: "Accepted",
    created_at: daysFromNow(-5)
  },
  {
    id: "app_2",
    gig_id: "gig_2",
    applicant_id: "usr_1",
    message: "I can help with the election portal backend and also fix the frontend login UX if needed.",
    status: "Rejected",
    created_at: daysFromNow(-5)
  },
  {
    id: "app_3",
    gig_id: "gig_2",
    applicant_id: "usr_9",
    message: "Interested in assisting with this backend bug fix.",
    status: "Rejected",
    created_at: daysFromNow(-4)
  },

  // Applications to Gig 7 (Completed - usr_3 accepted, usr_11 rejected)
  {
    id: "app_4",
    gig_id: "gig_7",
    applicant_id: "usr_3",
    message: "I love minimalist terminal tools! Check out my Figma portfolio: I can design 3 sleek icon variations.",
    status: "Accepted",
    created_at: daysFromNow(-14)
  },
  {
    id: "app_5",
    gig_id: "gig_7",
    applicant_id: "usr_11",
    message: "I can design vector SVG logos for your utility.",
    status: "Rejected",
    created_at: daysFromNow(-14)
  },

  // Applications to Gig 8 (Completed - usr_2 accepted)
  {
    id: "app_6",
    gig_id: "gig_8",
    applicant_id: "usr_2",
    message: "I have solved 300+ LeetCode problems and run tutoring for graph theory algorithms. Let's schedule the sessions!",
    status: "Accepted",
    created_at: daysFromNow(-11)
  },
  {
    id: "app_7",
    gig_id: "gig_8",
    applicant_id: "usr_4",
    message: "I can help you review graph traversal and shortest path proofs.",
    status: "Rejected",
    created_at: daysFromNow(-11)
  },

  // Applications to Gig 11 (Completed - usr_12 accepted)
  {
    id: "app_8",
    gig_id: "gig_11",
    applicant_id: "usr_12",
    message: "I'd love to hire you to write this data cleaning script for our semester survey dataset.",
    status: "Accepted",
    created_at: daysFromNow(-19)
  },

  // Applications to Gig 12 (In Progress - usr_7 accepted)
  {
    id: "app_9",
    gig_id: "gig_12",
    applicant_id: "usr_7",
    message: "I desperately need help with partial derivatives and double integrals before Monday's midterm!",
    status: "Accepted",
    created_at: daysFromNow(-5)
  },
  {
    id: "app_10",
    gig_id: "gig_12",
    applicant_id: "usr_9",
    message: "Would like to join this calculus tutoring session.",
    status: "Rejected",
    created_at: daysFromNow(-5)
  },

  // Applications to Gig 16 (In Progress - usr_3 accepted)
  {
    id: "app_11",
    gig_id: "gig_16",
    applicant_id: "usr_3",
    message: "I have the exact UI components ready in Figma! Let's swap: I provide design guidelines and you write the Flutter code.",
    status: "Accepted",
    created_at: daysFromNow(-3)
  },

  // Applications to Gig 18 (Completed - usr_6 accepted)
  {
    id: "app_12",
    gig_id: "gig_18",
    applicant_id: "usr_6",
    message: "I have written pitch decks that won 2 startup campus rounds. I can craft an inspiring 2-page executive summary.",
    status: "Accepted",
    created_at: daysFromNow(-17)
  },

  // Applications to Gig 20 (Completed - usr_5 accepted)
  {
    id: "app_13",
    gig_id: "gig_20",
    applicant_id: "usr_5",
    message: "Need 3D room renders for an automated smart home simulation project.",
    status: "Accepted",
    created_at: daysFromNow(-24)
  },

  // Pending Applications on Open Gigs
  // Gig 1 (Open - usr_7 and usr_10 applied)
  {
    id: "app_14",
    gig_id: "gig_1",
    applicant_id: "usr_7",
    message: "Our e-commerce student venture needs a landing page urgently. Would love to hire you!",
    status: "Pending",
    created_at: daysFromNow(-1)
  },
  {
    id: "app_15",
    gig_id: "gig_1",
    applicant_id: "usr_10",
    message: "Need a landing page for our cyber security society annual CTF competition.",
    status: "Pending",
    created_at: daysFromNow(-1)
  },

  // Gig 3 (Open - usr_1 and usr_2 applied)
  {
    id: "app_16",
    gig_id: "gig_3",
    applicant_id: "usr_1",
    message: "I can tutor you in Node.js / REST APIs in exchange for your Figma designs!",
    status: "Pending",
    created_at: daysFromNow(-1)
  },
  {
    id: "app_17",
    gig_id: "gig_3",
    applicant_id: "usr_2",
    message: "I can teach you Spring Boot and database modeling for your app prototypes.",
    status: "Pending",
    created_at: daysFromNow(-2)
  },

  // Gig 5 (Open - usr_6 applied)
  {
    id: "app_18",
    gig_id: "gig_5",
    applicant_id: "usr_6",
    message: "I have edited multiple IEEE conference submissions and know the LaTeX formatting guidelines intimately.",
    status: "Pending",
    created_at: daysFromNow(-3)
  },

  // Gig 6 (Open - usr_10 applied)
  {
    id: "app_19",
    gig_id: "gig_6",
    applicant_id: "usr_10",
    message: "I am AWS certified and can set up S3 + CloudFront with HTTPS in under 30 minutes.",
    status: "Pending",
    created_at: daysFromNow(-1)
  },

  // Gig 9 (Open - usr_5 applied)
  {
    id: "app_20",
    gig_id: "gig_9",
    applicant_id: "usr_5",
    message: "I need my resume polished for upcoming research internships and can write your python scraper in return!",
    status: "Pending",
    created_at: daysFromNow(-1)
  },

  // Gig 22 (Open - usr_1 applied)
  {
    id: "app_21",
    gig_id: "gig_22",
    applicant_id: "usr_1",
    message: "I have built multiple web scraping pipelines using Python and Cheerio. Ready to start today.",
    status: "Pending",
    created_at: daysFromNow(-1)
  }
];

export const INITIAL_REVIEWS = [
  // Reviews for Gig 7 (Completed: Owner usr_2, Accepted usr_3)
  {
    id: "rev_1",
    gig_id: "gig_7",
    reviewer_id: "usr_2",
    reviewee_id: "usr_3",
    rating: 5,
    comment: "Zainab designed an extraordinary logo and icon set! Outstanding attention to detail, very responsive, and delivered ahead of schedule."
  },
  {
    id: "rev_2",
    gig_id: "gig_7",
    reviewer_id: "usr_3",
    reviewee_id: "usr_2",
    rating: 5,
    comment: "Bilal gave clear design requirements and prompt feedback on each revision. Fantastic person to collaborate with!"
  },

  // Reviews for Gig 8 (Completed: Owner usr_9, Accepted usr_2)
  {
    id: "rev_3",
    gig_id: "gig_8",
    reviewer_id: "usr_9",
    reviewee_id: "usr_2",
    rating: 5,
    comment: "Bilal is a genius with graphs and DP algorithms. He explained Dijkstra's algorithm with intuitive visual analogies."
  },
  {
    id: "rev_4",
    gig_id: "gig_8",
    reviewer_id: "usr_2",
    reviewee_id: "usr_9",
    rating: 4,
    comment: "Hira was very engaged, did all the practice problems, and asked insightful questions. Best of luck with your exams!"
  },

  // Reviews for Gig 11 (Completed: Owner usr_5, Accepted usr_12)
  {
    id: "rev_5",
    gig_id: "gig_11",
    reviewer_id: "usr_12",
    reviewee_id: "usr_5",
    rating: 5,
    comment: "Mariam's script saved me dozens of hours of manual Excel cleaning. The documentation was crystal clear."
  },
  {
    id: "rev_6",
    gig_id: "gig_11",
    reviewer_id: "usr_5",
    reviewee_id: "usr_12",
    rating: 5,
    comment: "Taha provided clear dataset schemas and was wonderful to work with. Highly recommended!"
  },

  // Reviews for Gig 18 (Completed: Owner usr_7, Accepted usr_6)
  {
    id: "rev_7",
    gig_id: "gig_18",
    reviewer_id: "usr_7",
    reviewee_id: "usr_6",
    rating: 5,
    comment: "Danish's executive summary was poetic and persuasive. Our team qualified for the regional finals thanks to his polish!"
  },
  {
    id: "rev_8",
    gig_id: "gig_18",
    reviewer_id: "usr_6",
    reviewee_id: "usr_7",
    rating: 5,
    comment: "Sara's business concept was truly innovative. Great communication throughout the drafting process."
  },

  // Reviews for Gig 20 (Completed: Owner usr_11, Accepted usr_5)
  {
    id: "rev_9",
    gig_id: "gig_20",
    reviewer_id: "usr_5",
    reviewee_id: "usr_11",
    rating: 5,
    comment: "Fatima's 3D floorplan models looked hyper-realistic. Flawless materials and lighting!"
  },
  {
    id: "rev_10",
    gig_id: "gig_20",
    reviewer_id: "usr_11",
    reviewee_id: "usr_5",
    rating: 4,
    comment: "Mariam was very courteous and provided exact dimensions for the room mockups."
  }
];

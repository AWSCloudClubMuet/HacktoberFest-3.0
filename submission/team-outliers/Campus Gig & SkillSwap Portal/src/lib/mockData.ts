import { User, Gig, Application, Review } from "@/types";

export const SEED_USERS: User[] = [
  {
    id: "usr_1",
    name: "Aiden Vance",
    major: "Computer Science",
    semester: "Fall 2026",
    bio: "Full-stack developer focused on React, Node.js, and cloud automation. Love building clean developer tools and teaching peers.",
    skills: ["TypeScript", "React", "Next.js", "Python", "Docker"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_2",
    name: "Maya Lin",
    major: "Graphic & UI/UX Design",
    semester: "Spring 2026",
    bio: "Design enthusiast crafting accessible design systems and campus event visuals. Figma wizard and typography lover.",
    skills: ["Figma", "Design Systems", "Branding", "UI/UX", "Illustration"],
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_3",
    name: "Carlos Mendez",
    major: "Electrical Engineering",
    semester: "Fall 2026",
    bio: "Hardware tinkerer, Python scripter, and Calculus tutor. Happy to trade math coaching for web app polishing.",
    skills: ["Calculus", "Physics", "Python", "Circuit Design", "Matlab"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_4",
    name: "Sarah Jenkins",
    major: "English & Journalism",
    semester: "Spring 2026",
    bio: "Head editor of the campus weekly. Experienced in technical writing, essay refinement, and conference abstract proofreading.",
    skills: ["Technical Writing", "Copywriting", "Proofreading", "Research", "Editing"],
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_5",
    name: "Devon Brooks",
    major: "Software Engineering",
    semester: "Senior Year",
    bio: "Algorithms and Data Structures tutor. Building backend APIs and databases. Preparing for tech interviews.",
    skills: ["Data Structures", "Java", "Go", "SQL", "Algorithm Prep"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_6",
    name: "Priya Patel",
    major: "Marketing & Communications",
    semester: "Junior Year",
    bio: "Brand strategist and social media creator. Helping campus clubs grow their outreach and craft viral video hooks.",
    skills: ["Social Media", "Content Strategy", "SEO", "Video Editing", "Canva"],
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_7",
    name: "Liam O'Connor",
    major: "Data Science & Statistics",
    semester: "Fall 2026",
    bio: "Statistical modeling, R programming, and Machine Learning. Passionate about visualizing complex datasets.",
    skills: ["R", "Machine Learning", "Pandas", "Tableau", "Data Analysis"],
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_8",
    name: "Elena Rostova",
    major: "Interactive Media & 3D Art",
    semester: "Senior Year",
    bio: "3D modeler with Blender and Three.js experience. Creating assets for indie game jams and product mockups.",
    skills: ["Blender", "3D Modeling", "Animation", "Three.js", "Texturing"],
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_9",
    name: "Marcus Zhao",
    major: "Biomedical Sciences",
    semester: "Junior Year",
    bio: "Pre-med student offering Organic Chemistry and Biochemistry study sessions. Need help formatting my research thesis.",
    skills: ["Organic Chemistry", "Biochemistry", "Biology", "Lab Protocols", "Study Skills"],
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_10",
    name: "Zoe Washington",
    major: "Cinema & Audio Production",
    semester: "Senior Year",
    bio: "Sound designer and podcast producer. Offering podcast audio mastering, voice cleanup, and custom ambient tracks.",
    skills: ["Audio Engineering", "Logic Pro", "Podcast Editing", "Sound Design", "Mixing"],
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_11",
    name: "Tariq Al-Mansoor",
    major: "Cybersecurity & Networks",
    semester: "Fall 2026",
    bio: "CTF player and Linux sysadmin enthusiast. Offering Linux command line setup and home-lab security auditing.",
    skills: ["Linux", "Bash", "Network Security", "Docker", "Penetration Testing"],
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr_12",
    name: "Hannah Kim",
    major: "Economics & Finance",
    semester: "Senior Year",
    bio: "Microeconomics TA and Excel financial modeling enthusiast. Happy to help with statistics or problem sets.",
    skills: ["Microeconomics", "Excel Modeling", "Financial Analysis", "Stata", "Econometrics"],
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  }
];

export const SEED_GIGS: Gig[] = [
  // Programming - Offering
  {
    id: "gig_1",
    user_id: "usr_1",
    title: "Full-Stack Landing Page Build for Student Clubs",
    description: "I will design and code a responsive, fast Next.js landing page with Tailwind CSS for your campus organization or startup demo.",
    type: "Offering",
    category: "Programming",
    payment_type: "Paid",
    budget: 65,
    deadline: "2026-11-20T23:59:59.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-15T10:00:00.000Z"
  },
  // Programming - Requesting
  {
    id: "gig_2",
    user_id: "usr_7",
    title: "Need Python Web Scraper for Research Dataset",
    description: "Looking for an experienced programmer to scrape open environmental sensor reports and format them into clean CSV/JSON.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 45,
    deadline: "2026-11-12T18:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-16T14:30:00.000Z"
  },
  // Design - Offering
  {
    id: "gig_3",
    user_id: "usr_2",
    title: "Custom Vector Logo & Brand Style Guide",
    description: "Offering high-resolution vector logos, color palette, and typography guides for student projects, hackathon teams, or clubs.",
    type: "Offering",
    category: "Design",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-25T20:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-17T09:15:00.000Z"
  },
  // Design - Requesting
  {
    id: "gig_4",
    user_id: "usr_6",
    title: "Need Poster & Instagram Carousel for Charity Gala",
    description: "Annual campus charity drive needs an eye-catching event poster and 4-slide Instagram carousel before ticket sales launch.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-11-05T12:00:00.000Z",
    status: "In Progress",
    accepted_applicant_id: "usr_2",
    created_at: "2026-10-14T08:00:00.000Z"
  },
  // Writing - Offering
  {
    id: "gig_5",
    user_id: "usr_4",
    title: "Peer Proofreading for Term Papers & Essays",
    description: "Comprehensive grammatical review, clarity enhancement, and citation formatting (APA, MLA, Chicago). 24-hour turnaround.",
    type: "Offering",
    category: "Writing",
    payment_type: "Paid",
    budget: 25,
    deadline: "2026-12-01T23:59:59.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T11:00:00.000Z"
  },
  // Writing - Requesting
  {
    id: "gig_6",
    user_id: "usr_9",
    title: "Medical Abstract Polish & Grammar Review",
    description: "Drafting a 500-word conference abstract on enzymatic inhibitors. Seeking a strong writer to make the prose punchy and concise.",
    type: "Requesting",
    category: "Writing",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-10T15:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T16:45:00.000Z"
  },
  // Tutoring - Offering
  {
    id: "gig_7",
    user_id: "usr_3",
    title: "Calculus I & II Exam Prep Coaching",
    description: "Struggling with integrals, series, or derivatives? 2-hour 1-on-1 walk-through with customized practice problem sets.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: "2026-11-30T22:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-12T13:20:00.000Z"
  },
  // Tutoring - Requesting
  {
    id: "gig_8",
    user_id: "usr_1",
    title: "Need Linear Algebra & Eigenvectors Guidance",
    description: "Looking for an intuitive breakdown of vector transformations and diagonalization before our midterm exam next week.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 35,
    deadline: "2026-11-08T19:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T07:50:00.000Z"
  },
  // Programming - In Progress
  {
    id: "gig_9",
    user_id: "usr_11",
    title: "Setup CI/CD GitHub Actions for Student Project",
    description: "Configure automated linting, test runners, and automated preview deployments using Vercel & GitHub Actions.",
    type: "Offering",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-15T18:00:00.000Z",
    status: "In Progress",
    accepted_applicant_id: "usr_5",
    created_at: "2026-10-10T12:00:00.000Z"
  },
  // Programming - Completed
  {
    id: "gig_10",
    user_id: "usr_5",
    title: "Build RESTful API in Node.js for Mobile App",
    description: "Need an Express/Node backend connected to PostgreSQL for our mobile campus parking locator prototype.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 80,
    deadline: "2026-10-15T23:59:59.000Z",
    status: "Completed",
    accepted_applicant_id: "usr_1",
    created_at: "2026-10-01T09:00:00.000Z"
  },
  // Design - Completed
  {
    id: "gig_11",
    user_id: "usr_3",
    title: "Circuit Board Presentation Slide Deck",
    description: "Need clean 16:9 slides to showcase our engineering senior capstone circuit architecture.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 40,
    deadline: "2026-10-10T23:59:59.000Z",
    status: "Completed",
    accepted_applicant_id: "usr_2",
    created_at: "2026-09-28T14:00:00.000Z"
  },
  // Writing - Completed
  {
    id: "gig_12",
    user_id: "usr_7",
    title: "Proofreading Data Science Journal Submission",
    description: "Looking for an editor to review our 8-page paper on predictive climate trends before IEEE submission.",
    type: "Requesting",
    category: "Writing",
    payment_type: "Paid",
    budget: 35,
    deadline: "2026-10-05T20:00:00.000Z",
    status: "Completed",
    accepted_applicant_id: "usr_4",
    created_at: "2026-09-22T10:00:00.000Z"
  },
  // Tutoring - Completed
  {
    id: "gig_13",
    user_id: "usr_6",
    title: "Introduction to Excel Pivot Tables and VLOOKUP",
    description: "Seeking practical crash course on spreadsheet mastery for business finance projects.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 30,
    deadline: "2026-10-08T18:00:00.000Z",
    status: "Completed",
    accepted_applicant_id: "usr_12",
    created_at: "2026-09-25T11:30:00.000Z"
  },
  // Expired Gig (Deadline past, was Open)
  {
    id: "gig_14",
    user_id: "usr_8",
    title: "Unity 3D Shader Debugging Session",
    description: "Urgent help needed before game demo day to fix lighting artifacts in cartoon cel-shader.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-10-01T23:59:59.000Z", // In the past!
    status: "Expired",
    accepted_applicant_id: null,
    created_at: "2026-09-20T10:00:00.000Z"
  },
  // Cancelled Gig
  {
    id: "gig_15",
    user_id: "usr_10",
    title: "Podcast Theme Jingle Composition",
    description: "Cancelled because team chose an existing creative commons audio track.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 40,
    deadline: "2026-10-20T23:59:59.000Z",
    status: "Cancelled",
    accepted_applicant_id: null,
    created_at: "2026-10-02T15:00:00.000Z"
  },
  // More Open & Diverse Gigs to fulfill count >= 25
  {
    id: "gig_16",
    user_id: "usr_5",
    title: "Mock Technical Interview Practice (LeetCode Medium)",
    description: "1-hour mock technical interview covering binary trees, dynamic programming, and system design basics with constructive feedback.",
    type: "Offering",
    category: "Programming",
    payment_type: "Free",
    budget: null,
    deadline: "2026-11-28T19:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T18:00:00.000Z"
  },
  {
    id: "gig_17",
    user_id: "usr_8",
    title: "Custom 3D Low-Poly Character Rigging",
    description: "Offering Blender character modeling and mixamo-compatible rigging for student VR or game dev projects.",
    type: "Offering",
    category: "Design",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-12-05T23:59:59.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T11:20:00.000Z"
  },
  {
    id: "gig_18",
    user_id: "usr_10",
    title: "Professional Podcast Voice Cleanup & EQ Tuning",
    description: "Remove background hiss, room echo, and optimize dynamic range for your student podcast or voiceover reel.",
    type: "Offering",
    category: "Design",
    payment_type: "Paid",
    budget: 30,
    deadline: "2026-11-18T16:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-17T14:10:00.000Z"
  },
  {
    id: "gig_19",
    user_id: "usr_12",
    title: "Econometrics Problem Set Review in R / Stata",
    description: "Coaching through linear regressions, heteroskedasticity corrections, and interpreting p-values.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 40,
    deadline: "2026-11-22T20:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-16T17:00:00.000Z"
  },
  {
    id: "gig_20",
    user_id: "usr_9",
    title: "Need Assistance Coding Bio-Statistics Graph in R",
    description: "Have lab data on bacterial inhibition zones. Need an R script to produce publication-grade boxplots with ggplot2.",
    type: "Requesting",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-14T21:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T13:40:00.000Z"
  },
  {
    id: "gig_21",
    user_id: "usr_4",
    title: "Graduate School Statement of Purpose Editing",
    description: "Comprehensive structural and tone review for your MS/PhD applications. Highlighting your research narrative.",
    type: "Offering",
    category: "Writing",
    payment_type: "Paid",
    budget: 55,
    deadline: "2026-12-15T23:59:59.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T08:30:00.000Z"
  },
  {
    id: "gig_22",
    user_id: "usr_3",
    title: "Need Clean Figma Mockup for Smart Thermostat App",
    description: "Building an IoT microcontroller thermostat. Need a 3-screen Figma mockup for temperature setting and schedule.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 45,
    deadline: "2026-11-16T19:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T10:15:00.000Z"
  },
  {
    id: "gig_23",
    user_id: "usr_11",
    title: "Linux CLI & Shell Scripting 101 Tutoring",
    description: "Learn essential bash pipelines, grep, awk, file permissions, and ssh keys in a practical 90-minute session.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: "2026-11-27T18:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T19:20:00.000Z"
  },
  {
    id: "gig_24",
    user_id: "usr_2",
    title: "Need React Native Developer to Wire Up Auth Flow",
    description: "Have UI screens in React Native Expo, need someone to integrate Supabase email/password authentication.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 70,
    deadline: "2026-11-19T21:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T14:00:00.000Z"
  },
  {
    id: "gig_25",
    user_id: "usr_6",
    title: "Campus Magazine Article on Student Entrepreneurs",
    description: "Looking for an energetic writer to interview 3 student founders and write an engaging 1,200-word feature article.",
    type: "Requesting",
    category: "Writing",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-11-11T17:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-17T16:00:00.000Z"
  },
  {
    id: "gig_26",
    user_id: "usr_7",
    title: "Introductory Machine Learning & Scikit-Learn Coaching",
    description: "Understand decision trees, k-means clustering, and cross-validation with hands-on Jupyter notebook examples.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-12-02T21:00:00.000Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T16:30:00.000Z"
  }
];

export const SEED_APPLICATIONS: Application[] = [
  // For gig_4 (In Progress, accepted usr_2)
  {
    id: "app_1",
    gig_id: "gig_4",
    applicant_id: "usr_2",
    message: "Hi! I specialize in event posters and social carousels. Here is my portfolio link: fig.ma/mayalin. Would love to help!",
    status: "Accepted",
    created_at: "2026-10-14T09:30:00.000Z"
  },
  {
    id: "app_2",
    gig_id: "gig_4",
    applicant_id: "usr_8",
    message: "I can help with 3D or 2D layout for this poster if you still need someone.",
    status: "Rejected",
    created_at: "2026-10-14T10:15:00.000Z"
  },
  // For gig_9 (In Progress, accepted usr_5)
  {
    id: "app_3",
    gig_id: "gig_9",
    applicant_id: "usr_5",
    message: "I manage CI/CD for our open source club repo. Happy to trade this for some security audit tips!",
    status: "Accepted",
    created_at: "2026-10-10T14:00:00.000Z"
  },
  {
    id: "app_4",
    gig_id: "gig_9",
    applicant_id: "usr_1",
    message: "I use GitHub Actions daily for my deployments and can set up automated preview builds.",
    status: "Rejected",
    created_at: "2026-10-10T15:20:00.000Z"
  },
  // For gig_10 (Completed, accepted usr_1)
  {
    id: "app_5",
    gig_id: "gig_10",
    applicant_id: "usr_1",
    message: "I have built multiple Express + Postgres APIs with Prisma. Can finish this within 3 days.",
    status: "Accepted",
    created_at: "2026-10-01T11:00:00.000Z"
  },
  {
    id: "app_6",
    gig_id: "gig_10",
    applicant_id: "usr_11",
    message: "I can build the REST API and containerize it with Docker compose for easy local dev.",
    status: "Rejected",
    created_at: "2026-10-01T12:30:00.000Z"
  },
  // For gig_11 (Completed, accepted usr_2)
  {
    id: "app_7",
    gig_id: "gig_11",
    applicant_id: "usr_2",
    message: "I will make your engineering presentation look sleek and modern with custom diagrams.",
    status: "Accepted",
    created_at: "2026-09-28T15:00:00.000Z"
  },
  // For gig_12 (Completed, accepted usr_4)
  {
    id: "app_8",
    gig_id: "gig_12",
    applicant_id: "usr_4",
    message: "Experienced in editing technical and statistical publications. Will ensure rigorous flow.",
    status: "Accepted",
    created_at: "2026-09-22T11:30:00.000Z"
  },
  // For gig_13 (Completed, accepted usr_12)
  {
    id: "app_9",
    gig_id: "gig_13",
    applicant_id: "usr_12",
    message: "Happy to run an interactive session showing lookup formulas, indexing, and pivot summaries.",
    status: "Accepted",
    created_at: "2026-09-25T13:00:00.000Z"
  },
  // Applications for Open Gigs (Pending)
  {
    id: "app_10",
    gig_id: "gig_1",
    applicant_id: "usr_6",
    message: "Our Marketing Club needs an updated website urgently. We have the content ready!",
    status: "Pending",
    created_at: "2026-10-16T09:00:00.000Z"
  },
  {
    id: "app_11",
    gig_id: "gig_1",
    applicant_id: "usr_9",
    message: "The Pre-Med Student Association would love to collaborate on a showcase portal.",
    status: "Pending",
    created_at: "2026-10-17T11:45:00.000Z"
  },
  {
    id: "app_12",
    gig_id: "gig_2",
    applicant_id: "usr_1",
    message: "I use BeautifulSoup and Scrapy regularly. I can write a clean script with error handling in 2 days.",
    status: "Pending",
    created_at: "2026-10-16T16:00:00.000Z"
  },
  {
    id: "app_13",
    gig_id: "gig_2",
    applicant_id: "usr_5",
    message: "I can deliver a Python script with pandas data exporter and automated cron scheduling.",
    status: "Pending",
    created_at: "2026-10-17T08:30:00.000Z"
  },
  {
    id: "app_14",
    gig_id: "gig_3",
    applicant_id: "usr_1",
    message: "I'd love to swap skills! I can code your personal portfolio in exchange for a custom logo package.",
    status: "Pending",
    created_at: "2026-10-17T13:00:00.000Z"
  },
  {
    id: "app_15",
    gig_id: "gig_5",
    applicant_id: "usr_3",
    message: "Have a 12-page ethics paper due next week. Need someone to check for clarity and transition sentences.",
    status: "Pending",
    created_at: "2026-10-18T14:00:00.000Z"
  },
  {
    id: "app_16",
    gig_id: "gig_6",
    applicant_id: "usr_4",
    message: "Would love to swap for some chemistry tutoring for my biology elective!",
    status: "Pending",
    created_at: "2026-10-18T19:00:00.000Z"
  },
  {
    id: "app_17",
    gig_id: "gig_7",
    applicant_id: "usr_2",
    message: "Struggling with related rates and optimization problems in Calc I. Would love to join a study session!",
    status: "Pending",
    created_at: "2026-10-13T10:00:00.000Z"
  },
  {
    id: "app_18",
    gig_id: "gig_8",
    applicant_id: "usr_3",
    message: "Linear Algebra is my favorite subject. I can walk you through geometric intuition of eigenspaces.",
    status: "Pending",
    created_at: "2026-10-19T09:15:00.000Z"
  },
  {
    id: "app_19",
    gig_id: "gig_16",
    applicant_id: "usr_11",
    message: "Preparing for cybersecurity software roles. Would love an interview practice session on tree traversal.",
    status: "Pending",
    created_at: "2026-10-19T10:00:00.000Z"
  },
  {
    id: "app_20",
    gig_id: "gig_22",
    applicant_id: "usr_2",
    message: "I have designed UI for IoT devices before. I can send you a high-fidelity prototype in 48 hours.",
    status: "Pending",
    created_at: "2026-10-20T11:00:00.000Z"
  },
  {
    id: "app_21",
    gig_id: "gig_24",
    applicant_id: "usr_1",
    message: "I have configured Supabase Auth with PKCE and AsyncStorage in React Native multiple times.",
    status: "Pending",
    created_at: "2026-10-20T15:30:00.000Z"
  }
];

export const SEED_REVIEWS: Review[] = [
  // gig_10: Completed between owner usr_5 and applicant usr_1
  {
    id: "rev_1",
    gig_id: "gig_10",
    reviewer_id: "usr_5",
    reviewee_id: "usr_1",
    rating: 5,
    comment: "Aiden wrote exceptionally clean, documented code and delivered ahead of schedule. Highly recommended!",
    created_at: "2026-10-16T10:00:00.000Z"
  },
  {
    id: "rev_2",
    gig_id: "gig_10",
    reviewer_id: "usr_1",
    reviewee_id: "usr_5",
    rating: 5,
    comment: "Devon provided very clear API specifications and prompt feedback during testing. Great collaborator!",
    created_at: "2026-10-16T11:30:00.000Z"
  },

  // gig_11: Completed between owner usr_3 and applicant usr_2
  {
    id: "rev_3",
    gig_id: "gig_11",
    reviewer_id: "usr_3",
    reviewee_id: "usr_2",
    rating: 5,
    comment: "Maya transformed our messy technical slides into an executive-ready presentation. Fantastic visual flair!",
    created_at: "2026-10-11T09:00:00.000Z"
  },
  {
    id: "rev_4",
    gig_id: "gig_11",
    reviewer_id: "usr_2",
    reviewee_id: "usr_3",
    rating: 5,
    comment: "Carlos was great to work with, provided all technical diagrams promptly and made collaboration easy.",
    created_at: "2026-10-11T12:00:00.000Z"
  },

  // gig_12: Completed between owner usr_7 and applicant usr_4
  {
    id: "rev_5",
    gig_id: "gig_12",
    reviewer_id: "usr_7",
    reviewee_id: "usr_4",
    rating: 5,
    comment: "Sarah's editorial polish made our paper flow smoothly. Caught subtle terminology inconsistencies.",
    created_at: "2026-10-06T14:00:00.000Z"
  },
  {
    id: "rev_6",
    gig_id: "gig_12",
    reviewer_id: "usr_4",
    reviewee_id: "usr_7",
    rating: 5,
    comment: "Liam was extremely communicative and responsive to editorial notes. Would happily edit for him again.",
    created_at: "2026-10-06T16:30:00.000Z"
  },

  // gig_13: Completed between owner usr_6 and applicant usr_12
  {
    id: "rev_7",
    gig_id: "gig_13",
    reviewer_id: "usr_6",
    reviewee_id: "usr_12",
    rating: 5,
    comment: "Hannah is a patient, clear tutor who demystified complex financial formulas with real examples.",
    created_at: "2026-10-09T17:00:00.000Z"
  },
  {
    id: "rev_8",
    gig_id: "gig_13",
    reviewer_id: "usr_12",
    reviewee_id: "usr_6",
    rating: 4,
    comment: "Priya was engaged, prepared with specific questions, and picked up data concepts rapidly.",
    created_at: "2026-10-09T18:15:00.000Z"
  }
];

// server/seedData.js
// Pre-configured rich seed data conforming strictly to Issue #12 requirements

const initialUsers = [
  {
    id: "usr_1",
    name: "Ayesha Khan",
    major: "Software Engineering",
    semester: "6th",
    bio: "Full-stack developer passionate about React, Node.js, and cloud native architectures. Loves helping peers debug code and build capstones.",
    skills: ["React", "Node.js", "TypeScript", "Tailwind CSS", "MongoDB"]
  },
  {
    id: "usr_2",
    name: "Bilal Ahmed",
    major: "Computer Systems Engineering",
    semester: "7th",
    bio: "Embedded systems and Python automation geek. Offering tutoring in Data Structures, Algorithms, and C++ fundamentals.",
    skills: ["Python", "C++", "Data Structures", "IoT", "Linux"]
  },
  {
    id: "usr_3",
    name: "Zainab Fatima",
    major: "Graphic & Digital Design",
    semester: "5th",
    bio: "Visual designer crafting intuitive mobile UI/UX, brand identity kits, and presentation slides that stand out.",
    skills: ["Figma", "UI/UX Design", "Adobe Illustrator", "Wireframing", "Canva"]
  },
  {
    id: "usr_4",
    name: "Hamza Tariq",
    major: "Electrical Engineering",
    semester: "4th",
    bio: "Circuit analysis, Calculus, and MATLAB enthusiast. Always ready to swap math tutoring for frontend web skills.",
    skills: ["MATLAB", "Calculus", "Circuit Analysis", "LaTeX"]
  },
  {
    id: "usr_5",
    name: "Sara Noor",
    major: "Business Administration & Marketing",
    semester: "8th",
    bio: "Technical copywriter, content strategist, and resume reviewer. Helps STEM students articulate their achievements.",
    skills: ["Copywriting", "Resume Writing", "Research", "Pitch Decks", "SEO"]
  },
  {
    id: "usr_6",
    name: "Daniyal Raza",
    major: "Computer Science",
    semester: "5th",
    bio: "Cybersecurity buff and backend specialist. Express.js, PostgreSQL, and secure API architecture.",
    skills: ["Node.js", "Express", "PostgreSQL", "Docker", "Security"]
  },
  {
    id: "usr_7",
    name: "Mehak Ali",
    major: "Architecture & Visual Arts",
    semester: "6th",
    bio: "3D modeler and digital illustrator. Looking for Python scripting help in exchange for custom illustrations.",
    skills: ["Blender", "Digital Art", "AutoCAD", "Photoshop", "Storyboarding"]
  },
  {
    id: "usr_8",
    name: "Usman Ghani",
    major: "Data Science & AI",
    semester: "7th",
    bio: "Machine learning research assistant. Experienced in Pandas, Scikit-learn, and statistical analysis for term papers.",
    skills: ["Data Science", "Machine Learning", "Python", "Pandas", "PowerBI"]
  },
  {
    id: "usr_9",
    name: "Hira Mansoor",
    major: "Software Engineering",
    semester: "3rd",
    bio: "Eager sophomore learning modern frontend development. Quick learner, excited to collaborate on campus gigs.",
    skills: ["HTML/CSS", "JavaScript", "React Basics", "Git"]
  },
  {
    id: "usr_10",
    name: "Fahad Mustafa",
    major: "Telecommunication Engineering",
    semester: "6th",
    bio: "Computer networking, Packet Tracer, and Cisco routing tutor. Available for weekend crash courses.",
    skills: ["Networking", "Cisco Packet Tracer", "CCNA Basics", "Linux"]
  },
  {
    id: "usr_11",
    name: "Rameen Tariq",
    major: "English & Linguistics",
    semester: "7th",
    bio: "Academic proofreader, thesis editor, and SOP specialist. Over 30 student statements reviewed successfully.",
    skills: ["Academic Proofreading", "Editing", "SOP Review", "APA Formatting"]
  },
  {
    id: "usr_12",
    name: "Kashif Memon",
    major: "Information Technology",
    semester: "4th",
    bio: "Mobile app developer specializing in React Native and Firebase. Seeking graphic designer for app mockups.",
    skills: ["React Native", "Firebase", "REST APIs", "Tailwind CSS"]
  },
  {
    id: "usr_13",
    name: "Dua Siddiqui",
    major: "Software Engineering",
    semester: "5th",
    bio: "QA enthusiast & frontend developer. Focuses on responsive UI design, accessible markup, and clean code.",
    skills: ["React", "Jest", "Responsive UI", "Documentation"]
  },
  {
    id: "usr_14",
    name: "Shahzaib Shah",
    major: "Mathematics & Computing",
    semester: "6th",
    bio: "Discrete Mathematics and Linear Algebra mentor. Loves turning complex proofs into understandable visual concepts.",
    skills: ["Linear Algebra", "Discrete Math", "Python", "LaTeX"]
  }
];

const initialGigs = [
  {
    id: "gig_1",
    user_id: "usr_1",
    title: "Build Responsive React Landing Page for Campus Society",
    description: "Need an energetic developer to code a 3-page responsive site using React & Tailwind for the Computer Society annual symposium. Wireframes are ready in Figma.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 60,
    deadline: "2026-11-20T23:59:59Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-15T09:00:00Z"
  },
  {
    id: "gig_2",
    user_id: "usr_3",
    title: "Offering Custom UI/UX Figma Design for Final Year Projects",
    description: "Offering high-fidelity mobile or web prototypes in Figma for student FYPs. In exchange, I need tutoring in Database Systems (SQL queries and ER diagrams).",
    type: "Offering",
    category: "Design",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-30T18:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-16T11:30:00Z"
  },
  {
    id: "gig_3",
    user_id: "usr_2",
    title: "1-on-1 Data Structures & Algorithms Exam Prep Tutoring",
    description: "Offering 4 weekend sessions covering Trees, Graphs, Sorting algorithms, and Big-O notation. Includes practice LeetCode easy/medium problems.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 45,
    deadline: "2026-11-25T12:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-17T14:15:00Z"
  },
  {
    id: "gig_4",
    user_id: "usr_5",
    title: "Review & Polish Master's SOP / Tech Resume",
    description: "Will thoroughly review and proofread your graduate school Statement of Purpose or SWE internship resume. Free for 1st & 2nd year students!",
    type: "Offering",
    category: "Writing",
    payment_type: "Free",
    budget: null,
    deadline: "2026-12-05T20:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T08:45:00Z"
  },
  {
    id: "gig_5",
    user_id: "usr_6",
    title: "Urgent: Need Help Integrating Stripe / Payment Gateway in Express",
    description: "Looking for someone with Stripe API experience to help hook up webhook handlers in an existing Node.js backend. Codebase is clean.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-11-10T17:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T10:00:00Z"
  },
  {
    id: "gig_6",
    user_id: "usr_7",
    title: "Offering 3D Mascot Character Render for Student Startups",
    description: "Will model a charming 3D character in Blender for your project branding or mobile app onboarding screens.",
    type: "Offering",
    category: "Design",
    payment_type: "Paid",
    budget: 75,
    deadline: "2026-11-28T22:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-18T15:20:00Z"
  },
  {
    id: "gig_7",
    user_id: "usr_4",
    title: "Calculus II & Differential Equations Crash Course (Swap for Web Design)",
    description: "I will provide 5 hours of intensive calculus tutoring. Looking for someone who can help me style my personal portfolio website using CSS/Tailwind.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-18T16:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T09:30:00Z"
  },
  {
    id: "gig_8",
    user_id: "usr_8",
    title: "Need Technical Writer for AI Term Paper Methodology Section",
    description: "Looking for a peer with strong technical writing and LaTeX skills to help format and edit our machine learning benchmark comparison paper.",
    type: "Requesting",
    category: "Writing",
    payment_type: "Paid",
    budget: 35,
    deadline: "2026-11-12T19:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T11:00:00Z"
  },
  {
    id: "gig_9",
    user_id: "usr_10",
    title: "Packet Tracer Network Topology Simulation Assistance",
    description: "Offering guided session to setup OSPF and VLAN routing configurations on Cisco Packet Tracer for semester lab assignment.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: "2026-11-15T21:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T13:40:00Z"
  },
  {
    id: "gig_10",
    user_id: "usr_12",
    title: "Looking for Modern Logo & App Icon for Campus Rideshare App",
    description: "We are developing a campus carpool mobile app and need a clean, minimalist SVG logo and app icon set.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 40,
    deadline: "2026-11-22T18:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T14:50:00Z"
  },
  {
    id: "gig_11",
    user_id: "usr_14",
    title: "Swap Discrete Math Coaching for Python Scripting",
    description: "Need help writing an automated web scraping script in Python. Offering comprehensive Discrete Mathematics midterm coaching in exchange.",
    type: "Requesting",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-24T20:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-19T16:00:00Z"
  },
  {
    id: "gig_12",
    user_id: "usr_11",
    title: "Free Proofreading for Engineering Capstone Abstracts",
    description: "Offering free line-by-line grammar, clarity, and tone proofreading for senior engineering project abstracts.",
    type: "Offering",
    category: "Writing",
    payment_type: "Free",
    budget: null,
    deadline: "2026-12-01T23:59:59Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T08:00:00Z"
  },
  {
    id: "gig_13",
    user_id: "usr_13",
    title: "Frontend Testing & Bug Fixing in Vanilla JS App",
    description: "Need someone with browser debugging skills to fix cross-browser layout glitches and form validation in a student portal project.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 30,
    deadline: "2026-11-14T17:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T10:15:00Z"
  },
  {
    id: "gig_14",
    user_id: "usr_9",
    title: "Looking for Peer Tutor in Object Oriented Programming (Java)",
    description: "Struggling with Polymorphism and Interface design patterns in Java. Seeking an experienced upper-year tutor for 3 sessions.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 35,
    deadline: "2026-11-19T19:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T12:00:00Z"
  },
  // IN PROGRESS GIGS (with accepted applicant)
  {
    id: "gig_15",
    user_id: "usr_1",
    title: "Create Brand Identity & Social Banners for Hackathon Team",
    description: "Design social media banners, vector logo marks, and color guide for our national hackathon team submission.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 55,
    deadline: "2026-11-05T23:59:59Z",
    status: "In Progress",
    accepted_applicant_id: "usr_3",
    created_at: "2026-10-10T09:00:00Z"
  },
  {
    id: "gig_16",
    user_id: "usr_2",
    title: "Swap C++ Socket Programming for Mobile App UI Wireframe",
    description: "I will write multi-threaded C++ client-server socket code for your networking project in exchange for Figma wireframes.",
    type: "Offering",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-11-08T18:00:00Z",
    status: "In Progress",
    accepted_applicant_id: "usr_12",
    created_at: "2026-10-11T11:00:00Z"
  },
  {
    id: "gig_17",
    user_id: "usr_5",
    title: "Pitch Deck Copywriting & Slide Layout for Startup Competition",
    description: "Drafting the executive pitch narrative and financial summary slides for Hult Prize campus qualifiers.",
    type: "Offering",
    category: "Writing",
    payment_type: "Paid",
    budget: 65,
    deadline: "2026-11-04T15:00:00Z",
    status: "In Progress",
    accepted_applicant_id: "usr_8",
    created_at: "2026-10-12T14:30:00Z"
  },
  {
    id: "gig_18",
    user_id: "usr_4",
    title: "Assistance with Digital Signal Processing MATLAB Assignment",
    description: "Need guidance on FFT and FIR filter design scripts in MATLAB for Lab 6 submission.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 40,
    deadline: "2026-11-06T20:00:00Z",
    status: "In Progress",
    accepted_applicant_id: "usr_2",
    created_at: "2026-10-13T16:00:00Z"
  },
  // COMPLETED GIGS (with mutual reviews)
  {
    id: "gig_19",
    user_id: "usr_6",
    title: "Full-Stack Auth Module with JWT & Refresh Tokens",
    description: "Implement secure authentication microservice with refresh token rotation and bcrypt password hashing.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 80,
    deadline: "2026-10-05T20:00:00Z",
    status: "Completed",
    accepted_applicant_id: "usr_1",
    created_at: "2026-09-20T10:00:00Z"
  },
  {
    id: "gig_20",
    user_id: "usr_3",
    title: "Design Vector Illustrations for Student Health Awareness Campaign",
    description: "Create 4 vibrant, accessible vector illustrations for the university mental health society bulletin.",
    type: "Offering",
    category: "Design",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-10-08T18:00:00Z",
    status: "Completed",
    accepted_applicant_id: "usr_5",
    created_at: "2026-09-22T14:00:00Z"
  },
  {
    id: "gig_21",
    user_id: "usr_8",
    title: "Python Data Visualization with Seaborn for Senior Research",
    description: "Wrote clean scripts to generate boxplots, heatmaps, and regression charts from experimental sensor data.",
    type: "Offering",
    category: "Programming",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-10-10T19:00:00Z",
    status: "Completed",
    accepted_applicant_id: "usr_7",
    created_at: "2026-09-25T11:20:00Z"
  },
  {
    id: "gig_22",
    user_id: "usr_11",
    title: "Thesis Literature Review Proofreading and Formatting",
    description: "Comprehensive proofreading and Chicago-style reference check for 20-page review chapter.",
    type: "Offering",
    category: "Writing",
    payment_type: "Paid",
    budget: 45,
    deadline: "2026-10-12T22:00:00Z",
    status: "Completed",
    accepted_applicant_id: "usr_2",
    created_at: "2026-09-28T09:40:00Z"
  },
  {
    id: "gig_23",
    user_id: "usr_14",
    title: "Linear Algebra Eigenvalues & Matrix Decomposition Tutoring",
    description: "Three 90-minute tutoring sessions preparing student for midterms. Covered SVD and diagonalization.",
    type: "Offering",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: "2026-10-14T17:00:00Z",
    status: "Completed",
    accepted_applicant_id: "usr_9",
    created_at: "2026-09-30T15:00:00Z"
  },
  // EXPIRED GIGS (past deadline, was open)
  {
    id: "gig_24",
    user_id: "usr_4",
    title: "MATLAB Scripting for Circuit Simulation Lab 3",
    description: "Needed someone to check RLC transient response simulation graphs before the October 1st deadline.",
    type: "Requesting",
    category: "Programming",
    payment_type: "Paid",
    budget: 25,
    deadline: "2026-10-01T23:59:59Z",
    status: "Expired",
    accepted_applicant_id: null,
    created_at: "2026-09-22T10:00:00Z"
  },
  {
    id: "gig_25",
    user_id: "usr_10",
    title: "Swap Networking Study Notes for Assembly 8086 Cheatsheet",
    description: "Looking for an 8086 microprocessor assembly cheat sheet in exchange for CCNA routing notes.",
    type: "Requesting",
    category: "Writing",
    payment_type: "SkillSwap",
    budget: null,
    deadline: "2026-10-02T18:00:00Z",
    status: "Expired",
    accepted_applicant_id: null,
    created_at: "2026-09-24T12:00:00Z"
  },
  // CANCELLED GIGS
  {
    id: "gig_26",
    user_id: "usr_13",
    title: "Cancelled: Mobile App Prototype Usability Testing",
    description: "Gig was cancelled because the testing group was postponed to next semester.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Free",
    budget: null,
    deadline: "2026-11-30T23:59:59Z",
    status: "Cancelled",
    accepted_applicant_id: null,
    created_at: "2026-10-05T09:00:00Z"
  },
  {
    id: "gig_27",
    user_id: "usr_12",
    title: "Cancelled: High School Physics Tutoring",
    description: "Shifted schedule so no longer seeking tutoring at this time.",
    type: "Requesting",
    category: "Tutoring",
    payment_type: "Paid",
    budget: 30,
    deadline: "2026-11-20T18:00:00Z",
    status: "Cancelled",
    accepted_applicant_id: null,
    created_at: "2026-10-07T13:00:00Z"
  },
  {
    id: "gig_28",
    user_id: "usr_7",
    title: "Podcast Audio Cleanup & Noise Reduction",
    description: "Need an audio enthusiast to clean background hiss and master 2 episodes of campus tech podcast.",
    type: "Requesting",
    category: "Design",
    payment_type: "Paid",
    budget: 45,
    deadline: "2026-11-17T20:00:00Z",
    status: "Open",
    accepted_applicant_id: null,
    created_at: "2026-10-20T16:30:00Z"
  }
];

const initialApplications = [
  // For gig_1 (Open)
  {
    id: "app_1",
    gig_id: "gig_1",
    applicant_id: "usr_6",
    message: "Hey Ayesha! I have built several responsive landing pages with React and Tailwind CSS. Would love to deliver this before deadline.",
    status: "Pending",
    created_at: "2026-10-16T10:00:00Z"
  },
  {
    id: "app_2",
    gig_id: "gig_1",
    applicant_id: "usr_13",
    message: "Hi! I am great with React and mobile responsiveness. Checked out your society symposium theme and have great ideas.",
    status: "Pending",
    created_at: "2026-10-17T12:30:00Z"
  },
  // For gig_2 (Open - SkillSwap)
  {
    id: "app_3",
    gig_id: "gig_2",
    applicant_id: "usr_2",
    message: "I scored an A in Database Systems last semester and can teach ER diagrams, normalization, and SQL indexing thoroughly!",
    status: "Pending",
    created_at: "2026-10-17T15:00:00Z"
  },
  // For gig_3 (Open - Tutoring)
  {
    id: "app_4",
    gig_id: "gig_3",
    applicant_id: "usr_9",
    message: "I really need this DSA prep for my upcoming midterms! Would like to book the weekend slots.",
    status: "Pending",
    created_at: "2026-10-18T09:20:00Z"
  },
  {
    id: "app_5",
    gig_id: "gig_3",
    applicant_id: "usr_14",
    message: "Interested in brushing up on Graph algorithms and dynamic programming with you.",
    status: "Pending",
    created_at: "2026-10-18T11:45:00Z"
  },
  // For gig_4 (Open - Free)
  {
    id: "app_6",
    gig_id: "gig_4",
    applicant_id: "usr_9",
    message: "Sophomore here! Would appreciate a quick pass over my internship resume before the career fair.",
    status: "Pending",
    created_at: "2026-10-19T08:10:00Z"
  },
  // For gig_5 (Open)
  {
    id: "app_7",
    gig_id: "gig_5",
    applicant_id: "usr_1",
    message: "I implemented Stripe webhook verification in my past two projects. Can help you finish this in an evening.",
    status: "Pending",
    created_at: "2026-10-19T10:40:00Z"
  },
  // For gig_7 (Open - SkillSwap)
  {
    id: "app_8",
    gig_id: "gig_7",
    applicant_id: "usr_3",
    message: "Happy to design and code a sleek portfolio website for you in exchange for Calculus tutoring!",
    status: "Pending",
    created_at: "2026-10-19T14:00:00Z"
  },
  // For gig_8 (Open)
  {
    id: "app_9",
    gig_id: "gig_8",
    applicant_id: "usr_11",
    message: "Experienced in Overleaf LaTeX, IEEE formatting, and academic methodology writing. Ready to start.",
    status: "Pending",
    created_at: "2026-10-19T17:15:00Z"
  },
  // For gig_10 (Open)
  {
    id: "app_10",
    gig_id: "gig_10",
    applicant_id: "usr_3",
    message: "Check out my portfolio! I specialize in modern icon design and can provide vectors in multiple resolutions.",
    status: "Pending",
    created_at: "2026-10-20T09:10:00Z"
  },
  // For gig_15 (In Progress - Accepted: usr_3, Rejected: usr_7)
  {
    id: "app_11",
    gig_id: "gig_15",
    applicant_id: "usr_3",
    message: "I love designing branding packages for hackathon teams. Let's make SheNova stand out!",
    status: "Accepted",
    created_at: "2026-10-10T12:00:00Z"
  },
  {
    id: "app_12",
    gig_id: "gig_15",
    applicant_id: "usr_7",
    message: "Can provide custom digital art assets for your social banners.",
    status: "Rejected",
    created_at: "2026-10-10T14:30:00Z"
  },
  // For gig_16 (In Progress - Accepted: usr_12)
  {
    id: "app_13",
    gig_id: "gig_16",
    applicant_id: "usr_12",
    message: "Deal! I will deliver a complete React Native/Figma design kit in exchange for C++ socket guidance.",
    status: "Accepted",
    created_at: "2026-10-11T13:00:00Z"
  },
  // For gig_17 (In Progress - Accepted: usr_8)
  {
    id: "app_14",
    gig_id: "gig_17",
    applicant_id: "usr_8",
    message: "We have data on student market size and need a compelling story deck. Let's collaborate!",
    status: "Accepted",
    created_at: "2026-10-12T16:00:00Z"
  },
  // For gig_18 (In Progress - Accepted: usr_2, Rejected: usr_14)
  {
    id: "app_15",
    gig_id: "gig_18",
    applicant_id: "usr_2",
    message: "I aced DSP last semester and have MATLAB code examples ready for FFT analysis.",
    status: "Accepted",
    created_at: "2026-10-13T17:00:00Z"
  },
  {
    id: "app_16",
    gig_id: "gig_18",
    applicant_id: "usr_14",
    message: "I can assist with the theoretical math behind the discrete Fourier transform.",
    status: "Rejected",
    created_at: "2026-10-13T18:00:00Z"
  },
  // For gig_19 (Completed - Accepted: usr_1, Rejected: usr_13)
  {
    id: "app_17",
    gig_id: "gig_19",
    applicant_id: "usr_1",
    message: "Full-stack developer with extensive production JWT and session handling experience.",
    status: "Accepted",
    created_at: "2026-09-20T12:00:00Z"
  },
  {
    id: "app_18",
    gig_id: "gig_19",
    applicant_id: "usr_13",
    message: "Can help build and test backend auth endpoints with Postman.",
    status: "Rejected",
    created_at: "2026-09-20T13:30:00Z"
  },
  // For gig_20 (Completed - Accepted: usr_5)
  {
    id: "app_19",
    gig_id: "gig_20",
    applicant_id: "usr_5",
    message: "I am leading the campus mental health society campaign and would love these graphics!",
    status: "Accepted",
    created_at: "2026-09-22T16:00:00Z"
  },
  // For gig_21 (Completed - Accepted: usr_7)
  {
    id: "app_20",
    gig_id: "gig_21",
    applicant_id: "usr_7",
    message: "I can provide 3D renders for your research poster in return for Seaborn statistical plots.",
    status: "Accepted",
    created_at: "2026-09-25T13:00:00Z"
  },
  // For gig_22 (Completed - Accepted: usr_2)
  {
    id: "app_21",
    gig_id: "gig_22",
    applicant_id: "usr_2",
    message: "Need my thesis literature review checked before formal submission. Happy to pay asking price.",
    status: "Accepted",
    created_at: "2026-09-28T11:00:00Z"
  },
  // For gig_23 (Completed - Accepted: usr_9)
  {
    id: "app_22",
    gig_id: "gig_23",
    applicant_id: "usr_9",
    message: "Struggling with matrix diagonalization and need a patient tutor. Thank you for offering this freely!",
    status: "Accepted",
    created_at: "2026-09-30T16:00:00Z"
  },
  // For gig_24 (Expired - Pending app that expired)
  {
    id: "app_23",
    gig_id: "gig_24",
    applicant_id: "usr_2",
    message: "Can help with RLC circuits if you still need it.",
    status: "Pending",
    created_at: "2026-09-23T10:00:00Z"
  },
  // For gig_28 (Open)
  {
    id: "app_24",
    gig_id: "gig_28",
    applicant_id: "usr_4",
    message: "I have Audacity and Adobe Audition setups with de-noise filters. Can clean the audio tracks quickly.",
    status: "Pending",
    created_at: "2026-10-20T17:00:00Z"
  }
];

const initialReviews = [
  // For gig_19: Owner (usr_6) and Accepted Applicant (usr_1)
  {
    id: "rev_1",
    gig_id: "gig_19",
    reviewer_id: "usr_6",
    reviewee_id: "usr_1",
    rating: 5,
    comment: "Ayesha delivered bulletproof JWT authentication ahead of schedule! Her code was modular and well-documented.",
    created_at: "2026-10-06T10:00:00Z"
  },
  {
    id: "rev_2",
    gig_id: "gig_19",
    reviewer_id: "usr_1",
    reviewee_id: "usr_6",
    rating: 5,
    comment: "Daniyal had clear requirements, provided prompt feedback, and verified the endpoints immediately. Excellent gig poster!",
    created_at: "2026-10-06T11:30:00Z"
  },
  // For gig_20: Owner (usr_3) and Accepted Applicant (usr_5)
  {
    id: "rev_3",
    gig_id: "gig_20",
    reviewer_id: "usr_5",
    reviewee_id: "usr_3",
    rating: 5,
    comment: "Zainab's illustrations were gorgeous, empathetic, and perfectly on brand. The society council loved them!",
    created_at: "2026-10-09T09:15:00Z"
  },
  {
    id: "rev_4",
    gig_id: "gig_20",
    reviewer_id: "usr_3",
    reviewee_id: "usr_5",
    rating: 5,
    comment: "Sara was a joy to collaborate with. Clear brief, respectful communication, and swift approval.",
    created_at: "2026-10-09T10:00:00Z"
  },
  // For gig_21: Owner (usr_8) and Accepted Applicant (usr_7)
  {
    id: "rev_5",
    gig_id: "gig_21",
    reviewer_id: "usr_7",
    reviewee_id: "usr_8",
    rating: 4,
    comment: "Usman made insightful Seaborn graphs that elevated my research poster. Very knowledgeable in Python data science.",
    created_at: "2026-10-11T14:00:00Z"
  },
  {
    id: "rev_6",
    gig_id: "gig_21",
    reviewer_id: "usr_8",
    reviewee_id: "usr_7",
    rating: 5,
    comment: "Great skill swap! Mehak delivered realistic 3D model renders that looked professional.",
    created_at: "2026-10-11T16:30:00Z"
  },
  // For gig_22: Owner (usr_11) and Accepted Applicant (usr_2)
  {
    id: "rev_7",
    gig_id: "gig_22",
    reviewer_id: "usr_2",
    reviewee_id: "usr_11",
    rating: 5,
    comment: "Rameen caught numerous subtle formatting discrepancies and grammatical quirks. My advisor was genuinely impressed.",
    created_at: "2026-10-13T12:00:00Z"
  },
  {
    id: "rev_8",
    gig_id: "gig_22",
    reviewer_id: "usr_11",
    reviewee_id: "usr_2",
    rating: 5,
    comment: "Bilal's paper was fascinating and he was very responsive to suggested structural edits.",
    created_at: "2026-10-13T13:45:00Z"
  },
  // For gig_23: Owner (usr_14) and Accepted Applicant (usr_9)
  {
    id: "rev_9",
    gig_id: "gig_23",
    reviewer_id: "usr_9",
    reviewee_id: "usr_14",
    rating: 5,
    comment: "Shahzaib explained matrix eigenvalues in the simplest and most intuitive way possible. Boosted my exam confidence tremendously!",
    created_at: "2026-10-15T09:00:00Z"
  },
  {
    id: "rev_10",
    gig_id: "gig_23",
    reviewer_id: "usr_14",
    reviewee_id: "usr_9",
    rating: 5,
    comment: "Hira was an attentive and hardworking student who asked thoughtful questions during every session.",
    created_at: "2026-10-15T10:15:00Z"
  }
];

function getSeedData() {
  // Deep clone to prevent accidental mutations
  return {
    users: JSON.parse(JSON.stringify(initialUsers)),
    gigs: JSON.parse(JSON.stringify(initialGigs)),
    applications: JSON.parse(JSON.stringify(initialApplications)),
    reviews: JSON.parse(JSON.stringify(initialReviews))
  };
}

module.exports = {
  initialUsers,
  initialGigs,
  initialApplications,
  initialReviews,
  getSeedData
};

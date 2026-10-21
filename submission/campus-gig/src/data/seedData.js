// Campus Gig & SkillSwap Portal - Initial Seed Dataset
// 14 Students, 28 Gigs, 24 Applications, 10 Reviews

const users = [
  {
    id: "usr-1",
    name: "Alex Rivera",
    email: "alex.rivera@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    major: "Computer Science",
    semester: "Semester 6",
    bio: "Full-stack developer enthusiastic about web apps, cloud computing, and mentoring junior CS students.",
    skills: ["JavaScript", "React", "Node.js", "Python", "SQL"]
  },
  {
    id: "usr-2",
    name: "Maya Patel",
    email: "maya.patel@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
    major: "Digital Design & Media",
    semester: "Semester 5",
    bio: "UI/UX designer obsessed with Figma, design systems, modern typography, and campus branding.",
    skills: ["Figma", "UI/UX", "Adobe Illustrator", "Branding", "Wireframing"]
  },
  {
    id: "usr-3",
    name: "Liam O'Connor",
    email: "liam.oc@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
    major: "English & Journalism",
    semester: "Semester 7",
    bio: "Editor for the Campus Weekly newspaper. I help polish essays, statement of purposes, and project documentation.",
    skills: ["Technical Writing", "Proofreading", "Copywriting", "Creative Writing"]
  },
  {
    id: "usr-4",
    name: "Sophia Zhang",
    email: "sophia.zhang@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    major: "Mathematics & Statistics",
    semester: "Semester 6",
    bio: "Math department tutor for Calculus I-III and Linear Algebra. Love breaking down complex proofs.",
    skills: ["Calculus", "Linear Algebra", "Probability", "MATLAB", "R"]
  },
  {
    id: "usr-5",
    name: "Marcus Johnson",
    email: "marcus.j@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    major: "Computer Engineering",
    semester: "Semester 4",
    bio: "Embedded systems nerd and mobile app tinkerer. Looking for design collabs in exchange for coding help.",
    skills: ["C++", "Arduino", "Flutter", "Python", "Git"]
  },
  {
    id: "usr-6",
    name: "Elena Rostova",
    email: "elena.r@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    major: "Graphic Design",
    semester: "Semester 6",
    bio: "Poster artist and visual identity creator. Happy to trade logo design for math tutoring or coding.",
    skills: ["Photoshop", "Logo Design", "Poster Art", "Canva", "Infographics"]
  },
  {
    id: "usr-7",
    name: "Jordan Lee",
    email: "jordan.lee@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    major: "Data Science",
    semester: "Semester 7",
    bio: "Machine learning enthusiast building prediction models. TA for Intro to Data Science.",
    skills: ["Python", "Pandas", "Scikit-Learn", "Data Viz", "SQL"]
  },
  {
    id: "usr-8",
    name: "Amina Al-Mansoor",
    email: "amina.m@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amina",
    major: "Business Administration",
    semester: "Semester 5",
    bio: "Startup pitch deck specialist and academic research writer. Passionate about social entrepreneurship.",
    skills: ["Pitch Decks", "Business Plans", "Academic Writing", "Presentations"]
  },
  {
    id: "usr-9",
    name: "David Kim",
    email: "david.kim@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    major: "Physics",
    semester: "Semester 8",
    bio: "Physics graduate track student. Experienced peer tutor in Classical Mechanics and Electromagnetism.",
    skills: ["Physics", "Mechanics", "Electromagnetism", "LaTeX", "Scientific Computing"]
  },
  {
    id: "usr-10",
    name: "Chloe Tremblay",
    email: "chloe.t@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
    major: "Software Engineering",
    semester: "Semester 3",
    bio: "Sophomore eager to contribute to campus open source tools. Learning web backend and APIs.",
    skills: ["HTML", "CSS", "JavaScript", "Express.js", "Java"]
  },
  {
    id: "usr-11",
    name: "Tariq Hassan",
    email: "tariq.h@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tariq",
    major: "Communication & Media",
    semester: "Semester 5",
    bio: "Podcast producer and video editor for campus clubs. Fast turnaround on reel/shorts editing.",
    skills: ["Premiere Pro", "Video Editing", "Audio Mixing", "Storyboarding"]
  },
  {
    id: "usr-12",
    name: "Isabella Silva",
    email: "isabella.s@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella",
    major: "Chemistry",
    semester: "Semester 6",
    bio: "Organic chemistry peer mentor and lab report specialist. Chemistry doesn't have to be terrifying!",
    skills: ["Organic Chemistry", "Lab Reports", "General Chemistry", "Study Guides"]
  },
  {
    id: "usr-13",
    name: "Nate Robinson",
    email: "nate.r@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nate",
    major: "Cybersecurity",
    semester: "Semester 7",
    bio: "Ethical hacker and Linux sysadmin. Happy to assist with network lab setups and security audits.",
    skills: ["Linux", "Bash", "Network Security", "Cryptography", "Python"]
  },
  {
    id: "usr-14",
    name: "Zara Qureshi",
    email: "zara.q@campus.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zara",
    major: "Psychology & Cognitive Science",
    semester: "Semester 4",
    bio: "Research methods student. Can help with APA formatting, literature reviews, and survey design.",
    skills: ["APA Style", "Survey Design", "SPSS", "Literature Review"]
  }
];

const gigs = [
  // 1. Programming - Offering - Open
  {
    id: "gig-1",
    title: "Building Responsive Portfolio Websites for Students",
    description: "Offering to build a clean, mobile-responsive personal portfolio or project showcase using HTML, modern CSS, and lightweight JS. Includes GitHub Pages deployment assistance.",
    type: "Offering",
    category: "Programming",
    paymentType: "Paid",
    budget: 45,
    deadline: "2026-11-20",
    ownerId: "usr-1",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-10T14:30:00.000Z",
    tags: ["Portfolio", "Frontend", "GitHub Pages"]
  },
  // 2. Programming - Requesting - Open
  {
    id: "gig-2",
    title: "Need Help Debugging React State & Context in Capstone App",
    description: "Looking for an experienced React coder to help resolve an infinite render loop in my capstone project. Should take around 1-2 hours over Discord or in the campus library.",
    type: "Requesting",
    category: "Programming",
    paymentType: "Paid",
    budget: 35,
    deadline: "2026-11-05",
    ownerId: "usr-10",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-14T09:15:00.000Z",
    tags: ["React", "State Management", "Debugging"]
  },
  // 3. Design - Offering - Open
  {
    id: "gig-3",
    title: "Custom Club Logos & Social Media Banner Kits",
    description: "Offering high-resolution vector logos, Discord icons, and Instagram banner packages for student organizations and club events. Unlimited revisions until approved.",
    type: "Offering",
    category: "Design",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-25",
    ownerId: "usr-2",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-12T16:00:00.000Z",
    tags: ["Vector Logo", "Branding", "Social Media"]
  },
  // 4. Design - Requesting - Open
  {
    id: "gig-4",
    title: "UI/UX Wireframes Wanted for Smart Campus Laundry App",
    description: "Developing a mobile prototype for our software engineering course. We need 5-6 wireframe screens in Figma covering login, machine availability, and booking timer.",
    type: "Requesting",
    category: "Design",
    paymentType: "Paid",
    budget: 60,
    deadline: "2026-11-12",
    ownerId: "usr-5",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-15T11:45:00.000Z",
    tags: ["Figma", "Mobile UI", "Wireframing"]
  },
  // 5. Writing - Offering - Open
  {
    id: "gig-5",
    title: "Proofreading & APA/MLA Formatting for Term Papers",
    description: "Senior journalism editor offering detailed line-editing, grammar checks, academic voice tuning, and citations cross-checking for course term papers up to 15 pages.",
    type: "Offering",
    category: "Writing",
    paymentType: "Paid",
    budget: 30,
    deadline: "2026-11-30",
    ownerId: "usr-3",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-11T13:20:00.000Z",
    tags: ["Proofreading", "Academic Editing", "Citations"]
  },
  // 6. Writing - Requesting - Open
  {
    id: "gig-6",
    title: "Need Help Polishing Statement of Purpose for Grad School",
    description: "Applying for MS in Machine Learning and want a skilled writer to review my 2-page Statement of Purpose for narrative flow, clarity, and punchy impact.",
    type: "Requesting",
    category: "Writing",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-18",
    ownerId: "usr-7",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-16T10:10:00.000Z",
    tags: ["Grad School", "Statement of Purpose", "Review"]
  },
  // 7. Tutoring - Offering - Open
  {
    id: "gig-7",
    title: "Calculus I & II Crash Review Sessions Before Midterms",
    description: "Offering 90-minute 1-on-1 tutoring sessions covering limits, integration techniques, series convergence, and previous exam question walkthroughs.",
    type: "Offering",
    category: "Tutoring",
    paymentType: "Paid",
    budget: 25,
    deadline: "2026-11-10",
    ownerId: "usr-4",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-13T15:30:00.000Z",
    tags: ["Calculus", "Exam Prep", "Math"]
  },
  // 8. Tutoring - Requesting - Open
  {
    id: "gig-8",
    title: "Seeking Organic Chemistry Tutor for Reaction Mechanisms",
    description: "Struggling with electrophilic addition and SN1/SN2 mechanisms in Chem 202. Looking for someone patient to explain synth problems twice a week.",
    type: "Requesting",
    category: "Tutoring",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-28",
    ownerId: "usr-14",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-17T18:00:00.000Z",
    tags: ["Chemistry", "Organic Chem", "Mechanisms"]
  },
  // 9. Programming - Offering - In Progress
  {
    id: "gig-9",
    title: "Python Web Scraping & Data Cleaning Script Creation",
    description: "Offering to write automated scrapers using Beautiful Soup & Playwright, clean messy datasets, and export structured CSV/JSON for your research projects.",
    type: "Offering",
    category: "Programming",
    paymentType: "Paid",
    budget: 50,
    deadline: "2026-11-08",
    ownerId: "usr-7",
    status: "in_progress",
    acceptedApplicantId: "usr-8",
    createdAt: "2026-10-08T12:00:00.000Z",
    tags: ["Python", "Web Scraping", "Data Wrangling"]
  },
  // 10. Design - Requesting - In Progress
  {
    id: "gig-10",
    title: "Need Modern Slide Deck for Tech Startup Pitch Contest",
    description: "Our student team qualified for the university innovation showcase. We need a 10-slide polished pitch deck designed in Figma or Keynote.",
    type: "Requesting",
    category: "Design",
    paymentType: "Paid",
    budget: 70,
    deadline: "2026-11-04",
    ownerId: "usr-8",
    status: "in_progress",
    acceptedApplicantId: "usr-2",
    createdAt: "2026-10-09T08:45:00.000Z",
    tags: ["Pitch Deck", "Figma", "Presentation"]
  },
  // 11. Tutoring - Offering - In Progress
  {
    id: "gig-11",
    title: "1-on-1 Linear Algebra & Matrix Transformations Tutoring",
    description: "Offering weekly study drills on eigenvalues, eigenvectors, matrix diagonalizations, and vector spaces for CS and Math students.",
    type: "Offering",
    category: "Tutoring",
    paymentType: "Free",
    budget: 0,
    deadline: "2026-11-22",
    ownerId: "usr-4",
    status: "in_progress",
    acceptedApplicantId: "usr-5",
    createdAt: "2026-10-07T14:15:00.000Z",
    tags: ["Linear Algebra", "Free Tutoring", "Matrices"]
  },
  // 12. Writing - Offering - In Progress
  {
    id: "gig-12",
    title: "Resume & LinkedIn Profile Optimization for Tech Internships",
    description: "I will rewrite your software or design resume with bullet-point impact metrics and ATS keyword optimization to help you land summer 2027 interviews.",
    type: "Offering",
    category: "Writing",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-15",
    ownerId: "usr-3",
    status: "in_progress",
    acceptedApplicantId: "usr-1",
    createdAt: "2026-10-06T17:30:00.000Z",
    tags: ["Resume", "LinkedIn", "Career"]
  },
  // 13. Programming - Offering - Completed
  {
    id: "gig-13",
    title: "Build RESTful Express API with Authentication for Club Portal",
    description: "Built a complete Node/Express backend with user role management, SQLite integration, and documented endpoints for student society elections.",
    type: "Offering",
    category: "Programming",
    paymentType: "Paid",
    budget: 90,
    deadline: "2026-10-18",
    ownerId: "usr-1",
    status: "completed",
    acceptedApplicantId: "usr-6",
    createdAt: "2026-10-01T10:00:00.000Z",
    tags: ["Express", "Node.js", "REST API"]
  },
  // 14. Design - Requesting - Completed
  {
    id: "gig-14",
    title: "Design Vector Event Poster for Annual Hackathon",
    description: "Needed an eye-catching cyberpunk/space themed printable poster and digital banner for the campus hackathon promotional campaign.",
    type: "Requesting",
    category: "Design",
    paymentType: "Paid",
    budget: 80,
    deadline: "2026-10-19",
    ownerId: "usr-5",
    status: "completed",
    acceptedApplicantId: "usr-6",
    createdAt: "2026-10-02T11:20:00.000Z",
    tags: ["Poster", "Event", "Vector Illustration"]
  },
  // 15. Tutoring - Offering - Completed
  {
    id: "gig-15",
    title: "Physics I Mechanics & Kinematics Problem Solving Sessions",
    description: "Held three intensive 2-hour coaching sessions on rotational dynamics and energy conservation with step-by-step problem breakdowns.",
    type: "Offering",
    category: "Tutoring",
    paymentType: "Paid",
    budget: 40,
    deadline: "2026-10-15",
    ownerId: "usr-9",
    status: "completed",
    acceptedApplicantId: "usr-5",
    createdAt: "2026-10-01T09:00:00.000Z",
    tags: ["Physics", "Mechanics", "Tutoring"]
  },
  // 16. Writing - Requesting - Completed
  {
    id: "gig-16",
    title: "Copywriting for Sustainability Club Landing Page",
    description: "Needed punchy, engaging headlines and mission statements for our campus zero-waste initiative website.",
    type: "Requesting",
    category: "Writing",
    paymentType: "Free",
    budget: 0,
    deadline: "2026-10-16",
    ownerId: "usr-8",
    status: "completed",
    acceptedApplicantId: "usr-3",
    createdAt: "2026-10-03T13:40:00.000Z",
    tags: ["Copywriting", "Sustainability", "Web Content"]
  },
  // 17. Tutoring - Offering - Completed
  {
    id: "gig-17",
    title: "Organic Chemistry 101 Reaction Roadmaps and Quiz Prep",
    description: "Prepared custom reaction pathways diagrams and guided practice sessions for midterm review.",
    type: "Offering",
    category: "Tutoring",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-10-20",
    ownerId: "usr-12",
    status: "completed",
    acceptedApplicantId: "usr-14",
    createdAt: "2026-10-04T15:00:00.000Z",
    tags: ["Chemistry", "Organic Chem", "Roadmap"]
  },
  // 18. Programming - Requesting - Open
  {
    id: "gig-18",
    title: "Arduino Sensor Integration for Smart Greenhouse Prototype",
    description: "Need help wiring DHT22 temperature and soil moisture sensors to an ESP32 microcontroller and logging data via WiFi.",
    type: "Requesting",
    category: "Programming",
    paymentType: "Paid",
    budget: 55,
    deadline: "2026-11-24",
    ownerId: "usr-12",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-18T10:00:00.000Z",
    tags: ["IoT", "Arduino", "ESP32", "Hardware"]
  },
  // 19. Design - Offering - Open
  {
    id: "gig-19",
    title: "Professional Infographics & Data Visuals for Research Posters",
    description: "Transform complex tables and research findings into clean, publication-ready infographics for conferences and thesis presentations.",
    type: "Offering",
    category: "Design",
    paymentType: "Paid",
    budget: 40,
    deadline: "2026-11-29",
    ownerId: "usr-6",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-18T14:15:00.000Z",
    tags: ["Infographics", "Research", "Scientific Poster"]
  },
  // 20. Writing - Requesting - Open
  {
    id: "gig-20",
    title: "Technical Documentation for Campus Room Reservation Tool",
    description: "Looking for someone to write clear Markdown user manuals and API documentation for our newly deployed student booking portal.",
    type: "Requesting",
    category: "Writing",
    paymentType: "Paid",
    budget: 50,
    deadline: "2026-11-19",
    ownerId: "usr-13",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-19T09:30:00.000Z",
    tags: ["Technical Writing", "Documentation", "Markdown"]
  },
  // 21. Tutoring - Requesting - Open
  {
    id: "gig-21",
    title: "Need Linux Command Line & Bash Scripting Mentor",
    description: "Preparing for operating systems coursework. Want a hands-on guide through pipes, grep, sed, and writing automation scripts.",
    type: "Requesting",
    category: "Tutoring",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-21",
    ownerId: "usr-2",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-19T11:00:00.000Z",
    tags: ["Linux", "Bash", "OS", "Terminal"]
  },
  // 22. Programming - Offering - Open
  {
    id: "gig-22",
    title: "SQL Query Optimization & Database Schema Architecture",
    description: "I will review your PostgreSQL or MySQL database schema, normalize tables, write complex subqueries, and create performant indexes.",
    type: "Offering",
    category: "Programming",
    paymentType: "Paid",
    budget: 35,
    deadline: "2026-11-26",
    ownerId: "usr-1",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-19T13:45:00.000Z",
    tags: ["SQL", "PostgreSQL", "Database"]
  },
  // 23. Design - Offering - Open
  {
    id: "gig-23",
    title: "Free Figma 101 Coaching for Non-Designers",
    description: "Offering 45-minute crash courses to students wanting to learn the basics of Figma components, auto-layout, and prototypes for course projects.",
    type: "Offering",
    category: "Design",
    paymentType: "Free",
    budget: 0,
    deadline: "2026-12-01",
    ownerId: "usr-2",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T08:30:00.000Z",
    tags: ["Figma", "Coaching", "Free Workshop"]
  },
  // 24. Writing - Offering - Open
  {
    id: "gig-24",
    title: "Creative Storyboarding & Script Doctoring for Student Films",
    description: "Experienced scriptwriter available to review short film screenplays, enhance character dialogue, and structure narrative pacing.",
    type: "Offering",
    category: "Writing",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-27",
    ownerId: "usr-11",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T10:15:00.000Z",
    tags: ["Screenwriting", "Script Review", "Dialogue"]
  },
  // 25. Tutoring - Offering - Open
  {
    id: "gig-25",
    title: "Peer Tutoring in Discrete Math & Graph Theory",
    description: "Covering mathematical induction, logic gates, recurrence relations, trees, and graph traversal proofs before the final test.",
    type: "Offering",
    category: "Tutoring",
    paymentType: "Paid",
    budget: 20,
    deadline: "2026-11-23",
    ownerId: "usr-4",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T12:00:00.000Z",
    tags: ["Discrete Math", "Graph Theory", "Proofs"]
  },
  // 26. Programming - Requesting - Open
  {
    id: "gig-26",
    title: "Help Deploying Django Web Application to Railway/Heroku",
    description: "Completed a Django backend with PostgreSQL. Need assistance configuring environment variables, Gunicorn, and static files for live demo.",
    type: "Requesting",
    category: "Programming",
    paymentType: "Paid",
    budget: 40,
    deadline: "2026-11-14",
    ownerId: "usr-14",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T14:00:00.000Z",
    tags: ["Django", "DevOps", "Heroku", "Deployment"]
  },
  // 27. Design - Requesting - Open
  {
    id: "gig-27",
    title: "Need Custom Podcast Cover Art & Episode Template",
    description: "Launching a student interview podcast discussing university life and career paths. Need Spotify/Apple Podcasts square cover art.",
    type: "Requesting",
    category: "Design",
    paymentType: "Skill Swap",
    budget: 0,
    deadline: "2026-11-20",
    ownerId: "usr-11",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T16:00:00.000Z",
    tags: ["Podcast", "Cover Art", "Branding"]
  },
  // 28. Tutoring - Requesting - Open
  {
    id: "gig-28",
    title: "Looking for Intro to Microeconomics Problem Set Tutor",
    description: "Need help solving supply/demand elasticity, utility maximization, and perfect competition questions for Econ 101.",
    type: "Requesting",
    category: "Tutoring",
    paymentType: "Paid",
    budget: 25,
    deadline: "2026-11-16",
    ownerId: "usr-10",
    status: "open",
    acceptedApplicantId: null,
    createdAt: "2026-10-20T17:30:00.000Z",
    tags: ["Economics", "Microeconomics", "Tutoring"]
  }
];

const applications = [
  // Applications on gig-1 (open)
  {
    id: "app-1",
    gigId: "gig-1",
    applicantId: "usr-5",
    message: "Hi Alex! I need a clean portfolio for my hardware/software projects. Would love to work together.",
    status: "pending",
    createdAt: "2026-10-11T09:00:00.000Z"
  },
  {
    id: "app-2",
    gigId: "gig-1",
    applicantId: "usr-10",
    message: "Hey! I have a design ready and just need someone proficient with modern CSS and GitHub Pages.",
    status: "pending",
    createdAt: "2026-10-12T11:20:00.000Z"
  },

  // Applications on gig-2 (open)
  {
    id: "app-3",
    gigId: "gig-2",
    applicantId: "usr-1",
    message: "I have solved plenty of React render loop and Context issues. We can hop on Discord and fix this in 30 mins.",
    status: "pending",
    createdAt: "2026-10-14T14:00:00.000Z"
  },
  {
    id: "app-4",
    gigId: "gig-2",
    applicantId: "usr-7",
    message: "Happy to take a look at your React code. I also teach front-end basics at club workshops.",
    status: "pending",
    createdAt: "2026-10-15T10:00:00.000Z"
  },

  // Applications on gig-3 (open)
  {
    id: "app-5",
    gigId: "gig-3",
    applicantId: "usr-13",
    message: "Hey Maya, our CyberSecurity club needs a shield logo. I can trade Linux/Python scripts in return!",
    status: "pending",
    createdAt: "2026-10-13T13:00:00.000Z"
  },

  // Applications on gig-4 (open)
  {
    id: "app-6",
    gigId: "gig-4",
    applicantId: "usr-2",
    message: "I specialize in mobile app UX. The smart laundry app concept sounds super useful for dorms! I can deliver Figma frames quickly.",
    status: "pending",
    createdAt: "2026-10-15T16:30:00.000Z"
  },
  {
    id: "app-7",
    gigId: "gig-4",
    applicantId: "usr-6",
    message: "I have experience designing mobile prototypes and wireframes. Check out my design portfolio!",
    status: "pending",
    createdAt: "2026-10-16T08:15:00.000Z"
  },

  // Applications on gig-5 (open)
  {
    id: "app-8",
    gigId: "gig-5",
    applicantId: "usr-14",
    message: "I have a 12-page cognitive science research paper that needs strict APA formatting and flow checks.",
    status: "pending",
    createdAt: "2026-10-12T10:00:00.000Z"
  },

  // Applications on gig-6 (open)
  {
    id: "app-9",
    gigId: "gig-6",
    applicantId: "usr-3",
    message: "I love reviewing grad school essays! In exchange, I could use some help setting up a Python script for text analysis.",
    status: "pending",
    createdAt: "2026-10-17T09:40:00.000Z"
  },

  // Applications on gig-7 (open)
  {
    id: "app-10",
    gigId: "gig-7",
    applicantId: "usr-10",
    message: "Desperately need to prepare for the Calc II midterm next week. Looking forward to the 90 min session.",
    status: "pending",
    createdAt: "2026-10-14T11:00:00.000Z"
  },

  // Applications on gig-8 (open)
  {
    id: "app-11",
    gigId: "gig-8",
    applicantId: "usr-12",
    message: "I am a Chem lab mentor! I can break down reaction mechanisms step-by-step for you in exchange for psych survey design tips.",
    status: "pending",
    createdAt: "2026-10-18T10:15:00.000Z"
  },

  // Applications on gig-9 (in_progress)
  {
    id: "app-12",
    gigId: "gig-9",
    applicantId: "usr-8",
    message: "Need competitive analysis data scraped from 5 retail sites for our venture competition. Budget works great.",
    status: "accepted",
    createdAt: "2026-10-08T13:00:00.000Z"
  },
  {
    id: "app-13",
    gigId: "gig-9",
    applicantId: "usr-5",
    message: "Can you also scrape dynamic JavaScript content? Let me know.",
    status: "rejected",
    createdAt: "2026-10-08T15:00:00.000Z"
  },

  // Applications on gig-10 (in_progress)
  {
    id: "app-14",
    gigId: "gig-10",
    applicantId: "usr-2",
    message: "I have designed 3 winning pitch decks for collegiate hackathons and business challenges. Let's make this deck shine!",
    status: "accepted",
    createdAt: "2026-10-09T09:30:00.000Z"
  },
  {
    id: "app-15",
    gigId: "gig-10",
    applicantId: "usr-6",
    message: "Graphic designer here, happy to help build the slide deck in Canva or Illustrator.",
    status: "rejected",
    createdAt: "2026-10-09T10:00:00.000Z"
  },

  // Applications on gig-11 (in_progress)
  {
    id: "app-16",
    gigId: "gig-11",
    applicantId: "usr-5",
    message: "I need to understand eigenvalues for my robotics transform matrices. Really appreciate the free peer tutoring!",
    status: "accepted",
    createdAt: "2026-10-07T16:00:00.000Z"
  },

  // Applications on gig-12 (in_progress)
  {
    id: "app-17",
    gigId: "gig-12",
    applicantId: "usr-1",
    message: "Would love your resume critique before FAANG fall recruiting. I can help you build an interactive personal site in swap!",
    status: "accepted",
    createdAt: "2026-10-06T18:00:00.000Z"
  },

  // Applications on gig-13 (completed)
  {
    id: "app-18",
    gigId: "gig-13",
    applicantId: "usr-6",
    message: "We need an API backend for our design student showcase gallery. Ready to hire you!",
    status: "accepted",
    createdAt: "2026-10-01T12:00:00.000Z"
  },
  {
    id: "app-19",
    gigId: "gig-13",
    applicantId: "usr-10",
    message: "Interested in the backend gig if still available.",
    status: "rejected",
    createdAt: "2026-10-01T14:00:00.000Z"
  },

  // Applications on gig-14 (completed)
  {
    id: "app-20",
    gigId: "gig-14",
    applicantId: "usr-6",
    message: "I love cyber aesthetics! I can deliver high-res print PDFs and Instagram aspect ratios in 4 days.",
    status: "accepted",
    createdAt: "2026-10-02T13:00:00.000Z"
  },

  // Applications on gig-15 (completed)
  {
    id: "app-21",
    gigId: "gig-15",
    applicantId: "usr-5",
    message: "Need help solving torque and harmonic oscillator problems before the midterm.",
    status: "accepted",
    createdAt: "2026-10-01T10:30:00.000Z"
  },

  // Applications on gig-16 (completed)
  {
    id: "app-22",
    gigId: "gig-16",
    applicantId: "usr-3",
    message: "Passionate about climate advocacy! Happy to write the sustainability web copy for free.",
    status: "accepted",
    createdAt: "2026-10-03T14:30:00.000Z"
  },

  // Applications on gig-17 (completed)
  {
    id: "app-23",
    gigId: "gig-17",
    applicantId: "usr-14",
    message: "I need help with stereochemistry and chair conformations. I can help organize your study materials in return!",
    status: "accepted",
    createdAt: "2026-10-04T16:00:00.000Z"
  },

  // Application on gig-21 (open)
  {
    id: "app-24",
    gigId: "gig-21",
    applicantId: "usr-13",
    message: "Linux sysadmin here. I can tutor you in bash scripting in exchange for UI help on my security tools.",
    status: "pending",
    createdAt: "2026-10-19T14:00:00.000Z"
  }
];

const reviews = [
  // Reviews for gig-13 (Alex Rivera usr-1 owner, Elena Rostova usr-6 accepted applicant)
  {
    id: "rev-1",
    gigId: "gig-13",
    reviewerId: "usr-6", // applicant reviews owner Alex
    revieweeId: "usr-1",
    rating: 5,
    comment: "Alex is an incredible backend developer! Delivered the Express API ahead of schedule with clean docs and SQLite integration.",
    createdAt: "2026-10-18T16:00:00.000Z"
  },
  {
    id: "rev-2",
    gigId: "gig-13",
    reviewerId: "usr-1", // owner Alex reviews applicant Elena
    revieweeId: "usr-6",
    rating: 5,
    comment: "Elena was a fantastic client to work with. Very clear requirements, prompt feedback, and instant milestone approval.",
    createdAt: "2026-10-18T17:00:00.000Z"
  },

  // Reviews for gig-14 (Marcus Johnson usr-5 owner, Elena Rostova usr-6 accepted applicant)
  {
    id: "rev-3",
    gigId: "gig-14",
    reviewerId: "usr-5", // owner Marcus reviews applicant Elena
    revieweeId: "usr-6",
    rating: 5,
    comment: "The hackathon poster Elena designed blew everyone away! The typography and cyberpunk colors were top notch.",
    createdAt: "2026-10-19T18:00:00.000Z"
  },
  {
    id: "rev-4",
    gigId: "gig-14",
    reviewerId: "usr-6", // applicant Elena reviews owner Marcus
    revieweeId: "usr-5",
    rating: 4,
    comment: "Marcus provided great reference art and was very communicative throughout the revision rounds.",
    createdAt: "2026-10-19T19:30:00.000Z"
  },

  // Reviews for gig-15 (David Kim usr-9 owner, Marcus Johnson usr-5 accepted applicant)
  {
    id: "rev-5",
    gigId: "gig-15",
    reviewerId: "usr-5", // applicant Marcus reviews owner David
    revieweeId: "usr-9",
    rating: 5,
    comment: "David explains physics concepts with extreme clarity. Cleared up all my confusion with rotational dynamics in two sessions!",
    createdAt: "2026-10-15T18:00:00.000Z"
  },
  {
    id: "rev-6",
    gigId: "gig-15",
    reviewerId: "usr-9", // owner David reviews applicant Marcus
    revieweeId: "usr-5",
    rating: 5,
    comment: "Marcus was punctual, engaged, and worked through challenging problem sets with immense dedication.",
    createdAt: "2026-10-15T19:00:00.000Z"
  },

  // Reviews for gig-16 (Amina Al-Mansoor usr-8 owner, Liam O'Connor usr-3 accepted applicant)
  {
    id: "rev-7",
    gigId: "gig-16",
    reviewerId: "usr-8", // owner Amina reviews applicant Liam
    revieweeId: "usr-3",
    rating: 5,
    comment: "Liam's copywriting gave our sustainability initiative a fresh, inspiring voice. He delivered well before our launch deadline.",
    createdAt: "2026-10-16T17:00:00.000Z"
  },
  {
    id: "rev-8",
    gigId: "gig-16",
    reviewerId: "usr-3", // applicant Liam reviews owner Amina
    revieweeId: "usr-8",
    rating: 5,
    comment: "Loved working with Amina! Clear mission statement and vision made it easy to write engaging content.",
    createdAt: "2026-10-16T18:30:00.000Z"
  },

  // Reviews for gig-17 (Isabella Silva usr-12 owner, Zara Qureshi usr-14 accepted applicant)
  {
    id: "rev-9",
    gigId: "gig-17",
    reviewerId: "usr-14", // applicant Zara reviews owner Isabella
    revieweeId: "usr-12",
    rating: 5,
    comment: "Isabella's reaction roadmaps simplified weeks of organic chemistry lectures. Highly recommend her tutoring to anyone!",
    createdAt: "2026-10-20T19:00:00.000Z"
  },
  {
    id: "rev-10",
    gigId: "gig-17",
    reviewerId: "usr-12", // owner Isabella reviews applicant Zara
    revieweeId: "usr-14",
    rating: 4,
    comment: "Zara is a great study partner, took thorough notes, and shared excellent study structure templates.",
    createdAt: "2026-10-20T20:00:00.000Z"
  }
];

module.exports = {
  users,
  gigs,
  applications,
  reviews
};

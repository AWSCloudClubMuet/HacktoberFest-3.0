using CampusGigPortal.Models;

namespace CampusGigPortal.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any())
            {
                return; // Already seeded
            }

            // 1. Seed 14 Users
            var users = new List<User>
            {
                new User { Id = 1, Name = "Sarah Chen", Major = "Computer Science", Semester = "Semester 7", Bio = "Full-stack developer skilled in React, C# .NET, and Python. Love mentoring freshmen.", SkillsRaw = "C#, .NET, React, TypeScript, SQL Server, Python" },
                new User { Id = 2, Name = "Alex Rodriguez", Major = "Graphic Design", Semester = "Semester 5", Bio = "UI/UX enthusiast, Figma wizard, and illustrator for student organizations.", SkillsRaw = "Figma, Adobe Illustrator, Photoshop, UI/UX, Wireframing" },
                new User { Id = 3, Name = "Emily Watson", Major = "English & Communications", Semester = "Semester 6", Bio = "Editor-in-chief of campus journal. Passionate about essays and technical writing.", SkillsRaw = "Copyediting, Academic Writing, Proofreading, Research, Resume Review" },
                new User { Id = 4, Name = "Devin Patel", Major = "Mathematics & Statistics", Semester = "Semester 8", Bio = "Math tutor with 3 years of experience. Calculus, Linear Algebra, and Data Analysis.", SkillsRaw = "Calculus, Linear Algebra, Statistics, R, Python, MATLAB" },
                new User { Id = 5, Name = "Marcus Taylor", Major = "Software Engineering", Semester = "Semester 4", Bio = "Mobile developer (Flutter & Swift). Hackathon enthusiast looking for design collaborations.", SkillsRaw = "Flutter, Dart, Swift, Firebase, Mobile App Dev" },
                new User { Id = 6, Name = "Aisha Khan", Major = "Digital Marketing", Semester = "Semester 5", Bio = "Social media strategist, video editor for Reels/TikTok, and brand storytelling.", SkillsRaw = "Content Strategy, Premiere Pro, SEO, Canva, Social Media" },
                new User { Id = 7, Name = "Liam O'Connor", Major = "Computer Science", Semester = "Semester 3", Bio = "Cybersecurity club lead. Linux sysadmin, Docker, and backend Python/Go.", SkillsRaw = "Linux, Docker, Python, Go, Cybersecurity, Git" },
                new User { Id = 8, Name = "Chloe Kim", Major = "Industrial Design", Semester = "Semester 6", Bio = "3D modeling in Blender and SolidWorks. Product rendering and 3D printing mentor.", SkillsRaw = "Blender, 3D Modeling, SolidWorks, Rendering, Prototyping" },
                new User { Id = 9, Name = "Jordan Hayes", Major = "Economics & Finance", Semester = "Semester 7", Bio = "Financial modeling, advanced Excel macros, and introductory microeconomics tutor.", SkillsRaw = "Excel, Financial Modeling, PowerBI, Microeconomics, Statistics" },
                new User { Id = 10, Name = "Sofia Ramirez", Major = "Bioinformatics", Semester = "Semester 5", Bio = "Combining biology with computational scripting. Python data parsing and tutoring.", SkillsRaw = "Python, Biology Tutoring, Pandas, Data Visualization, BioPython" },
                new User { Id = 11, Name = "Ethan Brooks", Major = "Computer Science", Semester = "Semester 2", Bio = "Freshman hungry to learn web tech. Fast learner, eager to help with testing.", SkillsRaw = "HTML, CSS, JavaScript, Git, Python Basics" },
                new User { Id = 12, Name = "Maya Lin", Major = "Fine Arts & Animation", Semester = "Semester 7", Bio = "2D animator and character concept artist. Available for game jams and mascots.", SkillsRaw = "2D Animation, Procreate, Concept Art, Storyboarding, Illustration" },
                new User { Id = 13, Name = "Rohan Gupta", Major = "Data Science", Semester = "Semester 6", Bio = "Machine learning enthusiast, SQL query optimizer, and Kaggle competitor.", SkillsRaw = "SQL, Machine Learning, Scikit-Learn, PyTorch, Data Analysis" },
                new User { Id = 14, Name = "Jessica Bell", Major = "Physics", Semester = "Semester 4", Bio = "Physics problem-solver, lab report formatter, and calculus tutor.", SkillsRaw = "Physics, Mechanics, Calculus, LaTeX, Problem Solving" }
            };

            context.Users.AddRange(users);
            context.SaveChanges();

            var now = DateTime.Now;

            // 2. Seed 28 Gigs
            var gigs = new List<Gig>
            {
                new Gig { Id = 1, UserId = 1, Title = "Build a React + Node.js Student Club Portal", Description = "Looking for a student who can help implement a modern registration and event dashboard for the Robotics Club.", Type = "Requesting", Category = "Programming", PaymentType = "Paid", Budget = 150.00m, Deadline = now.AddDays(10), Status = "In Progress", AcceptedApplicantId = 5, CreatedAt = now.AddDays(-5) },
                new Gig { Id = 2, UserId = 5, Title = "iOS / Android App Debugging & Flutter Setup", Description = "Offering 3 hours of hands-on debugging for mobile app projects. Fix build issues and state management.", Type = "Offering", Category = "Programming", PaymentType = "SkillSwap", Budget = null, Deadline = now.AddDays(14), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-3) },
                new Gig { Id = 3, UserId = 7, Title = "Docker & Linux Server Deployment Help", Description = "I can containerize your semester project with Docker and deploy to a free-tier VPS with SSL. Free assistance for campus initiatives!", Type = "Offering", Category = "Programming", PaymentType = "Free", Budget = null, Deadline = now.AddDays(7), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-2) },
                new Gig { Id = 4, UserId = 11, Title = "Need Tutor for Data Structures & C++ Algorithms", Description = "Struggling with Binary Search Trees, Graphs, and DP before midterms. Need 4 sessions.", Type = "Requesting", Category = "Programming", PaymentType = "Paid", Budget = 80.00m, Deadline = now.AddDays(12), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-1) },
                new Gig { Id = 5, UserId = 13, Title = "SQL Database Optimization & Complex Queries", Description = "Offering consultation to optimize slow SQL queries and relational model design.", Type = "Offering", Category = "Programming", PaymentType = "Paid", Budget = 40.00m, Deadline = now.AddDays(20), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-4) },
                new Gig { Id = 6, UserId = 1, Title = "ASP.NET Core Web API Integration Help", Description = "Assisted in building clean REST APIs with JWT authentication for capstone project.", Type = "Offering", Category = "Programming", PaymentType = "Paid", Budget = 100.00m, Deadline = now.AddDays(-8), Status = "Completed", AcceptedApplicantId = 7, CreatedAt = now.AddDays(-25) },
                new Gig { Id = 7, UserId = 9, Title = "Automate Excel Data Pipeline with Python", Description = "Needed a Python script to merge 50 CSV survey results into an Excel report. Completed fast.", Type = "Requesting", Category = "Programming", PaymentType = "Paid", Budget = 50.00m, Deadline = now.AddDays(-15), Status = "Completed", AcceptedApplicantId = 1, CreatedAt = now.AddDays(-20) },

                new Gig { Id = 8, UserId = 2, Title = "Figma UI/UX Design for Mobile or Web Project", Description = "I will design interactive wireframes and clean mobile UI mockups in Figma.", Type = "Offering", Category = "Design", PaymentType = "Paid", Budget = 120.00m, Deadline = now.AddDays(15), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-4) },
                new Gig { Id = 9, UserId = 6, Title = "Need Logo & Brand Assets for Campus Hackathon", Description = "Looking for a creative designer to make a futuristic vector logo and banners for HackTheCampus.", Type = "Requesting", Category = "Design", PaymentType = "Paid", Budget = 75.00m, Deadline = now.AddDays(8), Status = "In Progress", AcceptedApplicantId = 2, CreatedAt = now.AddDays(-6) },
                new Gig { Id = 10, UserId = 12, Title = "2D Character Illustrations & Stickers", Description = "Offering custom digital illustrations and club mascots. Will exchange for audio editing or Python scripting!", Type = "Offering", Category = "Design", PaymentType = "SkillSwap", Budget = null, Deadline = now.AddDays(18), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-2) },
                new Gig { Id = 11, UserId = 8, Title = "3D CAD Modeling & 3D Print File Preparation", Description = "Can help mechanical engineering students turn sketches into printable STL/STEP models.", Type = "Offering", Category = "Design", PaymentType = "Paid", Budget = 60.00m, Deadline = now.AddDays(11), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-3) },
                new Gig { Id = 12, UserId = 4, Title = "Infographic Design for Mathematics Presentation", Description = "Needed visually engaging charts explaining Bayesian Statistics for conference poster.", Type = "Requesting", Category = "Design", PaymentType = "Paid", Budget = 45.00m, Deadline = now.AddDays(-10), Status = "Completed", AcceptedApplicantId = 2, CreatedAt = now.AddDays(-18) },
                new Gig { Id = 13, UserId = 10, Title = "Poster Design for Environmental Action Week", Description = "Need printable high-res A2 posters to raise awareness for campus recycling drives. Free volunteer.", Type = "Requesting", Category = "Design", PaymentType = "Free", Budget = null, Deadline = now.AddDays(5), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-1) },
                new Gig { Id = 14, UserId = 2, Title = "Slide Deck Redesign for Startup Pitch", Description = "Pitch deck redesign finished with high praise. Clean modern typography.", Type = "Offering", Category = "Design", PaymentType = "Paid", Budget = 90.00m, Deadline = now.AddDays(-12), Status = "Completed", AcceptedApplicantId = 9, CreatedAt = now.AddDays(-24) },

                new Gig { Id = 15, UserId = 3, Title = "Comprehensive Resume & Cover Letter Polish", Description = "Get your tech or business internship application reviewed with ATS keyword optimization.", Type = "Offering", Category = "Writing", PaymentType = "Paid", Budget = 35.00m, Deadline = now.AddDays(16), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-5) },
                new Gig { Id = 16, UserId = 14, Title = "Proofreading for Capstone Research Paper (LaTeX)", Description = "Need someone experienced in academic writing to review a 12-page research draft in physics.", Type = "Requesting", Category = "Writing", PaymentType = "Paid", Budget = 65.00m, Deadline = now.AddDays(9), Status = "In Progress", AcceptedApplicantId = 3, CreatedAt = now.AddDays(-7) },
                new Gig { Id = 17, UserId = 6, Title = "Ghostwriting Blog Posts & Campus Newsletter Articles", Description = "Offering engaging 800-word articles on student life or campus tech trends.", Type = "Offering", Category = "Writing", PaymentType = "SkillSwap", Budget = null, Deadline = now.AddDays(12), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-3) },
                new Gig { Id = 18, UserId = 1, Title = "Need Technical Documentation Writer for Open Source Tool", Description = "Looking for a student to write developer-friendly README guides and API docs.", Type = "Requesting", Category = "Writing", PaymentType = "Paid", Budget = 85.00m, Deadline = now.AddDays(14), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-2) },
                new Gig { Id = 19, UserId = 3, Title = "Grad School Statement of Purpose Editing", Description = "Helped senior student edit and tighten their MS Computer Science SOP for Stanford.", Type = "Offering", Category = "Writing", PaymentType = "Paid", Budget = 50.00m, Deadline = now.AddDays(-14), Status = "Completed", AcceptedApplicantId = 4, CreatedAt = now.AddDays(-28) },
                new Gig { Id = 20, UserId = 5, Title = "App Store Description & Release Notes Writing", Description = "Needed concise, engaging copy for an indie app release on Google Play.", Type = "Requesting", Category = "Writing", PaymentType = "SkillSwap", Budget = null, Deadline = now.AddDays(-20), Status = "Completed", AcceptedApplicantId = 3, CreatedAt = now.AddDays(-32) },
                new Gig { Id = 21, UserId = 11, Title = "Help with English Literature Essay Drafting", Description = "Looking for advice on organizing thesis arguments and textual quotes for Shakespeare critique.", Type = "Requesting", Category = "Writing", PaymentType = "Free", Budget = null, Deadline = now.AddDays(4), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-1) },

                new Gig { Id = 22, UserId = 4, Title = "Calculus II & Multivariate Calculus Tutoring", Description = "Offering weekly tutoring for Series, Polar Coordinates, and Double/Triple Integrals.", Type = "Offering", Category = "Tutoring", PaymentType = "Paid", Budget = 30.00m, Deadline = now.AddDays(25), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-6) },
                new Gig { Id = 23, UserId = 14, Title = "Physics 101 Mechanics & Thermodynamics Review", Description = "Offering review sessions for first-year engineering students preparing for midterms.", Type = "Offering", Category = "Tutoring", PaymentType = "SkillSwap", Budget = null, Deadline = now.AddDays(15), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-3) },
                new Gig { Id = 24, UserId = 9, Title = "Need Tutor for Advanced Corporate Finance", Description = "Seeking someone who scored A in Finance 302 to clarify DCF valuation models before Thursday.", Type = "Requesting", Category = "Tutoring", PaymentType = "Paid", Budget = 55.00m, Deadline = now.AddDays(6), Status = "In Progress", AcceptedApplicantId = 4, CreatedAt = now.AddDays(-4) },
                new Gig { Id = 25, UserId = 10, Title = "General Biology & Genetics Crash Course", Description = "Offering 2-hour crash courses explaining DNA replication and Mendelian genetics.", Type = "Offering", Category = "Tutoring", PaymentType = "Free", Budget = null, Deadline = now.AddDays(10), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-2) },
                new Gig { Id = 26, UserId = 7, Title = "Introduction to Linux Command Line & Bash Scripting", Description = "Completed 1-on-1 walkthrough of terminal navigation, pipes, grep, sed, and bash.", Type = "Offering", Category = "Tutoring", PaymentType = "Paid", Budget = 40.00m, Deadline = now.AddDays(-6), Status = "Completed", AcceptedApplicantId = 11, CreatedAt = now.AddDays(-16) },
                new Gig { Id = 27, UserId = 8, Title = "Old Semester 3D Printing Workshop Prep", Description = "Assistance was requested last month for setting up filament printers. Deadline passed.", Type = "Requesting", Category = "Design", PaymentType = "Paid", Budget = 50.00m, Deadline = now.AddDays(-10), Status = "Open", AcceptedApplicantId = null, CreatedAt = now.AddDays(-30) },
                new Gig { Id = 28, UserId = 2, Title = "Web Banner Animation for Dorm Party", Description = "The event was called off by administration, so this gig was cancelled by poster.", Type = "Offering", Category = "Design", PaymentType = "Free", Budget = null, Deadline = now.AddDays(2), Status = "Cancelled", AcceptedApplicantId = null, CreatedAt = now.AddDays(-7) }
            };

            context.Gigs.AddRange(gigs);
            context.SaveChanges();

            // 3. Seed 24 Applications
            var applications = new List<Application>
            {
                new Application { Id = 1, GigId = 1, ApplicantId = 5, Message = "Hey Sarah! I have built 3 Flutter and React portals with backend APIs. Would love to take this on!", Status = "Accepted", CreatedAt = now.AddDays(-4) },
                new Application { Id = 2, GigId = 1, ApplicantId = 7, Message = "I can handle the backend and deployment if needed, let me know!", Status = "Rejected", CreatedAt = now.AddDays(-4) },
                new Application { Id = 3, GigId = 1, ApplicantId = 13, Message = "Experienced with SQL databases and full stack React apps. Available immediately.", Status = "Rejected", CreatedAt = now.AddDays(-3) },
                new Application { Id = 2, GigId = 2, ApplicantId = 1, Message = "Would love to swap for some advanced .NET backend mentoring if you are interested!", Status = "Pending", CreatedAt = now.AddDays(-2) },
                new Application { Id = 5, GigId = 2, ApplicantId = 11, Message = "I have a buggy Flutter setup on my Mac, really need your guidance!", Status = "Pending", CreatedAt = now.AddDays(-1) },
                new Application { Id = 6, GigId = 4, ApplicantId = 1, Message = "I was a TA for CS201 Data Structures last year. We can set up practice sessions.", Status = "Pending", CreatedAt = now.AddDays(-1) },
                new Application { Id = 7, GigId = 4, ApplicantId = 4, Message = "Can explain algorithm complexity and tree traversals with visual proofs.", Status = "Pending", CreatedAt = now.AddHours(-12) },
                new Application { Id = 8, GigId = 8, ApplicantId = 5, Message = "I am building a campus ride-share app and need a cohesive design system in Figma.", Status = "Pending", CreatedAt = now.AddDays(-3) },
                new Application { Id = 9, GigId = 8, ApplicantId = 10, Message = "Need a modern web UI for our lab gene browser tool.", Status = "Pending", CreatedAt = now.AddDays(-2) },
                new Application { Id = 10, GigId = 9, ApplicantId = 2, Message = "I specialize in tech branding and hackathon collateral. Attached my portfolio link!", Status = "Accepted", CreatedAt = now.AddDays(-5) },
                new Application { Id = 11, GigId = 9, ApplicantId = 12, Message = "Can draw awesome mascot characters for the hackathon theme.", Status = "Rejected", CreatedAt = now.AddDays(-5) },
                new Application { Id = 12, GigId = 10, ApplicantId = 6, Message = "I can edit your art process videos for YouTube and TikTok in exchange for mascot art!", Status = "Pending", CreatedAt = now.AddDays(-1) },
                new Application { Id = 13, GigId = 11, ApplicantId = 14, Message = "Have a sensor mount for our optics experiment that needs 3D printing.", Status = "Pending", CreatedAt = now.AddDays(-2) },
                new Application { Id = 14, GigId = 15, ApplicantId = 7, Message = "Applying for cybersecurity summer analyst positions and need my resume reviewed.", Status = "Pending", CreatedAt = now.AddDays(-3) },
                new Application { Id = 15, GigId = 15, ApplicantId = 9, Message = "Looking for feedback on my investment banking resume formatting.", Status = "Pending", CreatedAt = now.AddDays(-2) },
                new Application { Id = 16, GigId = 16, ApplicantId = 3, Message = "I have edited several physics and engineering honors theses. Happy to review LaTeX.", Status = "Accepted", CreatedAt = now.AddDays(-6) },
                new Application { Id = 17, GigId = 16, ApplicantId = 6, Message = "Can assist with formatting and grammatical flow.", Status = "Rejected", CreatedAt = now.AddDays(-6) },
                new Application { Id = 18, GigId = 18, ApplicantId = 3, Message = "Technical writing is right up my alley. I can create clear markdown docs and diagrams.", Status = "Pending", CreatedAt = now.AddHours(-18) },
                new Application { Id = 19, GigId = 22, ApplicantId = 11, Message = "Preparing for my Calc II exam, definitely need 2 hours of coaching.", Status = "Pending", CreatedAt = now.AddDays(-2) },
                new Application { Id = 20, GigId = 22, ApplicantId = 10, Message = "Want to brush up on differential equations for biostatistics.", Status = "Pending", CreatedAt = now.AddDays(-1) },
                new Application { Id = 21, GigId = 24, ApplicantId = 4, Message = "I have taught financial mathematics and stochastic calculus. Ready to assist!", Status = "Accepted", CreatedAt = now.AddDays(-3) },
                new Application { Id = 22, GigId = 6, ApplicantId = 7, Message = "Proficient with ASP.NET Core and ready to dive into the API architecture.", Status = "Accepted", CreatedAt = now.AddDays(-24) },
                new Application { Id = 23, GigId = 7, ApplicantId = 1, Message = "Can write this pandas automation script within an afternoon.", Status = "Accepted", CreatedAt = now.AddDays(-19) },
                new Application { Id = 24, GigId = 12, ApplicantId = 2, Message = "I will turn your stats data into crisp vector infographics.", Status = "Accepted", CreatedAt = now.AddDays(-17) }
            };

            context.Applications.AddRange(applications);
            context.SaveChanges();

            // 4. Seed 10 Reviews
            var reviews = new List<Review>
            {
                new Review { Id = 1, GigId = 6, ReviewerId = 1, RevieweeId = 7, Rating = 5, Comment = "Liam was an incredible collaborator! He had deep knowledge of backend architecture and delivered well ahead of time.", CreatedAt = now.AddDays(-7) },
                new Review { Id = 2, GigId = 6, ReviewerId = 7, RevieweeId = 1, Rating = 5, Comment = "Sarah is super clear with requirements and provided instant feedback. A pleasure to work with!", CreatedAt = now.AddDays(-7) },
                new Review { Id = 3, GigId = 7, ReviewerId = 9, RevieweeId = 1, Rating = 5, Comment = "Sarah wrote a flawless Python automation script that saved me 10 hours of manual work. Highly recommended!", CreatedAt = now.AddDays(-14) },
                new Review { Id = 4, GigId = 7, ReviewerId = 1, RevieweeId = 9, Rating = 5, Comment = "Jordan provided very clear sample spreadsheets and paid promptly upon completion.", CreatedAt = now.AddDays(-14) },
                new Review { Id = 5, GigId = 12, ReviewerId = 4, RevieweeId = 2, Rating = 5, Comment = "Alex transformed my rough statistical equations into conference-ready, publication-grade infographics!", CreatedAt = now.AddDays(-9) },
                new Review { Id = 6, GigId = 12, ReviewerId = 2, RevieweeId = 4, Rating = 5, Comment = "Devin explained the mathematical concepts patiently so I could visualize them accurately. Great client!", CreatedAt = now.AddDays(-9) },
                new Review { Id = 7, GigId = 14, ReviewerId = 2, RevieweeId = 9, Rating = 4, Comment = "Jordan was thorough with his feedback on the pitch deck revisions. Smooth collaboration overall.", CreatedAt = now.AddDays(-11) },
                new Review { Id = 8, GigId = 14, ReviewerId = 9, RevieweeId = 2, Rating = 5, Comment = "The redesigned pitch deck won us second place in the campus venture competition! Exceptional design skills.", CreatedAt = now.AddDays(-11) },
                new Review { Id = 9, GigId = 19, ReviewerId = 3, RevieweeId = 4, Rating = 5, Comment = "Devin has impressive academic credentials and applied every suggestion with precision.", CreatedAt = now.AddDays(-13) },
                new Review { Id = 10, GigId = 26, ReviewerId = 7, RevieweeId = 11, Rating = 5, Comment = "Ethan was enthusiastic, took comprehensive notes on Linux shell scripting, and asked great questions.", CreatedAt = now.AddDays(-5) }
            };

            context.Reviews.AddRange(reviews);
            context.SaveChanges();
        }
    }
}
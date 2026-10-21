# Campus Gig & SkillSwap Portal

A student-focused peer-to-peer marketplace for university campuses.

## 1. Project Overview

The **Campus Gig & SkillSwap Portal** is a web application designed to connect university students through skills, services, and collaborative opportunities.

Students can register, create profiles, offer services, request assistance, and exchange skills within their campus community. Whether someone needs programming help, academic tutoring, graphic design, writing assistance, or technical collaboration, the platform provides a central place to connect with other students.

The platform supports paid gigs, skill exchanges, and free volunteer assistance. It also provides application management, gig progress tracking, and a mutual review system to help students build their campus reputation.

## 2. Objectives

- Create a centralized marketplace for student services and opportunities.
- Encourage peer-to-peer learning and collaboration.
- Help students earn through their skills and discover opportunities.
- Support skill exchanges without requiring direct payment.
- Build trust through student profiles, ratings, and reviews.
- Simplify the process of finding help and collaborating on campus.

## 3. Key Features

### 3.1 Student Registration and Profile Management

- Register new student users.
- Create and manage student profiles.
- Add information such as name, department, semester, bio, and skills.
- Browse the student directory to discover peers with relevant skills.
- View student ratings, activity statistics, active gigs, and completed work.
- Explore reviews received from other students.

### 3.2 Gig Marketplace

Students can publish two types of listings:

- **Offering:** A student advertises a service they can provide.
- **Requesting:** A student requests assistance with a task or service.

The platform supports three compensation models:

- **Paid:** Students set a budget for the requested service.
- **SkillSwap:** Students exchange skills without direct payment.
- **Free:** Students offer or request volunteer assistance.

Gig categories include Programming, Design, Writing, Tutoring, and Other.

### 3.3 Search, Filtering, and Sorting

- Search by gig title, description, and required skills.
- Filter by category, gig type, payment model, status, and budget range.
- Sort listings by newest, deadline urgency, or budget.
- Reset filters to return to the full marketplace.

### 3.4 Gig Lifecycle Management

Gigs follow a defined workflow:

`Open → In Progress → Completed`

Gigs may also be cancelled or expire when appropriate.

- Display progress through a visual status stepper.
- Allow owners to manage their gig listings.
- Validate deadlines and prevent invalid status transitions.
- Restrict modifications to completed or cancelled gigs.

### 3.5 Application Management

- Apply to gigs using a custom message or pitch.
- Include portfolio or contact links with applications.
- Prevent users from applying to their own gigs.
- Prevent duplicate applications to the same gig.
- Allow gig owners to accept or reject applicants.
- Automatically move a gig to `In Progress` when an applicant is accepted.
- Automatically reject other pending applications after selection.
- Prevent new applications once a gig is no longer open.

### 3.6 Reviews and Ratings

- Enable reviews after a gig is completed.
- Allow the gig owner and accepted applicant to review each other.
- Prevent duplicate reviews.
- Restrict reviews to eligible participants.
- Calculate profile ratings and completed-gig statistics dynamically.

### 3.7 Demo User Switcher

- Switch between 14 pre-seeded student personas.
- Explore different student profiles and departments.
- Test multi-user workflows without configuring separate demo accounts.
- Demonstrate gig creation, applications, applicant selection, and reviews.

The demo user switcher is intended for demonstration and testing. It is separate from the student registration feature.

## 4. Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 18, Vite 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| API Communication | REST API |
| Data Storage | JSON file-based persistence |
| Testing | Automated API integration tests |

## 5. Project Structure

```text
Campus Gig & SkillSwap Portal/
├── package.json
├── dev-runner.js
├── tests/
│   └── api.test.js
├── server/
│   ├── package.json
│   ├── index.js
│   ├── storage.js
│   └── data/
│       ├── users.json
│       ├── gigs.json
│       ├── applications.json
│       └── reviews.json
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/
        │   └── api.js
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        └── pages/
```

## 6. Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) version 18 or later.
- npm version 9 or later.

### Step 1: Navigate to the Project Directory

From the repository root, run:

```bash
cd submission/team_shenova
```

### Step 2: Install Dependencies

Run the project's combined installation command:

```bash
npm run install:all
```

If the combined command is unavailable, install dependencies individually:

```bash
npm install

cd server
npm install

cd ../client
npm install
```

### Step 3: Start the Application

Return to the project root if necessary, then run:

```bash
npm run dev
```

The expected local addresses are:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

The actual frontend port depends on the Vite configuration and available ports.

### Step 4: Run the Tests

From the project root, run:

```bash
npm test
```

The automated test suite covers API availability, seed data, profile operations, gig creation, filtering, application validation, status transitions, reviews, and persistence.

## 7. REST API Documentation

**Base URL:** `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |
| POST | `/seed/reset` | Reset the initial seed data |
| GET | `/users` | Retrieve student profiles |
| POST | `/users` | Create a student profile |
| GET | `/users/:id` | Retrieve a student profile and statistics |
| GET | `/gigs` | Retrieve and filter gigs |
| POST | `/gigs` | Create a gig |
| GET | `/gigs/:id` | Retrieve gig details |
| PUT | `/gigs/:id` | Update gig details |
| PATCH | `/gigs/:id/status` | Update gig status |
| DELETE | `/gigs/:id` | Delete a gig |
| GET | `/applications` | Retrieve applications |
| POST | `/applications` | Submit an application |
| PATCH | `/applications/:id/status` | Accept or reject an application |
| GET | `/reviews` | Retrieve reviews |
| POST | `/reviews` | Submit a review |

### Supported Query Parameters

The gigs endpoint supports filtering options such as:

- `category`
- `search`
- `type`
- `status`
- `payment_type`
- `sort`

Applications and reviews also support optional query parameters. Refer to the backend route handlers for the exact supported values and behavior.

## 8. Validation and Business Rules

The application enforces important rules to maintain consistent gig and application workflows.

1. **Registration validation:** Student profiles must satisfy the applicable input validation rules.
2. **Self-application prevention:** Users cannot apply to their own gigs.
3. **Duplicate application prevention:** Users cannot submit multiple applications to the same gig.
4. **Owner authorization:** Restricted gig-management actions are limited to the gig owner.
5. **Deadline validation:** Past deadlines are rejected.
6. **Budget validation:** Paid gigs require a positive numeric budget.
7. **Status validation:** Invalid gig status transitions are rejected.
8. **Review eligibility:** Only the owner and accepted applicant can review each other after completion.
9. **Duplicate-review prevention:** Participants cannot submit duplicate reviews for the same gig and reviewee.
10. **Rating validation:** Ratings must be integers between 1 and 5.

**Authentication note:** Student registration and profile creation should not be interpreted as secure identity verification unless the implementation includes appropriate authentication controls. The demo user switcher is intended for testing and demonstration, not production security.

## 9. Known Limitations and Future Improvements

Potential improvements include:

- Secure authentication and university email verification.
- University single sign-on integration.
- Real-time messaging between students.
- Secure online payment integration.
- Migration from JSON files to a database such as PostgreSQL.
- Deployment with environment-based configuration and monitoring.
- Automated continuous integration and deployment.
- Further accessibility and mobile usability improvements.

## 10. Testing

Run the automated test suite using:

```bash
npm test
```

Before submitting, verify that:

- The frontend starts successfully.
- The backend API responds correctly.
- Student registration and profile creation work as expected.
- Gig creation, searching, filtering, and applications work.
- Applicant selection triggers the correct status transitions.
- Review permissions and duplicate-review prevention work.
- Data persists correctly after storage reloads.
- The frontend production build completes successfully.

Report the actual test results from the latest run rather than relying on previously recorded test counts.

## 11. Project Information

- **Project Name:** Campus Gig & SkillSwap Portal
- **Developer:** Zainab Muhammad
- **Team:** SheNova
- **Event:** AWS Cloud Club MUET — HacktoberFest 3.0 (2026)
- **Branch:** `team_shenova`
- **Submission Directory:** `submission/team_shenova/`
- **Repository:** [AWSCloudClubMuet/HacktoberFest-3.0](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0)

## 12. Acknowledgements

We thank AWS Cloud Club MUET for organizing HacktoberFest 3.0 and providing an opportunity to learn, collaborate, and develop practical software solutions.

---

*Connecting campus talent with opportunities, one skill at a time.*

Campus Gig & SkillSwap Portal
A full-stack campus platform where students can post small gigs, offer
or request skills, apply to opportunities, manage work progress, and
build reputation through mutual reviews.

The project is organized as a React + Vite frontend and a FastAPI
backend using SQLAlchemy and SQLite.
Table of Contents
- Overview
- Features
- Technology Stack
- Project Structure
- Prerequisites
- Getting Started
  - 1. Run the Backend
  - 2. Run the Frontend
- Using the Application
- Core Workflow and Rules
- API Documentation
- Seed Data
- Troubleshooting
- Future Improvements
Overview
Campus Gig & SkillSwap Portal helps students collaborate around campus
by sharing short-term work and exchanging skills. A student can publish
a gig, apply to another student's gig, select an applicant, track
progress, and leave a review when the work is completed.

The platform supports paid gigs, free help, and skill swaps, making it
useful for both paid opportunities and peer-to-peer learning.
Features
Student Profiles
- Create and update a student profile.
- Add a name, academic/major information, bio, and skills.
- View profiles, posted gigs, and reputation information.
Gig Creation and Discovery
- Publish gigs with a title, description, category, gig type, payment
  type, budget where applicable, and deadline.
- Browse gigs and search/filter listings.
- Support for categories such as Programming, Design, Writing, and
  Tutoring.
- Distinguish between offering a service and requesting a service.
Applications and Selection
- Apply to a gig with an application message.
- Track your submitted applications and their statuses.
- Prevent duplicate applications and applying to your own gig.
- Allow the gig owner to review applicants and make a selection.
Work Progress
- Track gig progress through statuses such as Open, In Progress,
  Completed, and Expired.
- Accepting an applicant closes the opportunity to additional
  applications and updates other pending applications accordingly.
- Only the gig owner can manage the gig and its applicants.
Reviews and Reputation
- Support mutual reviews after a gig is completed.
- Reviewers can provide a rating from 1 to 5 and a written comment.
- Prevent a reviewer from submitting more than one review for the same
  gig.
- Display reputation based on stored reviews.
Seed/Demo Data
- The backend includes a seed-data module to help populate the
  application with sample users, gigs, applications, and reviews for
  development and demonstration.
Technology Stack
  Layer                                  Technology
  Frontend                               React, Vite, JavaScript/JSX, CSS
  Frontend routing                       React Router
  Backend API                            FastAPI
  Data validation                        Pydantic
  ORM                                    SQLAlchemy
  Database                               SQLite
  Python project/dependency management   uv / pyproject.toml
Project Structure
Campus_Gig/
├── MILESTONE_4_5_IMPLEMENTATION.md
├── .gitignore
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── deps.py
│   ├── enums.py
│   ├── models.py
│   ├── schemas.py
│   ├── services.py
│   ├── seed_data.py
│   ├── make_expired.py
│   ├── pyproject.toml
│   └── routers/
│       ├── users.py
│       ├── gigs.py
│       ├── applications.py
│       └── reviews.py
└── frontend/
    └── vite-project/
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── main.jsx
            ├── api.jsx
            ├── UserContext.jsx
            ├── components/
            ├── pages/
            └── styles/
Prerequisites
Install the following before running the project:
- Python compatible with the backend's pyproject.toml
- uv for Python dependency management (or use the package manager
  already configured for the backend)
- Node.js and npm
- Git (optional, for cloning the repository)
Check your installed versions:
python --version
uv --version
node --version
npm --version
Getting Started
Run the backend and frontend in separate terminal windows.
1. Run the Backend
Open PowerShell and navigate to the backend directory:
cd "Campus_Gig\backend"
Install/synchronize the backend dependencies using uv:
uv sync
Start the FastAPI development server:
uv run uvicorn main:app --reload
If uvicorn is not available through the project's configured
dependencies, install it in the backend environment and retry:
uv add uvicorn
uv run uvicorn main:app --reload
The backend should be available at:
- API base: http://127.0.0.1:8000
- Interactive Swagger documentation: http://127.0.0.1:8000/docs
- ReDoc documentation: http://127.0.0.1:8000/redoc
Keep this terminal running while using the frontend.
Database note: The project uses SQLite. The database is managed by
the backend code. Do not commit local database files containing
development data; use the seed-data module when you need reproducible
demo data.

2. Run the Frontend
Open a second PowerShell terminal and navigate to the Vite
application:
cd "Campus_Gig\frontend\vite-project"
Install JavaScript dependencies:
npm install
Start the Vite development server:
npm run dev
Vite prints a local URL in the terminal, commonly
http://localhost:5173. Open the exact URL it prints in your browser.

Keep both terminals running: the frontend serves the user interface,
while the backend handles API requests and database operations.
Connecting the Frontend to the Backend
The frontend API helper is located at
frontend/vite-project/src/api.jsx. If API requests fail, check the API
base URL configured in that file and make sure it points to the running
backend, normally http://127.0.0.1:8000. Also check the backend's CORS
configuration if the browser reports a cross-origin request error.
Using the Application
1. Open the frontend URL printed by Vite.
2. Continue with an existing demo user or create a student profile,
   depending on the options shown by the application.
3. Browse gigs and use the available search/filter controls.
4. Open a gig to view its details and apply if eligible.
5. Create your own gig to request help or offer a skill.
6. Use the application and gig management screens to review applicants
   and track work.
7. After a gig is completed, use the review section to submit feedback
   when eligible.
Exact screen labels and available actions depend on the current
application state and the logged-in demo user.
Core Workflow and Rules
A typical gig workflow is:
1. A student creates a profile.
2. A student publishes a gig.
3. Other eligible students submit applications.
4. The gig owner reviews applicants and accepts one.
5. The gig moves into progress and new applications are closed.
6. The work is marked completed.
7. Eligible participants leave mutual reviews.
The backend should enforce the relevant ownership and workflow rules
rather than relying only on frontend controls. Examples include
preventing duplicate applications, preventing applications to one's own
gig, restricting applicant management to the gig owner, and limiting
reviews to eligible participants after completion.
API Documentation
FastAPI provides interactive API documentation when the backend is
running:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
The code is organized into routers for users, gigs, applications, and
reviews. Use the interactive documentation to inspect the exact request
fields, response schemas, and available endpoints in the current
version.

The project supports the following main API operations:
  Area                                Typical operations
  Users                               List and retrieve users; create or
                                      update a profile

  Gigs                                List/search gigs; create a gig;
                                      retrieve details; update gig status

  Applications                        Submit an application; list a
                                      user's applications; manage
                                      applications as the gig owner

  Reviews                             Submit and retrieve reviews for
                                  completed gigs
Refer to the running API documentation for the authoritative endpoint
paths and schemas.
Seed Data
The backend includes seed_data.py for creating sample data for local
development and demonstrations. Check the file's instructions before
running it:
cd "Campus_Gig\backend"
Get-Content .\seed_data.py
Run the seed command documented in that file. If the script defines a
callable function rather than a command-line entry point, invoke it
using the method shown in the script. Back up any local database first
if you need to preserve existing development data.
Troubleshooting
uv is not recognized
Install uv and reopen PowerShell, then verify:
uv --version
uv sync fails
Make sure the terminal is in the backend directory and that
pyproject.toml exists. Read the error message to identify missing
dependencies or Python-version requirements.
uvicorn is not found
Use the project's environment and install it if needed:
uv add uvicorn
uv run uvicorn main:app --reload
npm or vite is not recognized
Make sure Node.js is installed, then run npm install from
frontend/vite-project. Start the app with npm run dev.
The frontend cannot reach the API
- Confirm the backend is running at http://127.0.0.1:8000.
- Check the API base URL in src/api.jsx.
- Review the browser console and backend terminal for errors.
- Check CORS settings if the browser reports a cross-origin error.
A database or demo-data issue occurs
Check database.py, seed_data.py, and the backend terminal output.
Avoid deleting the SQLite database unless you are comfortable losing
local development data.
Future Improvements
Potential extensions for the project include:
- Automated backend and frontend tests.
- Improved accessibility and responsive UI checks.
- Pagination and richer discovery filters.
- Production database configuration and migrations.
- Deployment configuration and environment-specific settings.
- Additional moderation and reporting workflows.
Project Documentation
See [`MILESTONE_4_5_IMPLEMENTATION.md`](MILESTONE_4_5_IMPLEMENTATION.md)
for the project's Milestone 4 and 5 implementation notes.
Campus Gig & SkillSwap Portal --- helping students find
opportunities, exchange skills, and build a campus community.

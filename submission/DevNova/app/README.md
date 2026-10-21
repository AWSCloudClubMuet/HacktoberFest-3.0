# DevNova — Campus Gig & SkillSwap Portal

## Team Name
**DevNova**

## Project Description
DevNova is a Campus Gig & SkillSwap Portal designed to connect students who want to offer their skills with students who need help with different tasks. The platform allows students to discover gigs, create their own gigs, apply for opportunities, and collaborate with other students.

The portal supports paid gigs, free help, and skill-swapping opportunities, encouraging students to learn, share knowledge, and gain practical experience within their campus community.

## Features

- **User Profiles:** View student profiles, skills, and gig activity.
- **Create Gigs:** Post new gigs by providing a title, description, category, payment type, budget, and deadline.
- **Explore Gigs:** Browse available gigs and search or filter opportunities.
- **Apply for Gigs:** Submit applications with a message.
- **Application Management:** Track applications and their statuses.
- **Gig Status Workflow:** Manage gig progress through open, in-progress, and completed statuses.
- **Reviews and Ratings:** Support mutual feedback and ratings after collaboration.
- **Responsive UI:** A clean and user-friendly interface for navigating the platform.

## Technologies Used

- **Frontend:** React.js
- **Build Tool:** Vite
- **Styling:** CSS and CSS Modules
- **Icons:** Lucide React
- **Mock Backend/API:** JSON Server
- **Data Storage:** JSON seed data
- **Version Control:** Git and GitHub

## Project Structure

```text
DevNova/
├── README.md
└── app/
    ├── db.json
    ├── package.json
    ├── index.html
    └── src/
        ├── components/
        ├── pages/
        ├── data/
        ├── styles/
        └── ...
```

## Installation and Setup

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

### 1. Navigate to the Project Folder

```bash
cd submission/DevNova/app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Mock API Server

Open a terminal in the `app` folder and run:

```bash
npx json-server --watch db.json --port 3001
```

The API will be available at:

```text
http://localhost:3001
```

### 4. Start the React Development Server

Open a second terminal in the same `app` folder and run:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

Keep both terminal windows running while using the application.

## Future Improvements

- Add secure user authentication.
- Replace the mock API with a production-ready backend and database.
- Improve application notifications.
- Add advanced search and filtering options.
- Enhance the review and rating system.

## Conclusion

DevNova aims to build a collaborative student community where students can exchange skills, find opportunities, and work together on academic and practical tasks. The platform encourages peer learning, teamwork, and skill development.

---

**Project Name:** DevNova  
**Project Type:** Campus Gig & SkillSwap Portal  
**Frontend:** React.js + Vite  
**API:** JSON Server  

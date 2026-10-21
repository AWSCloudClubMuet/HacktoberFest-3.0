Campus Gig & SkillSwap Portal

## 🎯 Goal

Create a Web or Mobile platform where students offer skills or request short-term help for payment, skill exchange or free, and earn reputation through completed gigs.

---

## 🏢 Scenario

Students with skills in programming, design, writing, editing and tutoring need a trusted campus marketplace to find collaborations, offer services, apply to gigs and review completed work.

---

## 📍 Milestones & Subtasks

### 🧩 Milestone 1 — Profiles & Gig Creation

**Problem:**  
Allow students to participate on both sides of a gig.

**Rules:**

- Users may act as Poster or Applicant depending on the gig.
- Profiles show name, major, skills, gigs posted, gigs completed and average rating.
- Post Offering or Requesting gigs with title, description, category, payment type (Paid/Skill Swap/Free), budget for paid gigs and deadline.

**Required operations / deliverables:**  
Role-flexible profiles and validated gig creation.

---

### 🧩 Milestone 2 — Discovery & Applications

**Problem:**  
Help students find and respond to relevant gigs.

**Rules:**

- Browse and filter by category, Offering/Requesting type, payment type and budget range.
- Search keywords across title and description.
- Apply with a short message and view personal application statuses.
- Reject applications to the user's own gigs or a duplicate application to the same gig.
- Gigs past their deadline while still Open appear as Expired.

**Required operations / deliverables:**  
Search/filter experience and application submission.

---

### 🧩 Milestone 3 — Applicant Selection & Status

**Problem:**  
Enforce a consistent assignment workflow.

**Rules:**

- Only gig owners may accept applicants or change gig status.
- Owners review applications, accept one applicant and reject others.
- Acceptance automatically changes the gig to In Progress, rejects remaining Pending applications and closes it to new applications.
- Support Open → In Progress → Completed; allow completion only from In Progress.

**Required operations / deliverables:**  
Applicant management and status transitions.

---

### 🧩 Milestone 4 — Mutual Reviews & Reputation

**Problem:**  
Build trust after gigs finish.

**Rules:**

- After completion, the owner and accepted applicant may each rate the other from 1 to 5 and leave a comment.
- Allow only one review per reviewer for that gig.
- Compute profile average ratings from stored reviews rather than manually editing the average.

**Required operations / deliverables:**  
Two-way reviews and calculated reputation.

---

### 🧩 Milestone 5 — Mock API & Seed Data

**Problem:**  
Demonstrate a fully integrated application.

**Rules:**

- Use mock API endpoints such as `GET /gigs?category=...&type=...&q=...`, `POST /gigs`, `POST /applications`, `PATCH /applications/:id`, `PATCH /gigs/:id` and `POST /reviews`.
- Seed at least 12 users, 25 gigs, 20 applications and 8 reviews.
- Gigs span Programming, Design, Writing and Tutoring, Offering/Requesting types and all statuses.

**Required operations / deliverables:**  
Seeded mock backend supporting full CRUD/state workflows.

---

## 🗃️ Database Structure

- Users: `id, name, major, semester, bio, skills (string array)`
- Gigs: `id, user_id, title, description, type (Offering/Requesting), category, payment_type (Paid/SkillSwap/Free), budget (nullable), deadline, status (Open/In Progress/Completed/Expired/Cancelled), accepted_applicant_id (nullable), created_at`
- Applications: `id, gig_id, applicant_id, message, status (Pending/Accepted/Rejected), created_at`
- Reviews: `id, gig_id, reviewer_id, reviewee_id, rating, comment`

---

## 📌 General Guidelines

**Hackathon duration:** 5 hours 30 minutes. Web or mobile development frameworks are allowed, and AI assistants are permitted. Participants must create and populate a **mock API** (e.g., MockAPI.io, JSON Server or custom backend), and fetch/mutate application data through it.

# Demo accounts

These five students are already in the seed data. Every password is `Demo@1234`. Nothing here is a real person.

## How to log in

1. Open the app and go to **Log in**.
2. Use a **Demo accounts** button to fill that student's email and password, then click **Log in**.
3. Or type the email and `Demo@1234` yourself.
4. To try a brand-new student, use **Sign up**. There is no email verification.

Log out from the name in the header when you want to switch students.

## Accounts

| Name | Email | Password | Major | Semester |
| --- | --- | --- | --- | --- |
| Aisha Khan | aisha.khan@campus.edu | Demo@1234 | Computer Science | 6 |
| Bilal Ahmed | bilal.ahmed@campus.edu | Demo@1234 | Graphic Design | 4 |
| Sara Malik | sara.malik@campus.edu | Demo@1234 | English Literature | 5 |
| Hamza Raza | hamza.raza@campus.edu | Demo@1234 | Business Administration | 7 |
| Zainab Tariq | zainab.tariq@campus.edu | Demo@1234 | Mathematics | 3 |

## What each account is good for

| Student | What you will see |
| --- | --- |
| Aisha Khan | Poster view. Her open gig **React office hours** has pending applications from Bilal, Sara, and Fatima. Accept one to move it to In Progress and reject the others. She also has a chat with Sara on the completed gig **Abstract rewrite**. |
| Bilal Ahmed | Applicant view. **React office hours** is Pending, **Portfolio thumbnail set** is Accepted, and **Slide deck critique for a logo** is Rejected. He has no seeded chat. |
| Sara Malik | Completed work and a rating. She is the accepted student on **Design critique session** and **Abstract rewrite**, and her profile average comes from those reviews. **Abstract rewrite** has a chat with Aisha. |
| Hamza Raza | An in-progress gig. He owns **Node API walkthrough**, with Fatima Noor already accepted. That gig has a chat between Hamza and Fatima. |
| Zainab Tariq | A fresh account. She has no gigs and no applications, so she is the right person for creating a gig and applying for the first time. |

## Chats

Run `npm run seed` so these threads are in `data/db.json`.

- **Node API walkthrough** — Hamza Raza (owner) and Fatima Noor (accepted). In Progress, so both can send. Open it from Hamza's **My gigs** via **Open chat**.
- **Abstract rewrite** — Aisha Khan (owner) and Sara Malik (accepted). Completed, so the chat stays open. Sara reaches it from **My applications**.

**Start video call** opens a Jitsi room in a new tab. **Share call link** posts that same URL into the chat. Zainab is not on either thread, so she cannot read or send.

## Suggested 5-minute walkthrough

1. Log in as **Zainab**. **Offer a service** lists other students' requests. **Request a service** lists services they are offering. Her own posts never appear in either catalogue.
2. From **Offer a service**, post a gig. The form starts as **Offering**. Choose **Paid** and submit with the budget empty, then fix it and post. The new gig opens, with a note that it is under **My gigs**.
3. Log out. Log in as **Bilal**, open that gig from **Request a service** (it is an Offering), and choose **Request this service**. Confirm the requirements, write at least 20 characters, then submit. The button changes to **Applied**.
4. Log in as **Zainab**, open the same gig, and confirm she cannot apply to her own gig.
5. Log in as **Sara** and apply through the same wizard.
6. Log in as **Zainab**, open **Applicants**, and accept **Bilal**. The confirm dialog says Sara will be rejected automatically. The gig moves to **In Progress**. Sara's application says another applicant was selected.
7. Confirm **Mark as completed**.
8. As Zainab, leave a review. Log in as Bilal and leave one too. The form disappears after each review.
9. Open both profiles and confirm the average rating and completed-gig count changed.
10. Browse gigs and open **Logo sketch session**. It is stored as Open with a past deadline, so the page shows **Expired** and new applications are closed. It is an Offering, so it is reached from **Request a service** once status includes Expired.

## Rules worth testing

- A student cannot apply to their own gig.
- A student cannot apply twice to the same gig.
- Only the owner can accept, reject, complete, or cancel.
- A gig can be marked Completed only from In Progress.
- Each participant can review the other person once, and only after the gig is Completed.
- A budget is required for Paid gigs and is not accepted for Skill Swap or Free gigs.
- An Open gig whose deadline has passed is shown as Expired.

These accounts are demo-only. They do not contain real personal data.

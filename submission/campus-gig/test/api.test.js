// Automated API & Business Logic Verification Test Suite
// Runs with: node test/api.test.js

const assert = require('assert');
const app = require('../server');

const PORT = 3999;
let server;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting Campus Gig & SkillSwap Portal API Test Suite...\n');

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Reset DB to seed state
    await test('POST /api/stats/reset restores initial seed data', async () => {
      const res = await fetch(`${BASE_URL}/stats/reset`, { method: 'POST' });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
    });

    // 2. Verify Seed Counts
    await test('Seed counts meet hackathon requirements (>=12 users, >=25 gigs, >=20 apps, >=8 reviews)', async () => {
      const res = await fetch(`${BASE_URL}/stats`);
      const { data } = await res.json();
      assert(data.totalUsers >= 12, `Expected >= 12 users, got ${data.totalUsers}`);
      assert(data.totalGigs >= 25, `Expected >= 25 gigs, got ${data.totalGigs}`);
      assert(data.totalApplications >= 20, `Expected >= 20 applications, got ${data.totalApplications}`);
      assert(data.totalReviews >= 8, `Expected >= 8 reviews, got ${data.totalReviews}`);
      console.log(`     [Counts: ${data.totalUsers} users, ${data.totalGigs} gigs, ${data.totalApplications} applications, ${data.totalReviews} reviews]`);
    });

    // 3. User Endpoints & Rating Calculation
    await test('GET /api/users returns enriched users with calculated average ratings', async () => {
      const res = await fetch(`${BASE_URL}/users`);
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert(json.data.length >= 12);
      const userWithReviews = json.data.find(u => u.reviewCount > 0);
      assert(userWithReviews, 'At least one user must have reviews');
      assert(typeof userWithReviews.averageRating === 'number');
      assert(userWithReviews.averageRating >= 1 && userWithReviews.averageRating <= 5);
    });

    // 4. Create User
    let createdUserId;
    await test('POST /api/users creates a new student profile', async () => {
      const payload = {
        name: 'Jordan CampusTester',
        major: 'Information Systems',
        semester: 'Semester 4',
        bio: 'Testing out the portal features.',
        skills: ['JavaScript', 'System Architecture']
      };
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.data.name, 'Jordan CampusTester');
      assert.strictEqual(json.data.completedGigs, 0);
      createdUserId = json.data.id;
    });

    // 5. Update User Profile
    await test('PATCH /api/users/:id updates profile info', async () => {
      const res = await fetch(`${BASE_URL}/users/${createdUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: 'Updated test bio info.' })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.bio, 'Updated test bio info.');
    });

    // 6. Gigs Search & Filters
    await test('GET /api/gigs supports category, paymentType, and search filters', async () => {
      // Category filter
      const catRes = await fetch(`${BASE_URL}/gigs?category=Programming`);
      const catJson = await catRes.json();
      assert(catJson.data.every(g => g.category === 'Programming'));

      // Payment filter
      const payRes = await fetch(`${BASE_URL}/gigs?paymentType=Skill%20Swap`);
      const payJson = await payRes.json();
      assert(payJson.data.every(g => g.paymentType === 'Skill Swap'));

      // Search query
      const searchRes = await fetch(`${BASE_URL}/gigs?q=React`);
      const searchJson = await searchRes.json();
      assert(searchJson.data.length > 0);
    });

    // 7. Create Gig
    let createdGigId;
    await test('POST /api/gigs creates an offering gig with validation', async () => {
      const payload = {
        title: 'Full Stack Node & React Code Review',
        description: 'Comprehensive code review and performance audit for student semester capstones.',
        category: 'Programming',
        paymentType: 'Paid',
        type: 'Offering',
        budget: 50,
        ownerId: createdUserId,
        tags: ['React', 'Node.js', 'Audit']
      };
      const res = await fetch(`${BASE_URL}/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.data.status, 'open');
      createdGigId = json.data.id;
    });

    // 8. Prevent Applying to Own Gig
    await test('POST /api/applications enforces: Prevent applying to own gig', async () => {
      const res = await fetch(`${BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          applicantId: createdUserId, // Creator applying to own gig
          message: 'Trying to apply to myself!'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 400);
      assert(json.error.includes('own gig'));
    });

    // 9. Successful Application by Another Student
    let app1Id;
    let app2Id;
    await test('POST /api/applications creates valid applications from other students', async () => {
      // Applicant 1 (usr-2)
      const res1 = await fetch(`${BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          applicantId: 'usr-2',
          message: 'Would love a code review for our design showcase site!'
        })
      });
      const json1 = await res1.json();
      assert.strictEqual(res1.status, 201);
      assert.strictEqual(json1.data.status, 'pending');
      app1Id = json1.data.id;

      // Applicant 2 (usr-3)
      const res2 = await fetch(`${BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          applicantId: 'usr-3',
          message: 'Also interested in getting my site reviewed.'
        })
      });
      const json2 = await res2.json();
      assert.strictEqual(res2.status, 201);
      app2Id = json2.data.id;
    });

    // 10. Prevent Duplicate Application
    await test('POST /api/applications enforces: Prevent duplicate application', async () => {
      const res = await fetch(`${BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          applicantId: 'usr-2', // Already applied
          message: 'Applying a second time!'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 400);
      assert(json.error.includes('already submitted an application'));
    });

    // 11. Accept Applicant (Gig owner accepts usr-2, auto-rejects usr-3, transitions gig to in_progress)
    await test('PATCH /api/applications/:id accepts applicant, sets gig to in_progress, auto-rejects others', async () => {
      const res = await fetch(`${BASE_URL}/applications/${app1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'accepted',
          actionUserId: createdUserId
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.application.status, 'accepted');

      // Verify Gig status is now in_progress
      const gigRes = await fetch(`${BASE_URL}/gigs/${createdGigId}`);
      const gigJson = await gigRes.json();
      assert.strictEqual(gigJson.data.status, 'in_progress');
      assert.strictEqual(gigJson.data.acceptedApplicantId, 'usr-2');

      // Verify other pending applicant (usr-3) was auto-rejected
      const app2Res = await fetch(`${BASE_URL}/applications/${app2Id}`);
      const app2Json = await app2Res.json();
      assert.strictEqual(app2Json.data.status, 'rejected');
    });

    // 12. Complete Gig Transition
    await test('PATCH /api/gigs/:id transitions gig from in_progress to completed', async () => {
      const res = await fetch(`${BASE_URL}/gigs/${createdGigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.status, 'completed');
    });

    // 13. Prevent Non-participant from Reviewing
    await test('POST /api/reviews enforces: Non-participants cannot review completed gig', async () => {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          reviewerId: 'usr-9', // random stranger
          rating: 5,
          comment: 'Did not participate but trying to review!'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 403);
      assert(json.error.includes('Only the gig owner and accepted applicant'));
    });

    // 14. Accepted Applicant Reviews Gig Owner
    await test('POST /api/reviews allows accepted applicant (usr-2) to review owner', async () => {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          reviewerId: 'usr-2',
          rating: 5,
          comment: 'Fantastic code review! Spotted three architectural bottlenecks.'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.data.review.rating, 5);
      assert.strictEqual(json.data.review.revieweeId, createdUserId);
    });

    // 15. Gig Owner Reviews Accepted Applicant
    await test('POST /api/reviews allows gig owner to review applicant (usr-2)', async () => {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          reviewerId: createdUserId,
          rating: 5,
          comment: 'Maya had a very clean frontend structure, pleasure working with her!'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.data.review.revieweeId, 'usr-2');
    });

    // 16. Prevent Duplicate Review by Same User on Same Gig
    await test('POST /api/reviews enforces: Prevent duplicate review for same gig', async () => {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: createdGigId,
          reviewerId: 'usr-2', // already reviewed
          rating: 4,
          comment: 'Submitting a second review!'
        })
      });
      const json = await res.json();
      assert.strictEqual(res.status, 400);
      assert(json.error.includes('already submitted a review'));
    });

    // 17. Verify Recalculated Ratings & Completed Gigs for Created User
    await test('GET /api/users/:id reflects dynamically updated rating and completed gig count', async () => {
      const res = await fetch(`${BASE_URL}/users/${createdUserId}`);
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.reviewCount, 1);
      assert.strictEqual(json.data.averageRating, 5);
      assert.strictEqual(json.data.completedGigs, 1);
    });

  } finally {
    // Reset DB back to seed state and close test server
    try {
      await fetch(`${BASE_URL}/stats/reset`, { method: 'POST' });
    } catch (_) {}

    server.close();
  }

  console.log(`\n===========================================`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner caught unexpected error:', err);
  if (server) server.close();
  process.exit(1);
});

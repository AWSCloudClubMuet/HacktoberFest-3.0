// End-to-End & Static Assets Integration Verification Test
// Runs with: node test/e2e_integration.test.js

const assert = require('assert');
const app = require('../server');

const PORT = 3998;
let server;
const BASE_URL = `http://localhost:${PORT}`;

async function runE2ETests() {
  console.log('🧪 Starting Campus Gig & SkillSwap Portal End-to-End & Asset Test Suite...\n');

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
    // 1. Static asset verification
    await test('GET / returns 200 HTML with title and demo selector elements', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const text = await res.text();
      assert.strictEqual(res.status, 200);
      assert(text.includes('Campus Gig & SkillSwap Portal'));
      assert(text.includes('id="demo-user-select"'));
      assert(text.includes('id="tab-explore"'));
      assert(text.includes('id="tab-dashboard"'));
    });

    await test('GET /css/style.css returns valid CSS stylesheet', async () => {
      const res = await fetch(`${BASE_URL}/css/style.css`);
      const text = await res.text();
      assert.strictEqual(res.status, 200);
      assert(text.includes('--primary:'));
      assert(text.includes('.gig-card'));
    });

    await test('GET /js/app.js, /js/api.js, /js/state.js return frontend scripts', async () => {
      const resApp = await fetch(`${BASE_URL}/js/app.js`);
      const resApi = await fetch(`${BASE_URL}/js/api.js`);
      const resState = await fetch(`${BASE_URL}/js/state.js`);
      assert.strictEqual(resApp.status, 200);
      assert.strictEqual(resApi.status, 200);
      assert.strictEqual(resState.status, 200);
    });

    await test('GET /api returns API status and endpoint directory', async () => {
      const res = await fetch(`${BASE_URL}/api`);
      const json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.status, 'online');
      assert(json.endpoints.gigs);
    });

    // 2. Full User Journey Workflow
    await test('Complete Workflow: Post Gig -> Apply -> Accept -> Complete -> Two-way Review', async () => {
      // Step A: Maya (usr-2) creates a Requesting gig for Tutoring
      const createGigRes = await fetch(`${BASE_URL}/api/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Need Linear Algebra Proof Tutoring for Midterm',
          description: 'Looking for a peer tutor to walk through Gram-Schmidt process and matrix diagonalization.',
          category: 'Tutoring',
          paymentType: 'Paid',
          budget: 30,
          type: 'Requesting',
          deadline: '2026-11-20',
          ownerId: 'usr-2',
          tags: ['Math', 'Linear Algebra']
        })
      });
      const gigJson = await createGigRes.json();
      assert.strictEqual(createGigRes.status, 201);
      const gigId = gigJson.data.id;
      assert.strictEqual(gigJson.data.status, 'open');

      // Step B: Sophia (usr-4, math major) applies for the gig
      const applyRes = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gigId,
          applicantId: 'usr-4',
          message: 'Hi Maya, I am the stats/math department peer tutor. Happy to explain Gram-Schmidt step by step!'
        })
      });
      const applyJson = await applyRes.json();
      assert.strictEqual(applyRes.status, 201);
      const appId = applyJson.data.id;
      assert.strictEqual(applyJson.data.status, 'pending');

      // Step C: Maya accepts Sophia's application
      const acceptRes = await fetch(`${BASE_URL}/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'accepted',
          actionUserId: 'usr-2'
        })
      });
      const acceptJson = await acceptRes.json();
      assert.strictEqual(acceptRes.status, 200);
      assert.strictEqual(acceptJson.data.application.status, 'accepted');

      // Check gig is now in_progress
      const getGigRes = await fetch(`${BASE_URL}/api/gigs/${gigId}`);
      const getGigJson = await getGigRes.json();
      assert.strictEqual(getGigJson.data.status, 'in_progress');
      assert.strictEqual(getGigJson.data.acceptedApplicantId, 'usr-4');

      // Step D: Maya completes the gig
      const completeRes = await fetch(`${BASE_URL}/api/gigs/${gigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      const completeJson = await completeRes.json();
      assert.strictEqual(completeRes.status, 200);
      assert.strictEqual(completeJson.data.status, 'completed');

      // Step E: Maya reviews Sophia (5 stars)
      const review1Res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gigId,
          reviewerId: 'usr-2',
          rating: 5,
          comment: 'Sophia was so patient and clear with the matrix proofs. A+ tutor!'
        })
      });
      const review1Json = await review1Res.json();
      assert.strictEqual(review1Res.status, 201);

      // Step F: Sophia reviews Maya (5 stars)
      const review2Res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gigId,
          reviewerId: 'usr-4',
          rating: 5,
          comment: 'Maya came prepared with targeted questions. Great session!'
        })
      });
      const review2Json = await review2Res.json();
      assert.strictEqual(review2Res.status, 201);

      // Step G: Verify ratings updated for both
      const sophiaRes = await fetch(`${BASE_URL}/api/users/usr-4`);
      const sophiaJson = await sophiaRes.json();
      assert(sophiaJson.data.completedGigs >= 1);
      assert(sophiaJson.data.averageRating >= 4.5);

      const mayaRes = await fetch(`${BASE_URL}/api/users/usr-2`);
      const mayaJson = await mayaRes.json();
      assert(mayaJson.data.completedGigs >= 1);
      assert(mayaJson.data.averageRating >= 4.5);
    });

  } finally {
    // Reset seed data and close server
    try {
      await fetch(`${BASE_URL}/api/stats/reset`, { method: 'POST' });
    } catch (_) {}

    server.close();
  }

  console.log(`\n===========================================`);
  console.log(`E2E Summary: ${passed} passed, ${failed} failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('E2E runner error:', err);
  if (server) server.close();
  process.exit(1);
});

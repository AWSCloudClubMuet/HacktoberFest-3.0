import assert from 'node:assert';
import app from '../server/index.js';
import { seedDatabase } from '../server/db.js';

const PORT = 5055;
const BASE = `http://localhost:${PORT}/api`;

let server;

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 Starting CampusLoop Backend Test Suite');
  console.log('========================================\n');

  // Reset & reseed clean database state for test run
  seedDatabase(true);

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server running at http://localhost:${PORT}\n`);

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

  // 1. Health check
  await test('GET /api/health returns healthy status', async () => {
    const res = await fetch(`${BASE}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
  });

  // 2. Database seeding verification
  await test('Seeded database meets all minimum hackathon requirements', async () => {
    const usersRes = await fetch(`${BASE}/users`);
    const users = await usersRes.json();
    assert.ok(users.length >= 12, `Expected >= 12 users, got ${users.length}`);

    const gigsRes = await fetch(`${BASE}/gigs`);
    const gigs = await gigsRes.json();
    assert.ok(gigs.length >= 25, `Expected >= 25 gigs, got ${gigs.length}`);

    const appsRes = await fetch(`${BASE}/applications`);
    const apps = await appsRes.json();
    assert.ok(apps.length >= 20, `Expected >= 20 applications, got ${apps.length}`);

    const revsRes = await fetch(`${BASE}/reviews`);
    const revs = await revsRes.json();
    assert.ok(revs.length >= 8, `Expected >= 8 reviews, got ${revs.length}`);
  });

  // 3. User profile and calculated reputation
  await test('GET /api/users/:id returns user profile with live calculated rating', async () => {
    const res = await fetch(`${BASE}/users/usr_1`);
    assert.strictEqual(res.status, 200);
    const user = await res.json();
    assert.strictEqual(user.id, 'usr_1');
    assert.strictEqual(user.name, 'Aarav Sharma');
    assert.ok(Array.isArray(user.skills), 'skills should be parsed array');
    assert.ok(user.rating >= 1 && user.rating <= 5);
    assert.ok(user.rating_breakdown !== undefined);
  });

  // 4. User profile editing & authorization
  await test('PATCH /api/users/:id rejects unauthorized edit (x-user-id mismatch)', async () => {
    const res = await fetch(`${BASE}/users/usr_2`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_1' // usr_1 trying to edit usr_2
      },
      body: JSON.stringify({ bio: 'Hacked bio' })
    });
    assert.strictEqual(res.status, 403);
  });

  await test('PATCH /api/users/:id permits owner edit', async () => {
    const res = await fetch(`${BASE}/users/usr_1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_1'
      },
      body: JSON.stringify({ bio: 'Updated verified student bio' })
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.bio, 'Updated verified student bio');
  });

  // 5. Gig search and filters
  await test('GET /api/gigs filters by category, payment type, and search keyword', async () => {
    const resCat = await fetch(`${BASE}/gigs?category=Programming`);
    const programmingGigs = await resCat.json();
    assert.ok(programmingGigs.every(g => g.category === 'Programming'));

    const resPaid = await fetch(`${BASE}/gigs?payment_type=Paid`);
    const paidGigs = await resPaid.json();
    assert.ok(paidGigs.every(g => g.payment_type === 'Paid'));

    const resSearch = await fetch(`${BASE}/gigs?search=web`);
    const searchGigs = await resSearch.json();
    assert.ok(searchGigs.length > 0);
  });

  // 6. Gig creation validation
  await test('POST /api/gigs rejects missing required fields and negative budget', async () => {
    const resInvalid = await fetch(`${BASE}/gigs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({ title: '' })
    });
    assert.strictEqual(resInvalid.status, 400);

    const resNegativeBudget = await fetch(`${BASE}/gigs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        title: 'Build Python Crawler',
        description: 'Scrape academic schedule',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: -50,
        deadline: '2026-11-20'
      })
    });
    assert.strictEqual(resNegativeBudget.status, 400);
  });

  let createdGigId;
  await test('POST /api/gigs creates valid gig and updates poster posted count', async () => {
    const userBefore = await (await fetch(`${BASE}/users/usr_1`)).json();

    const res = await fetch(`${BASE}/gigs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        title: 'Flutter App UI Redesign',
        description: 'Need a student to help redesign the mobile navigation.',
        type: 'Requesting',
        category: 'Design',
        payment_type: 'Paid',
        budget: 1500,
        deadline: '2026-12-01',
        skills_required: ['Figma', 'Flutter']
      })
    });

    assert.strictEqual(res.status, 201);
    const created = await res.json();
    assert.strictEqual(created.title, 'Flutter App UI Redesign');
    assert.strictEqual(created.status, 'Open');
    createdGigId = created.id;

    const userAfter = await (await fetch(`${BASE}/users/usr_1`)).json();
    assert.strictEqual(userAfter.gigs_posted, userBefore.gigs_posted + 1);
  });

  // 7. Own-gig application prevention
  await test('POST /api/applications prevents user from applying to own gig', async () => {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        gig_id: createdGigId, // poster is usr_1
        message: 'I want to apply to my own gig!'
      })
    });
    assert.strictEqual(res.status, 400);
    const err = await res.json();
    assert.ok(err.error.includes('own gig'));
  });

  // 8. Application submission & duplicate prevention
  let app1Id;
  await test('POST /api/applications accepts valid proposal from eligible student', async () => {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_3' },
      body: JSON.stringify({
        gig_id: createdGigId,
        message: 'Hi Aarav, I am a design major and would love to build the Flutter UI for you.'
      })
    });
    assert.strictEqual(res.status, 201);
    const app = await res.json();
    assert.strictEqual(app.status, 'Pending');
    app1Id = app.id;
  });

  await test('POST /api/applications prevents duplicate application from same student', async () => {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_3' },
      body: JSON.stringify({
        gig_id: createdGigId,
        message: 'Applying again for the same gig'
      })
    });
    assert.strictEqual(res.status, 400);
    const err = await res.json();
    assert.ok(err.error.includes('already submitted'));
  });

  await test('Add competing applicant usr_4 for atomic testing', async () => {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_4' },
      body: JSON.stringify({
        gig_id: createdGigId,
        message: 'Second applicant proposal from Priya.'
      })
    });
    assert.strictEqual(res.status, 201);
    const app = await res.json();
    assert.ok(app.id);
  });

  // 9. Atomic application acceptance & competing application rejection (Milestone 3)
  await test('PATCH /api/applications/:id/accept executes atomic acceptance and rejects competing applicants', async () => {
    // Non-owner cannot accept
    const unauthorizedRes = await fetch(`${BASE}/applications/${app1Id}/accept`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_2' }
    });
    assert.strictEqual(unauthorizedRes.status, 403);

    // Gig owner (usr_1) accepts app1 (usr_3)
    const acceptRes = await fetch(`${BASE}/applications/${app1Id}/accept`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' }
    });
    assert.strictEqual(acceptRes.status, 200);

    // Verify target app is Accepted
    const updatedApp1 = await (await fetch(`${BASE}/applications?gig_id=${createdGigId}&applicant_id=usr_3`)).json();
    assert.strictEqual(updatedApp1[0].status, 'Accepted');

    // Verify competing pending app2 is Rejected
    const updatedApp2 = await (await fetch(`${BASE}/applications?gig_id=${createdGigId}&applicant_id=usr_4`)).json();
    assert.strictEqual(updatedApp2[0].status, 'Rejected');

    // Verify gig is In Progress with accepted collaborator
    const gigRes = await fetch(`${BASE}/gigs/${createdGigId}`);
    const updatedGig = await gigRes.json();
    assert.strictEqual(updatedGig.status, 'In Progress');
    assert.strictEqual(updatedGig.accepted_applicant_id, 'usr_3');
  });

  // 10. Expired or In-Progress gig application rejection
  await test('POST /api/applications rejects application on non-open gig', async () => {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_5' },
      body: JSON.stringify({
        gig_id: createdGigId, // Now In Progress
        message: 'Applying late'
      })
    });
    assert.strictEqual(res.status, 400);
  });

  // 11. Work lifecycle completion
  await test('PATCH /api/gigs/:id to Completed enforces participant authorization', async () => {
    // Non-participant cannot complete
    const unauthRes = await fetch(`${BASE}/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_6' },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert.strictEqual(unauthRes.status, 403);

    // Authorized collaborator (usr_3) completes
    const completeRes = await fetch(`${BASE}/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_3' },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert.strictEqual(completeRes.status, 200);
    const completedGig = await completeRes.json();
    assert.strictEqual(completedGig.status, 'Completed');
  });

  // 12. Mutual reviews and calculated reputation (Milestone 4)
  await test('POST /api/reviews enforces mutual review rules and recalculates rating in DB', async () => {
    // Non-participant cannot review
    const unauthReview = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_6' },
      body: JSON.stringify({
        gig_id: createdGigId,
        reviewee_id: 'usr_1',
        rating: 5,
        comment: 'I did not work on this.'
      })
    });
    assert.strictEqual(unauthReview.status, 403);

    // Reviewer usr_1 reviews reviewee usr_3 (counterpart)
    const reviewRes = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        gig_id: createdGigId,
        reviewee_id: 'usr_3',
        rating: 5,
        comment: 'Sneha did stellar UI work for our Flutter app!'
      })
    });
    assert.strictEqual(reviewRes.status, 201);

    // Duplicate review from usr_1 rejected
    const dupReviewRes = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        gig_id: createdGigId,
        reviewee_id: 'usr_3',
        rating: 5,
        comment: 'Trying to review again'
      })
    });
    assert.strictEqual(dupReviewRes.status, 400);

    // Verify reviewee profile received review and rating is calculated
    const revieweeProfile = await (await fetch(`${BASE}/users/usr_3`)).json();
    assert.ok(revieweeProfile.reviews_count >= 1);
    assert.ok(revieweeProfile.rating >= 1 && revieweeProfile.rating <= 5);
  });

  // 13. Messages and Conversations persistence
  await test('GET & POST /api/conversations persists conversation messages', async () => {
    const convsRes = await fetch(`${BASE}/conversations`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    assert.strictEqual(convsRes.status, 200);
    const convs = await convsRes.json();
    assert.ok(convs.length > 0);

    const targetConv = convs[0];
    const initialMsgCount = targetConv.messages.length;

    const sendRes = await fetch(`${BASE}/conversations/${targetConv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({ text: 'Hello from verified test message!' })
    });
    assert.strictEqual(sendRes.status, 201);

    const recheckRes = await fetch(`${BASE}/conversations`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    const updatedConvs = await recheckRes.json();
    const updatedConv = updatedConvs.find(c => c.id === targetConv.id);
    assert.strictEqual(updatedConv.messages.length, initialMsgCount + 1);
  });

  // 14. Notifications persistence
  await test('GET & PATCH /api/notifications returns and updates read status', async () => {
    const notifsRes = await fetch(`${BASE}/notifications`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    assert.strictEqual(notifsRes.status, 200);
    const notifs = await notifsRes.json();
    assert.ok(notifs.length > 0);

    const readAllRes = await fetch(`${BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' }
    });
    assert.strictEqual(readAllRes.status, 200);

    const checkRes = await fetch(`${BASE}/notifications`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    const updatedNotifs = await checkRes.json();
    assert.ok(updatedNotifs.every(n => n.read === true));
  });

  // 15. Bookmarks persistence
  await test('GET & POST /api/bookmarks toggles gig bookmarks', async () => {
    const initialRes = await fetch(`${BASE}/bookmarks`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    const initialList = await initialRes.json();
    assert.ok(Array.isArray(initialList));

    const toggleRes = await fetch(`${BASE}/bookmarks/gig_2`, {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' }
    });
    const result = await toggleRes.json();
    assert.strictEqual(typeof result.bookmarked, 'boolean');

    const updatedRes = await fetch(`${BASE}/bookmarks`, {
      headers: { 'x-user-id': 'usr_1' }
    });
    const updatedList = await updatedRes.json();
    if (result.bookmarked) {
      assert.ok(updatedList.includes('gig_2'));
    } else {
      assert.ok(!updatedList.includes('gig_2'));
    }
  });

  // 16. Platform stats endpoint
  await test('GET /api/stats returns accurate dynamic platform figures', async () => {
    const res = await fetch(`${BASE}/stats`);
    assert.strictEqual(res.status, 200);
    const stats = await res.json();
    assert.ok(stats.activeGigs >= 0);
    assert.ok(stats.swapsCompleted >= 0);
    assert.ok(stats.totalStudents >= 12);
    assert.ok(stats.avgSatisfaction !== undefined);
  });

  // 17. AI Assistant Endpoint
  await test('POST /api/ai/query returns real database gigs and answers', async () => {
    const res = await fetch(`${BASE}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({ query: 'Find me programming gigs' })
    });
    assert.strictEqual(res.status, 200);
    const aiData = await res.json();
    assert.ok(aiData.text.length > 0);
    assert.ok(Array.isArray(aiData.suggestedGigs));
    assert.ok(aiData.suggestedGigs.length > 0);
    assert.ok(aiData.suggestedGigs.every(g => g.category === 'Programming'));
  });

  // 18. Owner-only reject application permission
  await test('PATCH /api/applications/:id/reject enforces gig owner authorization', async () => {
    // Create new gig by usr_1
    const gigRes = await fetch(`${BASE}/gigs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_1' },
      body: JSON.stringify({
        title: 'Logo Vectorization Task',
        description: 'Need logo vectors converted to SVG',
        type: 'Requesting',
        category: 'Design',
        payment_type: 'Free',
        deadline: '2026-12-15'
      })
    });
    const gig = await gigRes.json();

    // usr_2 applies
    const appRes = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_2' },
      body: JSON.stringify({ gig_id: gig.id, message: 'I can vectorize this.' })
    });
    const app = await appRes.json();

    // usr_3 (unauthorized) attempts to reject
    const unauthReject = await fetch(`${BASE}/applications/${app.id}/reject`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_3' }
    });
    assert.strictEqual(unauthReject.status, 403);

    // usr_1 (owner) rejects
    const authReject = await fetch(`${BASE}/applications/${app.id}/reject`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' }
    });
    assert.strictEqual(authReject.status, 200);
    const rejectedApp = await authReject.json();
    assert.strictEqual(rejectedApp.status, 'Rejected');
  });

  // 19. Demo account switching and user-isolated notifications
  await test('User switching isolates notifications and conversations to current student', async () => {
    const usr1Notifs = await (await fetch(`${BASE}/notifications`, { headers: { 'x-user-id': 'usr_1' } })).json();
    const usr2Notifs = await (await fetch(`${BASE}/notifications`, { headers: { 'x-user-id': 'usr_2' } })).json();

    assert.ok(usr1Notifs.every(n => n.user_id === 'usr_1'));
    assert.ok(usr2Notifs.every(n => n.user_id === 'usr_2'));
  });

  // 20. Conversation access control (non-participant rejection)
  await test('POST /api/conversations/:id/messages rejects unauthorized non-participants', async () => {
    // conv_1 is between usr_1 and usr_2; usr_5 is not a participant
    const res = await fetch(`${BASE}/conversations/conv_1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_5' },
      body: JSON.stringify({ text: 'Spy message' })
    });
    assert.strictEqual(res.status, 403);
  });

  // 21. API error handling on non-existent records
  await test('API returns appropriate 404s for invalid IDs', async () => {
    const resGig = await fetch(`${BASE}/gigs/gig_nonexistent_9999`);
    assert.strictEqual(resGig.status, 404);

    const resUser = await fetch(`${BASE}/users/usr_nonexistent_9999`);
    assert.strictEqual(resUser.status, 404);
  });

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  server.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});

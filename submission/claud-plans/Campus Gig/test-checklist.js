// Automated Test Suite for 18-Point Business-Rule Checklist
// Verifies Page 5 of Campus Gig & SkillSwap Portal Specification

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function req(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING 18-POINT BUSINESS-RULE TEST CHECKLIST');
  console.log('======================================================\n');

  // Reset store first for clean baseline
  await req('/debug/reset', { method: 'POST' });

  let passed = 0;
  let failed = 0;

  function assert(condition, testNum, testName, details = '') {
    if (condition) {
      console.log(`✅ [#${testNum}] PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [#${testNum}] FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // Checkpoints
  const health = await req('/health');
  console.log(`📡 GET /health: status ${health.status} (${health.data?.status})`);

  const counts = await req('/debug/counts');
  console.log(`📊 Seed counts: users=${counts.data?.users}, gigs=${counts.data?.gigs}, apps=${counts.data?.applications}, reviews=${counts.data?.reviews}`);
  assert(
    counts.data?.users === 12 &&
      counts.data?.gigs === 25 &&
      counts.data?.applications === 24 &&
      counts.data?.reviews === 8,
    0,
    'Seed Counts Check (12 users, 25 gigs, 24 apps, 8 reviews)',
    JSON.stringify(counts.data)
  );

  // 1. Create Paid gig without budget -> 400 error
  const t1 = await req('/gigs', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      title: 'Paid gig with missing budget',
      description: 'Testing validation rule',
      category: 'Programming',
      type: 'Offering',
      payment_type: 'Paid',
      deadline: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  assert(t1.status === 400, 1, 'Create Paid gig without budget returns 400', `Got status ${t1.status}`);

  // 2. Create gig with a past deadline -> 400 error
  const t2 = await req('/gigs', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      title: 'Past deadline gig',
      description: 'Testing deadline check',
      category: 'Design',
      type: 'Requesting',
      payment_type: 'Free',
      deadline: new Date(Date.now() - 86400000).toISOString(),
    }),
  });
  assert(t2.status === 400, 2, 'Create gig with past deadline returns 400', `Got status ${t2.status}`);

  // 3. Create Free gig with budget typed in -> Budget saved as null
  const t3 = await req('/gigs', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      title: 'Free gig with budget typed in',
      description: 'Should force budget to null',
      category: 'Writing',
      type: 'Offering',
      payment_type: 'Free',
      budget: 5000,
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    }),
  });
  assert(
    t3.status === 201 && t3.data?.budget === null,
    3,
    'Create Free gig with budget forces budget to null',
    `Got budget: ${t3.data?.budget}, status: ${t3.status}`
  );

  // 4. Filter category=Design + type=Offering -> Only matching gigs
  const t4 = await req('/gigs?category=Design&type=Offering');
  const allMatch =
    t4.data?.length > 0 &&
    t4.data.every((g) => g.category.toLowerCase() === 'design' && g.type.toLowerCase() === 'offering');
  assert(allMatch, 4, 'Filter category=Design + type=Offering returns only matching gigs', `Found ${t4.data?.length} gigs`);

  // 5. Search q=python -> Matches in title or description
  const t5 = await req('/gigs?q=python');
  const pythonMatches =
    t5.data?.length > 0 &&
    t5.data.every(
      (g) =>
        g.title.toLowerCase().includes('python') ||
        g.description.toLowerCase().includes('python')
    );
  assert(pythonMatches, 5, 'Search q=python matches in title or description', `Found ${t5.data?.length} matches`);

  // 6. Open gig with past deadline -> Shown as Expired, cannot apply
  const t6_list = await req('/gigs');
  const g9 = t6_list.data?.find((g) => g.id === 'g9');
  const showsExpired = g9 && g9.status === 'Expired';
  const applyExpired = await req('/applications', {
    method: 'POST',
    headers: { 'x-user-id': 'u2' },
    body: JSON.stringify({ gig_id: 'g9', message: 'Attempting to apply to expired gig' }),
  });
  assert(
    showsExpired && applyExpired.status === 400,
    6,
    'Open gig with past deadline shown as Expired and blocks application',
    `Status: ${g9?.status}, Apply status: ${applyExpired.status}`
  );

  // 7. Apply to your own gig -> Rejected (400)
  const t7 = await req('/applications', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({ gig_id: 'g1', message: 'Applying to my own gig' }),
  });
  assert(t7.status === 400, 7, 'Apply to your own gig is rejected', `Got status ${t7.status}`);

  // 8. Apply twice to the same gig -> Second one rejected (409)
  // u4 applies to g1 for the first time
  const t8_first = await req('/applications', {
    method: 'POST',
    headers: { 'x-user-id': 'u4' },
    body: JSON.stringify({ gig_id: 'g1', message: 'First valid application' }),
  });
  const t8_second = await req('/applications', {
    method: 'POST',
    headers: { 'x-user-id': 'u4' },
    body: JSON.stringify({ gig_id: 'g1', message: 'Duplicate application' }),
  });
  assert(
    t8_second.status === 409,
    8,
    'Apply twice to the same gig returns 409 Conflict',
    `First: ${t8_first.status}, Second: ${t8_second.status}`
  );

  // 9. Non-owner tries to accept an applicant -> 403
  // g1 owner is u1. Let u2 try to accept application a19 on g1
  const t9 = await req('/applications/a19', {
    method: 'PATCH',
    headers: { 'x-user-id': 'u2' },
    body: JSON.stringify({ status: 'Accepted' }),
  });
  assert(t9.status === 403, 9, 'Non-owner tries to accept an applicant returns 403 Forbidden', `Got status ${t9.status}`);

  // 10. Owner accepts applicant A (B and C pending) -> Gig In Progress, A Accepted, B and C Rejected
  // On g1: applications are a19 (u3), a20 (u5), and newly added app from u4
  const t10 = await req('/applications/a19', {
    method: 'PATCH',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({ status: 'Accepted' }),
  });
  const g1_after = await req('/gigs/g1');
  const a19_after = g1_after.data?.applications.find((a) => a.id === 'a19');
  const a20_after = g1_after.data?.applications.find((a) => a.id === 'a20');
  const cascadePassed =
    t10.status === 200 &&
    g1_after.data?.status === 'In Progress' &&
    g1_after.data?.accepted_applicant_id === 'u3' &&
    a19_after?.status === 'Accepted' &&
    a20_after?.status === 'Rejected';
  assert(
    cascadePassed,
    10,
    'Owner accepts applicant: Gig In Progress, A Accepted, others Rejected',
    `Gig: ${g1_after.data?.status}, a19: ${a19_after?.status}, a20: ${a20_after?.status}`
  );

  // 11. Apply to the gig after acceptance -> Rejected (400)
  const t11 = await req('/applications', {
    method: 'POST',
    headers: { 'x-user-id': 'u6' },
    body: JSON.stringify({ gig_id: 'g1', message: 'Applying after gig accepted' }),
  });
  assert(t11.status === 400, 11, 'Apply to gig after acceptance returns 400', `Got status ${t11.status}`);

  // 12. Complete a gig that is Open -> 400 error
  // g2 is Open
  const t12 = await req('/gigs/g2', {
    method: 'PATCH',
    headers: { 'x-user-id': 'u2' },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(t12.status === 400, 12, 'Complete a gig that is Open returns 400', `Got status ${t12.status}`);

  // 13. Complete a gig that is In Progress (owner) -> Status Completed
  // g1 is now In Progress, owner is u1
  const t13 = await req('/gigs/g1', {
    method: 'PATCH',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(
    t13.status === 200 && t13.data?.gig?.status === 'Completed',
    13,
    'Owner completes In Progress gig -> status Completed',
    `Got status ${t13.status}`
  );

  // 14. Review on a gig that is not Completed -> Rejected (400)
  // g13 is In Progress
  const t14 = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      gig_id: 'g13',
      reviewer_id: 'u1',
      reviewee_id: 'u2',
      rating: 5,
      comment: 'Attempting review on In Progress gig',
    }),
  });
  assert(t14.status === 400, 14, 'Review on a gig that is not Completed returns 400', `Got status ${t14.status}`);

  // 15. Review by someone not involved -> 403
  // On completed gig g1 (owner u1, accepted u3), u4 is not involved
  const t15 = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u4' },
    body: JSON.stringify({
      gig_id: 'g1',
      reviewer_id: 'u4',
      reviewee_id: 'u1',
      rating: 5,
      comment: 'Review from outsider',
    }),
  });
  assert(t15.status === 403, 15, 'Review by someone not involved returns 403', `Got status ${t15.status}`);

  // 16. Second review by the same reviewer -> Rejected (409)
  // On g17, u1 already reviewed u3 in initial seed (r1)
  const t16 = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      gig_id: 'g17',
      reviewer_id: 'u1',
      reviewee_id: 'u3',
      rating: 4,
      comment: 'Duplicate review attempt',
    }),
  });
  assert(t16.status === 409, 16, 'Second review by the same reviewer returns 409', `Got status ${t16.status}`);

  // 17. Rating of 0 or 6 -> 400 error
  const t17_low = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      gig_id: 'g1',
      reviewer_id: 'u1',
      reviewee_id: 'u3',
      rating: 0,
      comment: 'Rating zero test',
    }),
  });
  const t17_high = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      gig_id: 'g1',
      reviewer_id: 'u1',
      reviewee_id: 'u3',
      rating: 6,
      comment: 'Rating six test',
    }),
  });
  assert(
    t17_low.status === 400 && t17_high.status === 400,
    17,
    'Rating of 0 or 6 returns 400 error',
    `Low: ${t17_low.status}, High: ${t17_high.status}`
  );

  // 18. Valid review submitted -> Profile average updates
  // Check u3's profile before review on g1
  const u3_before = await req('/users/u3');
  const prevCount = u3_before.data?.reviewCount || 0;
  const prevRating = u3_before.data?.averageRating;

  // Submit valid review: u1 reviews u3 on completed gig g1
  const t18 = await req('/reviews', {
    method: 'POST',
    headers: { 'x-user-id': 'u1' },
    body: JSON.stringify({
      gig_id: 'g1',
      reviewer_id: 'u1',
      reviewee_id: 'u3',
      rating: 4,
      comment: 'Outstanding delivery on the MERN stack dashboard!',
    }),
  });

  const u3_after = await req('/users/u3');
  const newCount = u3_after.data?.reviewCount;
  const newRating = u3_after.data?.averageRating;

  assert(
    t18.status === 201 && newCount === prevCount + 1 && newRating !== null,
    18,
    'Valid review submitted and profile average updates',
    `Before: ${prevRating} (${prevCount} reviews), After: ${newRating} (${newCount} reviews)`
  );

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL 18 BUSINESS RULES PASSED WITH 100% SUCCESS!');
  } else {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exitCode = 1;
});

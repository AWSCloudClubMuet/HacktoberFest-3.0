// Authentication & Authorization Test Suite for Campus Gig & SkillSwap Portal
// Verifies JWT, Bcrypt, Helmet headers, Role guards, and Protected Endpoints

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
  return { status: res.status, headers: res.headers, data };
}

async function runAuthTests() {
  console.log('\n======================================================');
  console.log('🔒 RUNNING AUTHENTICATION & AUTHORIZATION TEST SUITE');
  console.log('======================================================\n');

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

  // 1. Helmet Security Headers verification
  const healthRes = await req('/health');
  const frameOptions = healthRes.headers.get('x-frame-options');
  const contentTypeOptions = healthRes.headers.get('x-content-type-options');
  assert(
    contentTypeOptions === 'nosniff' && frameOptions === 'SAMEORIGIN',
    1,
    'Helmet HTTP security headers present (x-content-type-options: nosniff, x-frame-options: SAMEORIGIN)',
    `Got content-type-options: ${contentTypeOptions}, frame-options: ${frameOptions}`
  );

  // 2. User Registration (Success with password hashing & JWT generation)
  const testStudent = {
    name: 'Taha Naveed',
    email: `taha.naveed.${Date.now()}@campus.edu.pk`,
    password: 'SecurePassword123!',
    major: 'Cyber Security',
    semester: 5,
    skills: ['Penetration Testing', 'Network Security', 'Python'],
  };

  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testStudent),
  });

  assert(
    regRes.status === 201 &&
      regRes.data?.token &&
      regRes.data?.user?.email === testStudent.email.toLowerCase() &&
      regRes.data?.user?.password === undefined,
    2,
    'Register new student returns 201 with signed JWT and sanitized user profile (no password exposed)',
    JSON.stringify(regRes.data)
  );

  const newStudentToken = regRes.data?.token;

  // 3. Duplicate Registration Prevention
  const dupRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testStudent),
  });
  assert(
    dupRes.status === 409,
    3,
    'Duplicate student registration returns 409 Conflict',
    `Got status ${dupRes.status}`
  );

  // 4. Invalid Registration (Short password < 6 characters)
  const shortPassRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...testStudent, email: 'valid@campus.edu.pk', password: '123' }),
  });
  assert(
    shortPassRes.status === 400,
    4,
    'Register with password under 6 characters returns 400 Bad Request',
    `Got status ${shortPassRes.status}`
  );

  // 5. Login with Seeded Account (Bcrypt password check)
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ali.khan@campus.edu.pk',
      password: 'campus123',
    }),
  });
  assert(
    loginRes.status === 200 && loginRes.data?.token && loginRes.data?.user?.id === 'u1',
    5,
    'Login with valid student credentials returns 200 and signed JWT token',
    JSON.stringify(loginRes.data)
  );

  const aliToken = loginRes.data?.token;

  // 6. Login with Wrong Password -> 401 Unauthorized
  const badLoginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ali.khan@campus.edu.pk',
      password: 'wrong_password_999',
    }),
  });
  assert(
    badLoginRes.status === 401,
    6,
    'Login with incorrect password returns 401 Unauthorized',
    `Got status ${badLoginRes.status}`
  );

  // 7. Protected Route /auth/me with Bearer Token
  const meRes = await req('/auth/me', {
    headers: { Authorization: `Bearer ${aliToken}` },
  });
  assert(
    meRes.status === 200 && meRes.data?.user?.name === 'Ali Khan' && meRes.data?.authenticated === true,
    7,
    'GET /auth/me with Bearer JWT returns authenticated profile with computed metrics',
    JSON.stringify(meRes.data)
  );

  // 8. Protected Route /auth/me without Token -> 401 Unauthorized
  const unauthMe = await req('/auth/me');
  assert(
    unauthMe.status === 401,
    8,
    'GET /auth/me without token returns 401 Unauthorized',
    `Got status ${unauthMe.status}`
  );

  // 9. Quick-Login for Evaluator Switcher
  const quickRes = await req('/auth/quick-login', {
    method: 'POST',
    body: JSON.stringify({ userId: 'u2' }),
  });
  assert(
    quickRes.status === 200 && quickRes.data?.token && quickRes.data?.user?.name === 'Fatima Ahmed',
    9,
    'POST /auth/quick-login issues fresh signed JWT for chosen persona',
    JSON.stringify(quickRes.data)
  );

  const fatimaToken = quickRes.data?.token;

  // 10. Create Gig with Bearer Token (Authorization & Ownership Check)
  const createGigRes = await req('/gigs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${fatimaToken}` },
    body: JSON.stringify({
      title: 'UI/UX Redesign for Student Project',
      description: 'Need assistance refining the user interface of our prototype in Figma.',
      category: 'Design',
      type: 'Offering',
      payment_type: 'Paid',
      budget: 4500,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  assert(
    createGigRes.status === 201 && createGigRes.data?.owner_id === 'u2',
    10,
    'Create gig with Bearer JWT assigns gig ownership strictly to token user',
    JSON.stringify(createGigRes.data)
  );

  // 11. Forbidden Owner Control (Non-owner tries to cancel gig)
  const newGigId = createGigRes.data?.id;
  const nonOwnerCancel = await req(`/gigs/${newGigId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${aliToken}` }, // Ali is u1, owner is u2
    body: JSON.stringify({ status: 'Cancelled' }),
  });

  assert(
    nonOwnerCancel.status === 403,
    11,
    'Non-owner attempting to modify gig returns 403 Forbidden',
    `Got status ${nonOwnerCancel.status}`
  );

  // 12. Allowed Owner Control with Bearer Token
  const ownerCancel = await req(`/gigs/${newGigId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${fatimaToken}` }, // Fatima is u2, owner
    body: JSON.stringify({ status: 'Cancelled' }),
  });

  assert(
    ownerCancel.status === 200 && ownerCancel.data?.gig?.status === 'Cancelled',
    12,
    'Gig owner modifying gig with Bearer JWT returns 200 and succeeds',
    JSON.stringify(ownerCancel.data)
  );

  console.log('\n======================================================');
  console.log(`📊 AUTH TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED WITH 100% SUCCESS!\n');
  }
}

runAuthTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

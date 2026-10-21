// tests/api.test.js
// Automated test suite for Campus Gig & SkillSwap Portal API

const http = require('http');
const app = require('../server/index');
const storage = require('../server/storage');

const PORT = 5099;
let server;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("=============================================================");
  console.log("Starting Campus Gig & SkillSwap Portal Automated API Tests");
  console.log("=============================================================\n");

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
  });

  try {
    // Reset seed data before testing
    await request('/seed/reset', { method: 'POST' });

    // 1. Health check
    console.log("--- 1. Testing Health & API Accessibility ---");
    const health = await request('/health');
    assert(health.status === 200, "Health endpoint returns 200");
    assert(health.data.status === 'ok', "Health status is 'ok'");

    // 2. Seed Data Validation
    console.log("\n--- 2. Testing Seed Data Integrity ---");
    const usersRes = await request('/users');
    assert(usersRes.status === 200, "GET /users returns 200");
    assert(usersRes.data.length >= 12, `Seed users count is ${usersRes.data.length} (>= 12 required)`);

    const gigsRes = await request('/gigs');
    assert(gigsRes.status === 200, "GET /gigs returns 200");
    assert(gigsRes.data.length >= 25, `Seed gigs count is ${gigsRes.data.length} (>= 25 required)`);

    const appsRes = await request('/applications');
    assert(appsRes.status === 200, "GET /applications returns 200");
    assert(appsRes.data.length >= 20, `Seed applications count is ${appsRes.data.length} (>= 20 required)`);

    const revsRes = await request('/reviews');
    assert(revsRes.status === 200, "GET /reviews returns 200");
    assert(revsRes.data.length >= 8, `Seed reviews count is ${revsRes.data.length} (>= 8 required)`);

    // Verify required categories & statuses exist in seed
    const categories = new Set(gigsRes.data.map(g => g.category));
    ['Programming', 'Design', 'Writing', 'Tutoring'].forEach(cat => {
      assert(categories.has(cat), `Category '${cat}' exists in seed gigs`);
    });

    const types = new Set(gigsRes.data.map(g => g.type));
    ['Offering', 'Requesting'].forEach(t => {
      assert(types.has(t), `Type '${t}' exists in seed gigs`);
    });

    const paymentTypes = new Set(gigsRes.data.map(g => g.payment_type));
    ['Paid', 'SkillSwap', 'Free'].forEach(pt => {
      assert(paymentTypes.has(pt), `Payment type '${pt}' exists in seed gigs`);
    });

    const statuses = new Set(gigsRes.data.map(g => g.status));
    ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'].forEach(st => {
      assert(statuses.has(st), `Status '${st}' exists in seed gigs`);
    });

    // 3. User Profile Metrics Calculation & Profile Editing
    console.log("\n--- 3. Testing User Profile Computed Metrics & Profile Editing ---");
    const userDetailRes = await request('/users/usr_1');
    assert(userDetailRes.status === 200, "GET /users/usr_1 succeeds");
    assert(typeof userDetailRes.data.gigs_posted === 'number', "User has computed gigs_posted count");
    assert(typeof userDetailRes.data.gigs_completed === 'number', "User has computed gigs_completed count");
    assert(typeof userDetailRes.data.average_rating === 'number', "User has computed average_rating");
    assert(Array.isArray(userDetailRes.data.skills), "User profile includes skills array");

    // Test profile editing ownership protection: user 2 attempting to edit user 1
    const forbiddenEdit = await request('/users/usr_1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_2' },
      body: { name: 'Malicious Overwrite' }
    });
    assert(forbiddenEdit.status === 403, "Editing another student's profile blocked with 403 Forbidden");

    // Test empty name validation
    const emptyNameEdit = await request('/users/usr_1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { name: '   ' }
    });
    assert(emptyNameEdit.status === 400, "Updating student profile with empty name rejected with 400");

    // Test successful profile editing
    const validEdit = await request('/users/usr_1', {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        name: 'Ayesha Khan (Senior Engineer)',
        department: 'Software Engineering & AI',
        bio: 'Updated bio: Senior software engineering student focusing on distributed systems and React.',
        skills: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Docker', 'GraphQL']
      }
    });
    assert(validEdit.status === 200, "Valid profile update returns 200");
    assert(validEdit.data.name === 'Ayesha Khan (Senior Engineer)', "Updated student name reflected in API response");
    assert(validEdit.data.department === 'Software Engineering & AI', "Updated department reflected in API response");
    assert(validEdit.data.skills.includes('GraphQL'), "Updated skills reflected in API response");
    assert(typeof validEdit.data.gigs_posted === 'number', "Dynamic computed metrics preserved after profile update");

    // 3b. User Creation & Validation (POST /api/users)
    console.log("\n--- 3b. Testing Student Profile Creation (POST /api/users) ---");
    // Invalid: Missing name
    const missingNameRes = await request('/users', {
      method: 'POST',
      body: {
        major: 'Software Engineering',
        semester: '5th'
      }
    });
    assert(missingNameRes.status === 400, "User creation without name rejected with 400");

    // Invalid: Missing major
    const missingMajorRes = await request('/users', {
      method: 'POST',
      body: {
        name: 'Fatima Zahra',
        semester: '5th'
      }
    });
    assert(missingMajorRes.status === 400, "User creation without major rejected with 400");

    // Invalid: Missing semester
    const missingSemesterRes = await request('/users', {
      method: 'POST',
      body: {
        name: 'Fatima Zahra',
        major: 'Software Engineering'
      }
    });
    assert(missingSemesterRes.status === 400, "User creation without semester rejected with 400");

    // Invalid: Bad email format
    const badEmailRes = await request('/users', {
      method: 'POST',
      body: {
        name: 'Fatima Zahra',
        major: 'Software Engineering',
        semester: '5th',
        email: 'invalid-email-address'
      }
    });
    assert(badEmailRes.status === 400, "User creation with invalid email format rejected with 400");

    // Valid User Creation
    const createdStudentRes = await request('/users', {
      method: 'POST',
      body: {
        name: 'Fatima Zahra',
        email: 'fatima.zahra@campus.edu',
        major: 'Software Engineering',
        semester: '5th',
        bio: 'Passionate about mobile apps, accessibility, and tutoring peers in discrete math.',
        skills: ['React Native', 'Kotlin', 'Accessibility', 'Figma']
      }
    });
    assert(createdStudentRes.status === 201, "Valid student profile created with 201");
    const createdStudent = createdStudentRes.data;
    assert(typeof createdStudent.id === 'string' && createdStudent.id.startsWith('usr_'), "Unique user ID generated (usr_...)");
    assert(createdStudent.name === 'Fatima Zahra', "Created student name matches input");
    assert(createdStudent.email === 'fatima.zahra@campus.edu', "Created student email matches input");
    assert(createdStudent.skills.includes('Kotlin'), "Skills array stored correctly");
    assert(createdStudent.gigs_posted === 0, "Initial computed gigs_posted is 0");
    assert(createdStudent.average_rating === 0, "Initial computed average_rating is 0");

    // Duplicate Email Check
    const dupEmailRes = await request('/users', {
      method: 'POST',
      body: {
        name: 'Imposter Student',
        email: 'fatima.zahra@campus.edu',
        major: 'Computer Science',
        semester: '3rd'
      }
    });
    assert(dupEmailRes.status === 400, "Duplicate email registration rejected with 400");
    assert(dupEmailRes.data.error.includes("email already exists"), "Error specifies email already exists");

    // Verify dynamic user fetching includes created student along with all seeded users
    const allUsersAfterCreate = await request('/users');
    assert(allUsersAfterCreate.data.length >= 15, `Total users count updated to ${allUsersAfterCreate.data.length} (includes seeded + new)`);
    assert(allUsersAfterCreate.data.some(u => u.id === createdStudent.id), "New student profile is dynamically returned in GET /users");

    // Verify new user can participate in gig creation
    const newUserGigRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': createdStudent.id },
      body: {
        user_id: createdStudent.id,
        title: 'Offering Kotlin Android App Tutoring & Code Review',
        description: 'I can help sophomore students debug their Android Studio projects and Gradle builds.',
        type: 'Offering',
        category: 'Tutoring',
        payment_type: 'Paid',
        budget: 40,
        deadline: '2026-12-10T00:00:00Z'
      }
    });
    assert(newUserGigRes.status === 201, "Newly created user can successfully post a gig");
    assert(newUserGigRes.data.user_id === createdStudent.id, "Gig is attributed to newly created user");

    // Verify new user can apply for existing gigs
    const newUserApplyRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': createdStudent.id },
      body: {
        gig_id: 'gig_1', // Gig posted by usr_1
        applicant_id: createdStudent.id,
        message: 'Hello! I am Fatima and I would love to collaborate on the symposium website.'
      }
    });
    assert(newUserApplyRes.status === 201, "Newly created user can apply to gigs");
    assert(newUserApplyRes.data.applicant_id === createdStudent.id, "Application attributed to newly created user");

    // 4. Gig Creation & Validation (with Identity Enforcement)
    console.log("\n--- 4. Testing Identity Enforcement on Protected Routes (401/403) ---");
    // Missing acting user on protected routes -> 401
    const missingUserGigRes = await request('/gigs', {
      method: 'POST',
      body: { title: 'Test Gig Without Identity' }
    });
    assert(missingUserGigRes.status === 401, "Missing acting-user on POST /gigs rejected with 401 Unauthorized");

    const missingUserAppRes = await request('/applications', {
      method: 'POST',
      body: { gig_id: 'gig_1', message: 'Hello without user' }
    });
    assert(missingUserAppRes.status === 401, "Missing acting-user on POST /applications rejected with 401 Unauthorized");

    const missingUserRevRes = await request('/reviews', {
      method: 'POST',
      body: { gig_id: 'gig_19', rating: 5, comment: 'Great job' }
    });
    assert(missingUserRevRes.status === 401, "Missing acting-user on POST /reviews rejected with 401 Unauthorized");

    const missingUserPatchGigRes = await request('/gigs/gig_1', {
      method: 'PATCH',
      body: { title: 'Unauthorized Patch' }
    });
    assert(missingUserPatchGigRes.status === 401, "Missing acting-user on PATCH /gigs/:id rejected with 401 Unauthorized");

    const missingUserDeleteGigRes = await request('/gigs/gig_1', {
      method: 'DELETE'
    });
    assert(missingUserDeleteGigRes.status === 401, "Missing acting-user on DELETE /gigs/:id rejected with 401 Unauthorized");

    const missingUserPatchAppRes = await request('/applications/app_1', {
      method: 'PATCH',
      body: { action: 'accept' }
    });
    assert(missingUserPatchAppRes.status === 401, "Missing acting-user on PATCH /applications/:id rejected with 401 Unauthorized");

    const missingUserPatchProfileRes = await request('/users/usr_1', {
      method: 'PATCH',
      body: { name: 'New Name' }
    });
    assert(missingUserPatchProfileRes.status === 401, "Missing acting-user on PATCH /users/:id rejected with 401 Unauthorized");

    // Invalid acting user on protected routes -> 401
    const invalidUserGigRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_nonexistent_9999' },
      body: {
        title: 'Build Python Web Scraper',
        description: 'Need a python web scraper built using BeautifulSoup',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 50,
        deadline: '2026-12-01T00:00:00Z'
      }
    });
    assert(invalidUserGigRes.status === 401, "Invalid acting-user on POST /gigs rejected with 401 Unauthorized");

    const invalidUserAppRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_nonexistent_9999' },
      body: {
        gig_id: 'gig_1',
        message: 'Applying with invalid persona'
      }
    });
    assert(invalidUserAppRes.status === 401, "Invalid acting-user on POST /applications rejected with 401 Unauthorized");

    // Impersonation attempts through request body -> 403
    const impersonateGigRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        user_id: 'usr_2', // Attempting to create on behalf of usr_2 while acting as usr_1
        title: 'Malicious Impersonation Gig',
        description: 'Trying to attribute this gig to user 2 without permission',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 50,
        deadline: '2026-12-01T00:00:00Z'
      }
    });
    assert(impersonateGigRes.status === 403, "Attempt to impersonate another user_id on POST /gigs rejected with 403 Forbidden");

    const impersonateAppRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: 'gig_2',
        applicant_id: 'usr_3', // Attempting to apply as usr_3 while acting as usr_1
        message: 'Applying on behalf of someone else'
      }
    });
    assert(impersonateAppRes.status === 403, "Attempt to impersonate another applicant_id on POST /applications rejected with 403 Forbidden");

    const impersonateReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: 'gig_19',
        reviewer_id: 'usr_6', // Attempting to review as usr_6 while acting as usr_1
        rating: 5,
        comment: 'Impersonated review'
      }
    });
    assert(impersonateReviewRes.status === 403, "Attempt to impersonate another reviewer_id on POST /reviews rejected with 403 Forbidden");

    // 4b. Gig Creation & Validation
    console.log("\n--- 4b. Testing Gig Creation & Validation ---");
    // Invalid: Paid gig with no budget
    const invalidBudgetRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        user_id: 'usr_1',
        title: 'Build Python Web Scraper',
        description: 'Need a python web scraper built using BeautifulSoup for school project',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        deadline: '2026-12-01T00:00:00Z'
      }
    });
    assert(invalidBudgetRes.status === 400, "Paid gig without budget rejected with 400");

    // Invalid: Past deadline
    const invalidDeadlineRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        user_id: 'usr_1',
        title: 'Build Python Web Scraper',
        description: 'Need a python web scraper built using BeautifulSoup for school project',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 50,
        deadline: '2025-01-01T00:00:00Z'
      }
    });
    assert(invalidDeadlineRes.status === 400, "Gig with past deadline rejected with 400");

    // Valid: Paid gig creation
    const validGigRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        title: 'Build Python Web Scraper for Thesis Project',
        description: 'Need a python web scraper built using BeautifulSoup and requests for thesis data collection.',
        type: 'Requesting',
        category: 'Programming',
        payment_type: 'Paid',
        budget: 65,
        deadline: '2026-12-15T00:00:00Z'
      }
    });
    assert(validGigRes.status === 201, "Valid Paid gig created with 201");
    const createdGigId = validGigRes.data.id;
    assert(validGigRes.data.status === 'Open', "Newly created gig has status 'Open'");
    assert(validGigRes.data.user_id === 'usr_1', "Created gig is associated with verified acting user usr_1");

    // Valid: SkillSwap gig creation without budget
    const skillSwapGigRes = await request('/gigs', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_3' },
      body: {
        title: 'Swap UI Design for C++ Multithreading Guidance',
        description: 'Offering complete Figma wireframe system for help with C++ POSIX thread synchronization.',
        type: 'Offering',
        category: 'Design',
        payment_type: 'SkillSwap',
        budget: null,
        deadline: '2026-12-20T00:00:00Z'
      }
    });
    assert(skillSwapGigRes.status === 201, "SkillSwap gig created without budget successfully");

    // Non-owner attempts to update or cancel gig -> 403
    const nonOwnerUpdateGigRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_2' }, // Not the owner (usr_1 is owner)
      body: { title: 'Malicious Title Edit' }
    });
    assert(nonOwnerUpdateGigRes.status === 403, "Non-owner attempt to update gig rejected with 403 Forbidden");

    const nonOwnerCancelGigRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_2' }, // Not the owner
      body: { status: 'Cancelled' }
    });
    assert(nonOwnerCancelGigRes.status === 403, "Non-owner attempt to cancel gig rejected with 403 Forbidden");

    const nonOwnerDeleteGigRes = await request(`/gigs/${createdGigId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': 'usr_2' } // Not the owner
    });
    assert(nonOwnerDeleteGigRes.status === 403, "Non-owner attempt to delete gig rejected with 403 Forbidden");

    // Direct transition to In Progress via generic PATCH /gigs/:id must be rejected
    const directInProgressRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { status: 'In Progress' }
    });
    assert(directInProgressRes.status === 400, "Direct transition from Open to In Progress via PATCH /gigs/:id rejected with 400");
    assert(directInProgressRes.data.error.includes("Direct transition"), "Error specifies direct transition to In Progress is not permitted");

    // 5. Search, Filter, and Sort (including ?q alias)
    console.log("\n--- 5. Testing Search and Filtering ---");
    const searchRes = await request('/gigs?search=Scraper');
    assert(searchRes.data.some(g => g.id === createdGigId), "Search by keyword '?search=Scraper' found created gig");

    const qAliasRes = await request('/gigs?q=Scraper');
    assert(qAliasRes.data.some(g => g.id === createdGigId), "Search by keyword alias '?q=Scraper' found created gig");

    const categoryFilterRes = await request('/gigs?category=Design');
    assert(categoryFilterRes.data.every(g => g.category === 'Design'), "Category filter returns only Design gigs");

    const budgetFilterRes = await request('/gigs?min_budget=50&max_budget=70');
    assert(budgetFilterRes.data.every(g => g.budget >= 50 && g.budget <= 70), "Budget range filter accurately filters gigs");

    // 6. Application Workflow & Validation
    console.log("\n--- 6. Testing Application Validations ---");
    // Self-application prevention (usr_1 owns createdGigId)
    const selfAppRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: createdGigId,
        message: 'Applying to my own gig which should fail'
      }
    });
    assert(selfAppRes.status === 400, "Self-application rejected with 400");
    assert(selfAppRes.data.error.includes("own gig"), "Error message specifies cannot apply to own gig");

    // Valid application from usr_2
    const app1Res = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_2' },
      body: {
        gig_id: createdGigId,
        message: 'I have 2 years of Python scraping experience with BeautifulSoup and Selenium.'
      }
    });
    assert(app1Res.status === 201, "Applicant usr_2 applied successfully");
    const app1Id = app1Res.data.id;
    assert(app1Res.data.applicant_id === 'usr_2', "Applicant ID derived from verified acting user usr_2");

    // Duplicate application prevention
    const dupAppRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_2' },
      body: {
        gig_id: createdGigId,
        message: 'Attempting duplicate application'
      }
    });
    assert(dupAppRes.status === 400, "Duplicate application rejected with 400");

    // Second applicant applies: usr_6
    const app2Res = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_6' },
      body: {
        gig_id: createdGigId,
        message: 'I can write this scraper and dump data directly to PostgreSQL or JSON.'
      }
    });
    assert(app2Res.status === 201, "Applicant usr_6 applied successfully");
    const app2Id = app2Res.data.id;

    // 7. Applicant Selection & Automatic Rejection of Others
    console.log("\n--- 7. Testing Applicant Selection & Automatic Status Transitions ---");
    // Unauthorized user attempts to accept applicant
    const unauthAcceptRes = await request(`/applications/${app1Id}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_4' }, // Not the gig owner
      body: { action: 'accept' }
    });
    assert(unauthAcceptRes.status === 403, "Non-owner cannot accept applicants (403 Forbidden)");

    // Unauthorized user attempts to reject applicant
    const unauthRejectRes = await request(`/applications/${app1Id}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_4' }, // Not the gig owner
      body: { action: 'reject' }
    });
    assert(unauthRejectRes.status === 403, "Non-owner cannot reject applicants (403 Forbidden)");

    // Owner accepts applicant usr_2
    const acceptRes = await request(`/applications/${app1Id}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' }, // Gig owner
      body: { action: 'accept' }
    });
    assert(acceptRes.status === 200, "Owner accepted applicant usr_2");
    assert(acceptRes.data.application.status === 'Accepted', "Application status marked 'Accepted'");
    assert(acceptRes.data.gig.status === 'In Progress', "Gig status transitioned to 'In Progress'");
    assert(acceptRes.data.gig.accepted_applicant_id === 'usr_2', "Gig accepted_applicant_id set to usr_2");

    // Verify other pending application (usr_6) was automatically marked Rejected
    const rejectedAppRes = await request('/applications?gig_id=' + createdGigId);
    const otherApp = rejectedAppRes.data.find(a => a.id === app2Id);
    assert(otherApp.status === 'Rejected', "Other pending applicant was automatically Rejected");

    // Enforce valid application decisions:
    // 1. Acceptance of Rejected application must fail (400)
    const acceptRejectedRes = await request(`/applications/${app2Id}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { action: 'accept' }
    });
    assert(acceptRejectedRes.status === 400, "Acceptance of Rejected application rejected with 400");

    // 2. Rejection of Accepted application must fail (400)
    const rejectAcceptedRes = await request(`/applications/${app1Id}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { action: 'reject' }
    });
    assert(rejectAcceptedRes.status === 400, "Rejection of Accepted application rejected with 400");

    // Block new applications while In Progress
    const blockedAppRes = await request('/applications', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_10' },
      body: {
        gig_id: createdGigId,
        message: 'Applying after applicant was already accepted'
      }
    });
    assert(blockedAppRes.status === 400, "New application to In Progress gig blocked with 400");

    // 8. Status Transitions Enforcement
    console.log("\n--- 8. Testing Status Transition Rules ---");
    // Illegal transition: In Progress -> Open (should fail)
    const illegalTransitionRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { status: 'Open' }
    });
    assert(illegalTransitionRes.status === 400, "Transition from In Progress back to Open rejected with 400");

    // Legal transition: In Progress -> Completed
    const completeRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { status: 'Completed' }
    });
    assert(completeRes.status === 200, "Gig transitioned from In Progress to Completed");
    assert(completeRes.data.status === 'Completed', "Gig status is now 'Completed'");

    // Illegal transition: Completed -> Open or In Progress (should fail)
    const modifyCompletedRes = await request(`/gigs/${createdGigId}`, {
      method: 'PATCH',
      headers: { 'x-user-id': 'usr_1' },
      body: { status: 'In Progress' }
    });
    assert(modifyCompletedRes.status === 400, "Modifying Completed gig rejected with 400");

    // 9. Mutual Reviews Workflow
    console.log("\n--- 9. Testing Mutual Reviews Workflow ---");
    // Non-participant usr_4 attempts to review
    const unauthReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_4' },
      body: {
        gig_id: createdGigId,
        rating: 5,
        comment: 'I did not work on this gig'
      }
    });
    assert(unauthReviewRes.status === 403, "Non-participant review rejected with 403");

    // Invalid rating (not 1-5 integer)
    const invalidRatingRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: createdGigId,
        rating: 6,
        comment: 'Great work'
      }
    });
    assert(invalidRatingRes.status === 400, "Rating > 5 rejected with 400");

    // Owner reviews accepted applicant (usr_1 reviews usr_2)
    const ownerReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: createdGigId,
        rating: 5,
        comment: 'Bilal wrote clean, well-tested scraper code and completed it ahead of schedule!'
      }
    });
    assert(ownerReviewRes.status === 201, "Owner submitted review for applicant (201)");
    assert(ownerReviewRes.data.reviewee_id === 'usr_2', "Review correctly attributed to usr_2");

    // Accepted applicant reviews owner (usr_2 reviews usr_1)
    const applicantReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_2' },
      body: {
        gig_id: createdGigId,
        rating: 5,
        comment: 'Ayesha gave clear requirements and verified the output promptly. Super pleasant to work with.'
      }
    });
    assert(applicantReviewRes.status === 201, "Applicant submitted review for owner (201)");
    assert(applicantReviewRes.data.reviewee_id === 'usr_1', "Review correctly attributed to usr_1");

    // Duplicate review check
    const dupReviewRes = await request('/reviews', {
      method: 'POST',
      headers: { 'x-user-id': 'usr_1' },
      body: {
        gig_id: createdGigId,
        rating: 4,
        comment: 'Trying to submit a second review'
      }
    });
    assert(dupReviewRes.status === 400, "Duplicate review rejected with 400");

    // 10. Persistence Test
    console.log("\n--- 10. Testing Persistence Across Storage Reloads ---");
    const freshStorage = require('../server/storage');
    const persistedGig = freshStorage.getGigById(createdGigId);
    assert(persistedGig !== null, "Created gig persists in storage");
    assert(persistedGig.status === 'Completed', "Gig status 'Completed' persists");
    assert(persistedGig.accepted_applicant_id === 'usr_2', "Accepted applicant ID 'usr_2' persists");

    console.log("\n=============================================================");
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log("=============================================================\n");
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();

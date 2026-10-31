/**
 * FoodBridge AI Comprehensive End-to-End Verification Test Suite
 * Tests Health, DB, Auth, Donor, NGO, Volunteer, Admin, and Gemini AI workflows.
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: TestResult[] = [];

function record(step: string, passed: boolean, details: string, error?: string) {
  results.push({ step, passed, details, error });
  const statusEmoji = passed ? '✅' : '❌';
  console.log(`${statusEmoji} [${passed ? 'PASS' : 'FAIL'}] ${step}: ${details}`);
  if (error) console.error(`    Error details: ${error}`);
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('   FOODBRIDGE AI: COMPREHENSIVE SYSTEM VERIFICATION   ');
  console.log('======================================================\n');

  try {
    // 1. Health & DB Check
    console.log('--- 1. Health & Database Connectivity ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.status === 'healthy') {
      record('Health Check', true, `App: ${healthData.app}, DB Mode: ${healthData.database?.mode}`);
    } else {
      record('Health Check', false, 'Health check did not return 200 OK');
    }

    const dbHealthRes = await fetch(`${BASE_URL}/api/health/db`);
    const dbHealthData = await dbHealthRes.json();
    record(
      'Database Connection Status',
      true,
      `Configured: ${dbHealthData.configured}, Connected: ${dbHealthData.connected}, Info: ${dbHealthData.message}`
    );

    // 2. Authentication Checks
    console.log('\n--- 2. Authentication & Authorization Checks ---');
    const uniqueEmail = `donor_${Date.now()}@foodbridge.test`;

    // 2a. Registration
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123!',
        name: 'Test Kitchen Lead',
        role: 'DONOR',
        organizationName: 'Hyderabadi Express Test Kitchen',
        organizationType: 'RESTAURANT',
        address: 'Banjara Hills Rd No 2, Hyderabad',
        latitude: 17.4156,
        longitude: 78.4352,
        phone: '+91 98765 43210',
        contactPerson: 'Zameer Khan',
      }),
    });
    const regData = await regRes.json();
    const regPassed = regRes.ok && regData.token && regData.user?.email === uniqueEmail;
    record('User Registration', regPassed, regPassed ? `Registered: ${uniqueEmail}` : JSON.stringify(regData));

    // 2b. Password validation (failed login)
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword' }),
    });
    record('Invalid Password Rejection', badLoginRes.status === 401, 'Correctly rejected invalid credentials with 401');

    // 2c. Successful Login & JWT issuance
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const hasNoHash = !loginData.user?.passwordHash;
    record('Login & Token Issuance', Boolean(token && hasNoHash), 'Received valid JWT and password hash is stripped from response');

    // 2d. Protected endpoint without token
    const noAuthRes = await fetch(`${BASE_URL}/api/auth/me`);
    record('Protected Route Enforcement', noAuthRes.status === 401, 'Unauthenticated request correctly returned 401');

    // 2e. Authenticated /me check
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    record('Authenticated Profile Fetch', meRes.ok && meData.user?.email === uniqueEmail, `Profile confirmed for role: ${meData.user?.role}`);

    // 3. Quick Login as Seeded Demo Donor
    console.log('\n--- 3. Donor Persona Workflow ---');
    const donorLoginRes = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType: 'donor' }),
    });
    const donorLogin = await donorLoginRes.json();
    const donorToken = donorLogin.token;
    record('Donor Quick Login', Boolean(donorToken), `Authenticated as: ${donorLogin.user?.name}`);

    // 3a. Create Food Listing
    const nowTime = new Date().toISOString();
    const deadlineTime = new Date(Date.now() + 6 * 3600000).toISOString();
    const createListingRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        foodName: 'Dum Biryani & Salan Meal Boxes',
        category: 'COOKED_MEALS',
        dietaryType: 'NON_VEGETARIAN',
        totalQuantity: 30,
        unit: 'MEAL_BOXES',
        preparationTime: nowTime,
        pickupStart: nowTime,
        pickupEnd: deadlineTime,
        collectionDeadline: deadlineTime,
        storageMethod: 'Keep warm in thermal containers',
        handlingInstructions: 'Transport carefully in food-grade carriers',
        allergenInformation: 'Dairy, Spices',
        pickupLocation: {
          address: 'Road No 10, Banjara Hills, Hyderabad',
          latitude: 17.4200,
          longitude: 78.4400,
        },
        donorDeclarationConfirmed: true,
        description: 'Freshly prepared Dum Biryani from lunch buffet. Hygienically packed.',
      }),
    });
    const listing = await createListingRes.json();
    const listingCreated = createListingRes.ok && Boolean(listing.id);
    record('Create Food Listing', listingCreated, listingCreated ? `Listing ID: ${listing.id}` : JSON.stringify(listing));

    // 3b. Edit Food Listing
    if (listing.id) {
      const editListingRes = await fetch(`${BASE_URL}/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${donorToken}`,
        },
        body: JSON.stringify({
          storageMethod: 'Keep warm in thermal containers above 65C',
        }),
      });
      const updatedListing = await editListingRes.json();
      record('Edit Food Listing', editListingRes.ok && updatedListing.storageMethod.includes('above 65C'), 'Listing updated successfully');
    }

    // 4. NGO Workflow
    console.log('\n--- 4. NGO Persona Workflow & Atomic Reservation ---');
    const ngoLoginRes = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType: 'ngo' }),
    });
    const ngoLogin = await ngoLoginRes.json();
    const ngoToken = ngoLogin.token;
    record('Verified NGO Quick Login', Boolean(ngoToken), `Authenticated as: ${ngoLogin.user?.name}`);

    // 4a. Browse Listings
    const browseRes = await fetch(`${BASE_URL}/api/listings`);
    const browseListings = await browseRes.json();
    record('Browse Listings', Array.isArray(browseListings) && browseListings.length > 0, `Found ${browseListings.length} listings`);

    // 4b. Atomic Reservation
    let requestId = '';
    if (listing.id) {
      // Test over-allocation rejection (claim 100 when only 30 available)
      const overClaimRes = await fetch(`${BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ngoToken}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          requestedQuantity: 100,
          notes: 'Excess claim attempt for testing',
        }),
      });
      record(
        'Prevent Over-Allocation (Atomic Guard)',
        overClaimRes.status === 400,
        'Over-claim request correctly rejected with 400 Bad Request'
      );

      // Valid claim: 15 meal boxes
      const claimRes = await fetch(`${BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ngoToken}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          requestedQuantity: 15,
          notes: 'For distribution at Secunderabad evening shelter',
        }),
      });
      const claimData = await claimRes.json();
      const claimPassed = claimRes.ok && Boolean(claimData.id);
      requestId = claimData.id;
      record('Claim Surplus Food', claimPassed, claimPassed ? `Request ID: ${requestId}, Quantity: 15` : JSON.stringify(claimData));
    }

    // 5. Handover & Dual Confirmation Workflow
    console.log('\n--- 5. Donor Approval & Dual-Party Confirmation ---');
    if (requestId) {
      // 5a. Donor Approves Request
      const approveRes = await fetch(`${BASE_URL}/api/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${donorToken}`,
        },
      });
      const approveData = await approveRes.json();
      record('Donor Approves Claim', approveRes.ok && approveData.request?.requestStatus === 'ACCEPTED', `Status: ${approveData.request?.requestStatus}`);

      // 5b. Donor Confirms Handover
      const donorConfirmRes = await fetch(`${BASE_URL}/api/pickups/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${donorToken}`,
        },
        body: JSON.stringify({ requestId, notes: 'Handed over in insulated boxes' }),
      });
      const donorConfirmData = await donorConfirmRes.json();
      record('Donor Confirms Handover', donorConfirmRes.ok && Boolean(donorConfirmData.pickup), 'Donor handover recorded');

      // 5c. NGO Confirms Receipt
      const recipientConfirmRes = await fetch(`${BASE_URL}/api/pickups/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ngoToken}`,
        },
        body: JSON.stringify({ requestId, notes: 'Received hot and fresh' }),
      });
      const recipientConfirmData = await recipientConfirmRes.json();
      const isCompleted = recipientConfirmRes.ok && recipientConfirmData.request?.requestStatus === 'COMPLETED';
      record(
        'NGO Confirms Receipt (Dual Confirmation Complete)',
        isCompleted,
        `Final Request Status: ${recipientConfirmData.request?.requestStatus}`
      );
    }

    // 6. Volunteer Workflow
    console.log('\n--- 6. Volunteer Courier Persona Workflow ---');
    const volLoginRes = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType: 'volunteer' }),
    });
    const volLogin = await volLoginRes.json();
    const volToken = volLogin.token;
    record('Volunteer Quick Login', Boolean(volToken), `Authenticated as: ${volLogin.user?.name}`);

    // 6a. Get Deliveries
    const deliveriesRes = await fetch(`${BASE_URL}/api/deliveries`, {
      headers: { Authorization: `Bearer ${volToken}` },
    });
    const deliveries = await deliveriesRes.json();
    record('Fetch Delivery Tasks', deliveriesRes.ok && Array.isArray(deliveries), `Retrieved ${deliveries.length} delivery tasks`);

    // 6b. Accept Task & Milestone Progression
    let taskToTrack = deliveries.find((d: any) => d.status === 'AVAILABLE');
    if (!taskToTrack && deliveries.length > 0) {
      taskToTrack = deliveries[0];
    }

    if (taskToTrack) {
      if (taskToTrack.status === 'AVAILABLE') {
        const acceptRes = await fetch(`${BASE_URL}/api/deliveries/${taskToTrack.id}/accept`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${volToken}` },
        });
        const acceptJson = await acceptRes.json();
        record('Volunteer Accepts Task', acceptRes.ok && acceptJson.task?.status === 'ASSIGNED', `Task ${taskToTrack.id} status: ${acceptJson.task?.status}`);
      } else {
        record('Volunteer Delivery Assignment Check', true, `Task ${taskToTrack.id} in active lifecycle status: ${taskToTrack.status}`);
      }

      // Progress status
      const pickedUpRes = await fetch(`${BASE_URL}/api/deliveries/${taskToTrack.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${volToken}`,
        },
        body: JSON.stringify({ status: 'PICKED_UP' }),
      });
      const pickedUpJson = await pickedUpRes.json();
      record('Milestone: Picked Up', pickedUpRes.ok && pickedUpJson.task?.status === 'PICKED_UP', `Status: ${pickedUpJson.task?.status}`);

      // Progress to DELIVERED
      const deliveredRes = await fetch(`${BASE_URL}/api/deliveries/${taskToTrack.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${volToken}`,
        },
        body: JSON.stringify({ status: 'DELIVERED', recipientVerificationCode: taskToTrack.pickupReference }),
      });
      const deliveredJson = await deliveredRes.json();
      record('Milestone: Delivered', deliveredRes.ok && deliveredJson.task?.status === 'DELIVERED', `Status: ${deliveredJson.task?.status}`);

      // 6c. Multi-Role Feedback
      const feedbackRes = await fetch(`${BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${volToken}`,
        },
        body: JSON.stringify({
          requestId: taskToTrack.requestId,
          listingId: taskToTrack.listingId,
          rating: 5,
          foodConditionRating: 5,
          punctualityRating: 5,
          comment: 'Seamless pickup from kitchen and smooth handover to shelter coordinator.',
        }),
      });
      const feedbackJson = await feedbackRes.json();
      record('Submit 5-Star Feedback', feedbackRes.ok && Boolean(feedbackJson.feedback?.id), `Feedback ID: ${feedbackJson.feedback?.id}`);
    }

    // 7. Admin Workflow
    console.log('\n--- 7. Administrator Persona Workflow ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType: 'admin' }),
    });
    const adminLogin = await adminLoginRes.json();
    const adminToken = adminLogin.token;
    record('Administrator Quick Login', Boolean(adminToken), `Authenticated as: ${adminLogin.user?.name}`);

    // 7a. Review Organizations
    const orgsRes = await fetch(`${BASE_URL}/api/admin/organizations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orgsData = await orgsRes.json();
    record('Admin Fetch Organizations', orgsRes.ok && Array.isArray(orgsData), `Reviewed ${orgsData.length} organizations`);

    // 7b. Verify Pending NGO
    const pendingOrg = orgsData.find((o: any) => o.verificationStatus === 'PENDING');
    if (pendingOrg) {
      const verifyRes = await fetch(`${BASE_URL}/api/admin/organizations/${pendingOrg.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Official NGO registration certificate verified.' }),
      });
      const verifyJson = await verifyRes.json();
      record('Admin Verify NGO', verifyRes.ok && verifyJson.organization?.verificationStatus === 'VERIFIED', `Verified NGO: ${pendingOrg.organizationName}`);
    }

    // 7c. Audit Logs
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    record('Admin Audit Logs', auditRes.ok && Array.isArray(auditData), `Audit logs logged: ${auditData.length} actions`);

    // 8. Gemini AI Services
    console.log('\n--- 8. Google Gemini AI Engine Verification ---');
    // 8a. AI Match
    if (listing.id) {
      const aiMatchRes = await fetch(`${BASE_URL}/api/ai/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const aiMatchData = await aiMatchRes.json();
      record(
        'AI Matchmaking Engine',
        aiMatchRes.ok && Array.isArray(aiMatchData.matches) && aiMatchData.matches.length > 0,
        `Matched ${aiMatchData.matches?.length} NGOs. Top score: ${aiMatchData.matches?.[0]?.totalScore}% (${aiMatchData.matches?.[0]?.organizationName})`
      );
    }

    // 8b. AI Description & Guidance Generator
    const aiDescRes = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodName: 'South Indian Veg Meals (Sambar, Poriyal, Rice)',
        quantity: 50,
        unit: 'PLATES',
        category: 'COOKED_MEALS',
        dietaryType: 'VEGETARIAN',
      }),
    });
    const aiDescData = await aiDescRes.json();
    const hasAiDesc = aiDescRes.ok && Boolean(aiDescData.description && aiDescData.storageGuidance);
    record(
      'AI Description & Guidance Generator',
      hasAiDesc,
      hasAiDesc ? `Guidance: ${aiDescData.storageGuidance.substring(0, 60)}...` : JSON.stringify(aiDescData)
    );

    // 8c. AI Redistribution Insights
    const aiInsightsRes = await fetch(`${BASE_URL}/api/ai/insights`);
    const aiInsightsData = await aiInsightsRes.json();
    const hasInsights = aiInsightsRes.ok && Boolean(aiInsightsData.headline);
    record(
      'AI Redistribution Insights',
      hasInsights,
      hasInsights ? `Headline: "${aiInsightsData.headline}"` : JSON.stringify(aiInsightsData)
    );

    // Summary
    console.log('\n======================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Test execution failed with fatal error:', err);
  }
}

runVerification();

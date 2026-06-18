import assert from 'assert';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const runTests = async () => {
  console.log('--- STARTING CRDMS BACKEND INTEGRATION TESTS (EMAIL AUTH & USER EDIT) ---');

  try {
    // Test 1: Admin Login by Email
    console.log('Testing Admin authentication using email...');
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@crdms.com', password: 'adminpassword' })
    });

    assert.strictEqual(loginRes.status, 200, 'Admin login should return HTTP 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Login should return a valid JWT token');
    assert.strictEqual(loginData.user.role, 'Admin', 'Logged in user role should be Admin');
    const adminToken = loginData.token;
    console.log('✓ Admin login by email assertion passed.');

    // Test 2: Fetch Candidates and verify response time
    console.log('Testing Candidates search performance (< 2s)...');
    const startTime = Date.now();
    const listRes = await fetch(`${BACKEND_URL}/candidates`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const duration = Date.now() - startTime;
    assert.strictEqual(listRes.status, 200, 'Fetching candidates should return HTTP 200');
    const candidates = await listRes.json();
    assert.ok(Array.isArray(candidates), 'Candidates endpoint should return an array');
    console.log(`✓ Candidates listed. Search response time: ${duration}ms (Performance criteria: < 2000ms)`);
    assert.ok(duration < 2000, 'Search duration must be under 2 seconds');

    // Test 3: Add Candidate Profile (CRUD CREATE)
    console.log('Testing Candidate profile creation...');
    const newCandPayload = {
      name: 'Integration Test Candidate',
      email: 'integration.test@crdms.com',
      phone: '+1 111-222-3333',
      skills: 'Integration testing, Node, SQLite',
      location: 'Test City',
      experience_years: 2.5,
      status: 'Applied'
    };

    const createRes = await fetch(`${BACKEND_URL}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newCandPayload)
    });

    assert.strictEqual(createRes.status, 201, 'Create candidate should return HTTP 201');
    const createData = await createRes.json();
    assert.ok(createData.id, 'Created profile should return record ID');
    const testCandidateId = createData.id;
    console.log('✓ Candidate profile successfully created.');

    // Test 4: Role-Based Access Control (RBAC) Verification
    console.log('Testing RBAC permissions...');
    
    // Log in as a Manager (Management Role) using email
    const managerLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@crdms.com', password: 'managerpassword' })
    });
    const managerLoginData = await managerLoginRes.json();
    const managerToken = managerLoginData.token;

    // A Manager should NOT have permission to delete candidate records
    const deleteByManagerRes = await fetch(`${BACKEND_URL}/candidates/${testCandidateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    assert.strictEqual(deleteByManagerRes.status, 403, 'Deleting candidate by Manager role should be blocked with HTTP 403');
    console.log('✓ Manager deletion restriction verified successfully.');

    // Clean up created test candidate using Admin
    console.log('Cleaning up test data...');
    const deleteByAdminRes = await fetch(`${BACKEND_URL}/candidates/${testCandidateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(deleteByAdminRes.status, 200, 'Admin deletion should return HTTP 200');
    console.log('✓ Test candidate record removed successfully.');

    // Test 5: Edit User Profile (Admin only PUT)
    console.log('Testing User updating endpoint (PUT /users/:id)...');
    
    // Get users roster
    const usersRes = await fetch(`${BACKEND_URL}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const users = await usersRes.json();
    
    // Find manager user
    const managerUser = users.find(u => u.username === 'manager');
    assert.ok(managerUser, 'Manager account should exist in DB');
    
    // Change manager's email to 'manager_updated@crdms.com'
    const updateRes = await fetch(`${BACKEND_URL}/users/${managerUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: 'manager_updated@crdms.com',
        role: 'Management' // Keep same role
      })
    });

    assert.strictEqual(updateRes.status, 200, 'Updating user should return HTTP 200');
    console.log('✓ Manager email successfully modified.');

    // Reset manager email back to default to keep DB clean
    const resetRes = await fetch(`${BACKEND_URL}/users/${managerUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: 'manager@crdms.com',
        role: 'Management'
      })
    });
    assert.strictEqual(resetRes.status, 200, 'Resetting user back to default should return HTTP 200');
    console.log('✓ Manager email reset successfully.');

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
};

runTests();

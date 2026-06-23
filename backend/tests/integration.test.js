import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const runTests = async () => {
  console.log('--- STARTING CRDMS BACKEND INTEGRATION TESTS ---');

  try {
    // Test 1: Admin Login by Email
    console.log('Testing Admin authentication...');
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@crdms.com', password: 'adminpassword' })
    });

    assert.strictEqual(loginRes.status, 200, 'Admin login should return HTTP 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.success, 'Response wrapper success field should be true');
    assert.ok(loginData.data.accessToken, 'Login should return a valid access JWT token');
    assert.strictEqual(loginData.data.user.role, 'Admin', 'Logged in user role should be Admin');
    const adminToken = loginData.data.accessToken;
    console.log('✓ Admin login assertion passed.');

    // Test 2: Fetch Candidates and verify response time
    console.log('Testing Candidates search performance...');
    const startTime = Date.now();
    const listRes = await fetch(`${BACKEND_URL}/candidates`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const duration = Date.now() - startTime;
    assert.strictEqual(listRes.status, 200, 'Fetching candidates should return HTTP 200');
    const listData = await listRes.json();
    assert.ok(listData.success, 'Candidates fetch success should be true');
    assert.ok(Array.isArray(listData.data.candidates), 'Candidates endpoint should return a candidates array');
    console.log(`✓ Candidates listed. Search response time: ${duration}ms (Goal: < 2000ms)`);
    assert.ok(duration < 2000, 'Search duration must be under 2 seconds');

    // Test 3: Add Candidate Profile (CRUD CREATE)
    console.log('Testing Candidate profile creation...');
    const newCandPayload = {
      name: 'Integration Test Candidate',
      email: 'integration.test@crdms.com',
      phone: '+91 99999 88888',
      skills: 'Integration testing, Node, MySQL, Mocha',
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
    assert.ok(createData.success, 'Candidate creation response success field should be true');
    assert.ok(createData.data.id, 'Created profile should return record ID');
    const testCandidateId = createData.data.id;
    console.log('✓ Candidate profile successfully created.');

    // Test 4: Role-Based Access Control (RBAC) Verification
    console.log('Testing RBAC permissions...');
    
    // Log in as a Recruiter (who should NOT have permission to delete candidate records)
    const recruiterLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'recruiter@crdms.com', password: 'recruiterpassword' })
    });
    const recruiterLoginData = await recruiterLoginRes.json();
    const recruiterToken = recruiterLoginData.data.accessToken;

    // A Recruiter should NOT have permission to delete candidate records
    const deleteByRecruiterRes = await fetch(`${BACKEND_URL}/candidates/${testCandidateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${recruiterToken}` }
    });
    
    assert.strictEqual(deleteByRecruiterRes.status, 403, 'Deleting candidate by Recruiter role should be blocked with HTTP 403');
    console.log('✓ Recruiter deletion restriction verified successfully.');

    // Clean up created test candidate using Admin
    console.log('Cleaning up test data (soft-deleting then hard-deleting)...');
    const deleteByAdminRes = await fetch(`${BACKEND_URL}/candidates/${testCandidateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(deleteByAdminRes.status, 200, 'Admin soft deletion should return HTTP 200');

    const hardDeleteByAdminRes = await fetch(`${BACKEND_URL}/candidates/hard-delete/${testCandidateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(hardDeleteByAdminRes.status, 200, 'Admin hard deletion should return HTTP 200');
    console.log('✓ Test candidate record permanently removed successfully.');

    // Test 5: Edit User Profile (Admin only PUT)
    console.log('Testing User updating endpoint (PUT /users/:id)...');
    
    // Get users roster
    const usersRes = await fetch(`${BACKEND_URL}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersData = await usersRes.json();
    const users = usersData.data;
    
    // Find recruiter user
    const recruiterUser = users.find(u => u.username === 'recruiter');
    assert.ok(recruiterUser, 'Recruiter account should exist in DB');
    
    // Change recruiter's email
    const updateRes = await fetch(`${BACKEND_URL}/users/${recruiterUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: 'recruiter_updated@crdms.com',
        role: 'Recruiter'
      })
    });

    assert.strictEqual(updateRes.status, 200, 'Updating user should return HTTP 200');
    console.log('✓ Recruiter email successfully modified.');

    // Reset recruiter email back to default to keep DB clean
    const resetRes = await fetch(`${BACKEND_URL}/users/${recruiterUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: 'recruiter@crdms.com',
        role: 'Recruiter'
      })
    });
    assert.strictEqual(resetRes.status, 200, 'Resetting user back to default should return HTTP 200');
    console.log('✓ Recruiter email reset successfully.');

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
};

runTests();

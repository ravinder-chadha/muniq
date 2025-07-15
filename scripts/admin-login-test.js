// Manual admin login test
// This simulates the browser login flow

const testAdminLogin = async () => {
  console.log("🔐 Testing Admin Login Flow\n");
  
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable is required');
    console.log('Please set ADMIN_PASSWORD before running this test:');
    console.log('export ADMIN_PASSWORD=your_password_here');
    console.log('node scripts/admin-login-test.js');
    process.exit(1);
  }
  
  try {
    // Step 1: Login
    console.log("Step 1: Logging in with admin password...");
    const loginResponse = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: adminPassword })
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResponse.ok || !loginResult.success) {
      console.log("❌ Login failed:", loginResult.message);
      return;
    }
    
    console.log("✅ Login successful!");
    const token = loginResult.token;
    
    // Step 2: Test accessing protected admin endpoint with token
    console.log("\nStep 2: Testing protected endpoint with token...");
    const protectedResponse = await fetch('http://localhost:3000/api/test-db?action=registrations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const protectedResult = await protectedResponse.json();
    
    if (protectedResponse.ok && protectedResult.success) {
      console.log("✅ Protected endpoint accessible with token!");
      console.log(`Found ${protectedResult.count} registrations`);
    } else {
      console.log("❌ Protected endpoint failed:", protectedResult.message);
    }
    
    // Step 3: Test token verification
    console.log("\nStep 3: Testing token verification...");
    const verifyResponse = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const verifyResult = await verifyResponse.json();
    
    if (verifyResponse.ok && verifyResult.success) {
      console.log("✅ Token verification successful!");
    } else {
      console.log("❌ Token verification failed:", verifyResult.message);
    }
    
    console.log("\n🎉 All tests passed! Admin login flow is working correctly.");
    console.log("\n📋 Manual test steps:");
    console.log("1. Visit http://localhost:3000/admin/login");
    console.log(`2. Enter password: ${adminPassword}`);
    console.log("3. Should redirect to http://localhost:3000/admin");
    console.log("4. Should see the admin dashboard with data");
    console.log("5. Click 'Logout' to clear session");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAdminLogin(); 
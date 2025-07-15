// Test script for admin authentication
// Run this with: node scripts/test-auth.js

const testAuth = async () => {
  console.log("🔐 Testing Admin Authentication System\n");

  // Test 1: Login with wrong password
  console.log("🧪 Test 1: Login with wrong password");
  try {
    const response = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'wrong-password' })
    });

    const result = await response.json();
    
    if (response.status === 401) {
      console.log("✅ Wrong password correctly rejected");
      console.log("Response:", result);
    } else {
      console.log("❌ Wrong password should return 401");
      console.log("Response:", result);
    }
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Login with correct password (if set)
  console.log("🧪 Test 2: Login with correct password");
  const testPassword = process.env.ADMIN_PASSWORD;
  
  if (!testPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable is required');
    console.log('Please set ADMIN_PASSWORD before running this test:');
    console.log('export ADMIN_PASSWORD=your_password_here');
    console.log('node scripts/test-auth.js');
    process.exit(1);
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: testPassword })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("✅ Login successful!");
      console.log("Token received:", result.token ? "Yes" : "No");
      
      // Test 3: Verify token
      console.log("\n🧪 Test 3: Token verification");
      const verifyResponse = await fetch('http://localhost:3000/api/admin/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${result.token}`
        }
      });

      const verifyResult = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyResult.success) {
        console.log("✅ Token verification successful!");
        console.log("Response:", verifyResult);
      } else {
        console.log("❌ Token verification failed");
        console.log("Response:", verifyResult);
      }
      
    } else {
      console.log("❌ Login failed (check if ADMIN_PASSWORD is set correctly)");
      console.log("Response:", result);
    }
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Access protected endpoint without token
  console.log("🧪 Test 4: Access protected endpoint without token");
  try {
    const response = await fetch('http://localhost:3000/api/test-db?action=registrations');
    const result = await response.json();
    
    console.log("Status:", response.status);
    console.log("Response:", result);
    
    if (response.status === 401) {
      console.log("✅ Protected endpoint correctly blocks unauthenticated access");
    } else {
      console.log("⚠️  Protected endpoint might not be properly secured");
    }
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  console.log("\n🎉 Authentication tests completed!\n");
  
  console.log("📋 To test the full authentication flow:");
  console.log("1. Make sure ADMIN_PASSWORD is set in your .env.local");
  console.log("2. Visit http://localhost:3000/admin/login");
  console.log("3. Enter your admin password");
  console.log("4. Should redirect to http://localhost:3000/admin");
  console.log("5. Try accessing /admin directly without logging in");
  console.log("6. Should redirect to /admin/login");
}

// Check if server is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'test' })
    });
    return true;
  } catch (error) {
    console.error("❌ Server not running or not accessible");
    console.log("Make sure to run 'npm run dev' first");
    return false;
  }
}

// Run tests
const runTests = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAuth();
  }
}

runTests(); 
// Simple test script to verify registration API is working
// Run this with: node scripts/test-registration.js

const testRegistration = async () => {
  const testData = {
    firstName: "John",
    lastName: "Doe",
    email: `test${Date.now()}@example.com`, // Unique email
    contact: "+91 9876543210",
    dob: "2000-01-01",
    standard: "12th",
    institution: "Test School",
    munExperience: "beginner"
  }

  console.log("🧪 Testing Registration API...");
  console.log("Test data:", testData);

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Registration successful!");
      console.log("Response:", result);
      
      // Test duplicate email
      console.log("\n🧪 Testing duplicate email...");
      const duplicateResponse = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData) // Same data
      });

      const duplicateResult = await duplicateResponse.json();
      
      if (duplicateResponse.status === 409) {
        console.log("✅ Duplicate email handling working correctly!");
        console.log("Response:", duplicateResult);
      } else {
        console.log("❌ Duplicate email should return 409 conflict");
        console.log("Response:", duplicateResult);
      }
      
    } else {
      console.log("❌ Registration failed!");
      console.log("Response:", result);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("Make sure the server is running with 'npm run dev'");
  }
}

const testDatabaseConnection = async () => {
  console.log("\n🧪 Testing Database Connection...");
  
  try {
    const response = await fetch('http://localhost:3000/api/test-db?action=connection');
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("✅ Database connection successful!");
      console.log("Response:", result);
    } else {
      console.log("❌ Database connection failed!");
      console.log("Response:", result);
    }
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
  }
}

const runAllTests = async () => {
  console.log("🚀 Starting MUNIQ Database Tests\n");
  
  await testDatabaseConnection();
  await testRegistration();
  
  console.log("\n🎉 Tests completed!");
  console.log("You can also visit http://localhost:3000/admin to see the admin dashboard");
}

// Run the tests
runAllTests(); 
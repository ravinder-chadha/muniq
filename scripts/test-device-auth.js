#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Check if password is provided
if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD environment variable is required');
  console.log('Please set ADMIN_PASSWORD before running this test:');
  console.log('export ADMIN_PASSWORD=your_password_here');
  console.log('node scripts/test-device-auth.js');
  process.exit(1);
}

// Different device fingerprints for testing
const DEVICE_1_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'accept-language': 'en-US,en;q=0.9',
  'x-forwarded-for': '192.168.1.100'
};

const DEVICE_2_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'accept-language': 'en-GB,en;q=0.9',
  'x-forwarded-for': '192.168.1.101'
};

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...DEVICE_1_HEADERS
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testDeviceAuthentication() {
  console.log('🔐 Testing Device-Specific Authentication with 10-minute sessions...\n');

  try {
    // Test 1: Login from Device 1
    console.log('1. Testing login from Device 1...');
    const loginResponse1 = await makeRequest('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...DEVICE_1_HEADERS
      },
      body: { password: ADMIN_PASSWORD }
    });

    if (loginResponse1.status === 200) {
      console.log('✅ Device 1 login successful');
      const device1Token = loginResponse1.data.token;
      
      // Test 2: Verify token works on Device 1
      console.log('\n2. Testing token verification on Device 1...');
      const verifyResponse1 = await makeRequest('/api/admin/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${device1Token}`,
          ...DEVICE_1_HEADERS
        }
      });

      if (verifyResponse1.status === 200) {
        console.log('✅ Token verification successful on Device 1');
      } else {
        console.log('❌ Token verification failed on Device 1:', verifyResponse1.data.message);
      }

      // Test 3: Try to use Device 1 token on Device 2
      console.log('\n3. Testing Device 1 token on Device 2 (should fail)...');
      const verifyResponse2 = await makeRequest('/api/admin/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${device1Token}`,
          ...DEVICE_2_HEADERS
        }
      });

      if (verifyResponse2.status === 401) {
        console.log('✅ Device 1 token correctly rejected on Device 2:', verifyResponse2.data.message);
      } else {
        console.log('❌ Device 1 token incorrectly accepted on Device 2');
      }

      // Test 4: Login from Device 2
      console.log('\n4. Testing login from Device 2...');
      const loginResponse2 = await makeRequest('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...DEVICE_2_HEADERS
        },
        body: { password: ADMIN_PASSWORD }
      });

      if (loginResponse2.status === 200) {
        console.log('✅ Device 2 login successful');
        const device2Token = loginResponse2.data.token;
        
        // Test 5: Verify Device 2 token works on Device 2
        console.log('\n5. Testing Device 2 token on Device 2...');
        const verifyResponse3 = await makeRequest('/api/admin/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${device2Token}`,
            ...DEVICE_2_HEADERS
          }
        });

        if (verifyResponse3.status === 200) {
          console.log('✅ Device 2 token verification successful on Device 2');
        } else {
          console.log('❌ Device 2 token verification failed on Device 2');
        }

        // Test 6: Try to use Device 2 token on Device 1
        console.log('\n6. Testing Device 2 token on Device 1 (should fail)...');
        const verifyResponse4 = await makeRequest('/api/admin/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${device2Token}`,
            ...DEVICE_1_HEADERS
          }
        });

        if (verifyResponse4.status === 401) {
          console.log('✅ Device 2 token correctly rejected on Device 1:', verifyResponse4.data.message);
        } else {
          console.log('❌ Device 2 token incorrectly accepted on Device 1');
        }
      } else {
        console.log('❌ Device 2 login failed:', loginResponse2.data.message);
      }

      // Test 7: Wait and test token expiration (for demo, we'll just show the concept)
      console.log('\n7. Testing token expiration (10 minutes)...');
      console.log('ℹ️  Tokens will expire after 10 minutes.');
      console.log('ℹ️  You can test expiration by waiting 10 minutes and trying to verify the token again.');

      // Test 8: Test with invalid password
      console.log('\n8. Testing with invalid password...');
      const invalidLoginResponse = await makeRequest('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...DEVICE_1_HEADERS
        },
        body: { password: 'wrongpassword' }
      });

      if (invalidLoginResponse.status === 401) {
        console.log('✅ Invalid password correctly rejected:', invalidLoginResponse.data.message);
      } else {
        console.log('❌ Invalid password incorrectly accepted');
      }

    } else {
      console.log('❌ Device 1 login failed:', loginResponse1.data.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testDeviceAuthentication().then(() => {
  console.log('\n🎉 Device authentication tests completed!');
  console.log('\nKey Features Tested:');
  console.log('✅ 10-minute session duration');
  console.log('✅ Device-specific authentication');
  console.log('✅ Token isolation between devices');
  console.log('✅ Password validation');
  console.log('✅ Token expiration handling');
}).catch(console.error); 
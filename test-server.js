#!/usr/bin/env node

console.log('🧪 Testing Surf Forecast Server...\n');

const http = require('http');

function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: Working`);
          resolve(true);
        } else {
          console.log(`❌ ${description}: Failed (${res.statusCode})`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: Connection failed`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Testing backend endpoints...\n');
  
  const tests = [
    ['http://localhost:5001/api/health', 'Health Check'],
    ['http://localhost:5001/api/test', 'Test Endpoint'],
    ['http://localhost:5001/api/spots', 'Surf Spots API'],
  ];
  
  let passed = 0;
  for (const [url, description] of tests) {
    const result = await testEndpoint(url, description);
    if (result) passed++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed\n`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Your server is working correctly.');
    console.log('✅ Frontend should now be able to connect to the backend.');
    console.log('🌐 Open http://localhost:3000 to use the app!');
  } else {
    console.log('⚠️  Some tests failed. Check if the server is running:');
    console.log('   npm run dev');
  }
}

runTests();
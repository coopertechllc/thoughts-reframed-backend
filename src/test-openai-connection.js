import OpenAI from 'openai';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com';

console.log('Testing OpenAI API connectivity...\n');

// Test 1: Basic network connectivity to OpenAI
async function testNetworkConnectivity() {
  return new Promise((resolve, reject) => {
    console.log('1. Testing network connectivity to api.openai.com...');
    
    const url = new URL(OPENAI_API_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY || 'test'}`,
        'User-Agent': 'OpenAI-Node/Test'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          // 200 = success, 401 = auth error but network works
          console.log('   ✓ Network connectivity: OK');
          console.log(`   Status Code: ${res.statusCode}`);
          resolve(true);
        } else {
          console.log(`   ✗ Network connectivity: Failed (Status: ${res.statusCode})`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ✗ Network connectivity: FAILED');
      console.log(`   Error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('   ✗ Network connectivity: TIMEOUT');
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

// Test 2: API authentication
async function testAPIAuthentication() {
  if (!OPENAI_API_KEY) {
    console.log('2. Testing API authentication...');
    console.log('   ⚠ Skipped: OPENAI_API_KEY not set in environment');
    return false;
  }

  console.log('2. Testing API authentication...');
  
  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    // Try to list models (lightweight API call)
    const response = await openai.models.list();
    console.log('   ✓ API authentication: OK');
    console.log(`   Available models: ${response.data.length} models found`);
    return true;
  } catch (error) {
    if (error.status === 401) {
      console.log('   ✗ API authentication: FAILED (Invalid API key)');
      console.log(`   Error: ${error.message}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('   ✗ API authentication: FAILED (Network error)');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('   ✗ API authentication: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

// Test 3: Whisper API endpoint
async function testWhisperEndpoint() {
  if (!OPENAI_API_KEY) {
    console.log('3. Testing Whisper API endpoint...');
    console.log('   ⚠ Skipped: OPENAI_API_KEY not set in environment');
    return false;
  }

  console.log('3. Testing Whisper API endpoint accessibility...');
  
  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    // Check if we can reach the audio endpoint (without actually uploading)
    // We'll just verify the endpoint exists by checking the API structure
    const url = `${OPENAI_API_URL}/v1/audio/transcriptions`;
    
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        // Even if we get an error about missing file, the endpoint is reachable
        if (res.statusCode === 400 || res.statusCode === 401) {
          console.log('   ✓ Whisper endpoint: Reachable');
          resolve(true);
        } else {
          console.log(`   ? Whisper endpoint: Status ${res.statusCode}`);
          resolve(true);
        }
      });

      req.on('error', (error) => {
        console.log('   ✗ Whisper endpoint: Not reachable');
        console.log(`   Error: ${error.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log('   ✗ Whisper endpoint: Timeout');
        resolve(false);
      });

      // Send empty body to test connectivity
      req.write('{}');
      req.end();
    });
  } catch (error) {
    console.log('   ✗ Whisper endpoint: Error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('OpenAI API Connectivity Test');
    console.log('='.repeat(50));
    console.log(`API URL: ${OPENAI_API_URL}`);
    console.log(`API Key: ${OPENAI_API_KEY ? 'Set (' + OPENAI_API_KEY.substring(0, 7) + '...)' : 'Not set'}`);
    console.log('');

    const networkOk = await testNetworkConnectivity();
    console.log('');
    
    const authOk = await testAPIAuthentication();
    console.log('');
    
    const whisperOk = await testWhisperEndpoint();
    console.log('');

    console.log('='.repeat(50));
    console.log('Summary:');
    console.log('='.repeat(50));
    console.log(`Network Connectivity: ${networkOk ? '✓ OK' : '✗ FAILED'}`);
    console.log(`API Authentication: ${authOk ? '✓ OK' : '✗ FAILED'}`);
    console.log(`Whisper Endpoint: ${whisperOk ? '✓ OK' : '✗ FAILED'}`);
    console.log('');

    if (networkOk && authOk && whisperOk) {
      console.log('✓ All tests passed! Backend can reach OpenAI API.');
      process.exit(0);
    } else {
      console.log('✗ Some tests failed. Check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();


const URL = 'http://localhost:8000/run';
const TOTAL_REQUESTS = 500;
const CONCURRENT_REQUESTS = 100; // sending in batches of 100

const payload = {
  language: "c",
  code: "#include <stdio.h>\nint main() { printf(\"Load Test Successful!\"); return 0; }"
};

async function sendRequest(id) {
  const ip = `192.168.1.${Math.floor(Math.random() * 255)}`; // Spoof IP to bypass rate limiting
  try {
    const start = Date.now();
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip, // mock different users
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    return { id, success: response.ok, time: Date.now() - start, data };
  } catch (error) {
    return { 
      id, 
      success: false, 
      error: error.message 
    };
  }
}

async function runLoadTest() {
  console.log(`Starting load test with ${TOTAL_REQUESTS} requests...`);
  
  let successCount = 0;
  let failCount = 0;
  const times = [];

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    console.log(`Sending batch ${i / CONCURRENT_REQUESTS + 1} (${CONCURRENT_REQUESTS} requests)...`);
    const batch = [];
    for (let j = 0; j < CONCURRENT_REQUESTS; j++) {
      if (i + j < TOTAL_REQUESTS) {
        batch.push(sendRequest(i + j));
      }
    }
    
    const results = await Promise.all(batch);
    results.forEach(res => {
      if (res.success) {
        successCount++;
        times.push(res.time);
      } else {
        failCount++;
        // console.error(res.error || res.data);
      }
    });
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / (times.length || 1);
  console.log(`\n--- Load Test Results ---`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Average Time (Success): ${avgTime.toFixed(2)}ms`);
}

runLoadTest();

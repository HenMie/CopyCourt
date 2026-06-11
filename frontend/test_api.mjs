import http from 'http';

const data = JSON.stringify({
  original_text: "这是一段测试文案，用来测试完整的开发环境是否工作正常。这是一段测试文案，用来测试完整的开发环境是否工作正常。",
  target_platform: "general",
  objective: "interest",
  intensity: "safe"
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8000,
  path: '/api/trials/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();

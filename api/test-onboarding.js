const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/onboarding/questions',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('\nNombre de questions:', parsed.length || 0);
      if (parsed.length > 0) {
        console.log('\nPremière question:');
        console.log(JSON.stringify(parsed[0], null, 2));
      }
    } catch (e) {
      console.log('Cannot parse JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();

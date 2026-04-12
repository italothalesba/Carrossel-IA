async function testAPI() {
  try {
    const response = await fetch('http://localhost:3018/api/ai/text-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Olá, teste da API Alibaba Cloud',
        parameters: {
          temperature: 0.7,
          max_new_tokens: 50
        }
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
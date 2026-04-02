exports.handler = async (event, context) => {
  const results = {
    step1_env: !!process.env.ANTHROPIC_API_KEY,
    step2_key_prefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'NOT SET',
    step3_node_version: process.version,
    step4_fetch_available: typeof fetch !== 'undefined',
    step5_api_test: null,
    step5_error: null
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results)
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK"' }]
      })
    });

    const data = await response.text();
    results.step5_api_status = response.status;
    results.step5_api_test = response.ok ? 'SUCCESS' : 'FAILED';
    results.step5_response = data.substring(0, 500);
  } catch (error) {
    results.step5_api_test = 'ERROR';
    results.step5_error = error.message;
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(results, null, 2)
  };
};

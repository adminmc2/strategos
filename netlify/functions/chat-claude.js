exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, system, max_tokens } = JSON.parse(event.body);

    // Construir array de mensajes con system prompt al inicio
    const systemPrompt = system || messages.find(m => m.role === 'system')?.content || '';
    const deepseekMessages = [];

    if (systemPrompt) {
      deepseekMessages.push({ role: 'system', content: systemPrompt });
    }

    // Añadir mensajes filtrando system (ya lo añadimos arriba)
    messages.filter(m => m.role !== 'system').forEach(m => {
      deepseekMessages.push({ role: m.role, content: m.content });
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: deepseekMessages,
        temperature: 0.5,
        max_tokens: max_tokens || 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek error:', errorText);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Error en DeepSeek API', details: errorText })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

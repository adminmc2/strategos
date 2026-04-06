const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
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
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { agent_key, messages, max_tokens, model, temperature } = JSON.parse(event.body);

    if (!agent_key) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'agent_key is required' })
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    // 1. Load agent config from crew_agents
    const agentRows = await sql`
      SELECT task_description, goal, role
      FROM crew_agents
      WHERE crew = 'strategos' AND agent_key = ${agent_key}
      LIMIT 1
    `;

    if (agentRows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Agent '${agent_key}' not found in crew strategos` })
      };
    }

    const agent = agentRows[0];

    // 2. Load active learned rules
    const reglas = await sql`
      SELECT tipo_error, regla
      FROM reglas_aprendidas
      WHERE crew = 'strategos' AND activa = true
      ORDER BY n_correcciones DESC
    `;

    // 3. Compose system prompt: task_description + reglas
    let systemPrompt = agent.task_description;

    if (reglas.length > 0) {
      const reglasText = reglas
        .map(r => `- [${r.tipo_error}] ${r.regla}`)
        .join('\n');
      systemPrompt += `\n\nREGLAS APRENDIDAS (aplica siempre):\n${reglasText}`;
    }

    // 4. Build messages array: system prompt + user conversation
    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 5. Send to GROQ API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model || process.env.DEFAULT_LLM_MODEL || 'llama-3.3-70b-versatile',
        messages: llmMessages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq error:', errorText);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Error en Groq API', details: errorText })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('chat-agent error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
    };
  }
};

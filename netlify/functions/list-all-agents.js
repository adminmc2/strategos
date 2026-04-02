const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Listar TODOS los agentes de la tabla agents
    const agents = await sql`
      SELECT * FROM agents ORDER BY id
    `;

    // Listar TODOS los activity_actions
    const actions = await sql`
      SELECT aa.*, a.name as agent_name
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      ORDER BY aa.activity_id, aa.action_order
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        total_agents: agents.length,
        agents: agents,
        total_actions: actions.length,
        actions: actions.map(a => ({
          id: a.id,
          activity_id: a.activity_id,
          agent_name: a.agent_name,
          action_order: a.action_order
        }))
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

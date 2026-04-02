const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);
  const activityId = event.queryStringParameters?.activityId;

  if (!activityId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'activityId es requerido' })
    };
  }

  try {
    const actions = await sql`
      SELECT
        aa.id,
        aa.action_order,
        aa.system_prompt,
        aa.initial_prompt,
        aa.llm_model,
        aa.temperature,
        aa.max_tokens,
        aa.top_p,
        aa.nivel_mcer,
        aa.adherencia_nivel,
        aa.options_json,
        a.name as agent_name,
        a.display_name as agent_display_name,
        a.icon as agent_icon,
        a.color as agent_color,
        act.context as activity_context,
        act.question as activity_question,
        act.options as activity_options
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      JOIN activities act ON aa.activity_id = act.id
      WHERE aa.activity_id = ${activityId}
        AND aa.is_active = true
      ORDER BY aa.action_order
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(actions)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener acciones de la actividad' })
    };
  }
};

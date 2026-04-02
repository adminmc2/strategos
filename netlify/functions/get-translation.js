const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  const sql = neon(process.env.DATABASE_URL);
  const activityId = event.queryStringParameters?.activityId;
  const lang = event.queryStringParameters?.lang;

  if (!activityId || !lang) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Se requiere activityId y lang' })
    };
  }

  try {
    const result = await sql`
      SELECT
        t.id,
        t.activity_id,
        t.language_code,
        t.translation_text,
        a.context as activity_context
      FROM activity_translations t
      JOIN activities a ON t.activity_id = a.id
      WHERE t.activity_id = ${activityId}
        AND t.language_code = ${lang.toUpperCase()}
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Traducción no encontrada' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      },
      body: JSON.stringify(result[0])
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Error al obtener traducción' })
    };
  }
};

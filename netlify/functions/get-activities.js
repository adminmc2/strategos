const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);
  const sectionId = event.queryStringParameters?.sectionId;

  try {
    let activities;

    if (sectionId) {
      activities = await sql`
        SELECT
          a.id,
          a.activity_number,
          a.context,
          a.question,
          a.options,
          s.section_code,
          s.title as section_title
        FROM activities a
        JOIN sections s ON a.section_id = s.id
        WHERE a.section_id = ${sectionId}
        ORDER BY a.activity_number
      `;
    } else {
      activities = await sql`
        SELECT
          a.id,
          a.activity_number,
          a.context,
          a.question,
          a.options,
          s.section_code,
          s.title as section_title
        FROM activities a
        JOIN sections s ON a.section_id = s.id
        ORDER BY s.section_code, a.activity_number
      `;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(activities)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener actividades' })
    };
  }
};

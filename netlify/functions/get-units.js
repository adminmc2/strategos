const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Obtener todas las unidades con sus secciones
    const units = await sql`
      SELECT
        u.id,
        u.unit_number,
        u.title,
        u.subtitle,
        u.color,
        json_agg(
          json_build_object(
            'id', s.id,
            'section_code', s.section_code,
            'title', s.title,
            'has_activities', s.has_activities
          ) ORDER BY s.section_code
        ) as sections
      FROM units u
      LEFT JOIN sections s ON u.id = s.unit_id
      GROUP BY u.id
      ORDER BY u.unit_number
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(units)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener datos' })
    };
  }
};

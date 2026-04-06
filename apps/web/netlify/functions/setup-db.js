const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Crear la tabla activity_translations
    await sql`
      CREATE TABLE IF NOT EXISTS activity_translations (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        language_code VARCHAR(10) NOT NULL,
        translation_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_id, language_code)
      )
    `;

    // Verificar estructura
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'activity_translations'
      ORDER BY ordinal_position
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Tabla activity_translations creada correctamente',
        columns: columns
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

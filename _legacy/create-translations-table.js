const { neon } = require('@neondatabase/serverless');

async function createTable() {
  // Usa la variable de entorno DATABASE_URL
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

    console.log('Tabla activity_translations creada exitosamente!');

    // Verificar que la tabla existe
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'activity_translations'
      ORDER BY ordinal_position
    `;

    console.log('\nEstructura de la tabla:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error al crear la tabla:', error);
    process.exit(1);
  }
}

createTable();

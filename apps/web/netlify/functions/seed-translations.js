const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Primero aseguramos que la tabla existe
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

    // Traducciones para la actividad 1 (vocabulario de lugares/actividades)
    const translations = [
      {
        activity_id: 1,
        language_code: 'EN',
        translation_text: `• to the cinema
• to other friends' house
• to have a drink
• to eat
• to dance
• to play basketball`
      },
      {
        activity_id: 1,
        language_code: 'PT',
        translation_text: `• ao cinema
• à casa de outros amigos
• tomar algo
• comer
• dançar
• jogar basquete`
      },
      {
        activity_id: 1,
        language_code: 'FR',
        translation_text: `• au cinéma
• chez d'autres amis
• prendre un verre
• manger
• danser
• jouer au basket`
      },
      {
        activity_id: 1,
        language_code: 'AL',
        translation_text: `• ins Kino
• zu anderen Freunden nach Hause
• etwas trinken gehen
• essen gehen
• tanzen gehen
• Basketball spielen`
      },
      {
        activity_id: 1,
        language_code: 'PL',
        translation_text: `• do kina
• do domu innych przyjaciół
• na drinka
• coś zjeść
• potańczyć
• pograć w koszykówkę`
      },
      {
        activity_id: 1,
        language_code: 'IT',
        translation_text: `• al cinema
• a casa di altri amici
• a prendere qualcosa
• a mangiare
• a ballare
• a giocare a pallacanestro`
      }
    ];

    // Insertar traducciones usando upsert
    for (const t of translations) {
      await sql`
        INSERT INTO activity_translations (activity_id, language_code, translation_text)
        VALUES (${t.activity_id}, ${t.language_code}, ${t.translation_text})
        ON CONFLICT (activity_id, language_code)
        DO UPDATE SET translation_text = ${t.translation_text}
      `;
    }

    // Verificar las traducciones insertadas
    const inserted = await sql`
      SELECT activity_id, language_code, LEFT(translation_text, 50) as preview
      FROM activity_translations
      ORDER BY activity_id, language_code
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Traducciones insertadas correctamente',
        count: inserted.length,
        translations: inserted
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

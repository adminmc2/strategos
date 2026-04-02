const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Contenido del diálogo
    const dialogueContext = `■ Hola, Luisa, ¿qué tal?
● Hola, ¿qué haces?
■ Nada, estoy viendo una serie.
● Oye, ¿vamos al centro esta tarde?
■ Estupendo, podemos ir al cine.
● Vale, ¿cómo quedamos?
■ ¿A las cinco en la puerta del metro?
● No, mejor a las seis. ¿Te parece bien?
■ De acuerdo. Quedamos a las seis. ¡Hasta luego!`;

    // Preguntas de comprensión
    const questions = `Contesta a las preguntas:
1. ¿Qué van a hacer Luisa y su amiga?
2. ¿Dónde quedan?
3. ¿A qué hora?`;

    // Respuestas correctas (para referencia del agente)
    const answers = `1. Van a ir al cine / Van al centro
2. En la puerta del metro
3. A las seis`;

    // Actualizar la actividad 2
    const updated = await sql`
      UPDATE activities
      SET
        context = ${dialogueContext},
        question = ${questions},
        options = ${answers}
      WHERE id = 2
      RETURNING id, activity_number, context, question, options
    `;

    if (updated.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No se encontró la actividad 2' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Actividad 2 actualizada con el contenido del diálogo',
        activity: updated[0]
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

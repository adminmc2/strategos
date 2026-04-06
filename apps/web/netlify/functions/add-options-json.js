const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Agregar columna options_json si no existe
    await sql`
      ALTER TABLE activity_actions
      ADD COLUMN IF NOT EXISTS options_json JSONB
    `;

    // 2. Buscar el activity_action de "Voy a tener suerte" (agente improvisador)
    const improvisadorAction = await sql`
      SELECT aa.id, aa.activity_id, a.name as agent_name
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE a.name = 'improvisador'
      AND aa.is_active = true
      LIMIT 1
    `;

    if (improvisadorAction.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No se encontró el agente improvisador activo' })
      };
    }

    // 3. Configurar las preguntas tipo test con iconos Lucide y estilos de vida
    const optionsData = {
      type: "random_question",
      questions: [
        {
          question: "Elige un animal",
          icon: "paw-print",
          options: [
            { icon: "cat", label: "Gato", value: "gato", estilo: "tranquilo, independiente, casero" },
            { icon: "dog", label: "Perro", value: "perro", estilo: "activo, social, le gusta salir" },
            { icon: "bird", label: "Pájaro", value: "pájaro", estilo: "libre, aventurero, viajero" },
            { icon: "fish", label: "Pez", value: "pez", estilo: "relajado, observador, tranquilo" }
          ]
        },
        {
          question: "Elige una comida",
          icon: "utensils",
          options: [
            { icon: "pizza", label: "Pizza", value: "pizza", estilo: "social, informal, le gusta estar con amigos" },
            { icon: "salad", label: "Ensalada", value: "ensalada", estilo: "saludable, cuidadoso, deportista" },
            { icon: "cookie", label: "Galleta", value: "galleta", estilo: "dulce, hogareño, nostálgico" },
            { icon: "coffee", label: "Café", value: "café", estilo: "urbano, intelectual, conversador" }
          ]
        },
        {
          question: "Elige un clima",
          icon: "cloud-sun",
          options: [
            { icon: "sun", label: "Sol", value: "sol", estilo: "activo, optimista, le gusta el aire libre" },
            { icon: "cloud-rain", label: "Lluvia", value: "lluvia", estilo: "reflexivo, tranquilo, prefiere estar en interior" },
            { icon: "snowflake", label: "Nieve", value: "nieve", estilo: "aventurero, deportista, activo" },
            { icon: "wind", label: "Viento", value: "viento", estilo: "libre, inquieto, viajero" }
          ]
        },
        {
          question: "Elige un color",
          icon: "palette",
          options: [
            { icon: "circle", label: "Rojo", value: "rojo", color: "#e63946", estilo: "apasionado, intenso, le gustan las fiestas" },
            { icon: "circle", label: "Azul", value: "azul", color: "#457b9d", estilo: "tranquilo, sereno, le gusta el mar" },
            { icon: "circle", label: "Verde", value: "verde", color: "#2a9d8f", estilo: "natural, ecológico, le gusta el campo" },
            { icon: "circle", label: "Amarillo", value: "amarillo", color: "#f4a261", estilo: "alegre, optimista, energético" }
          ]
        },
        {
          question: "Elige un tipo de música",
          icon: "music",
          options: [
            { icon: "guitar", label: "Rock", value: "rock", estilo: "rebelde, energético, le gustan los conciertos" },
            { icon: "music-2", label: "Jazz", value: "jazz", estilo: "sofisticado, nocturno, le gustan los bares" },
            { icon: "music-4", label: "Pop", value: "pop", estilo: "social, le gustan las fiestas, bailar" },
            { icon: "headphones", label: "Electrónica", value: "electrónica", estilo: "moderno, nocturno, le gustan los clubs" }
          ]
        }
      ]
    };

    // 4. Actualizar el activity_action con las opciones
    await sql`
      UPDATE activity_actions
      SET options_json = ${JSON.stringify(optionsData)}::jsonb
      WHERE id = ${improvisadorAction[0].id}
    `;

    // 5. Verificar la actualización
    const updated = await sql`
      SELECT id, options_json
      FROM activity_actions
      WHERE id = ${improvisadorAction[0].id}
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Campo options_json agregado y configurado correctamente',
        activity_action_id: improvisadorAction[0].id,
        options_json: updated[0].options_json
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

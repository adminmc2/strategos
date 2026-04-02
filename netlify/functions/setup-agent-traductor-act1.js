const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Crear el agente "traductor" si no existe
    let agent = await sql`
      SELECT id FROM agents WHERE name = 'traductor' LIMIT 1
    `;

    if (agent.length === 0) {
      agent = await sql`
        INSERT INTO agents (name, display_name, description, icon, color)
        VALUES (
          'traductor',
          'Traducir vocabulario',
          'Traduce el vocabulario de la actividad al idioma seleccionado',
          'languages',
          '#3B82F6'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Vocabulario de la actividad 1 con traducciones predefinidas
    const vocabularyData = {
      type: "vocabulary_translation",
      vocabulary: [
        {
          id: 1,
          text: "al cine",
          icon: "clapperboard",
          translations: {
            it: "al cinema",
            fr: "au cinéma",
            en: "to the cinema",
            pt: "ao cinema",
            de: "ins Kino",
            pl: "do kina"
          }
        },
        {
          id: 2,
          text: "a casa de otros amigos",
          icon: "home",
          translations: {
            it: "a casa di altri amici",
            fr: "chez d'autres amis",
            en: "to other friends' house",
            pt: "à casa de outros amigos",
            de: "zu anderen Freunden nach Hause",
            pl: "do domu innych przyjaciół"
          }
        },
        {
          id: 3,
          text: "a tomar algo",
          icon: "wine",
          translations: {
            it: "a prendere qualcosa",
            fr: "prendre un verre",
            en: "to have a drink",
            pt: "tomar algo",
            de: "etwas trinken gehen",
            pl: "na drinka"
          }
        },
        {
          id: 4,
          text: "a comer",
          icon: "utensils",
          translations: {
            it: "a mangiare",
            fr: "manger",
            en: "to eat",
            pt: "comer",
            de: "essen gehen",
            pl: "coś zjeść"
          }
        },
        {
          id: 5,
          text: "a bailar",
          icon: "music",
          translations: {
            it: "a ballare",
            fr: "danser",
            en: "to dance",
            pt: "dançar",
            de: "tanzen gehen",
            pl: "potańczyć"
          }
        },
        {
          id: 6,
          text: "a jugar al baloncesto",
          icon: "dribbble",
          translations: {
            it: "a giocare a pallacanestro",
            fr: "jouer au basket",
            en: "to play basketball",
            pt: "jogar basquete",
            de: "Basketball spielen",
            pl: "pograć w koszykówkę"
          }
        }
      ]
    };

    // 3. Verificar si ya existe activity_action para actividad 1 y este agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 1 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Contexto: El usuario quiere traducir el vocabulario de la actividad a su idioma.

Si el usuario pide traducir a un idioma que NO es italiano, francés, inglés, portugués o alemán:
- Traduce todo el vocabulario al idioma solicitado
- Formato: muestra cada expresión en español → traducción
- Usa emojis relevantes para cada lugar

Ejemplo de respuesta para polaco:
"🎬 al cine → do kina
🏠 a casa de otros amigos → do domu innych przyjaciół
🍺 a tomar algo → na drinka
🍽️ a comer → coś zjeść
💃 a bailar → potańczyć
🏀 a jugar al baloncesto → pograć w koszykówkę"`;

    const initialPrompt = `¡Vamos a traducir el vocabulario! 🌍

Elige tu idioma para ver las traducciones.`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(vocabularyData)}::jsonb,
          is_active = true,
          action_order = 1
        WHERE id = ${existingAction[0].id}
      `;
    } else {
      // Insertar
      await sql`
        INSERT INTO activity_actions (
          activity_id,
          agent_id,
          system_prompt,
          initial_prompt,
          options_json,
          is_active,
          action_order,
          llm_model,
          temperature,
          max_tokens
        )
        VALUES (
          1,
          ${agentId},
          ${systemPrompt},
          ${initialPrompt},
          ${JSON.stringify(vocabularyData)}::jsonb,
          true,
          1,
          'deepseek-chat',
          0.5,
          500
        )
      `;
    }

    // 4. Verificar resultado
    const result = await sql`
      SELECT
        aa.id,
        aa.activity_id,
        aa.action_order,
        aa.options_json,
        a.name as agent_name,
        a.display_name,
        a.icon,
        a.color
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE aa.activity_id = 1 AND a.name = 'traductor'
    `;

    // 5. Listar todos los agentes de actividad 1
    const allActions = await sql`
      SELECT a.name, a.display_name, aa.action_order
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE aa.activity_id = 1
      ORDER BY aa.action_order
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Agente traductor configurado para actividad 1',
        traductor: result[0],
        all_agents_activity_1: allActions
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

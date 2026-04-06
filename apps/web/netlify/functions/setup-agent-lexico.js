const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Crear el agente "lexico" si no existe
    let agent = await sql`
      SELECT id FROM agents WHERE name = 'lexico' LIMIT 1
    `;

    if (agent.length === 0) {
      agent = await sql`
        INSERT INTO agents (name, display_name, description, icon, color)
        VALUES (
          'lexico',
          'Aprender del texto',
          'Analiza campos léxicos y expresiones del diálogo',
          'highlighter',
          '#8B5CF6'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Datos del análisis léxico del diálogo
    const lexicalData = {
      type: "lexical_analysis",
      fields: [
        {
          id: "saludos",
          name: "Saludos y despedidas",
          color: "#F97316",
          style: "underline",
          icon: "hand-wave",
          expressions: [
            { text: "Hola", phraseIds: [1, 2] },
            { text: "¿qué tal?", phraseIds: [1] },
            { text: "¡Hasta luego!", phraseIds: [9] }
          ]
        },
        {
          id: "planes",
          name: "Hacer planes / Quedar",
          color: "#3B82F6",
          style: "double-underline",
          icon: "calendar",
          expressions: [
            { text: "¿vamos al...?", phraseIds: [4] },
            { text: "podemos ir", phraseIds: [5] },
            { text: "¿cómo quedamos?", phraseIds: [6] },
            { text: "Quedamos a las...", phraseIds: [9] }
          ]
        },
        {
          id: "tiempo",
          name: "Horas y tiempo",
          color: "#10B981",
          style: "dotted",
          icon: "clock",
          expressions: [
            { text: "esta tarde", phraseIds: [4] },
            { text: "a las cinco", phraseIds: [7] },
            { text: "a las seis", phraseIds: [8, 9] }
          ]
        },
        {
          id: "lugares",
          name: "Lugares",
          color: "#8B5CF6",
          style: "wavy",
          icon: "map-pin",
          expressions: [
            { text: "al centro", phraseIds: [4] },
            { text: "al cine", phraseIds: [5] },
            { text: "en la puerta del metro", phraseIds: [7] }
          ]
        },
        {
          id: "acuerdo",
          name: "Acuerdo y valoración",
          color: "#EC4899",
          style: "dashed",
          icon: "thumbs-up",
          expressions: [
            { text: "Estupendo", phraseIds: [5] },
            { text: "Vale", phraseIds: [6] },
            { text: "¿Te parece bien?", phraseIds: [8] },
            { text: "De acuerdo", phraseIds: [9] }
          ]
        },
        {
          id: "marcadores",
          name: "Marcadores conversacionales",
          color: "#6B7280",
          style: "bold",
          icon: "message-circle",
          expressions: [
            { text: "Oye", phraseIds: [4] },
            { text: "Nada", phraseIds: [3] },
            { text: "mejor", phraseIds: [8] }
          ]
        }
      ],
      phrases: [
        { id: 1, speaker: "persona1", text: "Hola, Luisa, ¿qué tal?" },
        { id: 2, speaker: "persona2", text: "Hola, ¿qué haces?" },
        { id: 3, speaker: "persona1", text: "Nada, estoy viendo una serie." },
        { id: 4, speaker: "persona2", text: "Oye, ¿vamos al centro esta tarde?" },
        { id: 5, speaker: "persona1", text: "Estupendo, podemos ir al cine." },
        { id: 6, speaker: "persona2", text: "Vale, ¿cómo quedamos?" },
        { id: 7, speaker: "persona1", text: "¿A las cinco en la puerta del metro?" },
        { id: 8, speaker: "persona2", text: "No, mejor a las seis. ¿Te parece bien?" },
        { id: 9, speaker: "persona1", text: "De acuerdo. Quedamos a las seis. ¡Hasta luego!" }
      ]
    };

    // 3. Verificar si ya existe activity_action para actividad 2 y este agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 2 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Contexto: El usuario está analizando un diálogo para aprender vocabulario organizado por campos léxicos.

Tu rol es ayudar a explicar las expresiones cuando el usuario lo pida:
- Explica el significado y uso de cada expresión
- Da ejemplos adicionales del mismo campo léxico
- Usa un lenguaje sencillo apropiado para nivel A1
- Responde en español pero puedes usar el idioma del usuario si lo necesita`;

    const initialPrompt = `¡Vamos a analizar el vocabulario del diálogo! 📚

He identificado diferentes tipos de expresiones. Pulsa en cada categoría para ver las expresiones marcadas en el texto.`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(lexicalData)}::jsonb,
          is_active = true,
          action_order = 2
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
          2,
          ${agentId},
          ${systemPrompt},
          ${initialPrompt},
          ${JSON.stringify(lexicalData)}::jsonb,
          true,
          2,
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
        aa.action_order,
        aa.options_json,
        a.name as agent_name,
        a.display_name,
        a.icon,
        a.color
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE aa.activity_id = 2 AND a.name = 'lexico'
    `;

    // 5. Listar todos los agentes de actividad 2
    const allActions = await sql`
      SELECT a.name, a.display_name, aa.action_order
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE aa.activity_id = 2
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
        message: 'Agente léxico configurado para actividad 2',
        lexico: result[0],
        all_agents_activity_2: allActions
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

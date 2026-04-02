const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Crear el agente "mapamental" si no existe
    let agent = await sql`
      SELECT id FROM agents WHERE name = 'mapamental' LIMIT 1
    `;

    if (agent.length === 0) {
      agent = await sql`
        INSERT INTO agents (name, display_name, description, icon, color)
        VALUES (
          'mapamental',
          'Mapa mental',
          'Construye un mapa mental conectando expresiones',
          'network',
          '#1E3A5F'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Datos del mapa mental tipo TIMELINE - ya configurado para explorar
    // Muestra la secuencia de funciones comunicativas del diálogo
    const mindMapData = {
      type: "mind_map_timeline",
      title: "QUEDAR CON AMIGOS",
      subtitle: "Estructura de la conversación",

      // Pasos del timeline (secuencia de funciones comunicativas)
      steps: [
        {
          id: 1,
          function: "SALUDAR",
          icon: "hand",
          color: "#1E3A5F",
          description: "Iniciar la conversación",
          expressions: [
            { text: "Hola", speaker: "both" },
            { text: "¿Qué tal?", speaker: "persona1" },
            { text: "¿Qué haces?", speaker: "persona2" }
          ],
          dialogueLines: [1, 2]
        },
        {
          id: 2,
          function: "PROPONER",
          icon: "lightbulb",
          color: "#E07B39",
          description: "Sugerir un plan",
          expressions: [
            { text: "¿Vamos al centro?", speaker: "persona2" },
            { text: "Podemos ir al cine", speaker: "persona1" }
          ],
          dialogueLines: [4, 5],
          places: ["al centro", "al cine", "a tomar algo", "a comer", "a bailar"]
        },
        {
          id: 3,
          function: "ORGANIZAR",
          icon: "calendar",
          color: "#7B68EE",
          description: "Decidir los detalles",
          expressions: [
            { text: "¿Cómo quedamos?", speaker: "persona2" },
            { text: "¿A las cinco en la puerta del metro?", speaker: "persona1" }
          ],
          dialogueLines: [6, 7]
        },
        {
          id: 4,
          function: "NEGOCIAR",
          icon: "message-circle",
          color: "#2A9D8F",
          description: "Ajustar el plan",
          expressions: [
            { text: "No, mejor a las seis", speaker: "persona2" },
            { text: "¿Te parece bien?", speaker: "persona2" }
          ],
          dialogueLines: [8]
        },
        {
          id: 5,
          function: "ACORDAR",
          icon: "check-circle",
          color: "#C06C84",
          description: "Confirmar el plan",
          expressions: [
            { text: "De acuerdo", speaker: "persona1" },
            { text: "Vale", speaker: "both" },
            { text: "Estupendo", speaker: "both" }
          ],
          dialogueLines: [9]
        },
        {
          id: 6,
          function: "DESPEDIRSE",
          icon: "hand",
          color: "#1E3A5F",
          description: "Cerrar la conversación",
          expressions: [
            { text: "¡Hasta luego!", speaker: "persona1" }
          ],
          dialogueLines: [9]
        }
      ],

      // Resumen visual para recordar
      summary: {
        title: "Para quedar con amigos:",
        steps: ["Saludar", "Proponer", "Organizar", "Negociar", "Acordar", "Despedirse"]
      }
    };

    // 3. Verificar si ya existe activity_action para actividad 2 y este agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 2 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Contexto: El usuario está construyendo un mapa mental conectando expresiones con sus categorías.

Tu rol es:
- Guiar al usuario para conectar las expresiones correctamente
- Dar pistas si conecta algo incorrectamente, sin dar la respuesta directa
- Felicitar cuando hace conexiones correctas
- Explicar por qué una expresión pertenece a cierta categoría
- Al final, hacer un resumen de lo aprendido
- Usar un lenguaje sencillo apropiado para nivel A1`;

    const initialPrompt = `¡Vamos a organizar lo que has aprendido! 🧠

Construye el mapa mental conectando cada expresión con su categoría. Toca una expresión y luego la categoría donde crees que va.`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(mindMapData)}::jsonb,
          is_active = true,
          action_order = 5
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
          ${JSON.stringify(mindMapData)}::jsonb,
          true,
          5,
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
      WHERE aa.activity_id = 2 AND a.name = 'mapamental'
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
        message: 'Agente mapa mental configurado para actividad 2',
        mapamental: result[0],
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

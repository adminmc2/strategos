const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Crear el agente "comprension" si no existe
    let agent = await sql`
      SELECT id FROM agents WHERE name = 'comprension' LIMIT 1
    `;

    if (agent.length === 0) {
      agent = await sql`
        INSERT INTO agents (name, display_name, description, icon, color)
        VALUES (
          'comprension',
          'Comprensión global visual',
          'Organiza imágenes para comprender el diálogo',
          'images',
          '#06B6D4'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Datos de comprensión visual - imágenes para ordenar
    const comprensionData = {
      type: "visual_comprehension",
      instruction: "Ordena las viñetas según el orden de los eventos del diálogo",
      showDescriptionOnCheck: true, // Solo mostrar descripción al comprobar
      // 5 viñetas que representan momentos clave del diálogo
      images: [
        {
          id: 1,
          src: "/public/vineta1.jpeg",
          alt: "Viñeta 1",
          description: "Chica viendo la TV",
          correctOrder: 1
        },
        {
          id: 2,
          src: "/public/vineta2.jpeg",
          alt: "Viñeta 2",
          description: "Chico habla por teléfono con la chica",
          correctOrder: 2
        },
        {
          id: 3,
          src: "/public/vineta3v1.jpeg",
          alt: "Viñeta 3",
          description: "Deciden ir al cine",
          correctOrder: 3
        },
        {
          id: 4,
          src: "/public/vineta4.jpeg",
          alt: "Viñeta 4",
          description: "Cambio de hora",
          correctOrder: 4
        },
        {
          id: 5,
          src: "/public/vineta5v2.jpeg",
          alt: "Viñeta 5",
          description: "Quedan a las seis",
          correctOrder: 5
        }
      ]
    };

    // 3. Verificar si ya existe activity_action para actividad 2 y este agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 2 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Contexto: El usuario está trabajando en una actividad de comprensión visual donde debe ordenar imágenes según el diálogo.

Tu rol es:
- Guiar al usuario para ordenar las imágenes correctamente
- Dar pistas si se equivoca sin dar la respuesta directa
- Felicitar cuando acierta
- Explicar brevemente qué parte del diálogo representa cada imagen
- Usar un lenguaje sencillo apropiado para nivel A1`;

    const initialPrompt = `¡Vamos a comprobar si entiendes el diálogo!

Ordena las imágenes según el orden de los eventos. Arrastra cada imagen a su posición correcta.`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(comprensionData)}::jsonb,
          is_active = true,
          action_order = 4
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
          ${JSON.stringify(comprensionData)}::jsonb,
          true,
          4,
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
      WHERE aa.activity_id = 2 AND a.name = 'comprension'
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
        message: 'Agente comprensión visual configurado para actividad 2',
        comprension: result[0],
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

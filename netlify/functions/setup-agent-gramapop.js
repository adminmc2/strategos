const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Crear el agente "gramapop" si no existe
    let agent = await sql`
      SELECT id FROM agents WHERE name = 'gramapop' LIMIT 1
    `;

    if (agent.length === 0) {
      agent = await sql`
        INSERT INTO agents (name, display_name, description, icon, color)
        VALUES (
          'gramapop',
          'Gramapop: Quedar/Quedarse',
          'Explica la diferencia entre quedar y quedarse con ejemplos del diálogo',
          'message-circle-question',
          '#8B5CF6'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Datos gramaticales sobre quedar/quedarse
    const grammarData = {
      type: "grammar_popup",
      topic: "quedar_quedarse",
      examples_from_dialogue: [
        {
          phrase: "¿cómo quedamos?",
          verb: "quedar",
          meaning: "acordar un encuentro / hacer planes",
          explanation: "Aquí 'quedar' significa ponerse de acuerdo para verse."
        },
        {
          phrase: "Quedamos a las seis",
          verb: "quedar",
          meaning: "acordar hora/lugar de encuentro",
          explanation: "'Quedar + a las + hora' = acordar una cita a esa hora."
        }
      ],
      grammar_rules: [
        {
          verb: "QUEDAR",
          uses: [
            "Acordar un encuentro: ¿Quedamos mañana?",
            "Fijar hora/lugar: Quedamos a las 5 en el parque",
            "Resultado: La cena quedó muy bien",
            "Restar: Quedan dos días para el examen"
          ]
        },
        {
          verb: "QUEDARSE",
          uses: [
            "Permanecer en un lugar: Me quedo en casa",
            "Estado resultante: Se quedó dormido",
            "Retener algo: ¿Te quedas con el libro?"
          ]
        }
      ],
      conjugation: {
        quedar: {
          yo: "quedo",
          tú: "quedas",
          "él/ella/usted": "queda",
          nosotros: "quedamos",
          vosotros: "quedáis",
          "ellos/ustedes": "quedan"
        },
        quedarse: {
          yo: "me quedo",
          tú: "te quedas",
          "él/ella/usted": "se queda",
          nosotros: "nos quedamos",
          vosotros: "os quedáis",
          "ellos/ustedes": "se quedan"
        }
      },
      practice_sentences: [
        { sentence: "¿A qué hora _____ (nosotros)?", answer: "quedamos", hint: "acordar encuentro" },
        { sentence: "Yo _____ en casa hoy.", answer: "me quedo", hint: "permanecer" },
        { sentence: "¿Dónde _____ para cenar?", answer: "quedamos", hint: "acordar lugar" },
        { sentence: "Ella _____ con mi paraguas.", answer: "se queda", hint: "retener" }
      ]
    };

    // 3. Verificar si ya existe activity_action para esta actividad y agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 2 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Tu especialidad es explicar la diferencia entre QUEDAR y QUEDARSE de forma clara y divertida.

QUEDAR (sin pronombre reflexivo):
- Acordar un encuentro: "¿Quedamos mañana?" "Quedamos a las 6"
- Indicar resultado: "La comida quedó rica"
- Restar/faltar: "Quedan 3 días"

QUEDARSE (con pronombre reflexivo me/te/se/nos/os/se):
- Permanecer: "Me quedo en casa"
- Estado resultante: "Se quedó dormido"
- Retener: "Me quedo con este libro"

Cuando el usuario pregunte:
1. Explica con ejemplos simples del diálogo
2. Usa emojis para hacerlo visual 📍🏠
3. Ofrece mini ejercicios de práctica
4. Celebra cuando acierte 🎉

Mantén las explicaciones cortas y claras (nivel A1).`;

    const initialPrompt = `En tus pops de gramática hoy hablamos de la diferencia entre <b>quedar</b> y <b>quedarse</b>.

¿En qué lengua quieres que hablemos?`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(grammarData)}::jsonb,
          is_active = true,
          action_order = 3
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
          ${JSON.stringify(grammarData)}::jsonb,
          true,
          3,
          'deepseek-chat',
          0.6,
          400
        )
      `;
    }

    // 4. Verificar resultado
    const result = await sql`
      SELECT
        aa.id,
        aa.action_order,
        aa.system_prompt,
        aa.initial_prompt,
        aa.options_json,
        a.name as agent_name,
        a.display_name,
        a.icon,
        a.color
      FROM activity_actions aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE aa.activity_id = 2 AND a.name = 'gramapop'
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Agente Gramapop (Quedar/Quedarse) configurado para actividad 2',
        agent: result[0]
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

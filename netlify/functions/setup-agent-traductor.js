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
          'Traduce frases del diálogo al idioma seleccionado',
          'languages',
          '#3B82F6'
        )
        RETURNING id
      `;
    }

    const agentId = agent[0].id;

    // 2. Datos del diálogo con traducciones predefinidas
    const dialogueData = {
      type: "dialogue_translation",
      languages: ["it", "fr", "en", "pt", "de", "pl"],
      phrases: [
        {
          id: 1,
          speaker: "persona1",
          text: "Hola, Luisa, ¿qué tal?",
          translations: {
            it: "Ciao, Luisa, come stai?",
            fr: "Salut, Luisa, ça va ?",
            en: "Hi, Luisa, how are you?",
            pt: "Olá, Luisa, como vai?",
            de: "Hallo, Luisa, wie geht's?",
            pl: "Cześć, Luisa, co słychać?"
          }
        },
        {
          id: 2,
          speaker: "persona2",
          text: "Hola, ¿qué haces?",
          translations: {
            it: "Ciao, cosa fai?",
            fr: "Salut, qu'est-ce que tu fais ?",
            en: "Hi, what are you doing?",
            pt: "Olá, o que você está fazendo?",
            de: "Hallo, was machst du?",
            pl: "Cześć, co robisz?"
          }
        },
        {
          id: 3,
          speaker: "persona1",
          text: "Nada, estoy viendo una serie.",
          translations: {
            it: "Niente, sto guardando una serie.",
            fr: "Rien, je regarde une série.",
            en: "Nothing, I'm watching a series.",
            pt: "Nada, estou assistindo uma série.",
            de: "Nichts, ich schaue eine Serie.",
            pl: "Nic, oglądam serial."
          }
        },
        {
          id: 4,
          speaker: "persona2",
          text: "Oye, ¿vamos al centro esta tarde?",
          translations: {
            it: "Ehi, andiamo in centro questo pomeriggio?",
            fr: "Dis, on va au centre-ville cet après-midi ?",
            en: "Hey, shall we go downtown this afternoon?",
            pt: "Ei, vamos ao centro esta tarde?",
            de: "Hey, gehen wir heute Nachmittag in die Stadt?",
            pl: "Hej, idziemy do centrum dziś po południu?"
          }
        },
        {
          id: 5,
          speaker: "persona1",
          text: "Estupendo, podemos ir al cine.",
          translations: {
            it: "Fantastico, possiamo andare al cinema.",
            fr: "Super, on peut aller au cinéma.",
            en: "Great, we can go to the cinema.",
            pt: "Ótimo, podemos ir ao cinema.",
            de: "Super, wir können ins Kino gehen.",
            pl: "Świetnie, możemy iść do kina."
          }
        },
        {
          id: 6,
          speaker: "persona2",
          text: "Vale, ¿cómo quedamos?",
          translations: {
            it: "Ok, come ci organizziamo?",
            fr: "D'accord, on se retrouve comment ?",
            en: "OK, how shall we meet?",
            pt: "Ok, como combinamos?",
            de: "OK, wie treffen wir uns?",
            pl: "Ok, jak się umawiamy?"
          }
        },
        {
          id: 7,
          speaker: "persona1",
          text: "¿A las cinco en la puerta del metro?",
          translations: {
            it: "Alle cinque all'ingresso della metro?",
            fr: "À cinq heures à l'entrée du métro ?",
            en: "At five at the metro entrance?",
            pt: "Às cinco na entrada do metrô?",
            de: "Um fünf am Metroeingang?",
            pl: "O piątej przy wejściu do metra?"
          }
        },
        {
          id: 8,
          speaker: "persona2",
          text: "No, mejor a las seis. ¿Te parece bien?",
          translations: {
            it: "No, meglio alle sei. Ti va bene?",
            fr: "Non, plutôt à six heures. Ça te va ?",
            en: "No, better at six. Is that OK with you?",
            pt: "Não, melhor às seis. Tudo bem para você?",
            de: "Nein, besser um sechs. Passt dir das?",
            pl: "Nie, lepiej o szóstej. Pasuje ci?"
          }
        },
        {
          id: 9,
          speaker: "persona1",
          text: "De acuerdo. Quedamos a las seis. ¡Hasta luego!",
          translations: {
            it: "D'accordo. Ci vediamo alle sei. A dopo!",
            fr: "D'accord. On se retrouve à six heures. À plus tard !",
            en: "OK. Let's meet at six. See you later!",
            pt: "De acordo. Ficamos às seis. Até logo!",
            de: "Einverstanden. Wir treffen uns um sechs. Bis später!",
            pl: "Zgoda. Spotykamy się o szóstej. Na razie!"
          }
        }
      ]
    };

    // 3. Verificar si ya existe activity_action para esta actividad y agente
    const existingAction = await sql`
      SELECT id FROM activity_actions
      WHERE activity_id = 2 AND agent_id = ${agentId}
      LIMIT 1
    `;

    const systemPrompt = `Eres Eliana, una asistente virtual especializada en enseñar español nivel A1.

Contexto: El usuario está trabajando con un diálogo y quiere traducir frases que no entiende.

Si el usuario te pide traducir frases a un idioma que NO es italiano, francés, inglés, portugués o alemán:
- Traduce las frases seleccionadas al idioma solicitado
- Mantén el registro informal del diálogo original
- Formato: muestra la frase en español → traducción
- Añade una breve explicación si hay expresiones idiomáticas

Ejemplo de respuesta:
"Aquí tienes las traducciones al [idioma]:

1. 'Hola, ¿qué tal?' → [traducción]
2. 'Oye, ¿vamos al centro?' → [traducción]

💡 Nota: 'Oye' es una forma informal de llamar la atención."`;

    const initialPrompt = `¡Vamos a traducir el diálogo! 🌍

Primero, elige tu idioma para ver las traducciones.`;

    if (existingAction.length > 0) {
      // Actualizar
      await sql`
        UPDATE activity_actions
        SET
          system_prompt = ${systemPrompt},
          initial_prompt = ${initialPrompt},
          options_json = ${JSON.stringify(dialogueData)}::jsonb,
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
          2,
          ${agentId},
          ${systemPrompt},
          ${initialPrompt},
          ${JSON.stringify(dialogueData)}::jsonb,
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
      WHERE aa.activity_id = 2 AND a.name = 'traductor'
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Agente traductor configurado para actividad 2',
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

// Variables globales
let currentExercise = null;
let completedExercises = [];

// Función para volver a la página anterior
function goBack() {
    window.location.href = 'landing.html';
}

// Función para seleccionar ejercicio y mostrar panel de IA
function selectExercise(exerciseNum) {
    currentExercise = exerciseNum;

    // Actualizar número de ejercicio en el panel
    document.getElementById('currentEx').textContent = exerciseNum;

    // Mostrar panel y overlay
    document.getElementById('aiPanel').classList.add('active');
    document.getElementById('overlay').classList.add('active');

    // Resaltar tarjeta seleccionada
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-exercise="${exerciseNum}"]`).classList.add('selected');

    // Actualizar indicador de progreso
    updateProgressIndicator(exerciseNum);

    // Limpiar resultados anteriores
    document.getElementById('aiResult').innerHTML = '';
}

// Actualizar indicador de progreso
function updateProgressIndicator(exerciseNum) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        if (index < exerciseNum) {
            step.classList.add('active');
        } else if (index === exerciseNum - 1) {
            step.classList.add('current');
        } else {
            step.classList.remove('active', 'current');
        }
    });
}

// Función para cerrar panel de IA
function closeAIPanel() {
    document.getElementById('aiPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');

    // Quitar resaltado
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('selected');
    });

    currentExercise = null;
}

// Función para obtener respuesta de IA
async function getAIResponse(action) {
    const resultDiv = document.getElementById('aiResult');

    // Mostrar loading
    resultDiv.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Generando respuesta con IA...</p>
        </div>
    `;

    // Simular llamada a API (1.5 segundos)
    setTimeout(() => {
        resultDiv.innerHTML = getDemoResponse(action);
    }, 1500);
}

// Respuestas demo según ejercicio y acción
function getDemoResponse(action) {
    const responses = {
        1: {
            'resolver': `
                <div class="response-section">
                    <h4>✅ Solución del Ejercicio 1</h4>
                    <div class="response-content">
                        <p><strong>Respuesta modelo:</strong></p>
                        <p class="example">"Sí, me gusta salir con mis amigos. Normalmente vamos al cine los viernes y a tomar algo los sábados. A veces también vamos a bailar."</p>
                        <div class="tip">
                            <strong>💡 Tip:</strong> Usa "me gusta" + infinitivo para expresar preferencias.
                        </div>
                    </div>
                </div>
            `,
            'explicar': `
                <div class="response-section">
                    <h4>📚 Explicación del Concepto</h4>
                    <div class="response-content">
                        <p><strong>Estructura: GUSTAR + Infinitivo</strong></p>
                        <ul>
                            <li>Me gusta + salir (I like to go out)</li>
                            <li>Te gusta + bailar (You like to dance)</li>
                            <li>Le gusta + ir al cine (He/She likes to go to the cinema)</li>
                        </ul>
                        <p><strong>Preposiciones de lugar:</strong></p>
                        <ul>
                            <li>IR + A + lugar: "Voy <strong>al</strong> cine" (a + el = al)</li>
                            <li>IR + A + infinitivo: "Voy <strong>a</strong> tomar algo"</li>
                        </ul>
                    </div>
                </div>
            `,
            'traducir': `
                <div class="response-section">
                    <h4>🌍 Traducción al Inglés</h4>
                    <div class="response-content">
                        <p><strong>Pregunta:</strong></p>
                        <p>"Do you like going out with your friends? Where do you go?"</p>
                        <p><strong>Opciones:</strong></p>
                        <ul>
                            <li>al cine → to the cinema/movies</li>
                            <li>a tomar algo → for a drink</li>
                            <li>a bailar → to dance/dancing</li>
                        </ul>
                    </div>
                </div>
            `,
            'ejemplos': `
                <div class="response-section">
                    <h4>💡 Más Ejemplos Nivel A1</h4>
                    <div class="response-content">
                        <p><strong>Conversaciones similares:</strong></p>
                        <div class="example-box">
                            <p>👤 "¿Qué te gusta hacer el fin de semana?"</p>
                            <p>💬 "Me gusta ir al parque y leer."</p>
                        </div>
                        <div class="example-box">
                            <p>👤 "¿Te gusta el cine?"</p>
                            <p>💬 "Sí, me encanta. Voy todos los domingos."</p>
                        </div>
                        <div class="example-box">
                            <p>👤 "¿Adónde vas con tu familia?"</p>
                            <p>💬 "Vamos a la playa o al campo."</p>
                        </div>
                    </div>
                </div>
            `,
            'pronunciacion': `
                <div class="response-section">
                    <h4>🔊 Guía de Pronunciación</h4>
                    <div class="response-content">
                        <p><strong>Palabras clave:</strong></p>
                        <div class="pronunciation-item">
                            <span class="word">amigos</span>
                            <span class="phonetic">[a-MI-gos]</span>
                        </div>
                        <div class="pronunciation-item">
                            <span class="word">bailar</span>
                            <span class="phonetic">[bai-LAR]</span>
                        </div>
                        <div class="pronunciation-item">
                            <span class="word">cine</span>
                            <span class="phonetic">[SI-ne] o [THI-ne] en España</span>
                        </div>
                        <p class="tip">💡 Recuerda: En español, todas las vocales se pronuncian claramente.</p>
                    </div>
                </div>
            `,
            'cultura': `
                <div class="response-section">
                    <h4>🎭 Contexto Cultural</h4>
                    <div class="response-content">
                        <p><strong>La vida social en países hispanohablantes:</strong></p>
                        <ul>
                            <li>🕐 Las salidas suelen ser más tarde que en otros países (cenar a las 21-22h)</li>
                            <li>☕ "Tomar algo" es muy común - puede ser café, cerveza, o tapas</li>
                            <li>👥 La vida social es muy importante en la cultura hispana</li>
                            <li>🎉 Los fines de semana son para familia y amigos</li>
                        </ul>
                    </div>
                </div>
            `
        },
        2: {
            'resolver': `
                <div class="response-section">
                    <h4>✅ Solución del Ejercicio 2</h4>
                    <div class="response-content">
                        <p><strong>Respuestas correctas:</strong></p>
                        <p class="example">1. Yo <strong>voy</strong> al teatro los sábados.</p>
                        <p class="example">2. Mis amigos <strong>escuchan</strong> música en casa.</p>
                        <div class="tip">
                            <strong>📝 Conjugaciones:</strong><br>
                            IR: voy, vas, va, vamos, vais, van<br>
                            ESCUCHAR: escucho, escuchas, escucha, escuchamos, escucháis, escuchan
                        </div>
                    </div>
                </div>
            `,
            'explicar': `
                <div class="response-section">
                    <h4>📚 Verbos de Movimiento vs. Verbos Regulares</h4>
                    <div class="response-content">
                        <p><strong>Verbo IR (irregular):</strong></p>
                        <table class="conjugation-table">
                            <tr><td>yo</td><td>voy</td></tr>
                            <tr><td>tú</td><td>vas</td></tr>
                            <tr><td>él/ella</td><td>va</td></tr>
                            <tr><td>nosotros</td><td>vamos</td></tr>
                            <tr><td>ellos</td><td>van</td></tr>
                        </table>
                        <p><strong>Verbo ESCUCHAR (regular -AR):</strong></p>
                        <p>Sigue el patrón: -o, -as, -a, -amos, -áis, -an</p>
                    </div>
                </div>
            `
        },
        3: {
            'resolver': `
                <div class="response-section">
                    <h4>✅ Vocabulario de Deportes</h4>
                    <div class="response-content">
                        <p><strong>Frases útiles con deportes:</strong></p>
                        <ul>
                            <li>Juego al fútbol (I play football)</li>
                            <li>Practico natación (I practice swimming)</li>
                            <li>Me gusta el tenis (I like tennis)</li>
                            <li>Veo baloncesto en la tele (I watch basketball on TV)</li>
                        </ul>
                        <p class="tip">💡 Usa "jugar a" con deportes de pelota, "practicar" con otros deportes.</p>
                    </div>
                </div>
            `,
            'ejemplos': `
                <div class="response-section">
                    <h4>💡 Más Vocabulario Deportivo A1</h4>
                    <div class="response-content">
                        <div class="vocab-grid">
                            <div>⚽ fútbol</div>
                            <div>🏊 natación</div>
                            <div>🎾 tenis</div>
                            <div>🏀 baloncesto</div>
                            <div>🏃 correr</div>
                            <div>🚴 ciclismo</div>
                            <div>🏐 voleibol</div>
                            <div>⛷️ esquí</div>
                        </div>
                        <p><strong>Verbos relacionados:</strong></p>
                        <ul>
                            <li>jugar (to play)</li>
                            <li>practicar (to practice)</li>
                            <li>hacer deporte (to do sports)</li>
                        </ul>
                    </div>
                </div>
            `
        },
        4: {
            'resolver': `
                <div class="response-section">
                    <h4>✅ Expresar Rutinas y Horarios</h4>
                    <div class="response-content">
                        <p><strong>Estructura para hablar de rutinas:</strong></p>
                        <p class="example">Los + [día en plural] + [verbo] + [actividad]</p>
                        <ul>
                            <li>Los lunes voy al gimnasio</li>
                            <li>Los miércoles tengo clase de español</li>
                            <li>Los fines de semana descanso</li>
                        </ul>
                    </div>
                </div>
            `,
            'cultura': `
                <div class="response-section">
                    <h4>🎭 Horarios en Países Hispanohablantes</h4>
                    <div class="response-content">
                        <p><strong>Diferencias culturales:</strong></p>
                        <ul>
                            <li>🍽️ Comida: 14:00-15:00 (más tarde que en otros países)</li>
                            <li>🌙 Cena: 21:00-22:00</li>
                            <li>🏪 Siesta: algunas tiendas cierran 14:00-17:00</li>
                            <li>🎉 Vida nocturna: empieza tarde (23:00+)</li>
                        </ul>
                    </div>
                </div>
            `
        }
    };

    // Obtener respuesta según ejercicio actual
    const exerciseResponses = responses[currentExercise] || responses[1];
    return exerciseResponses[action] || `
        <div class="response-section">
            <h4>📝 ${action.charAt(0).toUpperCase() + action.slice(1)}</h4>
            <div class="response-content">
                <p>Contenido para el ejercicio ${currentExercise}.</p>
            </div>
        </div>
    `;
}

// Event listeners para cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAIPanel();
    }
});

// Animación inicial
document.addEventListener('DOMContentLoaded', () => {
    // Animar entrada de tarjetas
    const cards = document.querySelectorAll('.exercise-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Marcar ejercicios completados
    markCompletedExercises();

    // Añadir efecto de transición al entrar
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Marcar ejercicios como completados
function markCompletedExercises() {
    completedExercises.forEach(exerciseNum => {
        const card = document.querySelector(`[data-exercise="${exerciseNum}"]`);
        if (card) {
            card.classList.add('completed');
        }
    });
}

// Marcar ejercicio como completado
function completeExercise(exerciseNum) {
    if (!completedExercises.includes(exerciseNum)) {
        completedExercises.push(exerciseNum);
        const card = document.querySelector(`[data-exercise="${exerciseNum}"]`);
        if (card) {
            card.classList.add('completed');
        }

        // Actualizar progreso
        updateProgressIndicator(exerciseNum);

        // Si todos están completados, mostrar mensaje
        if (completedExercises.length === 4) {
            setTimeout(() => {
                showCompletionMessage();
            }, 500);
        }
    }
}

// Mostrar mensaje de finalización
function showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'completion-message';
    message.innerHTML = `
        <div class="completion-content">
            <h2>🎉 ¡Felicidades!</h2>
            <p>Has completado todos los ejercicios de esta unidad</p>
            <button onclick="window.location.href='landing.html'">Volver al inicio</button>
        </div>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
        message.classList.add('active');
    }, 100);
}
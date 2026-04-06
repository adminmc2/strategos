// Tabla fija: cada consonante siempre lleva la misma vocal
const VOWEL_MAP = {
  B: 'O', C: 'A', D: 'E', F: 'I', G: 'O', H: 'A',
  J: 'U', K: 'I', L: 'U', M: 'A', N: 'O', Ñ: 'A',
  P: 'I', Q: 'U', R: 'E', S: 'O', T: 'A', V: 'I',
  X: 'E', Z: 'U'
};

// Genera nombre de agente desde siglas (orden respetado siempre)
// Ej: generateName('LCP') → 'LUCAPI'
function generateName(siglas) {
  return siglas
    .toUpperCase()
    .split('')
    .map(c => {
      const vowel = VOWEL_MAP[c];
      return vowel ? c + vowel : c; // Si es vocal u otro, se deja tal cual
    })
    .join('');
}

// Registro de agentes por destreza
// siglas: iniciales consonantes del nombre de la estrategia (orden original)
// nombre: nombre descriptivo de la estrategia/tarjeta
// destreza: a qué destreza pertenece
const AGENTS = [
  {
    siglas: 'LCP',
    nombre: 'Lee en Cuatro Pasos',
    generatedName: 'LUCAPI',
    destreza: 'comprension-lectora',
    descripcion: 'Estrategia de lectura en 4 pasos: prepárate, lee con una misión, busca las pruebas y conecta.',
    chatType: 'comprension'
  }
  // Nuevos agentes se añaden aquí con sus siglas y se genera el nombre automáticamente
];

// Generar nombres automáticamente para todos los agentes
AGENTS.forEach(agent => {
  agent.generatedName = generateName(agent.siglas);
  agent.urlSlug = agent.generatedName.toLowerCase();
});

module.exports = { VOWEL_MAP, generateName, AGENTS };

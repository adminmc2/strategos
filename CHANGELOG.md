# Changelog

Registro de cambios del proyecto STRATEGA - Plataforma Educativa con IA.

## [Unreleased]

### Añadido
- Agente "Mapa Mental" para actividad 2
  - Construcción interactiva: el estudiante conecta expresiones con categorías
  - 5 categorías: SALUDAR, PROPONER, ACORDAR, LUGAR, HORA
  - 19 expresiones del vocabulario de actividades 1 y 2
  - Paleta de colores accesible para daltonismo (protanopia, deuteranopia, tritanopia)
  - Diferentes estilos de borde por categoría para accesibilidad adicional
  - Iconos Lucide para cada expresión y categoría
  - Sistema tap-to-connect optimizado para móvil
  - Verificación instantánea con feedback visual
  - Función `setup-agent-mapamental.js` para configurar el agente
- Agente "Traductor" para actividad 2 (diálogo)
  - Traducciones predefinidas a 6 idiomas: IT, FR, EN, PT, DE, PL
  - Selección de frases individuales del diálogo para traducir
  - UI simplificada: solo símbolos ■/● sin "Persona 1/2"
  - Checkbox al final de cada frase
- Funciones Netlify para configurar agentes de traducción
  - `setup-agent-traductor.js`: Configura traductor para actividad 2
  - `setup-agent-traductor-act1.js`: Configura traductor para actividad 1
  - `list-all-agents.js`: Lista todos los agentes y acciones
  - `update-activity2-content.js`: Actualiza contenido del diálogo

### Mejorado
- Botones de chat dinámicos según la actividad
  - Actividad 1 muestra 4 agentes (vocabulario)
  - Actividad 2 muestra solo el traductor (diálogo)
- Opción "Traducir a otro idioma" después de ver traducciones
- Limpieza automática de traducciones anteriores al cambiar idioma
- Botones de acciones disponibles aparecen después de completar cualquier acción
  - Se muestran todos los agentes de la actividad actual
  - Funciona para traducción, análisis léxico, comprensión visual, etc.

### Corregido
- Error de JavaScript que impedía abrir las unidades (variable duplicada)

---

## [1.1.0] - 2024-12-05

### Añadido
- "Voy a tener suerte": nueva funcionalidad interactiva basada en estilos de vida
  - Preguntas tipo test: animal, comida, clima, color, música
  - Cada opción representa un estilo de vida (tranquilo, activo, social, etc.)
  - Tarjetas visuales con iconos Lucide para seleccionar opciones
  - IA genera frases personalizadas "Voy a..." según el estilo elegido
  - Respuestas en formato tarjeta con iconos
- Campo `options_json` en tabla `activity_actions` para configuración flexible
- Función `add-options-json.js` para gestionar opciones de actividades
- Sistema de traducciones de vocabulario con tarjetas visuales
  - Tarjetas de vocabulario con iconos Lucide, frase en español y traducción
  - Soporte para 6 idiomas principales: EN, PT, FR, AL, PL, IT
  - Opción "OTHER LANGUAGE" para traducciones con IA (DeepSeek)
- "Más vocabulario": genera vocabulario personalizado según la edad del usuario
  - Pregunta edad para adaptar el contenido
  - No repite vocabulario existente de la actividad
  - Muestra tarjetas con mismo formato que traducciones
  - Incluye traducción si el usuario ya eligió un idioma
- Función `seed-translations.js` para insertar traducciones en la BD
- Función `get-translation.js` para obtener traducciones de la BD
- Tabla `activity_translations` en Neon PostgreSQL
- Librería Lucide Icons para iconos en tarjetas de vocabulario
- Endpoint `/api/seed-translations` para poblar traducciones
- Endpoint `/api/translation` para consultar traducciones

### Mejorado
- Avatar de Eliana en header del chat y mensajes (imagen en lugar de letra "E")
- Delay simulado (1.5-2.5s) para traducciones desde BD - simula procesamiento IA
- Mensaje "Eliana está pensando..." durante carga de traducciones
- Opciones de acción aparecen después de cada respuesta

### Corregido
- Input en móvil: ya no hace zoom al escribir (font-size 16px)
- Viewport móvil: usa `100dvh` para ajustarse al teclado
- Chat container fijo en móvil para evitar problemas con teclado
- Prevención de ajuste automático de texto en iOS
- "OTHER LANGUAGE": ahora muestra tarjetas de vocabulario igual que los otros idiomas
- Flujo de idioma personalizado: intercepta correctamente el mensaje del usuario

### Técnico
- Estrategia de ahorro de tokens: traducciones comunes en BD, solo "OTHER LANGUAGE" usa IA
- UX mejorada: animación de pensamiento incluso para consultas a BD

---

## [1.0.0] - 2024-12-04

### Añadido
- Landing page con diseño moderno
- Página de ejercicios con chat interactivo
- Integración con DeepSeek API para chat con IA
- Sistema de unidades, secciones y actividades
- Función `setup-db.js` para crear tablas
- Configuración de Netlify Functions
- Base de datos Neon PostgreSQL

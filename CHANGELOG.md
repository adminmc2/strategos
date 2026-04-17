# Changelog — Strategos

Registro de cambios del proyecto **Strategos** — Agentes IA para aprender español con estrategias reales.

Formato: [Semantic Versioning](https://semver.org/lang/es/) `vX.Y.Z`
- **X (major):** Cambio de arquitectura o breaking changes
- **Y (minor):** Feature nueva visible para el usuario
- **Z (patch):** Bug fix, ajuste visual, corrección de deploy

---

## [3.2.28] - 2026-04-10

### Corregido (web)
- **DEHA tarjeta Cara A**: rediseño visual
  - Reloj grande centrado con Es/Son a los lados (como el PDF)
  - Y/MENOS en badges de color (verde/rojo)
  - Momentos claves: :15 :30 :45 en recuadros de color (teal, naranja, violeta)
  - Layout equilibrado sin scroll

---

## [3.2.27] - 2026-04-10

### Corregido (web)
- **DEHA tarjeta**: ortografia corregida
  - espanol → español, Expresion → Expresión, pelicula → película
  - Todos los textos con tildes y eñes usando entidades HTML

---

## [3.2.26] - 2026-04-10

### Corregido (web)
- **DEHA tarjeta**: compactada para caber en 440x630px sin scroll
  - Cara A: imágenes reducidas (75px), 3 momentos claves en una fila, padding reducido
  - Cara B: tabla sin imagen lateral, secciones compactas, font-size 0.9em

---

## [3.2.25] - 2026-04-10

### Corregido (web)
- **DEHA tarjeta**: header cambiado de verde `#4A7C59` a azul teal `#3D6B7E` (coincide con el PDF)
- Colores de acento (momentos claves, badges, tabla) actualizados al mismo azul

---

## [3.2.24] - 2026-04-10

### Añadido (web)
- **Agente DEHA** (Decir la Hora) — tarjeta flip en Expresión e Interacción Oral
  - Cara A: zonas del reloj (Y/MENOS), Es la una/Son las, momentos claves (cuarto/media)
  - Cara B: esquema comunicativo (decir hora, preguntar evento, quedar con amigos)
  - Replicado del PDF `deha.pdf` con misma estructura visual que HAFIMA
  - Header verde `#4A7C59`, fondo `#E8F5E9`, clase `hafima-card`
  - PDF descargable, 8 imágenes (`esq_hora1-8.png`)
- Sección EIO actualizada: 1 agente → 2 agentes (HAFIMA + DEHA)

---

## [3.2.23] - 2026-04-10

### Cambiado
- **Seed script**: `ON CONFLICT DO UPDATE` → `ON CONFLICT DO NOTHING`
  - El seed solo crea agentes nuevos, no sobreescribe los existentes
  - La BD es la fuente de verdad: ediciones desde la UI no se pierden al re-ejecutar el seed
- **Analizador backstory**: quitado "receive texts as images or plain text" (OCR se hace antes del pipeline)
- **Analizador goal**: añadido "from a Spanish text" (input genérico, principio 5 de goal design)

---

## [3.2.22] - 2026-04-10

### Cambiado (plataforma — agentes)
- **Analizador LLM**: Llama 4 Scout → GPT OSS 120B (Groq). 4x más rápido, genera lesson plan completo
- **Analizador task**: tools re-añadidas (consultar_reglas, consultar_correcciones) con manejo de caso vacío
  ("If no rules exist yet, proceed with your default pedagogical expertise")
- **Task simplificado**: 5 steps (reglas → correcciones → análisis → lesson plan → tricks)
- **Smart Reader Tricks**: "Generate EXACTLY 3, no more" (fix de tricks inventados)
- **Arquitectura OCR**: imagen → Llama 4 Scout (OCR) → texto → GPT OSS 120B (análisis). Scout solo para visión.

### Añadido (plataforma — UI)
- **Upload de imagen** en modal de Run (.jpg, .png, .webp) con preview
- **OCR en diagrama.py**: `_ocr_from_image()` con Scout antes del subprocess
- **Trazas detalle**: observations por llamada LLM (modelo, tokens, latencia, costo, input/output)
- **Trazas tabla**: estilo Langfuse con columnas Input/Output truncados, nombres de modelo cortos
- **`_safe_usage()`**: serialización segura de Langfuse Usage (fix model_dump crash)

### Corregido
- `get_trazas()`: extrae modelo/tokens de observations via trace.get()
- `get_traza_detalle()`: usa _safe_usage() en vez de model_dump()
- Trazas con 0 tokens en Llama 4 Scout (Groq no reporta usage en errores de tool validation)

---

## [3.1.0] - 2026-04-09

### Añadido (plataforma — Fase 2B)
- **ReglasView** (`/crew/:name/reglas`): CRUD completo de reglas aprendidas
  - Cards editables con tipo de error, regla, ejemplos
  - Crear, editar inline, eliminar con confirmacion
  - Badge activa/inactiva
- **CorreccionesView** (`/crew/:name/correcciones`): vista de correcciones
  - Tabla con fecha, agente, tipo, campo
  - Filas expandibles con valor original vs corregido
  - Filtro por agente (dropdown)
  - Stats agregadas arriba de la tabla
- **TrazasView** (`/crew/:name/trazas`): vista de trazas LLM
  - Tabla con fecha, modelo, tokens in/out, duracion, estado
  - Filas expandibles con request/response completo en pre formateado
  - Paginacion con "Cargar mas"
  - Detalle de traza via API
- **api.js**: 4 funciones nuevas (fetchTrazaDetalle, fetchCorreccionesStats, createRegla, deleteRegla)

### Eliminado
- Placeholder.jsx (reemplazado por las 3 vistas reales)

---

## [3.0.1] - 2026-04-08

### Corregido
- Eliminado crew STRATEGOS de BD (datos legacy)
- Header del editor: botón volver + nombre del crew visibles
- Panel config: ancho aumentado de 420px a 540px

### Mejorado (visual)
- Nodos con header de color por posición (azul, verde, violeta, amber) + icono + role preview
- Edges smoothstep con flecha (reemplaza línea dashed animada)
- Background dots (reemplaza grid)
- Handles discretos (hidden, visible on hover)
- MiniMap eliminado
- Controls con bordes redondeados

### Añadido
- Dashboard: botón "+ Crear nuevo crew" con card dashed
- Dashboard: loading state "Cargando crews..."
- Editor: loading state "Cargando pipeline..."
- Panel config: toast de error rojo si el save falla
- Rutas placeholder para Correcciones, Reglas, Trazas LLM (Fase 2B)

---

## [3.0.0] - 2026-04-08

### Cambiado (breaking — plataforma)
- **Languagent UI**: reescrita en React + Vite + React Flow (reemplaza vanilla HTML)
  - Estructura: `apps/plataforma/ui/` (src/, dist/, package.json, vite.config.js)
  - `diagrama.py` sirve `ui/dist/` con fallback a `web/` (legacy)
- **Nombre**: plataforma renombrada a Languagent (era AgentIAELE)

### Añadido
- **Dashboard** (`/`): grid de crews con pipeline preview y modelos usados
- **Editor** (`/crew/:name`): layout 3 zonas — sidebar, canvas React Flow, panel config
  - Canvas con nodos arrastrables, edges animados, minimap, zoom
  - Nodos muestran modelo, temperature, badges (vision/tools/reasoning)
  - Panel derecho slide-in: LLM Config, Identity, Task (editar + guardar)
  - Sidebar: lista de agentes, + Añadir agente, eliminar agente, links a sistema
- **React Router** con rutas: `/`, `/crew/:name`, `/crew/:name/trazas`, `/crew/:name/correcciones`, `/crew/:name/reglas`
- **API endpoints nuevos**:
  - `POST /api/crew_agents/create` — crear agente en un crew (auto agent_order)
  - `POST /api/crew_agents/delete` — eliminar agente por id
- **API mejoradas**: `api.js` con error handling, `runCrew`, `fetchRunStatus`, `fetchCorrecciones`, `fetchReglas`, `fetchTrazas`
- **LLMs corregidos en BD**: analizador → Llama 4 Scout, coach → DeepSeek V3

---

## [2.2.9] - 2026-04-08

### Añadido (plataforma)
- **Políticas de diseño de agentes** integradas en `.claude/rules/agent-prompt-design.md`
  - Adaptado del proyecto Guía Didáctica: frontmatter, language policy generalizada,
    terminología agnóstica de lengua, ejemplos de referencia (Recurvo + LUCAPI)
  - LLM config actualizado: ahora en BD (`crew_agents`), no en env vars
  - CLAUDE.md apunta a ruta local en vez de ruta externa

---

## [2.1.0] - 2026-04-07

### Añadido
- **Crew LUCAPI con 2 agentes** (patrón guía del profesor):
  - `analizador` (order 1): analiza texto, genera plan de lección por Protocolo L
  - `coach` (order 2): interactúa con el estudiante usando el plan del analizador
  - Cada crew tiene su propio runner: `scripts/crewai/lucapi.py`
- **LLM config en BD** — columnas `llm_model`, `llm_temperature`, `llm_max_tokens`, `llm_top_p` en tabla `crew_agents`
  - Analizador: `groq/llama-3.3-70b-versatile`, temp 0.3, max 4096
  - Coach: `groq/llama-3.3-70b-versatile`, temp 0.6, max 2048
  - Editable desde el dashboard sin tocar código
- **Autodescubrimiento de crews** — endpoint `/api/crews` (SELECT DISTINCT crew FROM crew_agents)
- **Autodescubrimiento de runners** — `scripts/crewai/{crew_name}.py` (sin AGENT_SCRIPTS hardcodeado)

### Eliminado
- `LLM_CFG`, `LLM_KEY_MAP` hardcodeados en runner (ahora se leen de BD)
- `AGENT_SCRIPTS` dict hardcodeado en `diagrama.py`
- `crew = 'strategos'` hardcodeado en `chat-agent.js` (ahora busca por agent_key)
- Defaults `"strategos"` en `diagrama.py` (reglas, evaluaciones, run)

### Cambiado
- `strategos.py` renombrado a `lucapi.py` (crew = runner)
- `crear_crew_agents.py`: crew `"lucapi"` con agent_keys `analizador` y `coach`
- `chat-agent.js`: busca agente por `agent_key` sin filtrar por crew fijo, carga reglas del crew del agente encontrado
- `diagrama.py`: `get_crew_agents` y `update_crew_agent` incluyen columnas LLM
- Regla en CLAUDE.md: bump version + changelog con cada cambio

---

## [2.0.0] - 2026-04-07

### Cambiado (breaking)
- **Monorepo**: reorganización completa del proyecto
  - Web pública → `apps/web/`
  - Plataforma de Agentes → `apps/plataforma/`
  - Archivos legacy → `_legacy/`
  - `railway.toml` y `netlify.toml` en raíz con paths actualizados
  - `.env` compartido en raíz, referenciado con path relativo `../../.env`

---

## [1.1.1] - 2026-04-06

### Corregido
- URL se actualiza a `/agente/lucapi` o `/agente/reca` al abrir la tarjeta modal
- URL restaura a `/agentes` al cerrar el modal

---

## [1.1.0] - 2026-04-06

### Añadido
- URLs directas a tarjetas de agente: `/agente/lucapi` y `/agente/reca`
- Abren directamente la tarjeta flip modal (no el chat)
- Agentes sin tarjeta siguen abriendo el chat como antes
- `lucapi` añadido al mapa de URLs de agentes

---

## [1.0.2] - 2026-04-06

### Corregido
- Versión dinámica: landing.html lee la versión de `/api/version` en vez de hardcodearla
- Fuente única de verdad: solo se mantiene en `package.json`
- Endpoint `/api/version` en server.js

---

## [1.0.1] - 2026-04-06

### Corregido
- Versión visible en landing debajo del botón "Comenzar"
- Eliminada versión del header de agentes.html

---

## [1.0.0] - 2026-04-06

### Baseline — Estado actual del proyecto

#### Arquitectura
- Express server (`server.js`) con adapter para Netlify Functions
- Deploy en Railway (Nixpacks) con healthcheck en `/health`
- Base de datos Neon PostgreSQL
- Dotenv para variables de entorno
- `railway.toml` con configuración de build y deploy

#### Páginas
- **Landing** (`landing.html`): Pantalla de inicio con botón "Comenzar"
- **Agentes** (`agentes.html`): Panel principal organizado por destrezas

#### Destrezas y agentes
- **Comprensión lectora (CL):** agente LUCAPI
  - Tarjeta flip (cara A: 4 pasos, cara B: 3 trucos del lector inteligente)
  - PDF descargable (`lucapi.pdf`)
  - Imágenes: lupa, cerebro, lector, lectura, word
- **Expresión e interacción escrita (EIE):** agente RECA
  - Tarjeta flip (cara A: 4 pasos para escribir email, cara B: revisión)
  - PDF descargable (`reca.pdf`)
  - Imágenes: EE1, ee2, ee3, libro
- **Expresión e interacción oral (EIO):** Próximamente
- **Comprensión auditiva (CA):** Próximamente

#### Chat
- Endpoint `/api/chat-agent` para conversación con agentes
- Avatar de agente con siglas y color dinámico
- Soporte para mensajes tipo `.message.agent`

#### API endpoints
- `GET /api/units` — Unidades con secciones
- `GET /api/activities` — Actividades de una sección
- `GET /api/activity-actions` — Acciones de agentes por actividad
- `GET /api/translation` — Traducciones de vocabulario
- `GET /api/list-agents` — Lista todos los agentes
- `GET /api/version` — Versión actual del proyecto
- `GET /health` — Healthcheck sin DB
- `POST /api/chat` — Chat con DeepSeek
- `POST /api/chat-claude` — Chat con Claude
- `POST /api/chat-agent` — Chat con agente específico
- `POST /api/setup-*` — Setup de agentes en BD

#### Rutas HTML
- `/` → landing.html
- `/agentes`, `/ejercicios`, `/index` → agentes.html
- `/agente/:nombre` → agentes.html (URL directa a un agente)

---

## [Pre-1.0] - 2026-04-02 a 2026-04-03

### Historial de desarrollo (antes del versionado formal)

- `f75512f` (2026-04-02) — Commit inicial: plataforma educativa con IA
- `bf0d746` (2026-04-02) — Express server para Railway, rediseño de landing
- `f8a89e2` (2026-04-03) — Página de destrezas/agentes, chat con Groq, rebrand a Strategos
- `85ffa1e` (2026-04-03) — URLs directas compartibles por agente (`/agente/:nombre`)

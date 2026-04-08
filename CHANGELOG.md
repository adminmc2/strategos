# Changelog — Strategos

Registro de cambios del proyecto **Strategos** — Agentes IA para aprender español con estrategias reales.

Formato: [Semantic Versioning](https://semver.org/lang/es/) `vX.Y.Z`
- **X (major):** Cambio de arquitectura o breaking changes
- **Y (minor):** Feature nueva visible para el usuario
- **Z (patch):** Bug fix, ajuste visual, corrección de deploy

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

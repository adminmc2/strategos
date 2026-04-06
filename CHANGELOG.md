# Changelog — Strategos

Registro de cambios del proyecto **Strategos** — Agentes IA para aprender español con estrategias reales.

Formato: [Semantic Versioning](https://semver.org/lang/es/) `vX.Y.Z`
- **X (major):** Cambio de arquitectura o breaking changes
- **Y (minor):** Feature nueva visible para el usuario
- **Z (patch):** Bug fix, ajuste visual, corrección de deploy

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

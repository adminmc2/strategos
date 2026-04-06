# Strategos - Reglas del proyecto

## Tarjetas de agentes (dimensiones fijas)
Todas las tarjetas (flip cards) de agentes deben tener SIEMPRE estas dimensiones exactas:
- **Desktop**: 440px ancho × 630px alto
- **Móvil** (max-width 768px): 100% ancho (max 440px) × 600px alto

No cambiar estas medidas sin aprobación explícita del usuario.

## Nombres de agentes
Los nombres se generan con el sistema de mapeo consonante-vocal definido en `config/agents.js`:
- Cada consonante de las siglas se empareja con una vocal fija según la tabla VOWEL_MAP
- El orden de las consonantes en las siglas debe respetarse siempre
- Ejemplo: LCP → LU-CA-PI → LUCAPI

## Versionado (semver)

Fuente única de verdad: `package.json` → campo `version`.
La landing lee la versión de `/api/version` (endpoint en server.js). NO hardcodear versiones en HTML.
La Plataforma de Agentes (`diagrama.py`) tiene `SERVER_VERSION` independiente.

- **X** — cambio de arquitectura, breaking changes
- **Y** — feature nueva visible (agente, tarjeta, destreza, endpoint)
- **Z** — fix (CSS, icono, bug, deploy)

Antes de cada push:
1. Bump `version` en `package.json`
2. Commit con mensaje que empiece con `vX.Y.Z —`
3. Push

## Workflow

1. Hacer cambios en código
2. Reiniciar server local (`kill port 3000 + node server.js`)
3. Verificar en `http://localhost:3000` que funciona
4. Solo cuando el usuario confirme → commit + push a Railway

NUNCA hacer push sin verificar local primero.

## Estructura del proyecto

Dos aplicaciones en el mismo repo:
- **Web pública** (Node/Express, puerto 3000): `server.js`, `landing.html`, `agentes.html`, `ejercicios.html`
- **Plataforma de Agentes** (Python, puerto 4567): `diagrama.py`, `web/index.html`

Ambas comparten: `.env`, `config/`, `scripts/`, BD Neon PostgreSQL (`crew_agents`).

## Diseño de agentes CrewAI

Las reglas de diseño de role, goal, backstory y task están en:
`/Users/armandocruz/Desktop/guia-didactica-profesor-IA/.claude/rules/agent-prompt-design.md`

Respetar siempre esas políticas al crear o modificar agentes.

# Strategos - Reglas del proyecto

## Tarjetas de agentes (dimensiones fijas)
Todas las tarjetas (flip cards) de agentes deben tener SIEMPRE estas dimensiones exactas:
- **Desktop**: 440px ancho × 630px alto
- **Móvil** (max-width 768px): 100% ancho (max 440px) × 600px alto

No cambiar estas medidas sin aprobación explícita del usuario.

## Nombres de agentes
Los nombres se generan con el sistema de mapeo consonante-vocal definido en `apps/web/config/agents.js`:
- Cada consonante de las siglas se empareja con una vocal fija según la tabla VOWEL_MAP
- El orden de las consonantes en las siglas debe respetarse siempre
- Ejemplo: LCP → LU-CA-PI → LUCAPI

## Versionado (semver)

Fuente única de verdad: `apps/web/package.json` → campo `version`.
La landing lee la versión de `/api/version` (endpoint en `apps/web/server.js`). NO hardcodear versiones en HTML.
La Plataforma de Agentes (`apps/plataforma/diagrama.py`) tiene `SERVER_VERSION` independiente.

- **X** — cambio de arquitectura, breaking changes
- **Y** — feature nueva visible (agente, tarjeta, destreza, endpoint)
- **Z** — fix (CSS, icono, bug, deploy)

Con cada cambio que se haga (no solo al hacer push):
1. Bump `version` en `apps/web/package.json`
2. Añadir entrada en `CHANGELOG.md` con fecha y descripción
3. Commit con mensaje que empiece con `vX.Y.Z —`

## Workflow

1. Hacer cambios en código
2. Reiniciar server local (`kill port 3000 + cd apps/web && node server.js`)
3. Verificar en `http://localhost:3000` que funciona
4. Solo cuando el usuario confirme → commit + push a Railway

NUNCA hacer push sin verificar local primero.

## Estructura del proyecto (monorepo)

```
stratega/
├── apps/
│   ├── web/              # Web pública (Node/Express, puerto 3000)
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── landing.html, agentes.html, ejercicios.html
│   │   ├── netlify/functions/
│   │   ├── config/agents.js
│   │   └── public/
│   └── plataforma/       # Plataforma de Agentes (Python, puerto 4567)
│       ├── diagrama.py
│       ├── requirements.txt
│       ├── web/index.html
│       └── scripts/
├── _legacy/              # Archivos legacy (no en uso activo)
├── .env                  # Compartido por ambas apps
├── railway.toml          # Deploy config (web)
└── netlify.toml          # Deploy config (web)
```

Ambas apps comparten: `.env` (raíz del repo), BD Neon PostgreSQL (`crew_agents`).

## Diseño de agentes CrewAI

Las reglas de diseño de role, goal, backstory y task están en:
`.claude/rules/agent-prompt-design.md`

Se cargan automáticamente cuando se trabaja en `apps/plataforma/scripts/` o `apps/plataforma/ui/`.
Respetar siempre esas políticas al crear o modificar agentes.

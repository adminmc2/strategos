# STRATEGA - Plataforma Educativa con IA

Plataforma educativa interactiva con Inteligencia Artificial, enfocada en agentes y estrategias de aprendizaje para adolescentes.

## Características

- **Interfaz Interactiva**: Navegación intuitiva por unidades y ejercicios
- **Asistente Virtual Eliana**: IA conversacional para ayuda personalizada
- **Ejercicios Adaptativos**: Contenido que se adapta al nivel del estudiante
- **Múltiples Opciones de Aprendizaje**:
  - Traducciones automáticas
  - Ejemplos contextualizados
  - Ejercicios personalizados
  - Práctica conversacional

## Estructura del Proyecto

```
stratega/
├── landing.html            # Página de bienvenida
├── ejercicios.html         # Interfaz principal de ejercicios
├── app.js                  # Lógica de la aplicación
├── style.css               # Estilos principales
├── landing-style.css       # Estilos del landing
├── public/                 # Recursos estáticos
├── netlify.toml            # Configuración de Netlify
└── _redirects              # Reglas de redirección
```

## Despliegue en Netlify

1. Conecta tu repositorio de GitHub a Netlify
2. Configuración de build:
   - **Build command**: `npm install`
   - **Publish directory**: `.`
   - **Branch to deploy**: `main`
3. Deploy

## Desarrollo Local

```bash
python3 -m http.server 8000
# O con Node.js
npx http-server -p 8000
```

## Variables de Entorno

Configura en Netlify `Site settings` > `Environment variables`:
- `DEEPSEEK_API_KEY`: Clave API de DeepSeek

## Tecnologías

- HTML5, CSS3, JavaScript (Vanilla)
- DeepSeek API / Claude API para IA
- Neon PostgreSQL (serverless)
- Netlify Functions

---

&copy; 2026 Stratega

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Adapter: Netlify function handler → Express route ---
function netlifyAdapter(handlerPath) {
  return async (req, res) => {
    const handler = require(handlerPath).handler;
    const event = {
      httpMethod: req.method,
      body: req.body ? JSON.stringify(req.body) : null,
      queryStringParameters: req.query || {},
      headers: req.headers,
      path: req.path
    };
    try {
      const result = await handler(event, {});
      const headers = result.headers || {};
      Object.entries(headers).forEach(([k, v]) => res.set(k, v));
      res.status(result.statusCode).send(result.body);
    } catch (err) {
      console.error(`Error in ${handlerPath}:`, err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  };
}

// --- API Routes (mapped from netlify.toml redirects) ---
const functionsDir = './netlify/functions';

// GET endpoints
app.get('/api/units', netlifyAdapter(`${functionsDir}/get-units`));
app.get('/api/activities', netlifyAdapter(`${functionsDir}/get-activities`));
app.get('/api/activity-actions', netlifyAdapter(`${functionsDir}/get-activity-actions`));
app.get('/api/translation', netlifyAdapter(`${functionsDir}/get-translation`));
app.get('/api/list-agents', netlifyAdapter(`${functionsDir}/list-all-agents`));
app.get('/api/test-claude', netlifyAdapter(`${functionsDir}/test-claude`));

// POST endpoints
app.post('/api/chat', netlifyAdapter(`${functionsDir}/chat`));
app.post('/api/chat-claude', netlifyAdapter(`${functionsDir}/chat-claude`));
app.post('/api/setup-db', netlifyAdapter(`${functionsDir}/setup-db`));
app.post('/api/seed-translations', netlifyAdapter(`${functionsDir}/seed-translations`));
app.post('/api/setup-agent-comprension', netlifyAdapter(`${functionsDir}/setup-agent-comprension`));
app.post('/api/setup-agent-gramapop', netlifyAdapter(`${functionsDir}/setup-agent-gramapop`));
app.post('/api/setup-agent-lexico', netlifyAdapter(`${functionsDir}/setup-agent-lexico`));
app.post('/api/setup-agent-mapamental', netlifyAdapter(`${functionsDir}/setup-agent-mapamental`));
app.post('/api/setup-agent-traductor', netlifyAdapter(`${functionsDir}/setup-agent-traductor`));
app.post('/api/setup-agent-traductor-act1', netlifyAdapter(`${functionsDir}/setup-agent-traductor-act1`));
app.post('/api/update-activity2-content', netlifyAdapter(`${functionsDir}/update-activity2-content`));
app.post('/api/update-agent-name', netlifyAdapter(`${functionsDir}/update-agent-name`));
app.post('/api/add-options-json', netlifyAdapter(`${functionsDir}/add-options-json`));

// --- Static files ---
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: false
}));

// --- HTML routes (from netlify.toml redirects) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'agentes.html')));
app.get('/ejercicios', (req, res) => res.sendFile(path.join(__dirname, 'agentes.html')));
app.get('/agentes', (req, res) => res.sendFile(path.join(__dirname, 'agentes.html')));
app.get('/agente/:nombre', (req, res) => res.sendFile(path.join(__dirname, 'agentes.html')));
app.get('/landing', (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));

// --- Start ---
app.listen(PORT, () => {
  console.log(`Strategos running on port ${PORT}`);
});
